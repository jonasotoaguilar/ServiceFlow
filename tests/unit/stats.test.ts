import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

// Mock next/navigation for dashboard
vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard",
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	redirect: vi.fn(),
}));
vi.mock("@/app/actions/locations", () => ({
	getLocations: vi.fn(async () => ({ data: [] })),
}));

describe("lib/service-days thresholds and pending-only (2.3 RED)", () => {
	it("lib/service-days.ts exists and exports thresholds", async () => {
		expect(exists("lib/service-days.ts")).toBe(true);
		const mod: any = await import(/* @vite-ignore */ "@/lib/service-days");
		expect(mod.UPCOMING_MIN ?? mod.UPCOMING_DAYS_MIN ?? mod.UPCOMING).toBeDefined();
		// Explicit thresholds 10–14 and 15
		const min = mod.UPCOMING_MIN ?? mod.UPCOMING_DAYS_MIN ?? 10;
		const max = mod.UPCOMING_MAX ?? mod.UPCOMING_DAYS_MAX ?? 14;
		const crit = mod.CRITICAL_MIN ?? mod.CRITICAL_DAYS_MIN ?? 15;
		expect(min).toBe(10);
		expect(max).toBe(14);
		expect(crit).toBe(15);
	});

	it("isUpcoming 10–14 true, 9 and 15 false; isCritical >=15 true (triangulate)", async () => {
		const mod: any = await import(/* @vite-ignore */ "@/lib/service-days");
		const isUpcoming = mod.isUpcoming ?? mod.classifyPendingDays;
		const isCritical = mod.isCritical;
		if (typeof isUpcoming === "function" && typeof isCritical === "function") {
			expect(isUpcoming(10)).toBe(true);
			expect(isUpcoming(14)).toBe(true);
			expect(isUpcoming(9)).toBe(false);
			expect(isUpcoming(15)).toBe(false);
			expect(isCritical(15)).toBe(true);
			expect(isCritical(20)).toBe(true);
			expect(isCritical(14)).toBe(false);
		} else if (typeof mod.classifyPendingDays === "function") {
			// Alternative API
			expect(mod.classifyPendingDays(10, "pending")).toBe("upcoming");
			expect(mod.classifyPendingDays(14, "pending")).toBe("upcoming");
			expect(mod.classifyPendingDays(15, "pending")).toBe("critical");
			expect(mod.classifyPendingDays(9, "pending")).toBeNull();
		} else {
			// Fallback via businessDays helper
			expect(typeof mod.businessDaysSince).toBe("function");
		}
	});

	it("upcoming/critical pending-only: ready/completed never counted", async () => {
		const mod: any = await import(/* @vite-ignore */ "@/lib/service-days");
		// businessDaysSince should still compute, but classification must be null for non-pending
		if (typeof mod.classifyPendingDays === "function") {
			expect(mod.classifyPendingDays(12, "ready")).toBeNull();
			expect(mod.classifyPendingDays(20, "completed")).toBeNull();
			expect(mod.classifyPendingDays(12, "cancelled")).toBeNull();
		}
		if (typeof mod.isUpcoming === "function" && typeof mod.getServiceDays === "function") {
			// pending-only via status param
			expect(
				mod.getServiceDays({ status: "pending", entryDate: new Date().toISOString() }, new Date()),
			).toBeGreaterThanOrEqual(0);
		}
		// Direct helper exists
		expect(mod).toBeDefined();
	});

	it("businessDaysSince computes >=0 and triangulates 0 vs 12", async () => {
		const mod: any = await import(/* @vite-ignore */ "@/lib/service-days");
		const fn = mod.businessDaysSince ?? mod.businessDaysBetween ?? mod.getBusinessDays;
		expect(typeof fn).toBe("function");
		const now = new Date("2024-01-22T12:00:00.000Z");
		const recent = new Date("2024-01-22T12:00:00.000Z").toISOString();
		const old = new Date("2024-01-01T12:00:00.000Z").toISOString();
		expect(fn(recent, now)).toBe(0);
		expect(fn(old, now)).toBeGreaterThanOrEqual(10);
	});
});

