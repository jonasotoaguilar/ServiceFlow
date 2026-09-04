import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const { mA, mL, mS, mE, mF, mC, mPB } = vi.hoisted(() => {
	const mA = vi.fn(),
		mL = vi.fn(),
		mS = vi.fn(),
		mE = vi.fn();
	const mF = vi.fn((t: string, p: any) => {
		let s = t;
		for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
		return s;
	});
	const mC = vi.fn((n: string) =>
		n === "locations" ? { getList: mL } : n === "services" ? { getList: mS } : { getList: mE },
	);
	const mPB = vi.fn(async () => ({ filter: mF, collection: mC }));
	return { mA, mL, mS, mE, mF, mC, mPB };
});
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: any) => (mA as any)(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/pocketbase", () => ({ createPocketBaseClient: (...a: any) => (mPB as any)(...a) }));
describe("Registro", () => {
	it("plain", () => {
		const s = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(s).toContain('router.push("/dashboard")');
		expect(s).not.toContain("createService");
		expect((s.match(/\{\s*page\s*\}\s*\/\s*\{\s*totalPages\s*\}/g) || []).length).toBe(0);
	});
});
describe("Metrics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mA.mockResolvedValue({ id: "uid1" });
		mL.mockResolvedValue({ items: [], totalItems: 0 });
		mS.mockResolvedValue({ items: [], totalItems: 0 });
		mE.mockResolvedValue({ items: [], totalItems: 0 });
	});
	it("counts", async () => {
		vi.resetModules();
		let m = await import("@/app/actions/locations");
		mL.mockResolvedValue({
			items: [
				{
					id: "locA",
					name: "A",
					userId: "uid1",
					isActive: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			],
			totalItems: 1,
		});
		mS.mockResolvedValue({
			items: [
				{ id: "s1", locationId: "locA", status: "pending" },
				{ id: "s2", locationId: "locA", status: "ready" },
				{ id: "s3", locationId: "locA", originLocationId: "locA", status: "completed" },
				{ id: "s4", locationId: "locA", status: "cancelled" },
			],
			totalItems: 4,
		});
		mE.mockResolvedValue({ items: [], totalItems: 0 });
		let r = await m.getLocations(false);
		expect((r.data as any[])[0].activeCount).toBe(2);
		vi.resetModules();
		m = await import("@/app/actions/locations");
		mL.mockResolvedValue({
			items: [
				{
					id: "locA",
					name: "A",
					userId: "uid1",
					isActive: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: "locB",
					name: "B",
					userId: "uid1",
					isActive: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			],
			totalItems: 2,
		});
		mS.mockResolvedValue({
			items: [{ id: "s1", locationId: "locB", originLocationId: "locA", status: "completed" }],
			totalItems: 1,
		});
		mE.mockResolvedValue({
			items: [{ fromLocationId: "locA", toLocationId: "locB" }],
			totalItems: 1,
		});
		r = await m.getLocations(false);
		expect((r.data as any[]).find((x) => x.id === "locA").completedCount).toBe(1);
		expect(read("app/actions/locations.ts")).toContain("fields");
	});
});
describe("Contracts", () => {
	it("all", () => {
		const j = JSON.parse(read("pocketbase/v1.collections.json"));
		const s = (Array.isArray(j) ? j : j.collections).find((x: any) => x.name === "services");
		expect((s.fields ?? s.schema).find((x: any) => x.name === "originLocationId")).toBeDefined();
		expect(read("lib/storage.ts")).toContain("originLocationId");
		expect(read("pb_hooks/services.pb.js")).toContain("onRecordCreateRequest");
		expect(read("pb_migrations/1756934400_backfill_origin_location.js")).toContain(
			"originLocationId",
		);
		expect(read("app/api/services/route.ts")).toContain("originLocationId");
	});
});
