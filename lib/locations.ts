import { createPocketBaseClient } from "@/lib/pocketbase";
import { applyBinding } from "@/lib/pocketbase-filter";

/**
 * Location invariant — every tenant must always have at least one active location.
 * No business role "Sede Principal"; the initial location is only bootstrap so a new tenant can operate.
 *
 * PocketBase schema:
 * - locations.isActive bool default true
 * - indexes: (userId) + (userId, isActive)
 *
 * ensureAtLeastOneLocation is idempotent and handles concurrent bootstrap via re-read on race.
 */
export async function ensureAtLeastOneLocation(
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
		return { error: "Error al asegurar sede" };
	}

	if (items.length === 0) {
		const now = new Date().toISOString();
		const payload: Record<string, unknown> = {
			name: "Sede Principal",
			userId,
			isActive: true,
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
				try {
					const retry = await pb.collection("locations").getList(1, 100, { filter });
					const found = (retry.items as Array<Record<string, unknown>>)[0];
					if (found) return { success: true, id: String(found.id) };
				} catch {}
			}
			return { error: "Error al crear sede inicial" };
		}
	}

	const actives = items.filter((x) => x.isActive !== false) as Array<Record<string, unknown>>;
	if (actives.length >= 1) return { success: true, id: String(actives[0].id) };

	const oldest = [...items].sort((a, b) =>
		String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
	)[0];
	try {
		await pb
			.collection("locations")
			.update(String(oldest.id), { isActive: true, updatedAt: new Date().toISOString() });
		return { success: true, id: String(oldest.id) };
	} catch {
		return { error: "Error al asegurar sede" };
	}
}

export const ensureDefaultLocation = ensureAtLeastOneLocation;
export const ensureInitialLocation = ensureAtLeastOneLocation;
