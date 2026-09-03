const ALLOWED_STATUSES = new Set(["pending", "ready", "completed", "cancelled"]);
export type ServiceListParams = {
	userId: string;
	search?: string;
	status?: string[];
	locationId?: string;
};
export type LocationListParams = { userId: string; onlyActive?: boolean };
export type ServiceEventListParams = {
	userId: string;
	locationId?: string;
	startDate?: string;
	endDate?: string;
	kind?: string;
	status?: string;
};
export type ServiceEventOperationKeyParams = {
	userId: string;
	serviceId: string;
	operationKey: string;
};
import { normalizeRut, isRutShapedLookup } from "./rut";

export type Binding = { filter: string; params: Record<string, unknown> };
export function serviceListBinding(p: ServiceListParams): Binding {
	const parts = ["userId = {:uid}"];
	const params: Record<string, unknown> = { uid: p.userId };
	if (p.search !== undefined && p.search !== null && String(p.search).length > 0) {
		const raw = String(p.search);
		if (isRutShapedLookup(raw)) {
			parts.push("(clientName ~ {:search} || invoiceNumber ~ {:search} || rut ~ {:rutSearch})");
			params.search = raw;
			(params as Record<string, unknown>).rutSearch = normalizeRut(raw);
		} else {
			parts.push("(clientName ~ {:search} || invoiceNumber ~ {:search} || rut ~ {:search})");
			params.search = raw;
		}
	}
	if (p.status && p.status.length > 0) {
		const allowed = p.status.filter((s) => ALLOWED_STATUSES.has(s));
		if (allowed.length > 0) {
			parts.push(`(${allowed.map((_, i) => `status = {:st${i}}`).join(" || ")})`);
			allowed.forEach((s, i) => {
				params[`st${i}`] = s;
			});
		}
	}
	if (p.locationId) {
		parts.push("locationId = {:locationId}");
		params.locationId = p.locationId;
	}
	return { filter: parts.join(" && "), params };
}
export function locationListBinding(p: LocationListParams): Binding {
	const parts = ["userId = {:uid}"];
	const params: Record<string, unknown> = { uid: p.userId };
	if (p.onlyActive) parts.push("isActive = true");
	return { filter: parts.join(" && "), params };
}
export function serviceEventListBinding(p: ServiceEventListParams): Binding {
	const parts = ["userId = {:uid}"];
	const params: Record<string, unknown> = { uid: p.userId };
	if (p.kind) {
		parts.push("kind = {:kind}");
		params.kind = p.kind;
	}
	if (p.status) {
		parts.push("(fromStatus = {:status} || toStatus = {:status})");
		params.status = p.status;
	}
	if (p.locationId) {
		parts.push("(fromLocationId = {:lid} || toLocationId = {:lid})");
		params.lid = p.locationId;
	}
	if (p.startDate) {
		parts.push("changedAt >= {:startDate}");
		params.startDate = p.startDate;
	}
	if (p.endDate) {
		parts.push("changedAt <= {:endDate}");
		params.endDate = p.endDate;
	}
	return { filter: parts.join(" && "), params };
}
export function serviceEventOperationKeyBinding(p: ServiceEventOperationKeyParams): Binding {
	return {
		filter: "userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}",
		params: { uid: p.userId, sid: p.serviceId, key: p.operationKey },
	};
}
export function applyBinding(
	pb: { filter: (t: string, p: Record<string, unknown>) => string },
	b: Binding,
): string {
	return pb.filter(b.filter, b.params);
}
