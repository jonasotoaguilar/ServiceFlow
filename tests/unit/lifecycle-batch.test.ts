import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	LifecycleBatchError,
	OPERATION_KEY_REGEX,
	operationKeyFingerprint,
	sendLifecycleBatch,
} from "@/lib/lifecycle-batch";
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
		n === "services"
			? { getOne, getList }
			: n === "service_events"
				? { getList, create: vi.fn() }
				: { getOne: vi.fn(), getList: vi.fn() },
	);
	const createBatchFn = vi.fn(() => ({
		collection: vi.fn((c: string) =>
			c === "services" ? { update: updateFn } : { create: createFn },
		),
		send: sendFn,
	}));
	return {
		pb: { filter: filterFn, collection: collectionFn, createBatch: createBatchFn } as any,
		filterFn,
		getOne,
		getList,
		updateFn,
		createFn,
		sendFn,
		createBatchFn,
	};
}
function serviceRecord(o: Record<string, unknown> = {}) {
	return {
		id: SERVICE_ID,
		userId: USER_ID,
		status: "pending",
		locationId: "loc_pb_15_chars1",
		lifecycleSeq: 0,
		...o,
	};
}
function eventRecord(o: Record<string, unknown> = {}) {
	return {
		id: "evt_15_chars00001",
		userId: USER_ID,
		ServiceId: SERVICE_ID,
		operationKey: VALID_KEY,
		lifecycleSeq: 1,
		kind: "status_changed",
		fromStatus: "pending",
		toStatus: "ready",
		...o,
	};
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
		await sendLifecycleBatch({ ...base(m1.pb), fromStatus: "pending", toStatus: "ready" }).catch(
			(x) => (e1 = x),
		);
		expect(e1.status).toBe(422);
		const m2 = createMockPb();
		m2.getOne.mockResolvedValue(serviceRecord());
		m2.getList.mockResolvedValue({
			items: [eventRecord({ fromLocationId: "loc_a", toLocationId: "loc_a" })],
		});
		const r2 = await sendLifecycleBatch({
			...base(m2.pb),
			fromStatus: "pending",
			toStatus: "ready",
			fromLocationId: "loc_a",
			toLocationId: "loc_a",
		});
		expect(r2.status).toBe(200);
		expect(m2.createBatchFn).not.toHaveBeenCalled();
		const m3 = createMockPb();
		m3.getOne.mockResolvedValue(serviceRecord({ lifecycleSeq: 5 }));
		m3.getList.mockResolvedValue({ items: [] });
		m3.sendFn.mockResolvedValue({});
		await sendLifecycleBatch({
			...base(m3.pb),
			kind: "location_changed",
			fromLocationId: "loc_a",
			toLocationId: "loc_b",
			servicePatch: { locationId: "loc_b" },
		});
		expect(m3.createBatchFn).toHaveBeenCalledTimes(1);
		expect(m3.updateFn).toHaveBeenCalledWith(
			SERVICE_ID,
			expect.objectContaining({ lifecycleSeq: 6 }),
		);
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
		m1.getList
			.mockResolvedValueOnce({ items: [] })
			.mockResolvedValueOnce({ items: [eventRecord()] });
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
		m3.getList
			.mockResolvedValueOnce({ items: [] })
			.mockResolvedValueOnce({ items: [eventRecord()] });
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

describe("operationKeyFingerprint - deterministic hash and format", () => {
	it("produces stable length-prefixed hex fingerprint with exact format", () => {
		expect(operationKeyFingerprint("")).toBe("0:00000000");
		expect(operationKeyFingerprint("a")).toBe("1:00000061");
		expect(operationKeyFingerprint("Abc")).toBe("3:00010042");
		expect(operationKeyFingerprint(VALID_KEY)).toBe("18:69e4576c");
		expect(operationKeyFingerprint("a".repeat(64))).toBe("64:72da0400");
	});

	it("is deterministic and distinguishes different keys (hash algorithm)", () => {
		const a = operationKeyFingerprint(VALID_KEY);
		const b = operationKeyFingerprint(VALID_KEY2);
		expect(a).not.toBe(b);
		expect(operationKeyFingerprint(VALID_KEY)).toBe(a);
		const c = operationKeyFingerprint("test-key-12345678");
		expect(c).toBe("17:3be3fd8d");
		expect(operationKeyFingerprint("another-key-123")).toBe("15:08fe3f06");
	});

	it("encodes length and 8-char zero-padded lower hex", () => {
		for (const k of ["", "a", "Abc", VALID_KEY, "X".repeat(32)]) {
			const fp = operationKeyFingerprint(k);
			const [lenPart, hexPart] = fp.split(":");
			expect(Number(lenPart)).toBe(k.length);
			expect(hexPart).toMatch(/^[0-9a-f]{8}$/);
			expect(hexPart.length).toBe(8);
		}
		// arithmetic mutants would shift hash → different hex
		expect(operationKeyFingerprint("Abc")).not.toBe("3:00012186"); // (h<<5)+h variant
	});
});

describe("isMatching - strict field equality via observable idempotency", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	async function assertMatching(
		existing: Record<string, unknown>,
		params: Record<string, unknown>,
		expectStatus: number,
	) {
		const { pb, getOne, getList } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValue({ items: [eventRecord(existing)] });
		let err: any = null;
		let res: any = null;
		try {
			res = await sendLifecycleBatch({ ...base(pb), ...params });
		} catch (e) {
			err = e;
		}
		if (expectStatus === 200) {
			expect(res?.status).toBe(200);
			expect(err).toBeNull();
		} else {
			expect(err?.status).toBe(expectStatus);
		}
	}

	it("requires kind equality - mismatch yields 422 not 200", async () => {
		await assertMatching(
			{ kind: "status_changed" },
			{ kind: "status_changed", fromStatus: "pending", toStatus: "ready" },
			200,
		);
		await assertMatching(
			{ kind: "status_changed" },
			{
				kind: "location_changed",
				fromLocationId: "loc_a",
				toLocationId: "loc_b",
				fromStatus: undefined,
				toStatus: undefined,
			},
			422,
		);
	});

	it("requires fromStatus equality including null handling", async () => {
		await assertMatching(
			{ fromStatus: "pending", toStatus: "ready" },
			{ fromStatus: "pending", toStatus: "ready" },
			200,
		);
		await assertMatching(
			{ fromStatus: "pending" },
			{ fromStatus: "ready", toStatus: "ready" },
			422,
		);
		await assertMatching({ fromStatus: null }, { fromStatus: undefined, toStatus: "ready" }, 200);
		await assertMatching(
			{ fromStatus: "pending" },
			{ fromStatus: undefined, toStatus: "ready" },
			422,
		);
	});

	it("requires toStatus and location fields equality", async () => {
		await assertMatching(
			{ kind: "status_changed", fromStatus: "pending", toStatus: "ready" },
			{
				kind: "location_changed",
				fromStatus: "pending",
				toStatus: "ready",
			},
			422,
		); // kind mismatch
		await assertMatching(
			{ kind: "status_changed", fromStatus: "pending", toStatus: "ready" },
			{ kind: "status_changed", fromStatus: "pending", toStatus: "ready" },
			200,
		);
		await assertMatching(
			{ kind: "status_changed", fromStatus: "pending", toStatus: "ready" },
			{ kind: "status_changed", fromStatus: "pending", toStatus: "cancelled" },
			422,
		);
		await assertMatching(
			{
				kind: "location_changed",
				fromLocationId: "loc_a",
				toLocationId: "loc_b",
				fromStatus: null,
				toStatus: null,
			},
			{ kind: "location_changed", fromLocationId: "loc_a", toLocationId: "loc_b" },
			200,
		);
		await assertMatching(
			{
				kind: "location_changed",
				fromLocationId: "loc_a",
				toLocationId: "loc_b",
				fromStatus: null,
				toStatus: null,
			},
			{ kind: "location_changed", fromLocationId: "loc_x", toLocationId: "loc_b" },
			422,
		);
		await assertMatching(
			{
				kind: "location_changed",
				fromLocationId: "loc_a",
				toLocationId: "loc_b",
				fromStatus: null,
				toStatus: null,
			},
			{ kind: "location_changed", fromLocationId: "loc_a", toLocationId: "loc_x" },
			422,
		);
	});
});