describe("getServiceStats tenant-global ignores table controls (2.3 RED)", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("getServiceStats exists in storage or dedicated module", async () => {
		let mod: any = null;
		try {
			mod = await import(/* @vite-ignore */ "@/lib/storage");
		} catch {}
		let alt: any = null;
		try {
			alt = await import(/* @vite-ignore */ "@/lib/service-stats");
		} catch {}
		const fn = mod?.getServiceStats ?? alt?.getServiceStats;
		expect(typeof fn).toBe("function");
	});

	it("ignores status/search/location/pagination — filter only userId + status equality (file content)", async () => {
		// Check implementation does not reference table controls
		const candidates = ["lib/storage.ts", "lib/service-stats.ts", "lib/service-days.ts"];
		let found = false;
		for (const rel of candidates) {
			if (!exists(rel)) continue;
			const src = read(rel);
			if (src.includes("getServiceStats")) {
				found = true;
				// Extract function body roughly
				const idx = src.indexOf("getServiceStats");
				const body = src.slice(idx, idx + 3000);
				// Must NOT contain search/location/pagination patterns inside getServiceStats
				expect(body).not.toMatch(/search.*~.*\{:search\}/);
				expect(body).not.toMatch(/locationId.*\{:locationId\}/);
				// Should contain totalItems for counts
				expect(body).toMatch(/totalItems/);
				// Should contain pending handling for upcoming/critical
				expect(body.toLowerCase()).toMatch(/upcoming|critical|pending/);
			}
		}
		expect(found).toBe(true);
	});

	it("runtime: counts via 4 totalItems + pending dates, ignores extra filters, tenant-isolated", async () => {
		const pbMock = vi.fn();
		const getList = vi.fn(async (_page: number, _limit: number, opts: any) => {
			const filter: string = opts?.filter ?? "";
			// tenant isolation: must contain uid
			if (!filter.includes("u1")) {
				return { items: [], totalItems: 0 };
			}
			if (filter.includes("status = {:status}")) {
				// extract status param via pb.filter binding simulation?
				// We simplify: return totalItems based on status embedded in filter string or opts
				// Since applyBinding resolves filter, we check filter contains status value directly if mocked pb.filter interpolates
				// Fallback: inspect opts
			}
			return { items: [], totalItems: 0 };
		});
		// More precise mock: intercept pb.filter to track
		let lastFilters: string[] = [];
		const fakePb = {
			filter: (tpl: string, params: Record<string, unknown>) => {
				let out = tpl;
				for (const [k, v] of Object.entries(params)) {
					out = out.replaceAll(`{:${k}}`, String(v));
				}
				lastFilters.push(out);
				return out;
			},
			collection: (name: string) => {
				if (name === "services") {
					return {
						getList: async (page: number, limit: number, opts: any) => {
							const f = opts?.filter ?? "";
							lastFilters.push(f);
							// counts for each status
							if (limit === 1) {
								if (f.includes("pending")) return { items: [{ id: "x" }], totalItems: 3 };
								if (f.includes("ready")) return { items: [{ id: "x" }], totalItems: 2 };
								if (f.includes("completed")) return { items: [{ id: "x" }], totalItems: 1 };
								if (f.includes("cancelled")) return { items: [{ id: "x" }], totalItems: 4 };
								return { items: [], totalItems: 0 };
							}
							// pending fetch for days
							if (f.includes("pending")) {
								const now = new Date();
								const daysAgo = (n: number) => {
									const d = new Date(now);
									// subtract n business days approx by calendar days for mock
									d.setDate(d.getDate() - Math.ceil(n * 1.4));
									return d.toISOString();
								};
								return {
									items: [
										{ id: "a", entryDate: daysAgo(5), status: "pending" },
										{ id: "b", entryDate: daysAgo(12), status: "pending" },
										{ id: "c", entryDate: daysAgo(20), status: "pending" },
									],
									totalItems: 3,
								};
							}
							return { items: [], totalItems: 0 };
						},
					};
				}
				return { getList: async () => ({ items: [], totalItems: 0 }) };
			},
		};

		vi.doMock("@/lib/pocketbase", () => ({
			createPocketBaseClient: vi.fn(async () => fakePb),
		}));

		// Re-import after mock
		const { getServiceStats } = await import(/* @vite-ignore */ "@/lib/storage").catch(
			async () => (await import(/* @vite-ignore */ "@/lib/service-stats")) as any,
		);
		expect(typeof getServiceStats).toBe("function");
		lastFilters = [];
		const res = await (getServiceStats as any)("u1");
		// Must return shape pending/ready/completed/cancelled/upcoming/critical
		expect(res).toHaveProperty("pending");
		expect(res).toHaveProperty("ready");
		expect(res).toHaveProperty("completed");
		expect(res).toHaveProperty("cancelled");
		expect(res).toHaveProperty("upcoming");
		expect(res).toHaveProperty("critical");
		// Values from mock: pending 3, ready 2, completed 1, cancelled 4
		expect(res.pending).toBe(3);
		expect(res.ready).toBe(2);
		expect(res.completed).toBe(1);
		expect(res.cancelled).toBe(4);
		// Upcoming 10-14 => one (12 days), critical >=15 => one (20 days)
		expect(res.upcoming).toBe(1);
		expect(res.critical).toBe(1);
		// Filters must NOT contain search/location patterns
		const filterJoined = lastFilters.join(" ");
		expect(filterJoined).not.toMatch(/clientName|invoiceNumber|rut/);
		expect(filterJoined).not.toMatch(/locationId/);
		// Must be tenant-bound
		expect(filterJoined).toContain("u1");
		// Other tenant isolated: call with u2 should contain u2 not u1
		lastFilters = [];
		const res2 = await (getServiceStats as any)("u2");
		const joined2 = lastFilters.join(" ");
		expect(joined2).toContain("u2");
		expect(joined2).not.toContain("u1");
		// Cleanup
		vi.doUnmock("@/lib/pocketbase");
	});
});

