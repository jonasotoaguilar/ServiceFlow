"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { normalizeString } from "@/lib/utils";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { locationListBinding, applyBinding } from "@/lib/pocketbase-filter";
import { LocationCreateSchema, LocationUpdateSchema } from "@/lib/schemas";

export async function getLocations(onlyActive = false) {
	const user = await getAuthUser();
	if (!user) return { error: "No autenticado" };
	try {
		const pb = await createPocketBaseClient();
		const binding = locationListBinding({ userId: user.id, onlyActive });
		const filter = applyBinding(pb, binding);
		const result = await pb.collection("locations").getList(1, 50, { filter, sort: "-createdAt" });
		const locations = result.items.map((doc: any) => ({ ...doc, id: doc.id }));
		if (locations.length === 0) return { data: [] };

		// Fetch all services with pagination and selected fields — avoids 200-row truncation.
		const svcFilter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
		const svcItems: Array<{
			locationId?: string;
			originLocationId?: string;
			status?: string;
		}> = [];
		let svcPage = 1;
		const svcPerPage = 200;
		while (true) {
			const svcRes: any = await pb.collection("services").getList(svcPage, svcPerPage, {
				filter: svcFilter,
				fields: "id,locationId,originLocationId,status",
				sort: "id",
			});
			const items =
				(svcRes?.items as Array<{
					locationId?: string;
					originLocationId?: string;
					status?: string;
				}>) ?? [];
			svcItems.push(...items);
			const total = typeof svcRes?.totalItems === "number" ? svcRes.totalItems : undefined;
			if (typeof total === "number") {
				if (svcPage * svcPerPage >= total) break;
			} else if (items.length < svcPerPage) break;
			svcPage++;
			if (svcPage > 50) break; // safety cap: 10k services
		}

		// Fetch all service_events for history — also paginated with selected fields.
		const logFilter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
		const logItems: Array<{ fromLocationId?: string; toLocationId?: string }> = [];
		let logPage = 1;
		const logPerPage = 200;
		while (true) {
			const logRes: any = await pb.collection("service_events").getList(logPage, logPerPage, {
				filter: logFilter,
				fields: "fromLocationId,toLocationId",
				sort: "id",
			});
			const items =
				(logRes?.items as Array<{ fromLocationId?: string; toLocationId?: string }>) ?? [];
			logItems.push(...items);
			const total = typeof logRes?.totalItems === "number" ? logRes.totalItems : undefined;
			if (typeof total === "number") {
				if (logPage * logPerPage >= total) break;
			} else if (items.length < logPerPage) break;
			logPage++;
			if (logPage > 50) break;
		}

		const svcCountMap = new Map<string, { active: number; completed: number }>();
		const historySet = new Set<string>();
		for (const s of svcItems) {
			const currentLoc = s.locationId;
			const originLoc = (s as any).originLocationId || null;
			if (currentLoc) historySet.add(currentLoc);
			if (originLoc) historySet.add(originLoc);
			if (s.status === "completed") {
				// Completed counts toward origin, not current location after transfer.
				// After migration origin is durable; missing origin (pre-migration) is not counted to avoid silent misattribution.
				const origin = originLoc;
				if (!origin) continue;
				if (!svcCountMap.has(origin)) svcCountMap.set(origin, { active: 0, completed: 0 });
				svcCountMap.get(origin)!.completed++;
			} else if (s.status === "pending" || s.status === "ready") {
				if (!currentLoc) continue;
				if (!svcCountMap.has(currentLoc)) svcCountMap.set(currentLoc, { active: 0, completed: 0 });
				svcCountMap.get(currentLoc)!.active++;
			} else if (s.status === "cancelled") {
				// cancelled contributes to history only, not to counts
			}
		}
		for (const l of logItems) {
			if (l.fromLocationId) historySet.add(l.fromLocationId);
			if (l.toLocationId) historySet.add(l.toLocationId);
		}
		const enriched = locations.map((loc: any) => {
			const counts = svcCountMap.get(loc.id) || { active: 0, completed: 0 };
			return {
				...loc,
				activeCount: counts.active,
				completedCount: counts.completed,
				hasHistory: historySet.has(loc.id),
			};
		});
		return { data: enriched };
	} catch (error) {
		console.error("Failed to fetch locations:", error);
		return { error: "Error al cargar Sedes" };
	}
}

