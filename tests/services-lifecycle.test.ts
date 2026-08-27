import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));
const mockServicesGetList = vi.fn();
const mockServicesCreate = vi.fn();
const mockServicesGetOne = vi.fn();
const mockServicesUpdate = vi.fn();
const mockServicesDelete = vi.fn();
const mockLocationsGetList = vi.fn();
const mockLocationsGetOne = vi.fn();
const mockLogsGetList = vi.fn();
const mockLogsCreate = vi.fn();
const mockLogsDelete = vi.fn();
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
			delete: mockServicesDelete,
		};
	if (n === "locations") return { getList: mockLocationsGetList, getOne: mockLocationsGetOne };
	if (n === "service_events")
		return { getList: mockLogsGetList, create: mockLogsCreate, delete: mockLogsDelete };
	throw new Error(n);
});
const mockCreatePocketBaseClient = vi.fn(async () => ({
	filter: mockFilter,
	collection: mockCollection,
}));
vi.mock("@/lib/pocketbase", () => ({
	createPocketBaseClient: (...a: unknown[]) => (mockCreatePocketBaseClient as any)(...a),
}));
function pbRecord(o: Record<string, unknown> = {}) {
	return {
		id: "pb15charsvc00001",
		userId: "user-1",
		invoiceNumber: "INV-001",
		clientName: "Acme Corp",
		rut: "11.111.111-1",
		contact: "56912345678",
		email: "a@b.com",
		product: "Laptop",
		failureDescription: "No enciende",
		sku: "SKU1",
		locationId: "loc_pb_15_chars1",
		entryDate: new Date().toISOString(),
		deliveryDate: null,
		readyDate: null,
		cancellationDate: null,
		status: "pending",
		repairCost: 0,
		notes: "",
		...o,
	};
}
describe("services read WU4 — getServices PocketBase tenant scope + GET route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesGetList.mockReset();
		mockLocationsGetList.mockReset();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockGetAuthUser.mockResolvedValue({ id: "test-user-1", email: "a@b.com", name: "A" });
	});
	it("default page=1 limit=20 envelope { data, total, page, limit }", async () => {
		mockServicesGetList.mockResolvedValue({
			items: [pbRecord(), pbRecord({ id: "pb15charsvc00002" })],
			totalItems: 2,
		});
		mockLocationsGetList.mockResolvedValue({
			items: [{ id: "loc_pb_15_chars1", name: "Taller Central" }],
			totalItems: 1,
		});
		const { getServices } = await import("@/lib/storage");
		const res = await getServices({ userId: "test-user-1" });
		expect(mockCreatePocketBaseClient).toHaveBeenCalledTimes(1);
		expect(mockCollection).toHaveBeenCalledWith("services");
		const [p, l, o] = mockServicesGetList.mock.calls[0] as [
			number,
			number,
			Record<string, unknown>,
		];
		expect(p).toBe(1);
		expect(l).toBe(20);
		expect(o).toHaveProperty("filter");
		expect(o).toHaveProperty("sort");
		expect(res.page).toBe(1);
		expect(res.limit).toBe(20);
		expect(res.total).toBe(2);
		expect(res.data).toHaveLength(2);
	});
	it("empty match returns { data: [], total: 0, page, limit } and skips location join", async () => {
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		const { getServices } = await import("@/lib/storage");
		const res = await getServices({ userId: "test-user-1", page: 1, limit: 20 });
		expect(res).toEqual({ data: [], total: 0, page: 1, limit: 20 });
		expect(mockLocationsGetList).not.toHaveBeenCalled();
	});
	it("sort entryDate asc default and -entryDate when desc", async () => {
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		const { getServices } = await import("@/lib/storage");
		await getServices({ userId: "u1", sortOrder: "asc" });
		expect(mockServicesGetList.mock.calls[0][2]).toHaveProperty("sort", "entryDate");
		vi.clearAllMocks();
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		await getServices({ userId: "u1", sortOrder: "desc" });
		expect(mockServicesGetList.mock.calls[0][2]).toHaveProperty("sort", "-entryDate");
		vi.clearAllMocks();
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		await getServices({ userId: "u1" });
		expect(mockServicesGetList.mock.calls[0][2]).toHaveProperty("sort", "entryDate");
	});
	it("bound search on clientName/invoiceNumber/rut and template invariant under metacharacters", async () => {
		const { serviceListBinding } = await import("@/lib/pocketbase-filter");
		const a = serviceListBinding({ userId: "u1", search: "normal" });
		const b = serviceListBinding({ userId: "u1", search: 'a" || b || c' });
		expect(a.filter).toBe(b.filter);
		expect(b.params.search).toBe('a" || b || c');
		mockServicesGetList.mockResolvedValue({ items: [pbRecord()], totalItems: 1 });
		const { getServices } = await import("@/lib/storage");
		await getServices({ userId: "u1", search: "Acme" });
		const [t, p] =
			mockFilter.mock.calls.find(([x]) => (x as string).includes("clientName")) ??
			mockFilter.mock.calls[0];
		expect(t as string).toContain("clientName ~ {:search}");
		expect(t as string).toContain("invoiceNumber ~ {:search}");
		expect(t as string).toContain("rut ~ {:search}");
		expect((p as Record<string, unknown>).search).toBe("Acme");
		expect(t as string).not.toContain("Acme");
		vi.clearAllMocks();
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		await getServices({ userId: "u1", search: 'a" || b' });
		const [tm, pr] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
		expect(pr.search).toBe('a" || b');
		expect(tm).not.toContain('a"');
	});
	it("status allowlist and locationId bound", async () => {
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		const { getServices } = await import("@/lib/storage");
		await getServices({
			userId: "u1",
			status: ["pending", "invalid" as any, "completed"],
			location: "loc_pb_15_chars1",
		});
		const [t, p] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
		expect(Object.values(p)).toContain("pending");
		expect(Object.values(p)).toContain("completed");
		expect(Object.values(p)).not.toContain("invalid");
		expect(t).not.toContain("invalid");
		expect(t).toContain("status =");
		expect(t).toContain("locationId = {:locationId}");
		expect(p.locationId).toBe("loc_pb_15_chars1");
	});
	it("two-user isolation via bound uid same template different param", async () => {
		mockServicesGetList.mockResolvedValue({
			items: [pbRecord({ userId: "user-A" })],
			totalItems: 1,
		});
		const { getServices } = await import("@/lib/storage");
		await getServices({ userId: "user-A" });
		const [ta, pa] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
		expect(pa.uid).toBe("user-A");
		expect(ta).toContain("userId = {:uid}");
		expect(ta).not.toContain("user-A");
		vi.clearAllMocks();
		mockServicesGetList.mockResolvedValue({
			items: [pbRecord({ id: "pb15charsvc00003", userId: "user-B" })],
			totalItems: 1,
		});
		mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		const { getServices: g2 } = await import("@/lib/storage");
		await g2({ userId: "user-B" });
		const [tb, pb] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
		expect(pb.uid).toBe("user-B");
		expect(ta).toBe(tb);
		expect(pa.uid).not.toBe(pb.uid);
	});
	it("page 2 of 25 triangulates pagination", async () => {
		const items = Array.from({ length: 5 }, (_, i) => pbRecord({ id: `pb15charsvc0000${i + 1}` }));
		mockServicesGetList.mockResolvedValue({ items, totalItems: 25 });
		mockLocationsGetList.mockResolvedValue({
			items: [{ id: "loc_pb_15_chars1", name: "Taller" }],
			totalItems: 1,
		});
		const { getServices } = await import("@/lib/storage");
		const res = await getServices({ userId: "u1", page: 2, limit: 20 });
		expect(mockServicesGetList).toHaveBeenCalledWith(2, 20, expect.any(Object));
		expect(res.page).toBe(2);
		expect(res.limit).toBe(20);
		expect(res.total).toBe(25);
		expect(res.data).toHaveLength(5);
	});
	it("search + status + location compose", async () => {
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		const { getServices } = await import("@/lib/storage");
		await getServices({ userId: "u1", search: "foo", status: ["ready"], location: "loc1" });
		const [t, p] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
		expect(t).toContain("userId = {:uid}");
		expect(t).toContain("clientName ~ {:search}");
		expect(t).toContain("status =");
		expect(t).toContain("locationId = {:locationId}");
		expect(p.uid).toBe("u1");
		expect(p.search).toBe("foo");
		expect(p.locationId).toBe("loc1");
	});
	it("maps id not $id and batched location join with bound id = {:id0} || ...", async () => {
		const svc = pbRecord({
			id: "pb15charsvc12345",
			$id: "should-not-use",
			locationId: "loc_pb_15_chars9",
		}) as any;
		mockServicesGetList.mockResolvedValue({ items: [svc], totalItems: 1 });
		mockLocationsGetList.mockResolvedValue({
			items: [{ id: "loc_pb_15_chars9", name: "Taller Norte" }],
			totalItems: 1,
		});
		const { getServices } = await import("@/lib/storage");
		const res = await getServices({ userId: "u1" });
		expect(res.data[0].id).toBe("pb15charsvc12345");
		expect((res.data[0] as any).id).not.toBe("should-not-use");
		expect(res.data[0].location).toBe("Taller Norte");
		expect(mockCollection).toHaveBeenCalledWith("locations");
		const loc = mockFilter.mock.calls.find(([x]) => (x as string).includes("id = {:id0}"));
		expect(loc).toBeDefined();
		const [lt, lp] = loc as [string, Record<string, unknown>];
		expect(lt).toContain("id = {:id0}");
		expect(Object.values(lp)).toContain("loc_pb_15_chars9");
		expect(lt).not.toContain("loc_pb_15_chars9");
		// multi-id batch
		vi.clearAllMocks();
		mockServicesGetList.mockResolvedValue({
			items: [
				pbRecord({ id: "pb15charsvc00010", locationId: "loc_a" }),
				pbRecord({ id: "pb15charsvc00011", locationId: "loc_b" }),
			],
			totalItems: 2,
		});
		mockLocationsGetList.mockResolvedValue({
			items: [
				{ id: "loc_a", name: "Sede A" },
				{ id: "loc_b", name: "Sede B" },
			],
			totalItems: 2,
		});
		const { getServices: g3 } = await import("@/lib/storage");
		const r2 = await g3({ userId: "u1" });
		expect(r2.data).toHaveLength(2);
		const mc = mockFilter.mock.calls.filter(([x]) => (x as string).includes("id = {:id"));
		expect(mc.length).toBeGreaterThanOrEqual(1);
		const [mt, mp] = mc[0] as [string, Record<string, unknown>];
		expect(mt).toContain("id = {:id0}");
		expect(mt).toContain("id = {:id1}");
		expect(Object.values(mp)).toEqual(expect.arrayContaining(["loc_a", "loc_b"]));
	});
	it("uses PocketBase only via createPocketBaseClient + serviceListBinding + applyBinding", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
		expect(src).toContain("createPocketBaseClient");
		expect(src).toContain("serviceListBinding");
		expect(src).toContain("applyBinding");
		expect(src).toContain('collection("services")');
		expect(src).toContain("getList");
		const f = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase-filter.ts"), "utf8");
		expect((f.match(/pb\.filter/g) ?? []).length).toBe(1);
	});
	it("GET unauthenticated returns 401 without PB calls", async () => {
		mockGetAuthUser.mockResolvedValue(null);
		const { GET } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services?page=1&limit=20");
		const res = await GET(req);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: "Unauthorized" });
		expect(mockCreatePocketBaseClient).not.toHaveBeenCalled();
	});
	it("GET keeps query params and passes userId from auth only triangulates comma-separated status", async () => {
		mockGetAuthUser.mockResolvedValue({ id: "auth-user-123", email: "a@b.com", name: "A" });
		mockServicesGetList.mockResolvedValue({
			items: [pbRecord({ id: "pb15charsvc00020" })],
			totalItems: 1,
		});
		mockLocationsGetList.mockResolvedValue({
			items: [{ id: "loc_pb_15_chars1", name: "Taller" }],
			totalItems: 1,
		});
		const { GET } = await import("@/app/api/services/route");
		const req = new Request(
			"http://localhost/api/services?page=2&limit=5&search=Acme&status=pending,ready&location=loc_pb_15_chars1&sortOrder=desc",
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.page).toBe(2);
		expect(body.limit).toBe(5);
		expect(body.total).toBe(1);
		expect(mockServicesGetList).toHaveBeenCalledWith(
			2,
			5,
			expect.objectContaining({ sort: "-entryDate" }),
		);
		const [t, p] = mockFilter.mock.calls.find(([x]) => (x as string).includes("userId")) as [
			string,
			Record<string, unknown>,
		];
		expect(p.uid).toBe("auth-user-123");
		expect(p.search).toBe("Acme");
		expect(Object.values(p)).toContain("pending");
		expect(Object.values(p)).toContain("ready");
		expect(p.locationId).toBe("loc_pb_15_chars1");
	});
});
describe("services write WU5 — saveService native ids + POST contract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesCreate.mockReset();
		mockServicesGetOne.mockReset();
		mockServicesUpdate.mockReset();
		mockServicesDelete.mockReset();
		mockLogsGetList.mockReset();
		mockLogsDelete.mockReset();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockGetAuthUser.mockResolvedValue({ id: "auth-user-1", email: "a@b.com", name: "Auth" });
		mockServicesCreate.mockResolvedValue(
			pbRecord({ id: "pb15newid123456", userId: "auth-user-1" }),
		);
		mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockLocationsGetOne.mockResolvedValue({
			id: "loc_pb_15_chars1",
			userId: "auth-user-1",
			isActive: true,
		});
		mockLocationsGetList.mockResolvedValue({
			items: [{ id: "loc_pb_15_chars1", userId: "auth-user-1", name: "Sede", isActive: true }],
			totalItems: 1,
		});
	});
	it("saveService omits id PB assigns + POST auth/defaults/cancelled source invariant", async () => {
		const { saveService } = await import("@/lib/storage");
		const payload = {
			userId: "auth-user-1",
			invoiceNumber: "INV-900",
			clientName: "Cliente Test",
			contact: "56999999999",
			product: "Televisor",
			locationId: "loc_pb_15_chars1",
			entryDate: new Date().toISOString(),
			status: "pending" as const,
			notes: "",
		} as any;
		expect((payload as any).id).toBeUndefined();
		const created = await saveService(payload);
		expect(mockServicesCreate).toHaveBeenCalledTimes(1);
		const arg = mockServicesCreate.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).not.toHaveProperty("id");
		expect(arg).not.toHaveProperty("$id");
		expect(arg.userId).toBe("auth-user-1");
		expect(created.id).toBe("pb15newid123456");
		const sSrc = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
		expect(sSrc).not.toMatch(/generateId/);
		expect(sSrc).not.toMatch(/crypto\.randomUUID/);
		const rSrc = fs.readFileSync(path.join(process.cwd(), "app/api/services/route.ts"), "utf8");
		expect(rSrc).not.toMatch(/generateId/);
		expect(rSrc).not.toMatch(/crypto\.randomUUID/);
		expect(sSrc).toContain('collection("services")');
		expect(sSrc).toContain(".create(");
		expect(
			sSrc.slice(sSrc.indexOf("saveService"), sSrc.indexOf("saveService") + 3000),
		).not.toContain("databases.createDocument");
		const before = Date.now();
		const { POST } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-901",
				clientName: "Cliente Uno",
				rut: "12.345.678-5",
				contact: "56911111111",
				product: "Celular",
				locationId: "loc_pb_15_chars1",
				userId: "evil-user",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const res = await POST(req);
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.userId).toBe("auth-user-1");
		expect(body.userId).not.toBe("evil-user");
		expect(body.status).toBe("pending");
		const a2 = mockServicesCreate.mock.calls[1][0] as Record<string, unknown>;
		expect(a2.userId).toBe("auth-user-1");
		expect(a2.status).toBe("pending");
		expect(new Date(a2.entryDate as string).getTime()).toBeGreaterThanOrEqual(before);
		mockServicesCreate.mockResolvedValue(
			pbRecord({ id: "pb15cancel123456", status: "pending", cancellationDate: null }),
		);
		const before2 = Date.now();
		mockLocationsGetOne.mockResolvedValue({
			id: "loc_pb_15_chars1",
			userId: "auth-user-1",
			isActive: true,
		});
		const req2 = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-902",
				clientName: "Cliente Dos",
				rut: "12.345.678-5",
				contact: "56922222222",
				product: "Tablet",
				locationId: "loc_pb_15_chars1",
				status: "cancelled",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const res2 = await POST(req2);
		expect(res2.status).toBe(201);
		const a3 = mockServicesCreate.mock.calls[2][0] as Record<string, unknown>;
		expect(a3.status).toBe("pending");
		expect(a3.cancellationDate).toBeNull();
		expect(a3.readyDate).toBeNull();
		expect(a3.deliveryDate).toBeNull();
		const postSlice = rSrc.slice(
			rSrc.indexOf("export async function POST"),
			rSrc.indexOf("export async function POST") + 2500,
		);
		expect(postSlice).toContain("ServiceSchema.safeParse");
		expect(postSlice.indexOf("ServiceSchema.safeParse")).toBeLessThan(
			postSlice.indexOf("saveService"),
		);
	});
	it("POST unauthenticated 401 and invalid 400 no PB create triangulates", async () => {
		mockGetAuthUser.mockResolvedValue(null);
		const { POST } = await import("@/app/api/services/route");
		const req = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-903",
				clientName: "Cliente Tres",
				contact: "56933333333",
				product: "Laptop",
				locationId: "loc_pb_15_chars1",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const res = await POST(req);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: "Unauthorized" });
		expect(mockCreatePocketBaseClient).not.toHaveBeenCalled();
		expect(mockServicesCreate).not.toHaveBeenCalled();
		mockGetAuthUser.mockResolvedValue({ id: "auth-user-1", email: "a@b.com", name: "A" });
		const payload = {
			invoiceNumber: "INV-904",
			contact: "56944444444",
			product: "Monitor",
			locationId: "loc_pb_15_chars1",
		} as any;
		const req2 = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify(payload),
			headers: { "Content-Type": "application/json" },
		});
		const res2 = await POST(req2);
		expect(res2.status).toBe(400);
		expect((await res2.json()).error).toBe("Datos inválidos");
		expect(mockServicesCreate).not.toHaveBeenCalled();
		const payload2 = {
			invoiceNumber: "INV-905",
			clientName: "Cliente Cuatro",
			contact: "56955555555",
			product: "Mouse",
			locationId: "loc_pb_15_chars1",
			status: "invalid_status",
		} as any;
		const req3 = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify(payload2),
			headers: { "Content-Type": "application/json" },
		});
		const res3 = await POST(req3);
		expect(res3.status).toBe(400);
		expect((await res3.json()).error).toBe("Datos inválidos");
		expect(mockServicesCreate).not.toHaveBeenCalled();
	});
});
describe("services write WU5 — update/delete ownership/completed/delete-order + PUT/DELETE contract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesGetOne.mockReset();
		mockServicesUpdate.mockReset();
		mockServicesDelete.mockReset();
		mockLogsGetList.mockReset();
		mockLogsDelete.mockReset();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "owner@a.com", name: "Owner" });
		mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000001", userId: "owner-1", status: "pending", locationId: "loc1" }),
		);
		mockServicesUpdate.mockResolvedValue(pbRecord({ id: "pb15svc00000001" }));
		mockServicesDelete.mockResolvedValue({});
	});
	it("completed immutable + ownership failure no mutation", async () => {
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000002", userId: "owner-1", status: "completed" }),
		);
		const { updateService } = await import("@/lib/storage");
		await expect(
			updateService(
				{
					id: "pb15svc00000002",
					clientName: "Nuevo",
					invoiceNumber: "INV-1",
					contact: "56912345678",
					product: "Prod",
					locationId: "loc1",
					entryDate: new Date().toISOString(),
					status: "pending",
					userId: "owner-1",
					repairCost: 0,
					notes: "",
				} as any,
				"owner-1",
			),
		).rejects.toThrow();
		expect(mockServicesUpdate).not.toHaveBeenCalled();
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000003", userId: "owner-1", status: "pending" }),
		);
		await expect(
			updateService(
				{
					id: "pb15svc00000003",
					clientName: "X",
					invoiceNumber: "INV-2",
					contact: "56912345678",
					product: "Prod",
					locationId: "loc1",
					entryDate: new Date().toISOString(),
					status: "pending",
					userId: "attacker",
					repairCost: 0,
					notes: "",
				} as any,
				"attacker-1",
			),
		).rejects.toThrow();
		expect(mockServicesUpdate).not.toHaveBeenCalled();
		mockServicesGetOne.mockResolvedValue(pbRecord({ id: "pb15svc00000004", userId: "owner-1" }));
		const { deleteService } = await import("@/lib/storage");
		await expect(deleteService("pb15svc00000004", "attacker-1")).rejects.toThrow();
		expect(mockServicesDelete).not.toHaveBeenCalled();
		const { PUT } = await import("@/app/api/services/route");
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "owner@a.com", name: "Owner" });
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000002", userId: "owner-1", status: "completed" }),
		);
		const putReq = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000002",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				notes: "test",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putRes = await PUT(putReq);
		expect(putRes.status).toBe(409);
		// Unit 8: generic reject for status/locationId is 400
		const putReject = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000002",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				locationId: "loc1",
				status: "pending",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putRejectRes = await PUT(putReject);
		expect(putRejectRes.status).toBe(400);
		expect(mockServicesUpdate).not.toHaveBeenCalled();
	});
	it("PUT/DELETE without id 400 unauth 401 generic 500 no PB leak", async () => {
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "a@b.com", name: "Owner" });
		const { PUT } = await import("@/app/api/services/route");
		const putReq = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				locationId: "loc1",
			} as any),
			headers: { "Content-Type": "application/json" },
		});
		const putRes = await PUT(putReq);
		expect(putRes.status).toBe(400);
		expect(mockServicesUpdate).not.toHaveBeenCalled();
		const { DELETE } = await import("@/app/api/services/route");
		const delReq = new Request("http://localhost/api/services", { method: "DELETE" });
		const delRes = await DELETE(delReq);
		expect(delRes.status).toBe(400);
		expect(mockServicesDelete).not.toHaveBeenCalled();
		mockGetAuthUser.mockResolvedValue(null);
		const putReq2 = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000005",
				invoiceNumber: "INV-1",
				clientName: "C",
				contact: "56912345678",
				product: "P",
				locationId: "loc1",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putRes2 = await PUT(putReq2);
		expect(putRes2.status).toBe(401);
		expect(await putRes2.json()).toEqual({ error: "Unauthorized" });
		const delReq2 = new Request("http://localhost/api/services?id=pb15svc00000005", {
			method: "DELETE",
		});
		const delRes2 = await DELETE(delReq2);
		expect(delRes2.status).toBe(401);
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "a@b.com", name: "Owner" });
		mockServicesCreate.mockRejectedValue(
			new Error("PocketBase connection failed at http://127.0.0.1:8090 details"),
		);
		mockLocationsGetOne.mockResolvedValue({ id: "loc1", userId: "owner-1", isActive: true });
		const { POST } = await import("@/app/api/services/route");
		const postReq = new Request("http://localhost/api/services", {
			method: "POST",
			body: JSON.stringify({
				invoiceNumber: "INV-999",
				clientName: "Cliente Fail",
				rut: "12.345.678-5",
				contact: "56999999999",
				product: "Prod",
				locationId: "loc1",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const postRes = await POST(postReq);
		expect(postRes.status).toBe(500);
		expect((await postRes.json()).error).not.toMatch(/PocketBase|127\.0\.0\.1/);
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000006", userId: "owner-1", status: "pending" }),
		);
		mockServicesUpdate.mockRejectedValue(new Error("PocketBase update failed secret"));
		const putReq3 = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000006",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				notes: "x",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putRes3 = await PUT(putReq3);
		expect(putRes3.status).toBe(500);
		expect(JSON.stringify(await putRes3.json())).not.toMatch(/PocketBase/);
	});
	it("delete logs first abort on failure and peer/completed triangulate", async () => {
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "a@b.com", name: "Owner" });
		mockServicesGetOne.mockResolvedValue(pbRecord({ id: "pb15svc00000007", userId: "owner-1" }));
		mockLogsGetList.mockResolvedValue({
			items: [
				{ id: "log1", ServiceId: "pb15svc00000007" },
				{ id: "log2", ServiceId: "pb15svc00000007" },
			],
			totalItems: 2,
		});
		mockLogsDelete.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("log delete fail"));
		const { deleteService } = await import("@/lib/storage");
		await expect(deleteService("pb15svc00000007", "owner-1")).rejects.toThrow();
		expect(mockLogsDelete).toHaveBeenCalledTimes(2);
		expect(mockServicesDelete).not.toHaveBeenCalled();
		const sSrc = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
		const delSlice = sSrc.slice(
			sSrc.indexOf("deleteService"),
			sSrc.indexOf("deleteService") + 4000,
		);
		expect(delSlice).toContain("service_events");
		expect(delSlice).toContain("ServiceId");
		expect(delSlice.indexOf("service_events")).toBeLessThan(delSlice.lastIndexOf("delete("));
		vi.clearAllMocks();
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "a@b.com", name: "Owner" });
		mockServicesGetOne.mockResolvedValue(pbRecord({ id: "pb15svc00000008", userId: "owner-1" }));
		mockLogsGetList.mockResolvedValue({ items: [{ id: "logA" }, { id: "logB" }], totalItems: 2 });
		mockLogsDelete.mockResolvedValue({});
		mockServicesDelete.mockResolvedValue({});
		mockCreatePocketBaseClient.mockResolvedValue({
			filter: mockFilter,
			collection: mockCollection,
		} as any);
		const { deleteService: del2 } = await import("@/lib/storage");
		await del2("pb15svc00000008", "owner-1");
		expect(mockLogsDelete).toHaveBeenCalledTimes(2);
		expect(mockServicesDelete).toHaveBeenCalledWith("pb15svc00000008");
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "owner@a.com", name: "Owner" });
		mockServicesGetOne.mockResolvedValue(pbRecord({ id: "pb15svc00000009", userId: "owner-1" }));
		mockLogsGetList.mockResolvedValue({ items: [{ id: "logX" }], totalItems: 1 });
		mockLogsDelete.mockResolvedValue({});
		const { DELETE } = await import("@/app/api/services/route");
		const delReq = new Request("http://localhost/api/services?id=pb15svc00000009", {
			method: "DELETE",
		});
		const delRes = await DELETE(delReq);
		expect(delRes.status).toBe(200);
		mockGetAuthUser.mockResolvedValue({
			id: "attacker-1",
			email: "attacker@a.com",
			name: "Attacker",
		});
		mockServicesGetOne.mockResolvedValue(
			pbRecord({ id: "pb15svc00000010", userId: "owner-1", status: "pending" }),
		);
		const { PUT: putPeer } = await import("@/app/api/services/route");
		const putPeerReq = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000010",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				notes: "x",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putPeerRes = await putPeer(putPeerReq);
		expect([404, 403].includes(putPeerRes.status)).toBe(true);
		const putPeerReject = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000010",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				locationId: "loc1",
				status: "pending",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putPeerRejectRes = await putPeer(putPeerReject);
		expect(putPeerRejectRes.status).toBe(400);
		expect(mockServicesUpdate).not.toHaveBeenCalled();
		mockGetAuthUser.mockResolvedValue({ id: "owner-1", email: "owner@a.com", name: "Owner" });
		mockServicesGetOne.mockResolvedValue(
			pbRecord({
				id: "pb15svc00000012",
				userId: "owner-1",
				status: "completed",
				locationId: "loc1",
			}),
		);
		const putCompReq = new Request("http://localhost/api/services", {
			method: "PUT",
			body: JSON.stringify({
				id: "pb15svc00000012",
				invoiceNumber: "INV-1",
				clientName: "Cliente",
				rut: "12.345.678-5",
				contact: "56912345678",
				product: "Prod",
				notes: "x",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const putCompRes = await putPeer(putCompReq);
		expect(putCompRes.status).toBe(409);
		expect(mockServicesUpdate).not.toHaveBeenCalled();
	});
	it("storage uses PB for writes sole pb.filter", () => {
		const sSrc = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
		expect(sSrc).toContain("createPocketBaseClient");
		const upd = sSrc.slice(sSrc.indexOf("updateService"), sSrc.indexOf("updateService") + 3000);
		expect(upd).toContain('collection("services")');
		expect(upd).toContain(".getOne");
		expect(upd).toContain(".update");
		const del = sSrc.slice(sSrc.indexOf("deleteService"), sSrc.indexOf("deleteService") + 4000);
		expect(del).toContain('collection("service_events")');
		expect(del).toContain('collection("services")');
		const fSrc = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase-filter.ts"), "utf8");
		expect((fSrc.match(/pb\.filter/g) ?? []).length).toBe(1);
		const rSrc = fs.readFileSync(path.join(process.cwd(), "app/api/services/route.ts"), "utf8");
		expect(rSrc).toContain("getAuthUser");
		expect(rSrc).toContain("ServiceSchema");
	});
});
describe("movement logs WU6c — updateService creates service_events only on location change, skip on completing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesGetOne.mockReset();
		mockServicesUpdate.mockReset();
		mockServicesCreate.mockReset();
		mockServicesDelete.mockReset();
		mockLogsGetList.mockReset();
		mockLogsCreate.mockReset();
		mockLogsDelete.mockReset();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockServicesGetOne.mockResolvedValue(
			pbRecord({
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				locationId: "locA",
				status: "pending",
			}),
		);
		mockServicesUpdate.mockResolvedValue(pbRecord({ id: "pb15svcWU6c00001" }));
		mockLogsCreate.mockResolvedValue({ id: "log1" });
		mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
	});
	it("non-completing location change writes one log with denormalized userId/ServiceId/from/to/changedAt", async () => {
		// WU4: generic updateService must NOT silently mutate lifecycle or create sequential event;
		// location change now goes via lifecycle-batch helper (status/transfer routes).
		const { updateService } = await import("@/lib/storage");
		await updateService(
			{
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				invoiceNumber: "INV-001",
				clientName: "Cliente WU6c",
				contact: "56912345678",
				product: "Laptop",
				locationId: "locB",
				entryDate: new Date().toISOString(),
				status: "ready",
				repairCost: 0,
				notes: "",
			} as any,
			"owner-1",
		);
		expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
		// generic update must have no sequential lifecycle event
		expect(mockLogsCreate).not.toHaveBeenCalled();
		// ensure storage does not contain sequential service_events creation for location change
		const sSrc = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
		const updSlice = sSrc.slice(
			sSrc.indexOf("export async function updateService"),
			sSrc.indexOf("export async function updateService") + 3500,
		);
		expect(updSlice).not.toContain('collection("service_events").create');
		expect(updSlice).not.toContain("fromLocationId");
		// but direct services update remains
		expect(updSlice).toContain('collection("services").update');
		// lifecycle batch helper owns atomic location_changed
		const batchSrc = fs.readFileSync(path.join(process.cwd(), "lib/lifecycle-batch.ts"), "utf8");
		expect(batchSrc).toContain("location_changed");
		expect(batchSrc).toContain("lifecycleSeq");
	});
	it("completing with a location change skips the log", async () => {
		mockServicesGetOne.mockResolvedValue(
			pbRecord({
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				locationId: "locA",
				status: "pending",
			}),
		);
		const { updateService } = await import("@/lib/storage");
		await updateService(
			{
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				invoiceNumber: "INV-001",
				clientName: "Cliente WU6c",
				contact: "56912345678",
				product: "Laptop",
				locationId: "locB",
				entryDate: new Date().toISOString(),
				status: "completed",
				repairCost: 0,
				notes: "",
			} as any,
			"owner-1",
		);
		expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
		expect(mockLogsCreate).not.toHaveBeenCalled();
	});
	it("unchanged location writes no log", async () => {
		mockServicesGetOne.mockResolvedValue(
			pbRecord({
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				locationId: "locA",
				status: "pending",
			}),
		);
		const { updateService } = await import("@/lib/storage");
		await updateService(
			{
				id: "pb15svcWU6c00001",
				userId: "owner-1",
				invoiceNumber: "INV-001",
				clientName: "Cliente WU6c",
				contact: "56912345678",
				product: "Laptop",
				locationId: "locA",
				entryDate: new Date().toISOString(),
				status: "ready",
				repairCost: 0,
				notes: "",
			} as any,
			"owner-1",
		);
		expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
		expect(mockLogsCreate).not.toHaveBeenCalled();
	});
});
