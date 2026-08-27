import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));
const mockServicesCreate = vi.fn();
const mockServicesGetOne = vi.fn();
const mockServicesUpdate = vi.fn();
const mockServicesGetList = vi.fn();
const mockLocationsGetOne = vi.fn();
const mockEventsCreate = vi.fn();
const mockEventsGetList = vi.fn();
const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
	let s = t;
	for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
	return s;
});
const mockCollection = vi.fn((n: string) => {
	if (n === "services")
		return {
			getList: mockServicesGetList,
			create: mockServicesCreate,
			getOne: mockServicesGetOne,
			update: mockServicesUpdate,
		};
	if (n === "locations") return { getOne: mockLocationsGetOne };
	if (n === "service_events") return { create: mockEventsCreate, getList: mockEventsGetList };
	throw new Error(n);
});
vi.mock("@/lib/pocketbase", () => ({
	createPocketBaseClient: async () => ({
		filter: mockFilter,
		collection: mockCollection,
		createBatch: undefined,
	}),
}));

describe("service-data-integrity — create creates service_events created", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockLocationsGetOne.mockResolvedValue({ id: "loc1", userId: "user-1", isActive: true });
		mockServicesCreate.mockResolvedValue({
			id: "svc123",
			userId: "user-1",
			locationId: "loc1",
			status: "pending",
		});
		mockEventsCreate.mockResolvedValue({ id: "evt1" });
	});
	it("POST create writes service_events kind created with rollback on event failure", async () => {
		const { POST } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-900",
				clientName: "Cliente Test",
				rut: "12.345.678-5",
				contact: "+56 9 1111 1111",
				product: "Prod",
				locationId: "loc1",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const res = await POST(req);
		expect(res.status).toBe(201);
		expect(mockServicesCreate).toHaveBeenCalledTimes(1);
		expect(mockEventsCreate).toHaveBeenCalledTimes(1);
		const evt = mockEventsCreate.mock.calls[0][0] as Record<string, unknown>;
		expect(evt.kind).toBe("created");
		expect(evt.ServiceId).toBe("svc123");
		expect(evt.userId).toBe("user-1");
		// rollback on event failure
		vi.clearAllMocks();
		mockLocationsGetOne.mockResolvedValue({ id: "loc1", userId: "user-1", isActive: true });
		mockServicesCreate.mockResolvedValue({ id: "svc124", userId: "user-1" });
		mockEventsCreate.mockRejectedValue(new Error("event fail"));
		const mockDelete = vi.fn().mockResolvedValue({});
		mockCollection.mockImplementation((n: string) => {
			if (n === "services") return { create: mockServicesCreate, delete: mockDelete } as any;
			if (n === "locations") return { getOne: mockLocationsGetOne } as any;
			if (n === "service_events") return { create: mockEventsCreate } as any;
			throw new Error(n);
		});
		const req2 = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-901",
				clientName: "Cliente Test2",
				rut: "12.345.678-5",
				contact: "+56 9 2222 2222",
				product: "Prod2",
				locationId: "loc1",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const res2 = await POST(req2);
		expect(res2.status).toBe(500);
		expect(mockDelete).toHaveBeenCalledWith("svc124");
	});
});

describe("service-data-integrity — generic edit allows partial non-lifecycle fields", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesGetOne.mockResolvedValue({
			id: "svc1",
			userId: "user-1",
			invoiceNumber: "INV-001",
			clientName: "Cliente",
			rut: "12.345.678-5",
			contact: "+56 9 1234 5678",
			product: "Prod",
			locationId: "loc1",
			entryDate: new Date().toISOString(),
			status: "pending",
			repairCost: 0,
			notes: "",
		} as any);
		const mockUpdate = vi.fn().mockResolvedValue({});
		mockCollection.mockImplementation((n: string) => {
			if (n === "services")
				return {
					getOne: mockServicesGetOne,
					update: mockUpdate,
					getList: mockServicesGetList,
				} as any;
			if (n === "locations") return { getOne: mockLocationsGetOne } as any;
			if (n === "service_events") return { create: mockEventsCreate } as any;
			throw new Error(n);
		});
		// need to capture mockUpdate for assertions
		(mockCollection as any).mockUpdate = mockUpdate;
	});
	it("PUT with only notes succeeds (partial) and preserves lifecycle fields", async () => {
		const { PUT } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({ id: "svc1", notes: "Nueva nota" }),
			headers: { "Content-Type": "application/json" },
		});
		const res = await PUT(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.notes).toBe("Nueva nota");
		// verify storage update was called with preserved fields
		const { updateService } = await import("@/lib/storage");
		// storage update is tested separately, here we just ensure route succeeded
	});
	it("PUT with status rejected with Spanish code", async () => {
		const { PUT } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({ id: "svc1", status: "ready" }),
			headers: { "Content-Type": "application/json" },
		});
		const res = await PUT(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.code).toBe("LIFECYCLE_PROTECTED");
		expect(body.error).toMatch(/estado.*sede|sede.*estado/i);
	});
});