export async function createLocation(prevState: any, formData: FormData) {
	const user = await getAuthUser();
	if (!user) return { error: "No autenticado" };
	const rawName = formData.get("name") as string | null;
	const rawAddress = formData.get("address") as string | null;
	const parsed = LocationCreateSchema.safeParse({
		name: rawName ?? "",
		address: rawAddress ?? undefined,
	});
	if (!parsed.success)
		return { error: parsed.error.issues[0]?.message ?? "El nombre es requerido" };
	const { name, address } = parsed.data;
	try {
		const pb = await createPocketBaseClient();
		const normalizedNew = normalizeString(name);
		const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
		const existingResult = await pb.collection("locations").getList(1, 100, { filter });
		const isDuplicate = (existingResult.items as unknown as Array<{ name: string }>).some(
			(loc) => normalizeString(loc.name) === normalizedNew,
		);
		if (isDuplicate) return { error: "Ya existe una Sede con este nombre (o similar)" };
		const docData: Record<string, unknown> = {
			name,
			userId: user.id,
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		if (address !== undefined) docData.address = address;
		await pb.collection("locations").create(docData);
		revalidatePath("/locations");
		return { success: true, message: "Sede creada correctamente" };
	} catch (error: any) {
		console.error("Error creating location:", error);
		return { error: "Error al crear la Sede" };
	}
}

export async function updateLocation(prevState: any, formData: FormData) {
	const user = await getAuthUser();
	if (!user) return { error: "No autenticado" };
	const id = formData.get("id") as string | null;
	const rawName = formData.get("name") as string | null;
	const rawAddress = formData.get("address") as string | null;
	if (!id) return { error: "ID de Sede requerido" };
	const parsed = LocationUpdateSchema.safeParse({
		name: rawName ?? "",
		address: rawAddress ?? undefined,
	});
	if (!parsed.success)
		return { error: parsed.error.issues[0]?.message ?? "El nombre es requerido" };
	const { name, address } = parsed.data;
	try {
		const pb = await createPocketBaseClient();
		let location: any;
		try {
			location = await pb.collection("locations").getOne(id);
		} catch {
			return { error: "Sede no encontrada" };
		}
		if (!location || location.userId !== user.id) return { error: "Sede no encontrada" };
		const normalizedNew = normalizeString(name);
		const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
		const existingResult = await pb.collection("locations").getList(1, 100, { filter });
		const isDuplicate = (
			existingResult.items as unknown as Array<{ id: string; name: string }>
		).some((loc) => loc.id !== id && normalizeString(loc.name) === normalizedNew);
		if (isDuplicate) return { error: "Ya existe otra Sede con este nombre (o similar)" };
		const updateData: Record<string, unknown> = { name, updatedAt: new Date().toISOString() };
		if (address !== undefined) updateData.address = address;
		await pb.collection("locations").update(id, updateData);
		revalidatePath("/locations");
		return { success: true, message: "Sede actualizada correctamente" };
	} catch (error: any) {
		console.error("Error updating location:", error);
		return { error: "Error al actualizar la Sede" };
	}
}

export async function toggleLocationActive(id: string, active: boolean) {
	const user = await getAuthUser();
	if (!user) return { error: "No autenticado" };
	try {
		const pb = await createPocketBaseClient();
		let doc: any;
		try {
			doc = await pb.collection("locations").getOne(id);
		} catch {
			return { error: "No autorizado" };
		}
		if (doc.userId !== user.id) return { error: "No autorizado" };
		if (!active) {
			const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
			const res = await pb.collection("locations").getList(1, 100, { filter });
			const items = (res.items as Array<{ id: string; isActive?: boolean }>) ?? [];
			const activeCount = items.filter((x) => x.isActive !== false).length;
			const targetIsActive = doc.isActive !== false;
			if (targetIsActive && activeCount <= 1)
				return { error: "Debe mantener al menos una Sede activa" };
		}
		await pb
			.collection("locations")
			.update(id, { isActive: active, updatedAt: new Date().toISOString() });
		revalidatePath("/locations");
		return { success: true };
	} catch (error) {
		console.error("Error toggling location active:", error);
		return { error: "Error al actualizar la Sede" };
	}
}

export async function deleteLocation(id: string, name: string) {
	const user = await getAuthUser();
	if (!user) return { error: "No autenticado" };
	try {
		const pb = await createPocketBaseClient();
		let location: any;
		try {
			location = await pb.collection("locations").getOne(id);
		} catch {
			return { error: "Sede no encontrada" };
		}
		if (!location || location.userId !== user.id) return { error: "Sede no encontrada" };
		const serviceFilter = applyBinding(pb, {
			filter: "userId = {:uid} && (locationId = {:locationId} || originLocationId = {:locationId})",
			params: { uid: user.id, locationId: id },
		});
		const servicesRes = await pb.collection("services").getList(1, 1, { filter: serviceFilter });
		const logFilter = applyBinding(pb, {
			filter: "userId = {:uid} && (fromLocationId = {:lid} || toLocationId = {:lid})",
			params: { uid: user.id, lid: id },
		});
		const logsRes = await pb.collection("service_events").getList(1, 1, { filter: logFilter });
		const hasServices =
			typeof (servicesRes as { totalItems?: number }).totalItems === "number"
				? (servicesRes as { totalItems: number }).totalItems > 0
				: (servicesRes.items?.length ?? 0) > 0;
		const hasLogs =
			typeof (logsRes as { totalItems?: number }).totalItems === "number"
				? (logsRes as { totalItems: number }).totalItems > 0
				: (logsRes.items?.length ?? 0) > 0;
		if (hasServices || hasLogs)
			return { error: "No se puede eliminar una Sede con historial de servicios o movimientos." };
		// Last-active guard (after historial so historial takes precedence in tests)
		if (location.isActive !== false) {
			const filterActive = applyBinding(pb, {
				filter: "userId = {:uid}",
				params: { uid: user.id },
			});
			const resActive = await pb.collection("locations").getList(1, 100, { filter: filterActive });
			const itemsActive = (resActive.items as Array<{ id: string; isActive?: boolean }>) ?? [];
			const activeCount = itemsActive.filter((x) => x.isActive !== false).length;
			if (activeCount <= 1) return { error: "Debe mantener al menos una Sede activa" };
		}
		await pb.collection("locations").delete(id);
		revalidatePath("/locations");
		return { success: true };
	} catch (error) {
		console.error("Error deleting location:", error);
		return { error: "Error al eliminar la Sede" };
	}
}
