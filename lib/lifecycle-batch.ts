import { applyBinding, serviceEventOperationKeyBinding } from "@/lib/pocketbase-filter";
export const OPERATION_KEY_REGEX = /^[A-Za-z0-9_-]{16,64}$/;
export type LifecycleKind = "status_changed" | "location_changed";
export interface SendLifecycleBatchParams {
	pb: any;
	userId: string;
	serviceId: string;
	operationKey: string;
	kind: LifecycleKind;
	fromStatus?: string;
	toStatus?: string;
	fromLocationId?: string;
	toLocationId?: string;
	servicePatch: Record<string, unknown>;
}
export interface SendLifecycleBatchResult { status: number; code: string; data?: unknown; }
export class LifecycleBatchError extends Error {
	status: number;
	code: string;
	constructor(s: number, c: string, m: string) {
		super(m);
		this.status = s;
		this.code = c;
		this.name = "LifecycleBatchError";
	}
}
export function operationKeyFingerprint(k: string): string {
	let h = 0;
	for (let i = 0; i < k.length; i++) {
		h = (h << 5) - h + k.charCodeAt(i);
		h |= 0;
	}
	return `${k.length}:${Math.abs(h).toString(16).padStart(8, "0").slice(0, 8)}`;
}
function log(outcome: string, code: string, kind: string, statusClass: string, keyFp: string) {
	console.error(JSON.stringify({ event: "lifecycle_batch", outcome, code, kind, statusClass, keyFp }));
}
function isMatching(e: Record<string, unknown>, p: SendLifecycleBatchParams): boolean {
	return (
		e.kind === p.kind &&
		(e.fromStatus ?? null) === (p.fromStatus ?? null) &&
		(e.toStatus ?? null) === (p.toStatus ?? null) &&
		(e.fromLocationId ?? null) === (p.fromLocationId ?? null) &&
		(e.toLocationId ?? null) === (p.toLocationId ?? null)
	);
}
function isBatchDisabled(e: any): boolean {
	const s = e?.status ?? e?.response?.status;
	return s === 403 && /Batch requests are not allowed/i.test(String(e?.message ?? e?.response?.message ?? ""));
}
function isTimeout(e: any): boolean {
	if (e?.isAbort) return true;
	const s = e?.status ?? e?.response?.status;
	if (s === 0 || (typeof s === "number" && s >= 500)) return true;
	const msg = `${e?.message ?? ""} ${e?.response?.message ?? ""} ${e?.cause?.message ?? ""}`;
	return /timeout|network|abort|fetch failed|ECONNRESET|ETIMEDOUT/i.test(msg);
}
function isUnique(e: any): boolean {
	if ((e?.status ?? e?.response?.status) !== 400) return false;
	const d = e?.response?.data ?? e?.data ?? {};
	if (d?.operationKey || d?.lifecycleSeq) return true;
	return /unique|already exists|validation_not_unique/i.test(`${e?.message ?? ""} ${JSON.stringify(d)}`);
}
function scopedFilter(p: SendLifecycleBatchParams) {
	return applyBinding(p.pb, serviceEventOperationKeyBinding({ userId: p.userId, serviceId: p.serviceId, operationKey: p.operationKey }));
}
export async function sendLifecycleBatch(p: SendLifecycleBatchParams): Promise<SendLifecycleBatchResult> {
	const keyFp = operationKeyFingerprint(p.operationKey);
	if (!OPERATION_KEY_REGEX.test(p.operationKey)) {
		log("error", "INVALID_OPERATION_KEY", p.kind, "4xx", keyFp);
		throw new LifecycleBatchError(400, "INVALID_OPERATION_KEY", "Invalid operationKey");
	}
	let svc: any;
	try {
		svc = await p.pb.collection("services").getOne(p.serviceId);
	} catch {
		log("error", "NOT_FOUND", p.kind, "4xx", keyFp);
		throw new LifecycleBatchError(403, "NOT_FOUND", "Service not found");
	}
	if (!svc || svc.userId !== p.userId) {
		log("error", "NOT_FOUND", p.kind, "4xx", keyFp);
		throw new LifecycleBatchError(403, "NOT_FOUND", "Service not found");
	}
	let existing: any[] = [];
	try {
		const r = await p.pb.collection("service_events").getList(1, 1, { filter: scopedFilter(p) });
		existing = r.items ?? [];
	} catch {
		log("error", "INTERNAL", p.kind, "5xx", keyFp);
		throw new LifecycleBatchError(500, "INTERNAL", "lookup failed");
	}
	if (existing.length > 0) {
		const e = existing[0] as Record<string, unknown>;
		if (isMatching(e, p)) {
			log("success", "OK", p.kind, "2xx", keyFp);
			return { status: 200, code: "OK", data: e };
		}
		log("error", "OPERATION_KEY_REUSED", p.kind, "4xx", keyFp);
		throw new LifecycleBatchError(422, "OPERATION_KEY_REUSED", "key reused");
	}
	const nextSeq = (svc.lifecycleSeq ?? 0) + 1;
	const servicePayload = { ...p.servicePatch, lifecycleSeq: nextSeq };
	const eventPayload = {
		userId: p.userId,
		ServiceId: p.serviceId,
		operationKey: p.operationKey,
		lifecycleSeq: nextSeq,
		kind: p.kind,
		fromStatus: p.fromStatus ?? null,
		toStatus: p.toStatus ?? null,
		fromLocationId: p.fromLocationId ?? null,
		toLocationId: p.toLocationId ?? null,
		actorId: p.userId,
		changedAt: new Date().toISOString(),
	};
	try {
		const b = p.pb.createBatch();
		b.collection("services").update(p.serviceId, servicePayload);
		b.collection("service_events").create(eventPayload);
		await b.send();
		log("success", "OK", p.kind, "2xx", keyFp);
		return { status: 200, code: "OK", data: { serviceId: p.serviceId, lifecycleSeq: nextSeq } };
	} catch (e: any) {
		if (isBatchDisabled(e)) {
			log("error", "BATCH_UNAVAILABLE", p.kind, "4xx", keyFp);
			throw new LifecycleBatchError(403, "BATCH_UNAVAILABLE", "Batch disabled");
		}
		if (isTimeout(e)) {
			try {
				const r = await p.pb.collection("service_events").getList(1, 1, { filter: scopedFilter(p) });
				if ((r.items ?? []).length > 0) {
					log("success", "OK", p.kind, "2xx", keyFp);
					return { status: 200, code: "OK", data: r.items[0] };
				}
			} catch {}
			log("error", "TRANSITION_CONFLICT", p.kind, "4xx", keyFp);
			throw new LifecycleBatchError(409, "TRANSITION_CONFLICT", "timeout conflict");
		}
		if (isUnique(e)) {
			try {
				const r = await p.pb.collection("service_events").getList(1, 1, { filter: scopedFilter(p) });
				if ((r.items ?? []).length > 0) {
					log("error", "OPERATION_KEY_REUSED", p.kind, "4xx", keyFp);
					throw new LifecycleBatchError(422, "OPERATION_KEY_REUSED", "reused");
				}
			} catch (ex: any) {
				if (ex instanceof LifecycleBatchError && ex.status === 422) throw ex;
			}
			log("error", "TRANSITION_CONFLICT", p.kind, "4xx", keyFp);
			throw new LifecycleBatchError(409, "TRANSITION_CONFLICT", "concurrent");
		}
		const s = e?.status ?? e?.response?.status;
		if (typeof s === "number" && s >= 400 && s < 500) {
			log("error", "VALIDATION_ERROR", p.kind, "4xx", keyFp);
			throw new LifecycleBatchError(400, "VALIDATION_ERROR", "validation");
		}
		log("error", "INTERNAL", p.kind, "5xx", keyFp);
		throw new LifecycleBatchError(500, "INTERNAL", "unexpected");
	}
}
