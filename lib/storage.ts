import { Service, ServiceStatus } from "./types";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { serviceListBinding, applyBinding } from "@/lib/pocketbase-filter";
import { businessDaysSince, isUpcoming, isCritical } from "./service-days";

// Helper to convert PocketBase document to Service type (WU4 read-only)
function mapToService(item: any, locMap: Map<string, any>): Service {
	const locationName = locMap.get(item.locationId)?.name || "Sin Sede";
	return {
		...item,
		id: item.id,
		location: locationName,
		entryDate: item.entryDate,
		deliveryDate: item.deliveryDate || undefined,
		readyDate: item.readyDate || undefined,
		cancellationDate: item.cancellationDate || undefined,
		status: item.status as ServiceStatus,
	};
}

export async function getServices(params?: {
	page?: number;
	limit?: number;
	search?: string;
	status?: ServiceStatus[];
	location?: string;
	userId?: string;
	sortOrder?: "asc" | "desc";
}): Promise<{ data: Service[]; total: number; page: number; limit: number }> {
	const page =
		params?.page && Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
	const limit =
		params?.limit && Number.isFinite(params.limit) && params.limit > 0
			? Math.floor(params.limit)
			: 20;
	const sort = params?.sortOrder === "desc" ? "-entryDate" : "entryDate";
	const userId = params?.userId ?? "";
	const binding = serviceListBinding({
		userId,
		search: params?.search,
		status: params?.status,
		locationId: params?.location,
	});
	try {
		const pb = await createPocketBaseClient();
		const filter = applyBinding(pb, binding);
		const result = await pb.collection("services").getList(page, limit, {
			filter,
			sort,
		});
		const total =
			typeof (result as { totalItems?: number }).totalItems === "number"
				? (result as { totalItems: number }).totalItems
				: 0;
		if (!result.items || result.items.length === 0) {
			return { data: [], total, page, limit };
		}
		const locationIds = new Set<string>();
		for (const doc of result.items as Array<{ locationId?: string }>) {
			if (doc.locationId) locationIds.add(doc.locationId);
		}
		let locMap = new Map<string, any>();
		if (locationIds.size > 0) {
			const ids = Array.from(locationIds);
			const parts = ids.map((_, i) => `id = {:id${i}}`).join(" || ");
			const locParams: Record<string, unknown> = {};
			ids.forEach((id, i) => {
				locParams[`id${i}`] = id;
			});
			const locFilter = applyBinding(pb, { filter: parts, params: locParams });
			const locRes = await pb.collection("locations").getList(1, 100, {
				filter: locFilter,
			});
			locMap = new Map((locRes.items as Array<{ id: string }>).map((l) => [l.id, l]));
		}
		const data = (result.items as any[]).map((doc) => mapToService(doc, locMap));
		// Attach serviceEvents for history in details modal (best-effort)
		try {
			const serviceIds = (result.items as Array<{ id: string }>).map((s) => s.id);
			if (serviceIds.length > 0) {
				const logParts = serviceIds.map((_, i) => `ServiceId = {:sid${i}}`).join(" || ");
				const logParams: Record<string, unknown> = { uid: userId };
				serviceIds.forEach((id, i) => {
					logParams[`sid${i}`] = id;
				});
				const logFilter = applyBinding(pb, {
					filter: `userId = {:uid} && (${logParts})`,
					params: logParams,
				});
				const logsRes = await pb.collection("service_events").getList(1, 200, {
					filter: logFilter,
					sort: "changedAt",
				});
				const logsByService = new Map<string, Array<any>>();
				for (const log of (logsRes.items as any[]) ?? []) {
					const sid = (log as { ServiceId?: string }).ServiceId;
					if (!sid) continue;
					if (!logsByService.has(sid)) logsByService.set(sid, []);
					logsByService.get(sid)!.push(log);
				}
				// Resolve location names for logs if not in locMap
				const logLocationIds = new Set<string>();
				for (const logs of logsByService.values()) {
					for (const l of logs as Array<{ fromLocationId?: string; toLocationId?: string }>) {
						if (l.fromLocationId) logLocationIds.add(l.fromLocationId);
						if (l.toLocationId) logLocationIds.add(l.toLocationId);
					}
				}
				const missingIds = Array.from(logLocationIds).filter((id) => !locMap.has(id));
				if (missingIds.length > 0) {
					const mParts = missingIds.map((_, i) => `id = {:mid${i}}`).join(" || ");
					const mParams: Record<string, unknown> = {};
					missingIds.forEach((id, i) => {
						mParams[`mid${i}`] = id;
					});
					const mFilter = applyBinding(pb, { filter: mParts, params: mParams });
					const mRes = await pb.collection("locations").getList(1, 100, { filter: mFilter });
					for (const loc of mRes.items as Array<{ id: string }>) {
						locMap.set(loc.id, loc);
					}
				}
				for (const svc of data) {
					const logs = logsByService.get(svc.id) ?? [];
					(svc as Service).serviceEvents = logs.map((l: any) => ({
						id: l.id,
						ServiceId: l.ServiceId,
						fromLocationId: l.fromLocationId,
						toLocationId: l.toLocationId,
						changedAt: l.changedAt,
						fromLocation: locMap.get(l.fromLocationId)?.name || l.fromLocationId,
						toLocation: locMap.get(l.toLocationId)?.name || l.toLocationId,
					}));
				}
			}
		} catch {
			// logs are optional for list view
		}
		return { data, total, page, limit };
	} catch (error) {
		console.error("Error fetching Services:", error);
		throw error;
	}
}

