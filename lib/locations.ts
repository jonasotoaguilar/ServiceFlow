import { createPocketBaseClient } from "@/lib/pocketbase";
import { applyBinding } from "@/lib/pocketbase-filter";

/**
 * Location invariants — exactly one default per user, default must be active, at least one active.
 *
 * PocketBase schema:
 * - locations.isDefault bool default false
 * - indexes: (userId) + (userId, isDefault) + partial unique (userId) WHERE isDefault = TRUE
 *
 * Partial unique verified for PB 0.28 via SQLite WHERE clause: `CREATE UNIQUE INDEX idx_locations_one_default ON locations (userId) WHERE isDefault = TRUE`.
 * If the PB version does not support partial WHERE (e.g., older SQLite), app-layer enforces single default:
 * getList → promote oldest active / create Sede Principal → unset previous → set new, with unique-hit retry (re-read on 409/400 unique).
 */
export async function ensureDefaultLocation(
	userId: string,
): Promise<{ success: true; id?: string } | { error: string }> {
	if (!userId) return { error: "userId requerido" };
	const pb = await createPocketBaseClient();
	const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: userId } });
	let items: Array<Record<string, unknown>>;
	try {
		const res = await pb.collection("locations").getList(1, 100, { filter });
		items = (res.items as Array<Record<string, unknown>>) ?? [];
	} catch {
		return { error: "Error al asegurar Sede predeterminada" };
	}

	// Zero locations → create Sede Principal default active (idempotent)
	if (items.length === 0) {
		const now = new Date().toISOString();
		const payload: Record<string, unknown> = {
			name: "Sede Principal",
			userId,
			isActive: true,
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		};
		try {
			const created = (await pb.collection("locations").create(payload)) as Record<string, unknown>;
			return { success: true, id: String(created.id ?? "") };
		} catch (e: unknown) {
			const msg = String((e as { message?: unknown })?.message ?? "").toLowerCase();
			const status = (e as { status?: unknown })?.status;
			const isUnique =
				msg.includes("unique") || msg.includes("already") || status === 409 || status === 400;
			if (isUnique) {
				// Concurrent create won — re-read and return existing default
				try {
					const retry = await pb.collection("locations").getList(1, 100, { filter });
					const found = (retry.items as Array<Record<string, unknown>>).find(
						(x) => x.isDefault === true,
					);
					if (found) return { success: true, id: String(found.id) };
				} catch {}
			}
			return { error: "Error al crear Sede predeterminada" };
		}
	}

	// Analyze current defaults
	const defaults = items.filter((x) => x.isDefault === true) as Array<Record<string, unknown>>;
	const actives = items.filter((x) => x.isActive !== false) as Array<Record<string, unknown>>;

	// Exactly one active default → no-op
	if (defaults.length === 1 && defaults[0].isActive !== false) {
		return { success: true, id: String(defaults[0].id) };
	}

	// Exactly one default but inactive → reactivate (default must be active)
	if (defaults.length === 1 && defaults[0].isActive === false) {
		try {
			await pb
				.collection("locations")
				.update(String(defaults[0].id), { isActive: true, updatedAt: new Date().toISOString() });
			return { success: true, id: String(defaults[0].id) };
		} catch {
			return { error: "Error al asegurar Sede predeterminada" };
		}
	}

	// Multiple defaults → keep oldest active default, unset others
	if (defaults.length > 1) {
		// Sort by createdAt ascending
		const sorted = [...defaults].sort((a, b) =>
			String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
		);
		const keep = sorted[0];
		// keep must be active; if not, activate it
		if (keep.isActive === false) {
			try {
				await pb
					.collection("locations")
					.update(String(keep.id), { isActive: true, updatedAt: new Date().toISOString() });
			} catch {}
		}
		for (const extra of sorted.slice(1)) {
			try {
				await pb
					.collection("locations")
					.update(String(extra.id), { isDefault: false, updatedAt: new Date().toISOString() });
			} catch {}
		}
		return { success: true, id: String(keep.id) };
	}

	// Zero defaults → promote oldest active, or oldest overall (activate it)
	if (defaults.length === 0) {
		if (actives.length > 0) {
			const oldestActive = [...actives].sort((a, b) =>
				String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
			)[0];
			try {
				await pb
					.collection("locations")
					.update(String(oldestActive.id), {
						isDefault: true,
						updatedAt: new Date().toISOString(),
					});
				return { success: true, id: String(oldestActive.id) };
			} catch (e: unknown) {
				const msg = String((e as { message?: unknown })?.message ?? "").toLowerCase();
				const status = (e as { status?: unknown })?.status;
				const isUnique = msg.includes("unique") || status === 409 || status === 400;
				if (isUnique) {
					try {
						const retry = await pb.collection("locations").getList(1, 100, { filter });
						const found = (retry.items as Array<Record<string, unknown>>).find(
							(x) => x.isDefault === true,
						);
						if (found) return { success: true, id: String(found.id) };
					} catch {}
				}
				return { error: "Error al asegurar Sede predeterminada" };
			}
		}
		// No actives but items exist (all inactive) → activate oldest and make default
		if (items.length > 0) {
			const oldest = [...items].sort((a, b) =>
				String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
			)[0];
			try {
				await pb
					.collection("locations")
					.update(String(oldest.id), {
						isActive: true,
						isDefault: true,
						updatedAt: new Date().toISOString(),
					});
				return { success: true, id: String(oldest.id) };
			} catch {
				return { error: "Error al asegurar Sede predeterminada" };
			}
		}
	}

	return { success: true };
}

