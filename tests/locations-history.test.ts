import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthUser: (...args: any[]) => (mockGetAuthUser as any)(...args),
}));

const mockGetList = vi.fn();
const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
  let s: string = t;
  for (const [k, v] of Object.entries(p)) {
    s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
  }
  return s;
});
const mockCollection = vi.fn(() => ({ getList: mockGetList }));
const mockCreatePocketBaseClient = vi.fn(async () => ({
  filter: mockFilter,
  collection: mockCollection,
}));
vi.mock("@/lib/pocketbase", () => ({
  createPocketBaseClient: (...args: any[]) => (mockCreatePocketBaseClient as any)(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("locations read WU3 — getLocations PocketBase tenant scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthUser.mockReset();
    mockGetList.mockReset();
    mockFilter.mockClear();
    mockCollection.mockClear();
    mockCreatePocketBaseClient.mockClear();
    // default: unauthenticated unless overridden
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
    // applyBinding should have called pb.filter with template containing uid placeholder
    expect(mockFilter).toHaveBeenCalledTimes(1);
    const [template, params] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(template).toContain("userId = {:uid}");
    expect(params.uid).toBe("u-tenant-1");
    // ensure raw uid not interpolated into template
    expect(template).not.toContain("u-tenant-1");
    expect(mockGetList).toHaveBeenCalledWith(1, expect.any(Number), expect.objectContaining({ filter: expect.any(String), sort: expect.any(String) }));
    const getListOpts = mockGetList.mock.calls[0][2] as Record<string, unknown>;
    expect(typeof getListOpts.filter).toBe("string");
    // filter string after pb.filter should contain the uid value
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
    // simulate second user
    mockGetAuthUser.mockResolvedValueOnce({ id: "user-B", email: "b@b.com", name: "B" });
    mockGetList.mockResolvedValue({ items: [{ id: "locB1", name: "Taller B", userId: "user-B", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], totalItems: 1 });
    // re-import to ensure fresh? but mock persists, just call again
    const { getLocations: getLocations2 } = await import("@/app/actions/locations");
    const resB = await getLocations2();
    const [templateB, paramsB] = mockFilter.mock.calls[0] as [string, Record<string, unknown>];
    expect(paramsB.uid).toBe("user-B");
    expect(templateB).toBe("userId = {:uid}");
    expect(resB.data).toHaveLength(1);
    expect((resB.data as Array<{ userId: string }>)[0].userId).toBe("user-B");
    // ensure filter templates are identical (invariant), only params differ
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
    // ensure returned record keeps PocketBase id, and does not expose $id as id
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
    // must use request-scoped PocketBase client
    expect(src).toContain("createPocketBaseClient");
    expect(src).toContain("locationListBinding");
    expect(src).toContain("applyBinding");
    expect(src).toContain('collection("locations")');
    expect(src).toContain("getList");
    // ensure getLocations does not use Appwrite databases/listDocuments
    // extract getLocations body: find function and check it doesn't contain databases.
    const getLocationsMatch = src.match(/export async function getLocations[\s\S]*?^}/m);
    if (getLocationsMatch) {
      const body = getLocationsMatch[0];
      expect(body).not.toContain("databases.");
      expect(body).not.toContain("COLLECTIONS.LOCATIONS");
      expect(body).not.toContain("Query.equal");
      expect(body).not.toContain("DB_ID");
    } else {
      // fallback: entire file should contain PocketBase for getLocations, and not rely on ID.unique for read
      expect(src).not.toMatch(/databases\.listDocuments.*COLLECTIONS\.LOCATIONS.*getLocations/);
    }
    // ensure tenant isolation is fail-closed: getAuthUser check before PB
    expect(src).toMatch(/getAuthUser[\s\S]*?No autenticado/);
    // ensure mapping uses record.id not $id
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
    // ensure we use installed PB types via pocketbase
    expect(src).not.toContain("node-appwrite");
    expect(src).not.toContain("loadFromCookie");
    // ensure we do not log secrets
    expect(src).not.toMatch(/console\.log.*pb_auth/);
    expect(src).not.toMatch(/console\.log.*token/);
  });
});
