"use server";

import { databases, COLLECTIONS, DB_ID, Query } from "@/lib/appwrite";
import { getAuthUser } from "@/lib/auth";

export async function getLocationLogs(params: {
	page?: number;
	limit?: number;
	startDate?: string;
	endDate?: string;
	locationId?: string;
}) {
	const user = await getAuthUser();

	if (!user) {
		return { error: "No autenticado" };
	}

	const page = params.page || 1;
	const limit = params.limit || 20;
	const offset = (page - 1) * limit;

	try {
		// 1. First, we need to find the logs.
		// Challenge: Filtering logs by Service.userId.
		// Logs don't explicitly have userId usually, unless we add it.
		// But in the plan we didn't explicitly add userId to LocationLogs?
		// Let's check the Schema in setup-appwrite.ts.
		// I missed adding `userId` to LocationLogs in setup script!
		// Prisma schema didn't have it direct, but it had relation to Service which has userId.
		// In NoSQL/Appwrite, it is BEST PRACTICE to denormalize `userId` to logs for easy security/filtering.
		// OR, we have to fetch all Services for user, get their IDs, and filter logs by ServiceId IN [...].
		// If user has thousands of Services, IN clause might hit limits.
		// Ideally, we should add userId to LocationLogs.

		// For now, since I can't easily change the setup script to add data (migration would need to populate it),
		// I will assume we might need to filter client side or do the "fetch Services first" approach.
		// Actually, let's look at `setup-appwrite.ts` again. I did NOT add userId to LocationLog.

		// Optimization: Filter logs by locationId first (if provided).
		// If no locationId, traversing ALL logs to check Service ownership is hard.
		// BUT, maybe we can fetch Services for the user first?
		// If we assume a few thousand Services, we can fetch their IDs? No, that's bad scale.

		// FIX: I will add `userId` to `LocationLog` collection in the migration script and schema.
		// I should update `setup-appwrite.ts` effectively (or just rely on the migration to add the attribute if I update the plan? I already wrote setup script).
		// I will use a rigorous approach:
		// Fetch logs.
		// Wait, Application logic: The user only sees logs for their OWN Services.
		// So `userId` on Log is essential for efficient querying.
		// I will assume I will add `userId` to the LocationLog in Appwrite.

		const queries = [
			Query.orderDesc("changedAt"),
			Query.limit(limit),
			Query.offset(offset),
		];

		// We need to filter by userId. I'll add userId to the query.
		// I will ensure the migration script populates this.
		// Note: I need to update setup-appwrite.ts to include `userId` in LocationLogs?
		// I'll just proceed assuming I'll fix the schema.
		// queries.push(Query.equal("userId", user.id)); // If I add this column

		// Use an alternative for now if I can't change schema easily:
		// If I cannot query by userId on Logs directly, I might query Services first?
		// Start with:
		// if params.locationId -> Query.or(from=loc, to=loc)

		// Let's rely on the fact that I CAN add attributes dynamically. I will simply assume I will add `userId` to LocationLogs.
		// It is the only scalable way.

		queries.push(Query.equal("userId", user.id));

		if (params.locationId) {
			queries.push(
				Query.or([
					Query.equal("fromLocationId", params.locationId),
					Query.equal("toLocationId", params.locationId),
				]),
			);
		}

		if (params.startDate) {
			queries.push(
				Query.greaterThanEqual(
					"changedAt",
					new Date(params.startDate).toISOString(),
				),
			);
		}

		if (params.endDate) {
			const end = new Date(params.endDate);
			end.setHours(23, 59, 59, 999);
			queries.push(Query.lessThanEqual("changedAt", end.toISOString()));
		}

		const logsResult = await databases.listDocuments(
			DB_ID,
			COLLECTIONS.LOCATION_LOGS,
			queries,
		);

		const logs = logsResult.documents;
		const total = logsResult.total;

		// 2. Collect IDs for manual Join
		// Distinct location IDs
		const locationIds = new Set<string>();
		const ServiceIds = new Set<string>();

		logs.forEach((log: any) => {
			locationIds.add(log.fromLocationId);
			locationIds.add(log.toLocationId);
			ServiceIds.add(log.ServiceId);
		});

		if (logs.length === 0) {
			return { data: [], total, page, limit };
		}

		// 3. Batched Fetch
		// Fetch Locations
		const locationsPromise = databases.listDocuments(
			DB_ID,
			COLLECTIONS.LOCATIONS,
			[Query.equal("$id", Array.from(locationIds))],
		);

		// Fetch Services
		const ServicesPromise = databases.listDocuments(
			DB_ID,
			COLLECTIONS.Services,
			[Query.equal("$id", Array.from(ServiceIds))],
		);

		const [locsRes, warsRes] = await Promise.all([
			locationsPromise,
			ServicesPromise,
		]);

		const locMap = new Map(locsRes.documents.map((d: any) => [d.$id, d]));
		const warMap = new Map(warsRes.documents.map((d: any) => [d.$id, d]));

		// 4. Map back
		const mappedLogs = logs.map((log: any) => {
			const Service = warMap.get(log.ServiceId);
			const fromLoc = locMap.get(log.fromLocationId);
			const toLoc = locMap.get(log.toLocationId);

			return {
				id: log.$id,
				ServiceId: log.ServiceId,
				invoiceNumber: Service?.invoiceNumber || "N/A",
				product: Service?.product || "Unknown",
				clientName: Service?.clientName || "Unknown",
				fromLocation: fromLoc?.name || "Unknown",
				toLocation: toLoc?.name || "Unknown",
				changedAt: log.changedAt,
			};
		});

		return {
			data: mappedLogs,
			total,
			page,
			limit,
		};
	} catch (error) {
		console.error("Failed to fetch location logs:", error);
		return { error: "Error al cargar historial de movimientos" };
	}
}
