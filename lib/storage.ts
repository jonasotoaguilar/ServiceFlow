import { databases, COLLECTIONS, DB_ID, Query, ID } from "@/lib/appwrite";
import { Service, ServiceStatus } from "./types";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { serviceListBinding, applyBinding } from "@/lib/pocketbase-filter";

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
	const page = params?.page && Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
	const limit = params?.limit && Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : 20;
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
		const total = typeof (result as { totalItems?: number }).totalItems === "number"
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
		return { data, total, page, limit };
	} catch (error) {
		console.error("Error fetching Services:", error);
		throw error;
	}
}

export async function saveService(Service: Service): Promise<void> {
	try {
		await databases.createDocument(DB_ID, COLLECTIONS.Services, Service.id, {
			userId: Service.userId,
			invoiceNumber: Service.invoiceNumber,
			clientName: Service.clientName,
			rut: Service.rut,
			contact: Service.contact,
			email: Service.email,
			product: Service.product,
			failureDescription: Service.failureDescription,
			sku: Service.sku,
			locationId: Service.locationId,
			entryDate: new Date(Service.entryDate).toISOString(), // ensure ISO format
			deliveryDate: Service.deliveryDate
				? new Date(Service.deliveryDate).toISOString()
				: null,
			readyDate: Service.readyDate
				? new Date(Service.readyDate).toISOString()
				: null,
			cancellationDate: Service.cancellationDate
				? new Date(Service.cancellationDate).toISOString()
				: null,
			status: Service.status,
			repairCost: Service.repairCost,
			notes: Service.notes,
		});
	} catch (error) {
		console.error("Error saving Service:", error);
		throw error;
	}
}

export async function updateService(
	updatedService: Service,
	userId?: string,
): Promise<void> {
	// 1. Get current to check ownership and diff
	const current = await databases.getDocument(
		DB_ID,
		COLLECTIONS.Services,
		updatedService.id,
	);

	if (userId && current.userId !== userId) {
		throw new Error("No Service found or access denied");
	}

	if (current.status === "completed") {
		throw new Error("Cannot modify a completed Service");
	}

	// 2. Update Service
	await databases.updateDocument(
		DB_ID,
		COLLECTIONS.Services,
		updatedService.id,
		{
			invoiceNumber: updatedService.invoiceNumber,
			clientName: updatedService.clientName,
			rut: updatedService.rut,
			contact: updatedService.contact,
			email: updatedService.email,
			product: updatedService.product,
			failureDescription: updatedService.failureDescription,
			sku: updatedService.sku,
			locationId: updatedService.locationId,
			entryDate: new Date(updatedService.entryDate).toISOString(),
			deliveryDate: updatedService.deliveryDate
				? new Date(updatedService.deliveryDate).toISOString()
				: null,
			readyDate: updatedService.readyDate
				? new Date(updatedService.readyDate).toISOString()
				: null,
			cancellationDate: updatedService.cancellationDate
				? new Date(updatedService.cancellationDate).toISOString()
				: null,
			status: updatedService.status,
			repairCost: updatedService.repairCost,
			notes: updatedService.notes,
		},
	);

	// 3. Create Log if Location changed
	if (current.locationId !== updatedService.locationId) {
		if (
			updatedService.status === "completed" &&
			current.status !== "completed"
		) {
			// Skip logic as per original
		} else {
			await databases.createDocument(
				DB_ID,
				COLLECTIONS.LOCATION_LOGS,
				ID.unique(),
				{
					userId: current.userId, // use owner ID
					ServiceId: updatedService.id,
					fromLocationId: current.locationId,
					toLocationId: updatedService.locationId,
					changedAt: new Date().toISOString(),
				},
			);
		}
	}
}

export async function deleteService(id: string, userId?: string): Promise<void> {
	const current = await databases.getDocument(DB_ID, COLLECTIONS.Services, id);

	if (userId && current.userId !== userId) {
		throw new Error("No Service found or access denied");
	}

	// 1. Fetch all related location logs
	try {
		const logs = await databases.listDocuments(DB_ID, COLLECTIONS.LOCATION_LOGS, [
			Query.equal("ServiceId", id),
			Query.limit(100), // Assuming reasonable amount of logs
		]);

		// 2. Delete each log
		const deleteLogsPromises = logs.documents.map((log) =>
			databases.deleteDocument(DB_ID, COLLECTIONS.LOCATION_LOGS, log.$id),
		);

		await Promise.all(deleteLogsPromises);
	} catch (error) {
		console.error("Error deleting related logs:", error);
		// We continue to delete the Service even if logs deletion fails,
		// but ideally we'd want this to be atomic.
	}

	// 3. Delete the Service itself
	await databases.deleteDocument(DB_ID, COLLECTIONS.Services, id);
}
