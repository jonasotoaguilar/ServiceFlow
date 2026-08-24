import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthUser: (...args: any[]) => (mockGetAuthUser as any)(...args),
}));

const mockLocationsGetList = vi.fn();
const mockLocationsGetOne = vi.fn();
const mockLocationsCreate = vi.fn();
const mockLocationsUpdate = vi.fn();
const mockLocationsDelete = vi.fn();
const mockServicesGetList = vi.fn();
const mockLogsGetList = vi.fn();
const mockGetList = mockLocationsGetList;
const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
  let s: string = t;
  for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
  return s;
});
const mockCollection = vi.fn((name: string) => {
  if (name === "locations") return { getList: mockLocationsGetList, getOne: mockLocationsGetOne, create: mockLocationsCreate, update: mockLocationsUpdate, delete: mockLocationsDelete };
  if (name === "services") return { getList: mockServicesGetList };
  if (name === "location_logs") return { getList: mockLogsGetList };
  return { getList: mockLocationsGetList, getOne: mockLocationsGetOne, create: mockLocationsCreate, update: mockLocationsUpdate, delete: mockLocationsDelete };
});
const mockCreatePocketBaseClient = vi.fn(async () => ({ filter: mockFilter, collection: mockCollection }));
vi.mock("@/lib/pocketbase", () => ({ createPocketBaseClient: (...args: any[]) => (mockCreatePocketBaseClient as any)(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("locations read WU3 — getLocations PocketBase tenant scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthUser.mockReset();
    mockGetList.mockReset();
    mockFilter.mockClear();
    mockCollection.mockClear();
    mockCreatePocketBaseClient.mockClear();
    mockGetAuthUser.mockResolvedValue(null);
  });

  it("unauthenticated → { error: 'No autenticado' } and no PB list/write", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations();
    expect(res).toEqual({ error: "No autenticado" });
    expect(mockCreatePocketBaseClient).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockGetList).not.toHaveBeenCalled();
    expect(mockFilter).not.toHaveBeenCalled();
  });

  it("authenticated binds userId = {:uid} via locationListBinding/applyBinding and calls PB collection locations", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u-tenant-1", email: "a@b.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations();
    expect(res).toEqual({ data: [] });
    expect(mockCreatePocketBaseClient).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledWith("locations");
    expect(mockFilter).toHaveBeenCalledTimes(1);
    const [template, params] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(template).toContain("userId = {:uid}");
    expect(params.uid).toBe("u-tenant-1");
    expect(template).not.toContain("u-tenant-1");
    expect(mockGetList).toHaveBeenCalledWith(1, expect.any(Number), expect.objectContaining({ filter: expect.any(String), sort: expect.any(String) }));
    const getListOpts = mockGetList.mock.calls[0][2] as Record<string, unknown>;
    expect(typeof getListOpts.filter).toBe("string");
    expect(getListOpts.filter as string).toContain("u-tenant-1");
  });

  it("peer rows excluded: second tenant uid produces different bound filter; raw ids never appear in template", async () => {
    mockGetAuthUser.mockResolvedValueOnce({ id: "user-A", email: "a@a.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [{ id: "locA1", name: "Taller A", userId: "user-A", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], totalItems: 1 });
    const { getLocations } = await import("@/app/actions/locations");
    await getLocations();
    const [templateA, paramsA] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(paramsA.uid).toBe("user-A");
    expect(templateA).toBe("userId = {:uid}");
    vi.clearAllMocks();
    mockGetAuthUser.mockResolvedValueOnce({ id: "user-B", email: "b@b.com", name: "B" });
    mockGetList.mockResolvedValue({ items: [{ id: "locB1", name: "Taller B", userId: "user-B", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], totalItems: 1 });
    const { getLocations: getLocations2 } = await import("@/app/actions/locations");
    const resB = await getLocations2();
    const [templateB, paramsB] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(paramsB.uid).toBe("user-B");
    expect(templateB).toBe("userId = {:uid}");
    expect(resB.data).toHaveLength(1);
    expect((resB.data as Array<{ userId: string }>)[0].userId).toBe("user-B");
    expect(templateA).toBe(templateB);
    expect(paramsA.uid).not.toBe(paramsB.uid);
  });

  it("onlyActive=true omits inactive via isActive = true filter", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getLocations } = await import("@/app/actions/locations");
    await getLocations(true);
    expect(mockFilter).toHaveBeenCalledTimes(1);
    const [template] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(template).toContain("isActive = true");
    expect(template).toContain("userId = {:uid}");
  });

  it("onlyActive=false includes inactive (no isActive clause)", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations(false);
    expect(res).toEqual({ data: [] });
    expect(mockFilter).toHaveBeenCalledTimes(1);
    const [template] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(template).not.toContain("isActive");
    expect(template).toContain("userId = {:uid}");
  });

  it("default getLocations() includes inactive (same as false)", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getLocations } = await import("@/app/actions/locations");
    await getLocations();
    const [template] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(template).not.toContain("isActive");
  });

  it("maps PocketBase id not $id", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    const pbRecord = { id: "pb15charId12345", $id: "should-not-use", name: "Taller", userId: "u1", isActive: true, address: "Calle 1", createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" };
    mockGetList.mockResolvedValue({ items: [pbRecord], totalItems: 1 });
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations();
    expect(res.data).toHaveLength(1);
    expect((res.data as Array<{ id: string }>)[0].id).toBe("pb15charId12345");
    expect((res.data as Array<{ id: string }>)[0].id).not.toBe("should-not-use");
    const returned = (res.data as Array<Record<string, unknown>>)[0];
    expect(returned.id).toBe("pb15charId12345");
  });

  it("empty list is success with data: [] not error", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    mockGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations();
    expect(res).toEqual({ data: [] });
    expect(res).not.toHaveProperty("error");
  });

  it("non-empty list returns data with same tenant only (triangulate)", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A" });
    const items = [
      { id: "loc1", name: "A1", userId: "u1", isActive: true, createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
      { id: "loc2", name: "A2", userId: "u1", isActive: false, createdAt: "2024-01-02T00:00:00.000Z", updatedAt: "2024-01-02T00:00:00.000Z" },
    ];
    mockGetList.mockResolvedValue({ items, totalItems: 2 });
    const { getLocations } = await import("@/app/actions/locations");
    const res = await getLocations();
    expect(res.data).toHaveLength(2);
    expect((res.data as Array<{ name: string }>).map((r) => r.name)).toEqual(["A1", "A2"]);
  });

  it("source uses PocketBase tenant binding and does not preserve Appwrite read fallback for getLocations", async () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app/actions/locations.ts"), "utf8");
    expect(src).toContain("createPocketBaseClient");
    expect(src).toContain("locationListBinding");
    expect(src).toContain("applyBinding");
    expect(src).toContain('collection("locations")');
    expect(src).toContain("getList");
    const getLocationsMatch = src.match(/export async function getLocations[\s\S]*?^}/m);
    if (getLocationsMatch) {
      const body = getLocationsMatch[0];
      expect(body).not.toContain("databases.");
      expect(body).not.toContain("COLLECTIONS.LOCATIONS");
      expect(body).not.toContain("Query.equal");
      expect(body).not.toContain("DB_ID");
    } else {
      expect(src).not.toMatch(/databases\.listDocuments.*COLLECTIONS\.LOCATIONS.*getLocations/);
    }
    expect(src).toMatch(/getAuthUser[\s\S]*?No autenticado/);
    expect(src).toMatch(/id:\s*record\.id|id:\s*doc\.id|\.id/);
    expect(src).not.toMatch(/doc\.\$id/);
  });

  it("page gate remains getAuthUser → redirect /login (auth-session spec)", async () => {
    const pageSrc = fs.readFileSync(path.join(process.cwd(), "app/locations/page.tsx"), "utf8");
    expect(pageSrc).toContain("getAuthUser");
    expect(pageSrc).toContain('redirect("/login")');
    expect(pageSrc).toContain("getLocations");
  });

  it("no new dependencies and no live PocketBase contact in tests (mocked only)", async () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app/actions/locations.ts"), "utf8");
    expect(src).not.toContain("node-appwrite");
    expect(src).not.toContain("loadFromCookie");
    expect(src).not.toMatch(/console\.log.*pb_auth/);
    expect(src).not.toMatch(/console\.log.*token/);
  });
});