export async function getServiceStats(userId: string): Promise<{
	pending: number;
	ready: number;
	completed: number;
	cancelled: number;
	upcoming: number;
	critical: number;
}> {
	if (!userId) throw new Error("userId required");
	const pb = await createPocketBaseClient();
	const statuses = ["pending", "ready", "completed", "cancelled"] as const;
	const counts: Record<string, number> = {};
	for (const status of statuses) {
		const filter = applyBinding(pb, {
			filter: "userId = {:uid} && status = {:status}",
			params: { uid: userId, status },
		});
		const res = await pb.collection("services").getList(1, 1, { filter });
		counts[status] =
			typeof (res as { totalItems?: number }).totalItems === "number"
				? (res as { totalItems: number }).totalItems
				: 0;
	}
	let upcoming = 0;
	let critical = 0;
	try {
		const pendingFilter = applyBinding(pb, {
			filter: "userId = {:uid} && status = {:status}",
			params: { uid: userId, status: "pending" },
		});
		const pendingRes = await pb.collection("services").getList(1, 500, { filter: pendingFilter });
		const items =
			(pendingRes.items as unknown as Array<{ entryDate: string; status: string }>) ?? [];
		for (const item of items) {
			const days = businessDaysSince(item.entryDate);
			if (isUpcoming(days)) upcoming++;
			else if (isCritical(days)) critical++;
		}
	} catch {
		// keep 0 on error
	}
	return {
		pending: counts.pending ?? 0,
		ready: counts.ready ?? 0,
		completed: counts.completed ?? 0,
		cancelled: counts.cancelled ?? 0,
		upcoming,
		critical,
	};
}

export async function saveService(service: Omit<Service, "id">): Promise<Service> {
	const pb = await createPocketBaseClient();
	const now = new Date().toISOString();
	const payload: Record<string, unknown> = {
		userId: service.userId,
		invoiceNumber: service.invoiceNumber,
		clientName: service.clientName,
		rut: service.rut,
		contact: service.contact,
		email: service.email,
		product: service.product,
		failureDescription: service.failureDescription,
		sku: service.sku,
		locationId: service.locationId,
		entryDate: service.entryDate ? new Date(service.entryDate).toISOString() : now,
		deliveryDate: service.deliveryDate ? new Date(service.deliveryDate).toISOString() : null,
		readyDate: service.readyDate ? new Date(service.readyDate).toISOString() : null,
		cancellationDate: service.cancellationDate
			? new Date(service.cancellationDate).toISOString()
			: service.status === "cancelled"
				? now
				: null,
		status: service.status ?? "pending",
		repairCost: service.repairCost,
		notes: service.notes ?? "",
	};
	const record = (await pb.collection("services").create(payload)) as any;
	// Lifecycle: created event — rollback service if event fails (no silent unlogged mutation)
	try {
		await pb.collection("service_events").create({
			userId: service.userId,
			ServiceId: record.id,
			kind: "created",
			fromLocationId: service.locationId,
			toLocationId: service.locationId,
			fromStatus: "pending",
			toStatus: "pending",
			actorId: service.userId,
			changedAt: now,
		});
	} catch (e) {
		try {
			await pb.collection("services").delete(record.id);
		} catch {}
		throw e;
	}
	return {
		...record,
		id: record.id,
		entryDate: record.entryDate,
		deliveryDate: record.deliveryDate || undefined,
		readyDate: record.readyDate || undefined,
		cancellationDate: record.cancellationDate || undefined,
		status: record.status as ServiceStatus,
	} as Service;
}