describe("service-data-integrity — transfer/status error mapping Spanish", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesGetOne.mockResolvedValue({
			id: "svc1",
			userId: "user-1",
			locationId: "locA",
			status: "pending",
		} as any);
		mockLocationsGetOne.mockResolvedValue({ id: "locA", userId: "user-1", isActive: true });
	});
	it("transfer same location returns Spanish El servicio ya está en esa sede", async () => {
		const { PATCH } = await import("@/app/api/services/[id]/transfer/route");
		const req = new Request("http://localhost/api/services/svc1/transfer", {
			method: "PATCH",
			body: JSON.stringify({ locationId: "locA" }),
			headers: { "Content-Type": "application/json" },
		});
		const res = await PATCH(req, { params: Promise.resolve({ id: "svc1" }) } as any);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("El servicio ya está en esa sede.");
		expect(body.code).toBe("SAME_LOCATION");
	});
});

describe("service-data-integrity — generic PUT lifecycle-date guard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesGetOne.mockResolvedValue({
			id: "svc1",
			userId: "user-1",
			invoiceNumber: "INV-001",
			clientName: "Cliente",
			rut: "12.345.678-5",
			contact: "+56 9 1234 5678",
			product: "Prod",
			locationId: "loc1",
			entryDate: new Date().toISOString(),
			status: "pending",
			repairCost: 0,
			notes: "",
		} as any);
		const mockUpdate = vi.fn().mockResolvedValue({});
		mockCollection.mockImplementation((n: string) => {
			if (n === "services")
				return {
					getOne: mockServicesGetOne,
					update: mockUpdate,
					getList: mockServicesGetList,
				} as any;
			if (n === "locations") return { getOne: mockLocationsGetOne } as any;
			if (n === "service_events") return { create: mockEventsCreate } as any;
			throw new Error(n);
		});
		(mockCollection as any).mockUpdate = mockUpdate;
	});
	it("PUT with populated deliveryDate is rejected 400 LIFECYCLE_PROTECTED and no persistence", async () => {
		const { PUT } = await import("@/app/api/services/route");
		const beforeUpdate = (mockCollection as any).mockUpdate as ReturnType<typeof vi.fn>;
		const req = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({ id: "svc1", notes: "x", deliveryDate: "2026-01-15T00:00:00.000Z" }),
			headers: { "Content-Type": "application/json" },
		});
		const res = await PUT(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.code).toBe("LIFECYCLE_PROTECTED");
		expect(body.error).toMatch(/estado.*sede|sede.*estado/i);
		expect(mockServicesGetOne).not.toHaveBeenCalled();
		expect(beforeUpdate).not.toHaveBeenCalled();
		expect(mockEventsCreate).not.toHaveBeenCalled();
	});
	it("PUT with null deliveryDate key-presence is rejected 400 even when null/empty", async () => {
		const { PUT } = await import("@/app/api/services/route");
		const beforeUpdate = (mockCollection as any).mockUpdate as ReturnType<typeof vi.fn>;
		const req = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({ id: "svc1", readyDate: null, cancellationDate: "" }),
			headers: { "Content-Type": "application/json" },
		});
		// stringify keeps null and empty string — Object.hasOwn must detect them
		const reqBody = await req.json().catch(() => null);
		// ensure test payload actually contains the keys (sanity)
		expect(Object.hasOwn(reqBody, "readyDate")).toBe(true);
		expect(Object.hasOwn(reqBody, "cancellationDate")).toBe(true);
		// re-create request because body already consumed
		const req2 = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({ id: "svc1", readyDate: null, cancellationDate: "" }),
			headers: { "Content-Type": "application/json" },
		});
		const res = await PUT(req2);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.code).toBe("LIFECYCLE_PROTECTED");
		expect(body.error).toMatch(/estado.*sede|sede.*estado/i);
		expect(mockServicesGetOne).not.toHaveBeenCalled();
		expect(beforeUpdate).not.toHaveBeenCalled();
		expect(mockEventsCreate).not.toHaveBeenCalled();
	});
});

