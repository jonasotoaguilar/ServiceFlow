import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));
const mockServicesGetList = vi.fn();
const mockLocationsGetList = vi.fn();
const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
  let s = t;
  for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
  return s;
});
const mockCollection = vi.fn((n: string) => {
  if (n === "services") return { getList: mockServicesGetList };
  if (n === "locations") return { getList: mockLocationsGetList };
  throw new Error(n);
});
const mockCreatePocketBaseClient = vi.fn(async () => ({ filter: mockFilter, collection: mockCollection }));
vi.mock("@/lib/pocketbase", () => ({ createPocketBaseClient: (...a: unknown[]) => (mockCreatePocketBaseClient as any)(...a) }));
function pbRecord(o: Record<string, unknown> = {}) {
  return {
    id: "pb15charsvc00001", userId: "user-1", invoiceNumber: "INV-001", clientName: "Acme Corp", rut: "11.111.111-1",
    contact: "56912345678", email: "a@b.com", product: "Laptop", failureDescription: "No enciende", sku: "SKU1",
    locationId: "loc_pb_15_chars1", entryDate: new Date().toISOString(), deliveryDate: null, readyDate: null,
    cancellationDate: null, status: "pending", repairCost: 0, notes: "", ...o,
  };
}
describe("services read WU4 — getServices PocketBase tenant scope + GET route", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mockGetAuthUser.mockReset(); mockServicesGetList.mockReset(); mockLocationsGetList.mockReset();
    mockFilter.mockClear(); mockCollection.mockClear(); mockCreatePocketBaseClient.mockClear();
    mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
    mockGetAuthUser.mockResolvedValue({ id: "test-user-1", email: "a@b.com", name: "A" });
  });
  it("default page=1 limit=20 envelope { data, total, page, limit }", async () => {
    mockServicesGetList.mockResolvedValue({ items: [pbRecord(), pbRecord({ id: "pb15charsvc00002" })], totalItems: 2 });
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc_pb_15_chars1", name: "Taller Central" }], totalItems: 1 });
    const { getServices } = await import("@/lib/storage");
    const res = await getServices({ userId: "test-user-1" });
    expect(mockCreatePocketBaseClient).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledWith("services");
    const [p, l, o] = mockServicesGetList.mock.calls[0] as [number, number, Record<string, unknown>];
    expect(p).toBe(1); expect(l).toBe(20); expect(o).toHaveProperty("filter"); expect(o).toHaveProperty("sort");
    expect(res.page).toBe(1); expect(res.limit).toBe(20); expect(res.total).toBe(2); expect(res.data).toHaveLength(2);
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
    vi.clearAllMocks(); mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
    await getServices({ userId: "u1", sortOrder: "desc" });
    expect(mockServicesGetList.mock.calls[0][2]).toHaveProperty("sort", "-entryDate");
    vi.clearAllMocks(); mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
    await getServices({ userId: "u1" });
    expect(mockServicesGetList.mock.calls[0][2]).toHaveProperty("sort", "entryDate");
  });
  it("bound search on clientName/invoiceNumber/rut and template invariant under metacharacters", async () => {
    const { serviceListBinding } = await import("@/lib/pocketbase-filter");
    const a = serviceListBinding({ userId: "u1", search: "normal" });
    const b = serviceListBinding({ userId: "u1", search: 'a" || b || c' });
    expect(a.filter).toBe(b.filter); expect(b.params.search).toBe('a" || b || c');
    mockServicesGetList.mockResolvedValue({ items: [pbRecord()], totalItems: 1 });
    const { getServices } = await import("@/lib/storage");
    await getServices({ userId: "u1", search: "Acme" });
    const [t, p] = mockFilter.mock.calls.find(([x]) => (x as string).includes("clientName")) ?? mockFilter.mock.calls[0];
    expect((t as string)).toContain("clientName ~ {:search}"); expect((t as string)).toContain("invoiceNumber ~ {:search}"); expect((t as string)).toContain("rut ~ {:search}");
    expect((p as Record<string, unknown>).search).toBe("Acme"); expect(t as string).not.toContain("Acme");
    vi.clearAllMocks(); mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
    await getServices({ userId: "u1", search: 'a" || b' });
    const [tm, pr] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(pr.search).toBe('a" || b'); expect(tm).not.toContain('a"');
  });
  it("status allowlist and locationId bound", async () => {
    mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getServices } = await import("@/lib/storage");
    await getServices({ userId: "u1", status: ["pending", "invalid" as any, "completed"], location: "loc_pb_15_chars1" });
    const [t, p] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(Object.values(p)).toContain("pending"); expect(Object.values(p)).toContain("completed"); expect(Object.values(p)).not.toContain("invalid");
    expect(t).not.toContain("invalid"); expect(t).toContain("status ="); expect(t).toContain("locationId = {:locationId}"); expect(p.locationId).toBe("loc_pb_15_chars1");
  });
  it("two-user isolation via bound uid same template different param", async () => {
    mockServicesGetList.mockResolvedValue({ items: [pbRecord({ userId: "user-A" })], totalItems: 1 });
    const { getServices } = await import("@/lib/storage");
    await getServices({ userId: "user-A" });
    const [ta, pa] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(pa.uid).toBe("user-A"); expect(ta).toContain("userId = {:uid}"); expect(ta).not.toContain("user-A");
    vi.clearAllMocks(); mockServicesGetList.mockResolvedValue({ items: [pbRecord({ id: "pb15charsvc00003", userId: "user-B" })], totalItems: 1 }); mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getServices: g2 } = await import("@/lib/storage");
    await g2({ userId: "user-B" });
    const [tb, pb] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(pb.uid).toBe("user-B"); expect(ta).toBe(tb); expect(pa.uid).not.toBe(pb.uid);
  });
  it("page 2 of 25 triangulates pagination", async () => {
    const items = Array.from({ length: 5 }, (_, i) => pbRecord({ id: `pb15charsvc0000${i + 1}` }));
    mockServicesGetList.mockResolvedValue({ items, totalItems: 25 });
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc_pb_15_chars1", name: "Taller" }], totalItems: 1 });
    const { getServices } = await import("@/lib/storage");
    const res = await getServices({ userId: "u1", page: 2, limit: 20 });
    expect(mockServicesGetList).toHaveBeenCalledWith(2, 20, expect.any(Object));
    expect(res.page).toBe(2); expect(res.limit).toBe(20); expect(res.total).toBe(25); expect(res.data).toHaveLength(5);
  });
  it("search + status + location compose", async () => {
    mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getServices } = await import("@/lib/storage");
    await getServices({ userId: "u1", search: "foo", status: ["ready"], location: "loc1" });
    const [t, p] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(t).toContain("userId = {:uid}"); expect(t).toContain("clientName ~ {:search}"); expect(t).toContain("status ="); expect(t).toContain("locationId = {:locationId}");
    expect(p.uid).toBe("u1"); expect(p.search).toBe("foo"); expect(p.locationId).toBe("loc1");
  });
  it("maps id not $id and batched location join with bound id = {:id0} || ...", async () => {
    const svc = pbRecord({ id: "pb15charsvc12345", $id: "should-not-use", locationId: "loc_pb_15_chars9" }) as any;
    mockServicesGetList.mockResolvedValue({ items: [svc], totalItems: 1 });
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc_pb_15_chars9", name: "Taller Norte" }], totalItems: 1 });
    const { getServices } = await import("@/lib/storage");
    const res = await getServices({ userId: "u1" });
    expect(res.data[0].id).toBe("pb15charsvc12345"); expect((res.data[0] as any).id).not.toBe("should-not-use");
    expect(res.data[0].location).toBe("Taller Norte");
    expect(mockCollection).toHaveBeenCalledWith("locations");
    const loc = mockFilter.mock.calls.find(([x]) => (x as string).includes("id = {:id0}"));
    expect(loc).toBeDefined();
    const [lt, lp] = loc as [string, Record<string, unknown>];
    expect(lt).toContain("id = {:id0}"); expect(Object.values(lp)).toContain("loc_pb_15_chars9"); expect(lt).not.toContain("loc_pb_15_chars9");
    // multi-id batch
    vi.clearAllMocks(); mockServicesGetList.mockResolvedValue({ items: [pbRecord({ id: "pb15charsvc00010", locationId: "loc_a" }), pbRecord({ id: "pb15charsvc00011", locationId: "loc_b" })], totalItems: 2 });
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc_a", name: "Sede A" }, { id: "loc_b", name: "Sede B" }], totalItems: 2 });
    const { getServices: g3 } = await import("@/lib/storage");
    const r2 = await g3({ userId: "u1" });
    expect(r2.data).toHaveLength(2);
    const mc = mockFilter.mock.calls.filter(([x]) => (x as string).includes("id = {:id"));
    expect(mc.length).toBeGreaterThanOrEqual(1);
    const [mt, mp] = mc[0] as [string, Record<string, unknown>];
    expect(mt).toContain("id = {:id0}"); expect(mt).toContain("id = {:id1}"); expect(Object.values(mp)).toEqual(expect.arrayContaining(["loc_a", "loc_b"]));
  });
  it("uses PocketBase only via createPocketBaseClient + serviceListBinding + applyBinding", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "lib/storage.ts"), "utf8");
    expect(src).toContain("createPocketBaseClient"); expect(src).toContain("serviceListBinding"); expect(src).toContain("applyBinding");
    expect(src).toContain('collection("services")'); expect(src).toContain("getList");
    const f = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase-filter.ts"), "utf8");
    expect((f.match(/pb\.filter/g) ?? []).length).toBe(1);
  });
  it("GET unauthenticated returns 401 without PB calls", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const { GET } = await import("@/app/api/services/route");
    const req = new Request("http://localhost/api/services?page=1&limit=20");
    const res = await GET(req);
    expect(res.status).toBe(401); expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockCreatePocketBaseClient).not.toHaveBeenCalled();
  });
  it("GET keeps query params and passes userId from auth only triangulates comma-separated status", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "auth-user-123", email: "a@b.com", name: "A" });
    mockServicesGetList.mockResolvedValue({ items: [pbRecord({ id: "pb15charsvc00020" })], totalItems: 1 });
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc_pb_15_chars1", name: "Taller" }], totalItems: 1 });
    const { GET } = await import("@/app/api/services/route");
    const req = new Request("http://localhost/api/services?page=2&limit=5&search=Acme&status=pending,ready&location=loc_pb_15_chars1&sortOrder=desc");
    const res = await GET(req);
    expect(res.status).toBe(200); const body = await res.json();
    expect(body.page).toBe(2); expect(body.limit).toBe(5); expect(body.total).toBe(1);
    expect(mockServicesGetList).toHaveBeenCalledWith(2, 5, expect.objectContaining({ sort: "-entryDate" }));
    const [t, p] = mockFilter.mock.calls.find(([x]) => (x as string).includes("userId")) as [string, Record<string, unknown>];
    expect(p.uid).toBe("auth-user-123"); expect(p.search).toBe("Acme"); expect(Object.values(p)).toContain("pending"); expect(Object.values(p)).toContain("ready"); expect(p.locationId).toBe("loc_pb_15_chars1");
  });
});