describe("isBatchDisabled - conjunction of 403 and batch message", () => {
	beforeEach(() => vi.clearAllMocks());

	async function batchError(errShape: any) {
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValue({ items: [] });
		sendFn.mockRejectedValue(errShape);
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		return err;
	}

	it("maps 403 with batch phrase to BATCH_UNAVAILABLE via either message field", async () => {
		const e1: any = new Error("Batch requests are not allowed.");
		e1.status = 403;
		expect((await batchError(e1)).code).toBe("BATCH_UNAVAILABLE");
		const e2: any = {
			status: 403,
			response: { status: 403, message: "Batch requests are not allowed." },
		};
		expect((await batchError(e2)).code).toBe("BATCH_UNAVAILABLE");
		const e3: any = new Error("Batch requests are not allowed.");
		e3.response = { status: 403, message: "Batch requests are not allowed." };
		// s derived from e.status ?? e.response.status → 403 via e.message
		expect((await batchError(e3)).code).toBe("BATCH_UNAVAILABLE");
	});

	it("does not treat 403 alone or batch phrase alone as batch disabled", async () => {
		const only403: any = new Error("forbidden");
		only403.status = 403;
		expect((await batchError(only403)).code).toBe("VALIDATION_ERROR");
		expect((await batchError(only403)).status).toBe(400);
		const onlyPhrase: any = new Error("Batch requests are not allowed.");
		onlyPhrase.status = 500;
		const res = await batchError(onlyPhrase);
		// 500 is timeout, not batch -> relookup empty => 409
		expect(res.code).toBe("TRANSITION_CONFLICT");
		expect(res.status).toBe(409);
		const phraseViaResponse: any = new Error("other");
		phraseViaResponse.status = 200;
		phraseViaResponse.response = { status: 200, message: "Batch requests are not allowed." };
		// not 403 -> not batch disabled -> 500 not timeout? actually status 200 not >=400 -> internal 500
		expect((await batchError(phraseViaResponse)).status).toBe(500);
	});
});

