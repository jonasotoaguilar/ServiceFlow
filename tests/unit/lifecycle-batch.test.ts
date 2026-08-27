import { describe, it, expect, vi, beforeEach } from "vitest";
import { OPERATION_KEY_REGEX, sendLifecycleBatch } from "@/lib/lifecycle-batch";
const VALID_KEY = "AbcDef1234567890_-";
const VALID_KEY2 = "Xyz789_UpdatedKey12";
const SERVICE_ID = "pb15svc00000001";
const USER_ID = "user-1";
const OTHER_USER = "other-user-99";
function createMockPb() {
	const filterFn = vi.fn((t: string, p: Record<string, unknown>) => {
		let o = t;
		for (const [k, v] of Object.entries(p)) o = o.replaceAll(`{:${k}}`, `"${String(v)}"`);
		return o;
	});
	const getOne = vi.fn();
	const getList = vi.fn();
	const updateFn = vi.fn();
	const createFn = vi.fn();
	const sendFn = vi.fn();
	const collectionFn = vi.fn((n: string) =>
		n === "services" ? { getOne, getList } : n === "service_events" ? { getList, create: vi.fn() } : { getOne: vi.fn(), getList: vi.fn() },
	);
	const createBatchFn = vi.fn(() => ({
		collection: vi.fn((c: string) => (c === "services" ? { update: updateFn } : { create: createFn })),
		send: sendFn,
	}));
	return { pb: { filter: filterFn, collection: collectionFn, createBatch: createBatchFn } as any, filterFn, getOne, getList, updateFn, createFn, sendFn, createBatchFn };
}
function serviceRecord(o: Record<string, unknown> = {}) {
	return { id: SERVICE_ID, userId: USER_ID, status: "pending", locationId: "loc_pb_15_chars1", lifecycleSeq: 0, ...o };
}
function eventRecord(o: Record<string, unknown> = {}) {
	return { id: "evt_15_chars00001", userId: USER_ID, ServiceId: SERVICE_ID, operationKey: VALID_KEY, lifecycleSeq: 1, kind: "status_changed", fromStatus: "pending", toStatus: "ready", ...o };
}
const base = (pb: any, o: Record<string, unknown> = {}) => ({
	pb,
	userId: USER_ID,
	serviceId: SERVICE_ID,
	operationKey: VALID_KEY,
	kind: "status_changed" as const,
	servicePatch: { status: "ready" },
	...o,
});
describe("lifecycle-batch sendLifecycleBatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});
	it("validates operationKey and rejects invalid before I/O", async () => {
		expect(OPERATION_KEY_REGEX.test(VALID_KEY)).toBe(true);
		expect(OPERATION_KEY_REGEX.test(VALID_KEY2)).toBe(true);
		expect(OPERATION_KEY_REGEX.test("short")).toBe(false);
		const { pb, getOne, createBatchFn } = createMockPb();
		const invalid = ["short", "bad key! with spaces", "", "a".repeat(15), "a".repeat(65)];
		for (const bad of invalid) {
			let e: any = null;
			await sendLifecycleBatch({ ...base(pb), operationKey: bad }).catch((x) => (e = x));
			expect(e?.code).toBe("INVALID_OPERATION_KEY");
		}
		expect(getOne).not.toHaveBeenCalled();
		expect(createBatchFn).not.toHaveBeenCalled();
	});
	it("enforces scoped lookup and tenant isolation via 403", async () => {
		const { pb, filterFn, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValue({ items: [] });
		sendFn.mockResolvedValue({});
		await sendLifecycleBatch(base(pb));
		const [tpl, params] = filterFn.mock.calls[0] as [string, Record<string, unknown>];
		expect(tpl).toBe("userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}");
		expect(params).toEqual({ uid: USER_ID, sid: SERVICE_ID, key: VALID_KEY });
		const cases = [
			() => {
				const m = createMockPb();
				m.getOne.mockRejectedValue({ status: 404 });
				return m;
			},
			() => {
				const m = createMockPb();
				m.getOne.mockResolvedValue(serviceRecord({ userId: OTHER_USER }));
				return m;
			},
		];
		for (const mk of cases) {
			const m = mk();
			let err: any = null;
			await sendLifecycleBatch(base(m.pb)).catch((e) => (err = e));
			expect(err.status).toBe(403);
		}
	});
	it("handles idempotency reuse atomic seq and 403 batch disabled", async () => {
		const m1 = createMockPb();
		m1.getOne.mockResolvedValue(serviceRecord());
		m1.getList.mockResolvedValue({ items: [eventRecord({ toStatus: "cancelled" })] });
		let e1: any = null;
		await sendLifecycleBatch({ ...base(m1.pb), fromStatus: "pending", toStatus: "ready" }).catch((x) => (e1 = x));
		expect(e1.status).toBe(422);
		const m2 = createMockPb();
		m2.getOne.mockResolvedValue(serviceRecord());
		m2.getList.mockResolvedValue({ items: [eventRecord({ fromLocationId: "loc_a", toLocationId: "loc_a" })] });
		const r2 = await sendLifecycleBatch({ ...base(m2.pb), fromStatus: "pending", toStatus: "ready", fromLocationId: "loc_a", toLocationId: "loc_a" });
		expect(r2.status).toBe(200);
		expect(m2.createBatchFn).not.toHaveBeenCalled();
		const m3 = createMockPb();
		m3.getOne.mockResolvedValue(serviceRecord({ lifecycleSeq: 5 }));
		m3.getList.mockResolvedValue({ items: [] });
		m3.sendFn.mockResolvedValue({});
		await sendLifecycleBatch({ ...base(m3.pb), kind: "location_changed", fromLocationId: "loc_a", toLocationId: "loc_b", servicePatch: { locationId: "loc_b" } });
		expect(m3.createBatchFn).toHaveBeenCalledTimes(1);
		expect(m3.updateFn).toHaveBeenCalledWith(SERVICE_ID, expect.objectContaining({ lifecycleSeq: 6 }));
		expect(m3.createFn).toHaveBeenCalledWith(expect.objectContaining({ lifecycleSeq: 6 }));
		const m4 = createMockPb();
		m4.getOne.mockResolvedValue(serviceRecord());
		m4.getList.mockResolvedValue({ items: [] });
		const err: any = new Error("Batch requests are not allowed.");
		err.status = 403;
		err.response = { message: "Batch requests are not allowed." };
		m4.sendFn.mockRejectedValue(err);
		let e4: any = null;
		await sendLifecycleBatch(base(m4.pb)).catch((x) => (e4 = x));
		expect(e4.code).toBe("BATCH_UNAVAILABLE");
	});
	it("reconciles timeout and unique races with single relookup", async () => {
		const m1 = createMockPb();
		m1.getOne.mockResolvedValue(serviceRecord());
		m1.getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [eventRecord()] });
		const t1: any = new Error("timeout");
		t1.status = 0;
		t1.isAbort = true;
		m1.sendFn.mockRejectedValue(t1);
		expect((await sendLifecycleBatch(base(m1.pb))).status).toBe(200);
		const m2 = createMockPb();
		m2.getOne.mockResolvedValue(serviceRecord());
		m2.getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [] });
		m2.sendFn.mockRejectedValue({ status: 0, isAbort: true, message: "network" });
		let e2: any = null;
		await sendLifecycleBatch(base(m2.pb)).catch((x) => (e2 = x));
		expect(e2.status).toBe(409);
		const m3 = createMockPb();
		m3.getOne.mockResolvedValue(serviceRecord());
		m3.getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [eventRecord()] });
		const u3: any = new Error("unique");
		u3.status = 400;
		u3.response = { data: { operationKey: { code: "validation_not_unique" } } };
		m3.sendFn.mockRejectedValue(u3);
		let e3: any = null;
		await sendLifecycleBatch(base(m3.pb)).catch((x) => (e3 = x));
		expect(e3.status).toBe(422);
		const m4 = createMockPb();
		m4.getOne.mockResolvedValue(serviceRecord());
		m4.getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [] });
		const u4: any = new Error("unique");
		u4.status = 400;
		u4.response = { data: { lifecycleSeq: { code: "validation_not_unique" } } };
		m4.sendFn.mockRejectedValue(u4);
		let e4: any = null;
		await sendLifecycleBatch(base(m4.pb)).catch((x) => (e4 = x));
		expect(e4.status).toBe(409);
	});
	it("maps validation 4xx to 400 unexpected to 500 and logs fingerprint", async () => {
		const m1 = createMockPb();
		m1.getOne.mockResolvedValue(serviceRecord());
		m1.getList.mockResolvedValue({ items: [] });
		const v: any = new Error("validation");
		v.status = 400;
		v.response = { data: { clientName: { code: "validation_required" } } };
		m1.sendFn.mockRejectedValue(v);
		let e1: any = null;
		await sendLifecycleBatch(base(m1.pb)).catch((x) => (e1 = x));
		expect(e1.status).toBe(400);
		const m2 = createMockPb();
		m2.getOne.mockResolvedValue(serviceRecord());
		m2.getList.mockResolvedValue({ items: [] });
		m2.sendFn.mockRejectedValue(new Error("weird unknown"));
		let e2: any = null;
		await sendLifecycleBatch(base(m2.pb)).catch((x) => (e2 = x));
		expect(e2.status).toBe(500);
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const m3 = createMockPb();
		m3.getOne.mockResolvedValue(serviceRecord());
		m3.getList.mockResolvedValue({ items: [] });
		m3.sendFn.mockResolvedValue({});
		await sendLifecycleBatch(base(m3.pb));
		const logged = spy.mock.calls.map((c) => String(c[0])).join(" ");
		expect(logged).not.toContain(VALID_KEY);
		expect(logged).toMatch(/keyFp/);
		spy.mockRestore();
	});
});