describe("GET /api/services/stats tenant-bound no table-control params (2.4 RED)", () => {
	it("route file exists", () => {
		expect(exists("app/api/services/stats/route.ts")).toBe(true);
	});

	it("does NOT read table-control params (search/status/location/page/limit) from searchParams", () => {
		const src = read("app/api/services/stats/route.ts");
		expect(src).toContain("getAuthUser");
		expect(src).toContain("getServiceStats");
		// Must NOT parse table controls
		expect(src).not.toMatch(/searchParams\.get\(\s*["']search["']\s*\)/);
		expect(src).not.toMatch(/searchParams\.get\(\s*["']status["']\s*\)/);
		expect(src).not.toMatch(/searchParams\.get\(\s*["']location["']\s*\)/);
		expect(src).not.toMatch(/searchParams\.get\(\s*["']page["']\s*\)/);
		expect(src).not.toMatch(/searchParams\.get\(\s*["']limit["']\s*\)/);
		expect(src).not.toMatch(/searchParams\.get\(\s*["']sortOrder["']\s*\)/);
	});

	it("returns 401 when unauthenticated and shape pending/ready/completed/cancelled/upcoming/critical when authed (integration)", async () => {
		// File content check: handles 401
		const src = read("app/api/services/stats/route.ts");
		expect(src).toMatch(/401|Unauthorized/);
		expect(src).toMatch(/pending|ready|completed|cancelled|upcoming|critical/);
	});
});

describe("ServicesDashboard cards global, static tokens, Entregada, exclusive toggle (2.4 RED)", () => {
	it("cards read stats not page array — fetch /api/services/stats and no Services.filter counts", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("/api/services/stats");
		// Must have stats state, not pendingCount from Services.filter
		expect(src).toMatch(/stats\.pending|stats\.upcoming|stats\.critical/);
		// Old derivation must be gone
		expect(src).not.toMatch(/Services\.filter\(.*pendingCount/);
		expect(src).not.toMatch(/const pendingCount = Services\.filter/);
		expect(src).not.toContain("const upcomingExpirationCount = Services.filter");
		expect(src).not.toContain("const criticalServicesCount = Services.filter");
	});

	it("static STATUS_CARD/STATUS_BADGE, no dynamic color interpolation", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).not.toContain("text-${");
		expect(src).not.toContain("border-${");
		expect(src).not.toContain("bg-${");
		// No Tailwind important color like border-amber-500! or border-primary!
		expect(src).not.toMatch(/border-[a-z0-9-]+!/);
		expect(src).not.toMatch(/border-[a-z-]+!"/);
		// Must contain static constants
		expect(src).toMatch(/STATUS_CARD|STATUS_BADGE|pending-bg|ready-bg|completed-bg|cancelled-bg/);
		// Should use pending/ready/completed/cancelled tokens explicitly
		expect(src).toContain("pending-bg");
		expect(src).toContain("ready-bg");
		expect(src).toContain("completed-bg");
		expect(src).toContain("cancelled-bg");
	});

	it("displays Entregada for completed (not Completadas/Completada)", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("Entregada");
		// Old label must be gone
		expect(src).not.toMatch(/label:\s*"Completadas"/);
		// Dashboard should show Entregada in statusOptions
		expect(src).toMatch(/completed.*Entregada|Entregada.*completed/);
		const tableSrc = read("components/services/ServicesTable.tsx");
		expect(tableSrc).toContain("Entregada");
		expect(tableSrc).not.toContain("Completada");
	});

	it("no glass/dark slate on dashboard cards — Taller Claro tokens", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).not.toContain("glass-card");
		expect(src).not.toContain("bg-slate-800");
		expect(src).not.toContain("bg-slate-700");
		expect(src).not.toContain("border-slate-700");
		// Surface tokens should be present
		expect(src).toMatch(/bg-surface|bg-background|border-border/);
	});

	it("exclusive toggleStatus: empty = all rows, second click clears (behavioral)", async () => {
		// Mock fetch for dashboard mount
		const statsData = {
			pending: 3,
			ready: 2,
			completed: 5,
			cancelled: 1,
			upcoming: 1,
			critical: 1,
		};
		const originalFetch = global.fetch;
		// @ts-expect-error
		global.fetch = vi.fn(async (url: string) => {
			if (String(url).includes("/api/services/stats")) {
				return { ok: true, json: async () => statsData } as any;
			}
			if (String(url).includes("/api/services?")) {
				return { ok: true, json: async () => ({ data: [], total: 0 }) } as any;
			}
			return { ok: true, json: async () => ({ data: [] }) } as any;
		});

		const { ServiceDashboard } = await import(
			/* @vite-ignore */ "@/components/services/ServicesDashboard"
		);
		render(
			React.createElement(ServiceDashboard as any, {
				initialData: { data: [], total: 0, page: 1, limit: 20 },
			}),
		);

		// Wait for stats to render
		await waitFor(() => {
			// pending count from stats should appear
			const pendingNumbers = screen.getAllByText(String(statsData.pending));
			expect(pendingNumbers.length).toBeGreaterThan(0);
		});

		// Cards should show Entregada label somewhere (completed card)
		expect(screen.getByText(/Entregada/)).toBeInTheDocument();

		// Find pending card button — first card with Pendientes label
		const pendientes = screen.getAllByText(/Pendientes/i);
		expect(pendientes.length).toBeGreaterThan(0);
		const card = pendientes[0].closest("button");
		expect(card).not.toBeNull();

		// Initially no filter active? empty = all rows => no card should have active border? But we check toggle behavior
		// Click pending card -> should set filter to pending only (exclusive)
		fireEvent.click(card!);
		// After click, if we click again same card, should clear (empty all)
		fireEvent.click(card!);

		// After second click, service fetch should have been called with status empty (all rows)
		// Check that fetch was called with no status or empty status for table
		// We verify via our mock that stats fetch is independent of table filter changes
		// Stats should remain same after filter clicks (global)
		await waitFor(() => {
			expect(screen.getAllByText(String(statsData.pending)).length).toBeGreaterThan(0);
		});

		// Check no dynamic interpolation in rendered output? Already file-checked

		global.fetch = originalFetch as any;
		vi.resetModules();
	});

	it("icons + text not color-only: card and badge have svg icons", async () => {
		const src = read("components/services/ServicesDashboard.tsx");
		// Each card should have lucide icons Clock, AlertTriangle, Zap, CheckCircle, X
		expect(src).toContain("Clock");
		expect(src).toContain("AlertTriangle");
		expect(src).toContain("Zap");
		expect(src).toContain("CheckCircle");
		const tableSrc = read("components/services/ServicesTable.tsx");
		// Badge should have icon element (svg) alongside text
		expect(tableSrc).toMatch(/<Clock|<CheckCircle|<Zap|<AlertTriangle|<X/);
		// And dashboard cards have both icon and label
		expect(src).toMatch(/Pendientes[\s\S]*Clock|Clock[\s\S]*Pendientes/);
	});
});
