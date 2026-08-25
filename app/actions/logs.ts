"use server";

import { getAuthUser } from "@/lib/auth";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { logListBinding, applyBinding } from "@/lib/pocketbase-filter";

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

	const page =
		params.page && Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
	const limit =
		params.limit && Number.isFinite(params.limit) && params.limit > 0
			? Math.floor(params.limit)
			: 20;

	try {
		const pb = await createPocketBaseClient();
		const binding = logListBinding({
			userId: user.id,
			locationId: params.locationId,
			startDate: params.startDate,
			endDate: params.endDate,
		});
		const filter = applyBinding(pb, binding);
		const result = await pb.collection("location_logs").getList(page, limit, {
			filter,
			sort: "-changedAt",
		});

		const total =
			typeof (result as { totalItems?: number }).totalItems === "number"
				? (result as { totalItems: number }).totalItems
				: 0;

		const rawLogs = (result.items as any[]) ?? [];
		if (rawLogs.length === 0) {
			return { data: [], total, page, limit };
		}

		// Enrich with service invoice/product/client and location names (best-effort)
		const serviceIds = Array.from(
			new Set(rawLogs.map((l) => l.ServiceId).filter(Boolean) as string[]),
		);
		const locIds = Array.from(
			new Set(
				rawLogs.flatMap((l) => [l.fromLocationId, l.toLocationId]).filter(Boolean) as string[],
			),
		);

		const serviceMap = new Map<string, any>();
		const locMap = new Map<string, any>();

		if (serviceIds.length > 0) {
			try {
				const sParts = serviceIds.map((_, i) => `id = {:sid${i}}`).join(" || ");
				const sParams: Record<string, unknown> = {};
				serviceIds.forEach((id, i) => {
					sParams[`sid${i}`] = id;
				});
				const sFilter = applyBinding(pb, {
					filter: `userId = {:uid} && (${sParts})`,
					params: { uid: user.id, ...sParams },
				});
				// Fallback if userId filter fails (e.g. no index), try without userId
				let sRes: any;
				try {
					sRes = await pb.collection("services").getList(1, 100, { filter: sFilter });
				} catch {
					const sFilter2 = applyBinding(pb, { filter: sParts, params: sParams });
					sRes = await pb.collection("services").getList(1, 100, { filter: sFilter2 });
				}
				for (const s of (sRes.items as any[]) ?? []) serviceMap.set(s.id, s);
			} catch {}
		}

		if (locIds.length > 0) {
			try {
				const lParts = locIds.map((_, i) => `id = {:lid${i}}`).join(" || ");
				const lParams: Record<string, unknown> = {};
				locIds.forEach((id, i) => {
					lParams[`lid${i}`] = id;
				});
				const lFilter = applyBinding(pb, { filter: lParts, params: lParams });
				const lRes = await pb.collection("locations").getList(1, 100, { filter: lFilter });
				for (const loc of (lRes.items as any[]) ?? []) locMap.set(loc.id, loc);
			} catch {}
		}

		const data = rawLogs.map((doc) => {
			const svc = serviceMap.get(doc.ServiceId);
			const fromLoc = locMap.get(doc.fromLocationId);
			const toLoc = locMap.get(doc.toLocationId);
			return {
				...doc,
				id: doc.id,
				invoiceNumber: svc?.invoiceNumber ?? doc.invoiceNumber ?? "",
				product: svc?.product ?? doc.product ?? "",
				clientName: svc?.clientName ?? doc.clientName ?? "",
				fromLocation: fromLoc?.name ?? doc.fromLocation ?? doc.fromLocationId ?? "",
				toLocation: toLoc?.name ?? doc.toLocation ?? doc.toLocationId ?? "",
			};
		});

		return {
			data,
			total,
			page,
			limit,
		};
	} catch (error) {
		console.error("Failed to fetch location logs:", error);
		return { error: "Error al cargar historial de movimientos" };
	}
}
