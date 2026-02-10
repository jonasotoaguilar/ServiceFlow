import { databases, COLLECTIONS, DB_ID, Query, ID } from "@/lib/appwrite";
import { Service, ServiceStatus } from "./types";

// Helper to convert Appwrite document to Service type
function mapToService(
	item: any,
	locMap: Map<string, any>,
	logs: any[] = [],
): Service {
	const locationName = locMap.get(item.locationId)?.name || "Sin Sede";

	// Sort logs for this Service
	const ServiceLogs = logs
		.filter((l) => l.ServiceId === item.$id)
		.sort(
			(a, b) =>
				new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
		)
		.map((log) => ({
			...log,
			id: log.$id,
			fromLocation: locMap.get(log.fromLocationId)?.name || "Desconocido",
			toLocation: locMap.get(log.toLocationId)?.name || "Desconocido",
			changedAt: log.changedAt, // Already string in Appwrite
		}));

	return {
		...item,
		id: item.$id, // Map $id to id
		location: locationName,
		entryDate: item.entryDate,
		deliveryDate: item.deliveryDate || undefined,
		readyDate: item.readyDate || undefined,
		cancellationDate: item.cancellationDate || undefined,
		status: item.status as ServiceStatus,
		locationLogs: ServiceLogs,
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
	const page = params?.page || 1;
	const limit = params?.limit || 20;
	const offset = (page - 1) * limit;

	const queries: string[] = [
		Query.limit(limit),
		Query.offset(offset),
		params?.sortOrder === "desc" ? Query.orderDesc("entryDate") : Query.orderAsc("entryDate"),
	];

	if (params?.userId) {
		queries.push(Query.equal("userId", params.userId));
	}

	if (params?.status && params.status.length > 0) {
		queries.push(Query.equal("status", params.status));
	}

	if (params?.location) {
		queries.push(Query.equal("locationId", params.location));
	}

	if (params?.search) {
		const search = params.search;
		// Note: 'search' requires FullText index
		// 'starsWith' works on Key index
		queries.push(
			Query.or([
				Query.search("clientName", search),
				Query.search("invoiceNumber", search),
				Query.search("rut", search),
			]),
		);
	}

	try {
		const result = await databases.listDocuments(
			DB_ID,
			COLLECTIONS.Services,
			queries,
		); // Casting query array to any[] if TS complains, but string[] is correct for SDK

		if (result.documents.length === 0) {
			return { data: [], total: result.total, page, limit };
		}

		// Batch Fetch Relations
		const ServiceIds = result.documents.map((d) => d.$id);

		// 1. Fetch Logs for these Services
		// Limit logs? If a Service has 100 logs, fetching all might be too much,
		// but usually they have few. Let's fetch reasonably.
		// We can't easily limit "per parent" in one query.
		// We'll fetch all logs where ServiceId IN [...].
		const logsResult = await databases.listDocuments(
			DB_ID,
			COLLECTIONS.LOCATION_LOGS,
			[
				Query.equal("ServiceId", ServiceIds),
				Query.limit(1000), // Sanity limit
			],
		);

		// 2. Collect all Location IDs
		const locationIds = new Set<string>();

		// From Services
		result.documents.forEach((d) => locationIds.add(d.locationId));

		// From logs
		logsResult.documents.forEach((l) => {
			locationIds.add(l.fromLocationId);
			locationIds.add(l.toLocationId);
		});

		// 3. Fetch Locations
		const locationsResult = await databases.listDocuments(
			DB_ID,
			COLLECTIONS.LOCATIONS,
			[
				Query.equal("$id", Array.from(locationIds)),
				Query.limit(100), // Sanity limit
			],
		);

		const locMap = new Map(locationsResult.documents.map((l) => [l.$id, l]));

		const data = result.documents.map((doc) =>
			mapToService(doc, locMap, logsResult.documents),
		);

		return {
			data,
			total: result.total,
			page,
			limit,
		};
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