describe("locations write WU6b — create/update/toggle/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthUser.mockReset(); mockLocationsGetList.mockReset(); mockLocationsGetOne.mockReset(); mockLocationsCreate.mockReset(); mockLocationsUpdate.mockReset(); mockLocationsDelete.mockReset(); mockServicesGetList.mockReset(); mockLogsGetList.mockReset();
    mockFilter.mockClear(); mockCollection.mockClear(); mockCreatePocketBaseClient.mockClear();
    mockGetAuthUser.mockResolvedValue({ id: "u-owner-1", email: "owner@test.com", name: "Owner" });
    mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 });
    mockLocationsGetOne.mockResolvedValue({ id: "loc123456789012", name: "Taller", userId: "u-owner-1", isActive: true });
    mockLocationsCreate.mockResolvedValue({ id: "pb15newlocid123", name: "Taller", userId: "u-owner-1", isActive: true });
    mockLocationsUpdate.mockResolvedValue({ id: "loc123456789012", name: "Updated" });
    mockLocationsDelete.mockResolvedValue({}); mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
  });
  it("unauthenticated mutate writes nothing", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const { createLocation: c, updateLocation: u, toggleLocationActive: t, deleteLocation: d } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("name", "Taller"); expect(await c(null, fd)).toEqual({ error: "No autenticado" });
    const fd2 = new FormData(); fd2.set("id", "loc1"); fd2.set("name", "Taller"); expect(await u(null, fd2)).toEqual({ error: "No autenticado" });
    expect(await t("loc1", false)).toEqual({ error: "No autenticado" }); expect(await d("loc1", "Taller")).toEqual({ error: "No autenticado" });
    expect(mockCreatePocketBaseClient).not.toHaveBeenCalled(); expect(mockLocationsCreate).not.toHaveBeenCalled(); expect(mockLocationsUpdate).not.toHaveBeenCalled(); expect(mockLocationsDelete).not.toHaveBeenCalled();
  });
  it("create isActive true, server userId, address trimmed, native id omitted", async () => {
    mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLocationsCreate.mockResolvedValue({ id: "pb15charId67890", name: "Taller Centro", address: "Calle 123", userId: "u-owner-1", isActive: true });
    const { createLocation } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("name", "  Taller Centro  "); fd.set("address", "  Calle 123  "); const r = await createLocation(null, fd);
    expect(r).toEqual(expect.objectContaining({ success: true })); const p = mockLocationsCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(p.userId).toBe("u-owner-1"); expect(p.isActive).toBe(true); expect(p.name).toBe("Taller Centro"); expect(p.address).toBe("Calle 123"); expect(p).not.toHaveProperty("id"); expect(p).not.toHaveProperty("$id");
    vi.clearAllMocks(); mockGetAuthUser.mockResolvedValue({ id: "u-owner-1", email: "owner@test.com", name: "Owner" }); mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLocationsCreate.mockResolvedValue({ id: "pb15charId67891", name: "Taller Sin Dir", userId: "u-owner-1", isActive: true });
    const fd2 = new FormData(); fd2.set("name", "Taller Sin Dir"); fd2.set("address", "   "); const r2 = await createLocation(null, fd2); expect(r2).toEqual(expect.objectContaining({ success: true })); expect((mockLocationsCreate.mock.calls[0][0] as Record<string, unknown>).address).toBeUndefined();
  });
  it("duplicate exact rejected via normalizeString and bound userId only", async () => {
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc1", name: "Taller Centro", userId: "u-owner-1" }], totalItems: 1 });
    const { createLocation } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("name", "Taller Centro"); const r = await createLocation(null, fd);
    expect(r.error).toMatch(/Ya existe.*Sede.*nombre/i); expect(mockLocationsCreate).not.toHaveBeenCalled(); expect(mockFilter).toHaveBeenCalled();
    const [t, p] = mockFilter.mock.calls.find(([x]) => (x as string).includes("userId")) ?? mockFilter.mock.calls[0]; expect((t as string)).toContain("userId = {:uid}"); expect((p as Record<string, unknown>).uid).toBe("u-owner-1"); expect(t as string).not.toContain("Taller Centro");
  });
  it("update keeps own name without duplicate error", async () => {
    mockLocationsGetOne.mockResolvedValue({ id: "loc1", name: "Taller Centro", userId: "u-owner-1", isActive: true }); mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc1", name: "Taller Centro", userId: "u-owner-1" }], totalItems: 1 }); mockLocationsUpdate.mockResolvedValue({ id: "loc1", name: "Taller Centro" });
    const { updateLocation } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("id", "loc1"); fd.set("name", "Taller Centro"); fd.set("address", "Nueva Dir"); const r = await updateLocation(null, fd); expect(r).toEqual(expect.objectContaining({ success: true })); expect(mockLocationsUpdate).toHaveBeenCalledTimes(1);
  });
  it("peer mutate fails with not-found/unauthorized and no mutation", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-B", email: "b@test.com", name: "B" }); mockLocationsGetOne.mockResolvedValue({ id: "loc1", name: "Taller", userId: "user-A", isActive: true });
    const { updateLocation: u, toggleLocationActive: t, deleteLocation: d } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("id", "loc1"); fd.set("name", "Hack"); expect((await u(null, fd)).error).toMatch(/no encontrada|No autorizado/i); expect(mockLocationsUpdate).not.toHaveBeenCalled();
    expect((await t("loc1", false)).error).toMatch(/No autorizado|no encontrada/i); expect(mockLocationsUpdate).not.toHaveBeenCalled();
    mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 }); expect((await d("loc1", "Taller")).error).toMatch(/no encontrada|No autorizado/i); expect(mockLocationsDelete).not.toHaveBeenCalled();
  });
  it("delete blocked with service or log, same Spanish guard; unused deletes", async () => {
    mockLocationsGetOne.mockResolvedValue({ id: "loc1", name: "Taller", userId: "u-owner-1", isActive: true }); mockServicesGetList.mockResolvedValue({ items: [{ id: "svc1", locationId: "loc1" }], totalItems: 1 }); mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
    const { deleteLocation } = await import("@/app/actions/locations");
    expect((await deleteLocation("loc1", "Taller")).error).toBe("No se puede eliminar una Sede con historial de servicios o movimientos."); expect(mockLocationsDelete).not.toHaveBeenCalled();
    mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLogsGetList.mockResolvedValue({ items: [{ id: "log1", fromLocationId: "loc1" }], totalItems: 1 }); expect((await deleteLocation("loc1", "Taller")).error).toBe("No se puede eliminar una Sede con historial de servicios o movimientos."); expect(mockLocationsDelete).not.toHaveBeenCalled();
    mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLocationsDelete.mockResolvedValue({}); expect(await deleteLocation("loc1", "Taller")).toEqual(expect.objectContaining({ success: true })); expect(mockLocationsDelete).toHaveBeenCalledWith("loc1");
  });
  it("source uses PocketBase, Zod, native ids, bound filters, no Appwrite fallback", async () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app/actions/locations.ts"), "utf8");
    expect(src).toContain("createPocketBaseClient"); expect(src).toContain("LocationCreateSchema"); expect(src).toContain("LocationUpdateSchema"); expect(src).toContain("normalizeString"); expect(src).toContain('collection("locations")'); expect(src).toContain(".create("); expect(src).toContain(".update("); expect(src).toContain(".delete("); expect(src).toContain("applyBinding"); expect(src).toContain("isActive");
    expect(src).not.toContain("ID.unique"); expect(src).not.toContain("DB_ID"); expect(src).not.toContain("databases."); expect(src).not.toContain("Query.equal"); expect(src).not.toContain("COLLECTIONS.");
  });
  it("accent-insensitive duplicate and cross-tenant allowed, toggle keeps history", async () => {
    mockLocationsGetList.mockResolvedValue({ items: [{ id: "loc1", name: "Ñuñoa", userId: "u-owner-1" }], totalItems: 1 });
    const { createLocation: c, toggleLocationActive: t } = await import("@/app/actions/locations");
    const fd = new FormData(); fd.set("name", "Nunoa"); expect((await c(null, fd)).error).toMatch(/Ya existe.*Sede.*nombre/i); expect(mockLocationsCreate).not.toHaveBeenCalled();
    mockGetAuthUser.mockResolvedValue({ id: "user-B", email: "b@test.com", name: "B" }); mockLocationsGetList.mockResolvedValue({ items: [], totalItems: 0 }); mockLocationsCreate.mockResolvedValue({ id: "pb15charId99999", name: "Taller Centro", userId: "user-B", isActive: true });
    const fd2 = new FormData(); fd2.set("name", "Taller Centro"); expect(await c(null, fd2)).toEqual(expect.objectContaining({ success: true })); expect(mockLocationsCreate).toHaveBeenCalled();
    vi.clearAllMocks(); mockGetAuthUser.mockResolvedValue({ id: "u-owner-1", email: "owner@test.com", name: "Owner" }); mockLocationsGetOne.mockResolvedValue({ id: "loc1", name: "Taller", userId: "u-owner-1", isActive: true, hasHistory: true }); mockLocationsUpdate.mockResolvedValue({ id: "loc1", isActive: false });
    expect(await t("loc1", false)).toEqual(expect.objectContaining({ success: true })); expect(mockLocationsUpdate).toHaveBeenCalledWith("loc1", expect.objectContaining({ isActive: false })); expect(mockLocationsDelete).not.toHaveBeenCalled();
  });
});