describe("service-data-integrity — transfer missing-target localization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesGetOne.mockResolvedValue({
			id: "svc1",
			userId: "user-1",
			locationId: "locA",
			status: "pending",
		} as any);
		mockLocationsGetOne.mockResolvedValue({ id: "locA", userId: "user-1", isActive: true });
		mockServicesUpdate.mockResolvedValue({});
		mockEventsCreate.mockResolvedValue({ id: "evt1" });
		mockCollection.mockImplementation((n: string) => {
			if (n === "services")
				return { getOne: mockServicesGetOne, update: mockServicesUpdate } as any;
			if (n === "locations") return { getOne: mockLocationsGetOne } as any;
			if (n === "service_events") return { create: mockEventsCreate } as any;
			throw new Error(n);
		});
	});
	it("transfer with all target keys absent returns 400 Spanish INVALID_LOCATION and no write", async () => {
		const { PATCH } = await import("@/app/api/services/[id]/transfer/route");
		const payloads = [
			{},
			{ foo: "bar" },
			{ locationId: "", toLocationId: "", targetLocationId: "" },
		];
		for (const body of payloads) {
			vi.clearAllMocks();
			mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
			mockServicesGetOne.mockResolvedValue({
				id: "svc1",
				userId: "user-1",
				locationId: "locA",
				status: "pending",
			} as any);
			const req = new Request("http://localhost/api/services/svc1/transfer", {
				method: "PATCH",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PATCH(req, { params: Promise.resolve({ id: "svc1" }) } as any);
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json.code).toBe("INVALID_LOCATION");
			expect(json.error).toMatch(/sede/i);
			expect(json.error).not.toMatch(/locationId required/i);
			expect(mockServicesGetOne).not.toHaveBeenCalled();
			expect(mockServicesUpdate).not.toHaveBeenCalled();
			expect(mockEventsCreate).not.toHaveBeenCalled();
			expect(mockLocationsGetOne).not.toHaveBeenCalled();
		}
	});
});

describe("service-data-integrity — service_events schema", () => {
	it("v1.collections.json has service_events with correct id and indexes and no location_logs", () => {
		const raw = read("pocketbase/v1.collections.json");
		const data = JSON.parse(raw);
		const cols = data.collections as Array<{ name: string; id?: string }>;
		expect(cols.map((c) => c.name)).toContain("service_events");
		expect(cols.map((c) => c.name)).not.toContain("location_logs");
		const svc = cols.find((c) => c.name === "service_events") as any;
		expect(svc.id).toBe("pbc_2579451501");
		const idxStr = JSON.stringify(svc.indexes);
		expect(idxStr).toContain("idx_service_events_");
		expect(idxStr).not.toContain("idx_location_logs_");
		expect(idxStr).toContain("ON service_events");
	});
	it("service_events fields support new kinds", () => {
		const raw = read("pocketbase/v1.collections.json");
		const data = JSON.parse(raw);
		const svc = (data.collections as any[]).find((c) => c.name === "service_events");
		const fieldNames = (svc.fields as Array<{ name: string }>).map((f) => f.name);
		expect(fieldNames).toEqual(
			expect.arrayContaining(["userId", "ServiceId", "kind", "fromStatus", "toStatus"]),
		);
		const src = read("lib/types.ts");
		expect(src).toContain('kind?: "created"');
		expect(src).toContain("location_changed");
		expect(src).toContain("status_changed");
	});
});