export async function setDefaultLocation(
	userId: string,
	locationId: string,
): Promise<{ success: true } | { error: string }> {
	if (!userId || !locationId) return { error: "Datos inválidos" };
	const pb = await createPocketBaseClient();
	let target: Record<string, unknown>;
	try {
		target = (await pb.collection("locations").getOne(locationId)) as Record<string, unknown>;
	} catch {
		return { error: "Sede no encontrada" };
	}
	if (String(target.userId) !== String(userId)) return { error: "Sede no encontrada" };
	if (target.isActive === false) return { error: "La Sede destino debe estar activa" };
	if (target.isDefault === true) return { success: true };

	const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: userId } });
	let items: Array<Record<string, unknown>> = [];
	try {
		const res = await pb.collection("locations").getList(1, 100, { filter });
		items = (res.items as Array<Record<string, unknown>>) ?? [];
	} catch {
		return { error: "Error al cambiar Sede predeterminada" };
	}
	const currentDefault = items.find((x) => x.isDefault === true) as
		| Record<string, unknown>
		| undefined;
	const now = new Date().toISOString();
	try {
		if (currentDefault && String(currentDefault.id) !== String(locationId)) {
			await pb
				.collection("locations")
				.update(String(currentDefault.id), { isDefault: false, updatedAt: now });
		}
		await pb
			.collection("locations")
			.update(String(locationId), { isDefault: true, updatedAt: now });
		return { success: true };
	} catch (e: unknown) {
		const msg = String((e as { message?: unknown })?.message ?? "").toLowerCase();
		const status = (e as { status?: unknown })?.status;
		const isUnique = msg.includes("unique") || status === 409 || status === 400;
		if (isUnique) {
			// Re-read to confirm exactly one default after race
			try {
				const retry = await pb.collection("locations").getList(1, 100, { filter });
				const defaults = (retry.items as Array<Record<string, unknown>>).filter(
					(x) => x.isDefault === true,
				);
				if (defaults.length === 1 && String(defaults[0].id) === String(locationId))
					return { success: true };
			} catch {}
			return { error: "Conflicto al cambiar Sede predeterminada" };
		}
		return { error: "Error al cambiar Sede predeterminada" };
	}
}