describe("isTimeout - 0, 5xx, isAbort and message detectors", () => {
	beforeEach(() => vi.clearAllMocks());

	async function timeoutResult(errShape: any, lookupFound: boolean) {
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		// first getList for existing lookup -> empty, second for relookup
		getList
			.mockResolvedValueOnce({ items: [] })
			.mockResolvedValueOnce({ items: lookupFound ? [eventRecord()] : [] });
		sendFn.mockRejectedValue(errShape);
		let err: any = null;
		let res: any = null;
		try {
			res = await sendLifecycleBatch(base(pb));
		} catch (e) {
			err = e;
		}
		return { err, res };
	}

	it("treats isAbort, status 0 and status >=500 as timeout (single relookup)", async () => {
		let r = await timeoutResult({ isAbort: true, message: "" }, false);
		expect(r.err?.status).toBe(409);
		r = await timeoutResult({ isAbort: true, message: "" }, true);
		expect(r.res?.status).toBe(200);

		r = await timeoutResult({ status: 0, message: "" }, false);
		expect(r.err?.status).toBe(409);
		r = await timeoutResult({ status: 500, message: "" }, true);
		expect(r.res?.status).toBe(200);
		r = await timeoutResult({ status: 503, message: "" }, false);
		expect(r.err?.status).toBe(409);
	});

	it("distinguishes 5xx boundary and typeof guard", async () => {
		// 500 is timeout, 499 is validation
		let r = await timeoutResult({ status: 500, message: "" }, false);
		expect(r.err?.status).toBe(409);
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValue({ items: [] });
		sendFn.mockRejectedValue({ status: 499, message: "" });
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		expect(err.status).toBe(400);
		expect(err.code).toBe("VALIDATION_ERROR");
		// string status not number -> not timeout -> internal
		const sString: any = { status: "500", message: "" };
		r = await timeoutResult(sString, false);
		expect(r.err?.status).toBe(500);
		expect(r.err?.code).toBe("INTERNAL");
	});

	it("matches timeout phrases in message/cause fields", async () => {
		for (const msg of [
			"timeout exceeded",
			"network error",
			"abort",
			"fetch failed",
			"ECONNRESET",
			"ETIMEDOUT",
		]) {
			const r = await timeoutResult({ message: msg }, false);
			expect(r.err?.status, msg).toBe(409);
		}
		for (const msg of ["timeout", "Network", "ABORT case"]) {
			const r = await timeoutResult({ response: { message: msg } }, false);
			expect(r.err?.status, msg).toBe(409);
		}
		const cause: any = new Error("x");
		cause.cause = { message: "ETIMEDOUT" };
		cause.status = 400;
		const r = await timeoutResult(cause, true);
		expect(r.res?.status).toBe(200);
		// non-timeout message -> not timeout -> 400
		const non: any = { status: 400, message: "some other error", response: { data: {} } };
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValue({ items: [] });
		sendFn.mockRejectedValue(non);
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		expect(err.code).toBe("VALIDATION_ERROR");
	});
});

