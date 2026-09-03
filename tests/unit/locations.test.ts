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
describe("Location invariants — at least one active, no default role (Unit 7)", () => {
	beforeEach(reset);
	describe("schema", () => {
		it("has isActive bool default true and no isDefault", () => {
			const { cols } = load() as any;
			const loc = cols.find((c: any) => c.name === "locations");
			const f = (loc.fields ?? loc.schema).find((x: any) => x.name === "isActive");
			expect(f).toBeDefined();
			expect(f.type).toBe("bool");
			const noDefault = (loc.fields ?? loc.schema).find((x: any) => x.name === "isDefault");
			expect(noDefault).toBeUndefined();
		});
		it("indexes cover userId and isActive, no isDefault unique", () => {
			const { cols } = load() as any;
			const r = read("pocketbase/v1.collections.json");
			const loc = cols.find((c: any) => c.name === "locations");
			const idxs: string[] = loc.indexes ?? [];
			expect(idxs.some((i) => i.includes("userId"))).toBe(true);
			expect(idxs.some((i) => i.includes("isActive"))).toBe(true);
			expect(r).not.toContain("isDefault");
			expect(r).not.toMatch(/WHERE.*isDefault/i);
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
	describe("ensureAtLeastOneLocation idempotent", () => {
		it("zero → creates Sede Principal active", async () => {
			mockLList.mockResolvedValue({ items: [], totalItems: 0 });
			mockLCreate.mockResolvedValue({ id: "pb15loc00000001" });
			const { ensureAtLeastOneLocation } = await import("@/lib/locations");
			await ensureAtLeastOneLocation(uid);
			expect(mockLCreate).toHaveBeenCalledTimes(1);
			const arg = mockLCreate.mock.calls[0][0] as any;
			expect(arg.userId).toBe(uid);
			expect(arg.isActive).toBe(true);
			expect(arg.isDefault).toBeUndefined();
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
			const { ensureAtLeastOneLocation } = await import("@/lib/locations");
			await ensureAtLeastOneLocation(uid);
			expect(mockLCreate).not.toHaveBeenCalled();
			expect(mockLUpdate).not.toHaveBeenCalled();
		});
		it("already one active no-op", async () => {
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

describe("Locations rhythm and shared shell (Unit 3 RED)", () => {
	it("Locations title is text-2xl font-semibold tracking-tight, not text-xl font-bold", () => {
		const src = read("app/(app)/locations/locationsManager.tsx");
		expect(src).toMatch(
			/<h1[^>]*text-2xl[^>]*font-semibold[^>]*tracking-tight[^>]*>\s*Gestión de Sedes/,
		);
		expect(src).not.toMatch(/<h1[^>]*text-xl[^>]*font-bold/);
		expect(src).toContain("Gestión de Sedes");
		// header band gap-4 mb-6
		expect(src).toMatch(/gap-4/);
		expect(src).toMatch(/mb-6/);
	});

	it("Locations toolbar is border-y bg-surface/50 px-4 py-3 shared operate band, not card", () => {
		const src = read("app/(app)/locations/locationsManager.tsx");
		expect(src).toContain("border-y");
		expect(src).toContain("bg-surface/50");
		expect(src).toContain("px-4");
		expect(src).toContain("py-3");
		// should not be card with shadow-sm p-4 rounded-sm mb-6 as isolated card
		expect(src).not.toMatch(/bg-surface border border-border shadow-sm p-4 mb-6/);
		// should be flex with gap and border-y band
		expect(src).toMatch(/border-y[^"]*bg-surface\/50[^"]*px-4[^"]*py-3/);
	});

	it("Locations inherits shell max-w-7xl 2xl:max-w-[1600px] via layout, no per-page max widths", () => {
		const layout = read("app/(app)/layout.tsx");
		const navbar = read("components/layout/Navbar.tsx");
		const locPage = read("app/(app)/locations/page.tsx");
		const locManager = read("app/(app)/locations/locationsManager.tsx");
		// shell has 2xl
		expect(layout).toContain("max-w-7xl");
		expect(layout).toContain("2xl:max-w-[1600px]");
		expect(navbar).toContain("2xl:max-w-[1600px]");
		// locations page/manager should not duplicate shell widths
		expect(locPage).not.toContain("max-w-7xl");
		expect(locPage).not.toContain("2xl:max-w");
		expect(locManager).not.toContain("max-w-7xl");
		expect(locManager).not.toContain("2xl:max-w");
	});
});