export async function updateService(updatedService: Service, userId?: string): Promise<void> {
	const pb = await createPocketBaseClient();
	let current: any;
	try {
		current = await pb.collection("services").getOne(updatedService.id);
	} catch {
		throw new Error("No Service found or access denied");
	}
	if (userId && current.userId !== userId) {
		throw new Error("No Service found or access denied");
	}
	if (current.status === "completed") {
		throw new Error("Cannot modify a completed Service");
	}
	const now = new Date().toISOString();
	const payload: Record<string, unknown> = {
		invoiceNumber: updatedService.invoiceNumber,
		clientName: updatedService.clientName,
		rut: updatedService.rut,
		contact: updatedService.contact,
		email: updatedService.email,
		product: updatedService.product,
		failureDescription: updatedService.failureDescription,
		sku: updatedService.sku,
		locationId: updatedService.locationId,
		entryDate: updatedService.entryDate
			? new Date(updatedService.entryDate).toISOString()
			: current.entryDate,
		deliveryDate: updatedService.deliveryDate
			? new Date(updatedService.deliveryDate).toISOString()
			: null,
		readyDate: updatedService.readyDate ? new Date(updatedService.readyDate).toISOString() : null,
		cancellationDate: updatedService.cancellationDate
			? new Date(updatedService.cancellationDate).toISOString()
			: updatedService.status === "cancelled" && !current.cancellationDate
				? now
				: (current.cancellationDate ?? null),
		status: updatedService.status,
		repairCost: updatedService.repairCost,
		notes: updatedService.notes,
	};
	const fromLocationId = current.locationId as string | undefined;
	const toLocationId = updatedService.locationId as string | undefined;
	const isLocationChanged = !!fromLocationId && !!toLocationId && fromLocationId !== toLocationId;
	const isCompleting = current.status !== "completed" && updatedService.status === "completed";
	// Atomicity: prefer batch if available, otherwise explicit rollback to avoid unlogged mutation
	const canBatch = false; // batch disabled per PocketBase 0.40.1 Batch requests are not allowed
	if (isLocationChanged && !isCompleting) {
		if (canBatch) {
			const batch: any = (pb as any).createBatch();
			batch.collection("services").update(updatedService.id, payload);
			batch.collection("service_events").create({
				userId: current.userId,
				ServiceId: updatedService.id,
				kind: "location_changed",
				fromLocationId,
				toLocationId,
				fromStatus: current.status,
				toStatus: updatedService.status,
				actorId: current.userId,
				changedAt: now,
			});
			await batch.send();
		} else {
			await pb.collection("services").update(updatedService.id, payload);
			try {
				await pb.collection("service_events").create({
					userId: current.userId,
					ServiceId: updatedService.id,
					kind: "location_changed",
					fromLocationId,
					toLocationId,
					fromStatus: current.status,
					toStatus: updatedService.status,
					actorId: current.userId,
					changedAt: now,
				});
			} catch (e) {
				// rollback location to avoid unlogged successful mutation
				try {
					await pb.collection("services").update(updatedService.id, { locationId: fromLocationId });
				} catch {}
				throw e;
			}
		}
	} else {
		await pb.collection("services").update(updatedService.id, payload);
	}
}

export async function deleteService(id: string, userId?: string): Promise<void> {
	const pb = await createPocketBaseClient();
	let current: any;
	try {
		current = await pb.collection("services").getOne(id);
	} catch {
		throw new Error("No Service found or access denied");
	}
	if (userId && current.userId !== userId) {
		throw new Error("No Service found or access denied");
	}
	const filter = applyBinding(pb, { filter: "ServiceId = {:sid}", params: { sid: id } });
	const logsRes = await pb.collection("service_events").getList(1, 100, { filter });
	const items = (logsRes.items as Array<{ id: string }>) ?? [];
	for (const log of items) {
		await pb.collection("service_events").delete(log.id);
	}
	await pb.collection("services").delete(id);
}