describe("isUnique - 400 with operationKey/lifecycleSeq or unique phrase", () => {
	beforeEach(() => vi.clearAllMocks());

	async function uniqueResult(errShape: any, lookupFound: boolean) {
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList
			.mockResolvedValueOnce({ items: [] })
			.mockResolvedValueOnce({ items: lookupFound ? [eventRecord()] : [] });
		sendFn.mockRejectedValue(errShape);
		let err: any = null;
		let res: any = null;
		try {
			res = await sendLifecycleBatch(base(pb));
		} catch (e) {
			err = e;
		}
		return { err, res, getList };
	}

	it("detects via response data operationKey/lifecycleSeq", async () => {
		let r = await uniqueResult(
			{ status: 400, response: { data: { operationKey: { code: "x" } } }, message: "" },
			true,
		);
		expect(r.err?.status).toBe(422);
		r = await uniqueResult(
			{ status: 400, response: { data: { lifecycleSeq: { code: "x" } } }, message: "" },
			false,
		);
		expect(r.err?.status).toBe(409);
		// data via e.data fallback
		r = await uniqueResult({ status: 400, data: { operationKey: "dup" }, message: "" }, true);
		expect(r.err?.status).toBe(422);
	});

	it("detects via unique phrase in message+data and requires 400 status", async () => {
		let r = await uniqueResult(
			{ status: 400, message: "unique constraint failed", response: { data: {} } },
			true,
		);
		expect(r.err?.status).toBe(422);
		r = await uniqueResult(
			{ status: 400, message: "already exists", response: { data: {} } },
			true,
		);
		expect(r.err?.status).toBe(422);
		r = await uniqueResult(
			{ status: 400, message: "validation_not_unique", response: { data: {} } },
			true,
		);
		expect(r.err?.status).toBe(422);
		// 400 without unique phrase and no operationKey -> validation not unique path
		r = await uniqueResult(
			{ status: 400, message: "other", response: { data: { clientName: { code: "required" } } } },
			false,
		);
		expect(r.err?.code).toBe("VALIDATION_ERROR");
		// non-400 with same data -> not unique
		r = await uniqueResult(
			{ status: 500, response: { data: { operationKey: { code: "x" } } }, message: "unique" },
			false,
		);
		expect(r.err?.status).toBe(409); // 500 is timeout, not unique
	});

	it("uses nullish coalescing over data sources and JSON stringify", async () => {
		// e.response.data present -> preferred over e.data
		const e1: any = {
			status: 400,
			response: { data: { operationKey: "a" } },
			data: {},
			message: "",
		};
		let r = await uniqueResult(e1, true);
		expect(r.err?.code).toBe("OPERATION_KEY_REUSED");
		// e.response undefined -> fallback to e.data
		const e2: any = { status: 400, data: { lifecycleSeq: "b" }, message: "" };
		r = await uniqueResult(e2, true);
		expect(r.err?.code).toBe("OPERATION_KEY_REUSED");
	});
});

