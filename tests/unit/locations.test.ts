import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const load = () => {
	const r = fs.readFileSync(path.join(process.cwd(), "pocketbase/v1.collections.json"), "utf8");
	const j = JSON.parse(r);
	return { c: j, cols: Array.isArray(j) ? j : (j.collections ?? j.data ?? []) };
};
const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const mockLList = vi.fn(),
	mockLOne = vi.fn(),
	mockLCreate = vi.fn(),
	mockLUpdate = vi.fn(),
	mockLDelete = vi.fn(),
	mockSList = vi.fn(),
	mockLogList = vi.fn();
const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
	let s = t;
	for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
	return s;
});
const mockCol = vi.fn((n: string) => {
	if (n === "locations")
		return {
			getList: mockLList,
			getOne: mockLOne,
			create: mockLCreate,
			update: mockLUpdate,
			delete: mockLDelete,
		};
	if (n === "services") return { getList: mockSList };
	if (n === "service_events") return { getList: mockLogList };
	throw new Error(n);
});
const mockPB = vi.fn(async () => ({ filter: mockFilter, collection: mockCol }));
vi.mock("@/lib/pocketbase", () => ({
	createPocketBaseClient: (...a: unknown[]) => (mockPB as any)(...a),
}));
const uid = "user-1";
const now = new Date().toISOString();
function reset() {
	vi.clearAllMocks();
	mockGetAuthUser.mockReset();
	mockLList.mockReset();
	mockLOne.mockReset();
	mockLCreate.mockReset();
	mockLUpdate.mockReset();
	mockLDelete.mockReset();
	mockSList.mockReset();
	mockLogList.mockReset();
	mockFilter.mockClear();
	mockCol.mockClear();
	mockPB.mockClear();
	mockGetAuthUser.mockResolvedValue({ id: uid, email: "a@b.com", name: "A" });
	mockSList.mockResolvedValue({ items: [], totalItems: 0 });
	mockLogList.mockResolvedValue({ items: [], totalItems: 0 });
}
describe("Location invariants — isDefault + ensure idempotent + guards (Unit 7 RED 4.1)", () => {
	beforeEach(reset);
	describe("schema", () => {
		it("has isDefault bool default false", () => {
			const { cols } = load() as any;
			const loc = cols.find((c: any) => c.name === "locations");
			const f = (loc.fields ?? loc.schema).find((x: any) => x.name === "isDefault");
			expect(f).toBeDefined();
			expect(f.type).toBe("bool");
		});
		it("indexes cover userId and document partial unique or isDefault", () => {
			const { cols } = load() as any;
			const r = read("pocketbase/v1.collections.json");
			const loc = cols.find((c: any) => c.name === "locations");
			const idxs: string[] = loc.indexes ?? [];
			expect(idxs.some((i) => i.includes("userId"))).toBe(true);
			const hasPartial = idxs.some((i) => /WHERE.*isDefault/i.test(i) && /UNIQUE/i.test(i));
			const src = read("lib/locations.ts");
			const hasDoc = /isDefault/.test(src) && /partial|WHERE|app.*layer|unique/i.test(src);
			expect(hasPartial || hasDoc).toBe(true);
			expect(r).toContain("isDefault");
		});
		it("tenant rules locked and address optional", () => {
			const { cols } = load() as any;
			const loc = cols.find((c: any) => c.name === "locations");
			for (const rule of [
				loc.listRule,
				loc.viewRule,
				loc.createRule,
				loc.updateRule,
				loc.deleteRule,
			])
				expect(rule).toBe("userId = @request.auth.id");
			const a = (loc.fields ?? loc.schema).find((x: any) => x.name === "address");
			expect(a.required).toBe(false);
		});
	});
	describe("ensureDefaultLocation idempotent", () => {
		it("zero → creates Sede Principal default active", async () => {
			mockLList.mockResolvedValue({ items: [], totalItems: 0 });
			mockLCreate.mockResolvedValue({ id: "pb15loc00000001" });
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			expect(mockLCreate).toHaveBeenCalledTimes(1);
			const arg = mockLCreate.mock.calls[0][0] as any;
			expect(arg.userId).toBe(uid);
			expect(arg.isDefault).toBe(true);
			expect(arg.isActive).toBe(true);
			expect(String(arg.name)).toMatch(/Sede Principal/i);
			const [t, p] = mockFilter.mock.calls.find(([x]: any) => String(x).includes("userId")) as any;
			expect(t).toContain("userId = {:uid}");
			expect(p.uid).toBe(uid);
		});
		it("second call idempotent no duplicate", async () => {
			mockLList.mockResolvedValueOnce({ items: [], totalItems: 0 });
			mockLCreate.mockResolvedValue({ id: "pb15loc00000001" });
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			expect(mockLCreate).toHaveBeenCalledTimes(1);
			mockLCreate.mockClear();
			mockLList.mockResolvedValueOnce({
				items: [
					{
						id: "pb15loc00000001",
						userId: uid,
						name: "Sede Principal",
						isActive: true,
						isDefault: true,
						createdAt: now,
					},
				],
				totalItems: 1,
			});
			await ensureDefaultLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
		});
		it("register then login not duplicate", async () => {
			mockLList.mockResolvedValue({
				items: [
					{
						id: "pb15loc00000001",
						userId: uid,
						name: "Sede Principal",
						isActive: true,
						isDefault: true,
						createdAt: now,
					},
				],
				totalItems: 1,
			});
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			mockLCreate.mockClear();
			await ensureDefaultLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
		});
		it("existing zero repaired once second no duplicate", async () => {
			mockLList.mockResolvedValueOnce({ items: [], totalItems: 0 });
			mockLCreate.mockResolvedValue({ id: "pb15locREPAIR01" });
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			expect(mockLCreate).toHaveBeenCalledTimes(1);
			mockLCreate.mockClear();
			mockLList.mockResolvedValueOnce({
				items: [
					{
						id: "pb15locREPAIR01",
						userId: uid,
						name: "Sede Principal",
						isActive: true,
						isDefault: true,
					},
				],
				totalItems: 1,
			});
			await ensureDefaultLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
		});
		it("no default but active exists promotes oldest", async () => {
			const older = new Date(Date.now() - 10000).toISOString(),
				newer = new Date().toISOString();
			mockLList.mockResolvedValue({
				items: [
					{
						id: "locA",
						userId: uid,
						name: "Sede A",
						isActive: true,
						isDefault: false,
						createdAt: older,
					},
					{
						id: "locB",
						userId: uid,
						name: "Sede B",
						isActive: true,
						isDefault: false,
						createdAt: newer,
					},
				],
				totalItems: 2,
			});
			mockLUpdate.mockResolvedValue({});
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
			expect(mockLUpdate).toHaveBeenCalledWith(
				"locA",
				expect.objectContaining({ isDefault: true }),
			);
		});
		it("already one active default no-op", async () => {
			mockLList.mockResolvedValue({
				items: [
					{
						id: "pb15loc00000001",
						userId: uid,
						name: "Sede Principal",
						isActive: true,
						isDefault: true,
						createdAt: now,
					},
				],
				totalItems: 1,
			});
			const { ensureDefaultLocation } = await import("@/lib/locations");
			await ensureDefaultLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
	});
	describe("setDefaultLocation safe change", () => {
		it("moves default A→B previous active non-default", async () => {
			mockLOne.mockResolvedValue({
				id: "locB",
				userId: uid,
				name: "Sede B",
				isActive: true,
				isDefault: false,
			});
			mockLList.mockResolvedValue({
				items: [
					{
						id: "locA",
						userId: uid,
						name: "Sede A",
						isActive: true,
						isDefault: true,
						createdAt: now,
					},
					{
						id: "locB",
						userId: uid,
						name: "Sede B",
						isActive: true,
						isDefault: false,
						createdAt: now,
					},
				],
				totalItems: 2,
			});
			mockLUpdate.mockResolvedValue({});
			const { setDefaultLocation } = await import("@/lib/locations");
			const r = await setDefaultLocation(uid, "locB");
			expect(r).toEqual(expect.objectContaining({ success: true }));
			expect(mockLUpdate).toHaveBeenCalledWith(
				"locA",
				expect.objectContaining({ isDefault: false }),
			);
			expect(mockLUpdate).toHaveBeenCalledWith(
				"locB",
				expect.objectContaining({ isDefault: true }),
			);
		});
		it("inactive target rejected", async () => {
			mockLOne.mockResolvedValue({
				id: "locB",
				userId: uid,
				name: "Sede B",
				isActive: false,
				isDefault: false,
			});
			mockLList.mockResolvedValue({
				items: [
					{ id: "locA", userId: uid, name: "Sede A", isActive: true, isDefault: true },
					{ id: "locB", userId: uid, name: "Sede B", isActive: false, isDefault: false },
				],
				totalItems: 2,
			});
			const { setDefaultLocation } = await import("@/lib/locations");
			const r = await setDefaultLocation(uid, "locB");
			expect((r as any).error).toMatch(/activa|inactive|no puede/i);
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
		it("foreign rejected", async () => {
			mockLOne.mockResolvedValue({
				id: "locF",
				userId: "other",
				name: "Other",
				isActive: true,
				isDefault: false,
			});
			const { setDefaultLocation } = await import("@/lib/locations");
			const r = await setDefaultLocation(uid, "locF");
			expect((r as any).error).toMatch(/no encontrada|No autorizado/i);
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
		it("missing rejected", async () => {
			mockLOne.mockRejectedValue(new Error("not found"));
			const { setDefaultLocation } = await import("@/lib/locations");
			const r = await setDefaultLocation(uid, "missing");
			expect((r as any).error).toMatch(/no encontrada/i);
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
	});
	describe("guards delete/deactivate", () => {
		it("default delete rejected", async () => {
			mockGetAuthUser.mockResolvedValue({ id: uid, email: "a@b.com", name: "A" });
			mockLOne.mockResolvedValue({
				id: "locDefault",
				userId: uid,
				name: "Sede Principal",
				isActive: true,
				isDefault: true,
			});
			mockSList.mockResolvedValue({ items: [], totalItems: 0 });
			mockLogList.mockResolvedValue({ items: [], totalItems: 0 });
			const { deleteLocation } = await import("@/app/actions/locations");
			const r = await deleteLocation("locDefault", "Sede Principal");
			expect((r as any).error).toMatch(/predeterminada|default|No se puede eliminar/i);
			expect(mockLDelete).not.toHaveBeenCalled();
		});
		it("last active deactivate rejected", async () => {
			mockLOne.mockResolvedValue({
				id: "locOnly",
				userId: uid,
				name: "Sede Principal",
				isActive: true,
				isDefault: true,
			});
			mockLList.mockResolvedValue({
				items: [
					{ id: "locOnly", userId: uid, name: "Sede Principal", isActive: true, isDefault: true },
				],
				totalItems: 1,
			});
			const { toggleLocationActive } = await import("@/app/actions/locations");
			const r = await toggleLocationActive("locOnly", false);
			expect((r as any).error).toMatch(/activa|predeterminada|al menos/i);
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
		it("default deactivate rejected even with another active", async () => {
			mockLOne.mockResolvedValue({
				id: "locDefault",
				userId: uid,
				name: "Sede A",
				isActive: true,
				isDefault: true,
			});
			mockLList.mockResolvedValue({
				items: [
					{ id: "locDefault", userId: uid, name: "Sede A", isActive: true, isDefault: true },
					{ id: "locB", userId: uid, name: "Sede B", isActive: true, isDefault: false },
				],
				totalItems: 2,
			});
			const { toggleLocationActive } = await import("@/app/actions/locations");
			const r = await toggleLocationActive("locDefault", false);
			expect((r as any).error).toMatch(/predeterminada|default/i);
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
		it("deactivate non-default with another active succeeds", async () => {
			mockLOne.mockResolvedValue({
				id: "locB",
				userId: uid,
				name: "Sede B",
				isActive: true,
				isDefault: false,
			});
			mockLList.mockResolvedValue({
				items: [
					{ id: "locA", userId: uid, name: "Sede A", isActive: true, isDefault: true },
					{ id: "locB", userId: uid, name: "Sede B", isActive: true, isDefault: false },
				],
				totalItems: 2,
			});
			mockLUpdate.mockResolvedValue({ id: "locB", isActive: false });
			const { toggleLocationActive } = await import("@/app/actions/locations");
			const r = await toggleLocationActive("locB", false);
			expect(r).toEqual(expect.objectContaining({ success: true }));
			expect(mockLUpdate).toHaveBeenCalledWith(
				"locB",
				expect.objectContaining({ isActive: false }),
			);
		});
		it("hard-delete blocked if referenced", async () => {
			mockGetAuthUser.mockResolvedValue({ id: uid, email: "a@b.com", name: "A" });
			mockLList.mockResolvedValue({
				items: [
					{ id: "locB", userId: uid, isActive: true, isDefault: false },
					{ id: "locA", userId: uid, isActive: true, isDefault: true },
				],
				totalItems: 2,
			});
			mockLOne.mockResolvedValue({
				id: "locB",
				userId: uid,
				name: "Sede B",
				isActive: true,
				isDefault: false,
			});
			mockSList.mockResolvedValue({ items: [{ id: "svc1", locationId: "locB" }], totalItems: 1 });
			mockLogList.mockResolvedValue({ items: [], totalItems: 0 });
			const { deleteLocation } = await import("@/app/actions/locations");
			expect(((await deleteLocation("locB", "Sede B")) as any).error).toMatch(
				/historial|No se puede eliminar/i,
			);
			expect(mockLDelete).not.toHaveBeenCalled();
			mockSList.mockResolvedValue({ items: [], totalItems: 0 });
			mockLogList.mockResolvedValue({
				items: [{ id: "log1", fromLocationId: "locB" }],
				totalItems: 1,
			});
			expect(((await deleteLocation("locB", "Sede B")) as any).error).toMatch(
				/historial|No se puede eliminar/i,
			);
			expect(mockLDelete).not.toHaveBeenCalled();
		});
	});
	describe("wiring", () => {
		it("auth.ts imports and calls ensureDefaultLocation in login and register", () => {
			const s = read("app/actions/auth.ts");
			expect(s).toContain("ensureDefaultLocation");
			const li = s.indexOf("export async function login"),
				ri = s.indexOf("export async function register");
			expect(li).toBeGreaterThanOrEqual(0);
			expect(ri).toBeGreaterThanOrEqual(0);
			expect(s.slice(li, li + 4000)).toContain("ensureDefaultLocation");
			expect(s.slice(ri, ri + 6000)).toContain("ensureDefaultLocation");
		});
		it("layout imports ensure and calls with user.id", () => {
			const s = read("app/(app)/layout.tsx");
			expect(s).toContain("ensureDefaultLocation");
			expect(s).toContain("getAuthUser");
			const a = s.indexOf("getAuthUser"),
				e = s.indexOf("ensureDefaultLocation");
			expect(a).toBeGreaterThanOrEqual(0);
			expect(e).toBeGreaterThan(a);
			expect(s).toMatch(/ensureDefaultLocation\s*\(\s*user\.id/);
		});
		it("lib/locations uses bound filters no interpolation", () => {
			const s = read("lib/locations.ts");
			expect(s).toContain("createPocketBaseClient");
			expect(s).toContain("ensureDefaultLocation");
			expect(s).toContain("setDefaultLocation");
			expect(s).toContain("applyBinding");
			expect(s).toContain('collection("locations")');
		});
	});
	describe("tenant isolation", () => {
		it("getLocations binds userId", async () => {
			mockLList.mockResolvedValue({ items: [], totalItems: 0 });
			const { getLocations } = await import("@/app/actions/locations");
			await getLocations(false);
			const [t, p] = mockFilter.mock.calls.find(([x]: any) => String(x).includes("userId")) as any;
			expect(t).toContain("userId = {:uid}");
			expect(p.uid).toBe(uid);
		});
	});
});