describe("sendLifecycleBatch - payload, branching and error mapping", () => {
	beforeEach(() => vi.clearAllMocks());

	it("fails lookup with INTERNAL when service_events getList throws", async () => {
		const { pb, getOne, getList } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockRejectedValue(new Error("db down"));
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		expect(err.status).toBe(500);
		expect(err.code).toBe("INTERNAL");
	});

	it("returns 200 with correct service payload containing lifecycleSeq and code", async () => {
		const { pb, getOne, getList, sendFn, updateFn, createFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord({ lifecycleSeq: 4 }));
		getList.mockResolvedValue({ items: [] });
		sendFn.mockResolvedValue({});
		const res = await sendLifecycleBatch(base(pb));
		expect(res).toEqual({
			status: 200,
			code: "OK",
			data: { serviceId: SERVICE_ID, lifecycleSeq: 5 },
		});
		expect(updateFn).toHaveBeenCalledWith(SERVICE_ID, expect.objectContaining({ lifecycleSeq: 5 }));
		expect(createFn).toHaveBeenCalledWith(
			expect.objectContaining({ ServiceId: SERVICE_ID, lifecycleSeq: 5, operationKey: VALID_KEY }),
		);
	});

	it("uses scoped filter binding for initial and retry lookups", async () => {
		const { pb, filterFn, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [] });
		sendFn.mockRejectedValue({ status: 0, message: "timeout" });
		await sendLifecycleBatch(base(pb)).catch(() => {});
		expect(filterFn).toHaveBeenCalledTimes(2);
		expect(filterFn.mock.calls[0][0]).toBe(
			"userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}",
		);
		expect(filterFn.mock.calls[0][1]).toEqual({ uid: USER_ID, sid: SERVICE_ID, key: VALID_KEY });
		expect(filterFn.mock.calls[1][1]).toEqual({ uid: USER_ID, sid: SERVICE_ID, key: VALID_KEY });
	});

	it("rethrows OPERATION_KEY_REUSED when unique relookup throws that error", async () => {
		const m2 = createMockPb();
		m2.getOne.mockResolvedValue(serviceRecord());
		m2.getList
			.mockResolvedValueOnce({ items: [] })
			.mockRejectedValueOnce(new LifecycleBatchError(422, "OPERATION_KEY_REUSED", "reused"));
		m2.sendFn.mockRejectedValue({
			status: 400,
			response: { data: { operationKey: "x" } },
			message: "",
		});
		let err: any = null;
		await sendLifecycleBatch(base(m2.pb)).catch((e) => (err = e));
		expect(err.code).toBe("OPERATION_KEY_REUSED");
		expect(err.status).toBe(422);
	});

	it("maps 4xx validation boundaries and unexpected 5xx", async () => {
		async function expectCode(status: any, expectedStatus: number, expectedCode: string) {
			const { pb, getOne, getList, sendFn } = createMockPb();
			getOne.mockResolvedValue(serviceRecord());
			getList.mockResolvedValue({ items: [] });
			sendFn.mockRejectedValue({ status, message: "" });
			let err: any = null;
			await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
			expect(err.status, `status ${status}`).toBe(expectedStatus);
			expect(err.code, `status ${status}`).toBe(expectedCode);
		}
		await expectCode(400, 400, "VALIDATION_ERROR");
		await expectCode(404, 400, "VALIDATION_ERROR");
		await expectCode(499, 400, "VALIDATION_ERROR");
		// 500 is timeout, not validation
		const { pb, getOne, getList, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		getList.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ items: [] });
		sendFn.mockRejectedValue({ status: 500, message: "" });
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		expect(err.status).toBe(409);
		// string status not number -> internal
		await expectCode("500", 500, "INTERNAL");
		// unknown without status -> internal
		const m = createMockPb();
		m.getOne.mockResolvedValue(serviceRecord());
		m.getList.mockResolvedValue({ items: [] });
		m.sendFn.mockRejectedValue(new Error("weird"));
		let e2: any = null;
		await sendLifecycleBatch(base(m.pb)).catch((e) => (e2 = e));
		expect(e2.status).toBe(500);
		expect(e2.code).toBe("INTERNAL");
	});
});

describe("mutant 240 - unique-conflict scoped relookup", () => {
	it("unique-conflict relookup uses tenant/service/key scoped filter not unfiltered", async () => {
		const { pb, getOne, getList, filterFn, sendFn } = createMockPb();
		getOne.mockResolvedValue(serviceRecord());
		let calls = 0;
		const foreign = eventRecord({
			userId: OTHER_USER,
			ServiceId: "other-svc-00000001",
			operationKey: VALID_KEY,
		});
		getList.mockImplementation((_a: any, _b: any, opts: any) => {
			calls++;
			if (calls === 1) return Promise.resolve({ items: [] });
			const f = opts?.filter as string | undefined;
			if (
				typeof f === "string" &&
				f.includes(USER_ID) &&
				f.includes(SERVICE_ID) &&
				f.includes(VALID_KEY)
			) {
				return Promise.resolve({ items: [] });
			}
			return Promise.resolve({ items: [foreign] });
		});
		sendFn.mockRejectedValue({
			status: 400,
			response: { data: { operationKey: { code: "x" } } },
			message: "",
		});
		let err: any = null;
		await sendLifecycleBatch(base(pb)).catch((e) => (err = e));
		expect(err.status).toBe(409);
		expect(err.code).toBe("TRANSITION_CONFLICT");
		expect(calls).toBe(2);
		expect(filterFn).toHaveBeenCalledTimes(2);
		const secondFilter = (getList.mock.calls[1]?.[2] as any)?.filter as string;
		expect(secondFilter).toContain(USER_ID);
		expect(secondFilter).toContain(SERVICE_ID);
		expect(secondFilter).toContain(VALID_KEY);
		expect(secondFilter).toBe(
			`userId = "${USER_ID}" && ServiceId = "${SERVICE_ID}" && operationKey = "${VALID_KEY}"`,
		);
	});
});
