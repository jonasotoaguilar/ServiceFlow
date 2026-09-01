import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";

// Helpers
function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

// Mock next/navigation for Navbar rendering
vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard",
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	redirect: vi.fn(),
}));

describe("Shell layout — app/(app)/layout.tsx shared chrome (Unit 2 2.1 RED)", () => {
	it("app/(app)/layout.tsx exists and is a server layout", () => {
		expect(exists("app/(app)/layout.tsx")).toBe(true);
		const src = read("app/(app)/layout.tsx");
		expect(src.length).toBeGreaterThan(50);
		// must be async server component
		expect(src).toMatch(/export default async function|export default function/);
	});

	it("wraps in min-h-dvh, renders Navbar directly, then main with max-w-7xl gutters py-8", () => {
		const src = read("app/(app)/layout.tsx");
		// min-h-dvh viewport filling container per spec
		expect(src).toContain("min-h-dvh");
		expect(src).not.toContain("min-h-screen");
		// must import Navbar from correct path
		expect(src).toContain("components/layout/Navbar");
		expect(src).not.toContain('from "@/components/Navbar"');
		expect(src).not.toContain("from '@/components/Navbar'");
		// Navbar rendered
		expect(src).toMatch(/<Navbar/);
		// main gutters exactly px-4 sm:px-6 lg:px-8 py-8 and max-w-7xl
		expect(src).toContain("max-w-7xl");
		expect(src).toContain("px-4");
		expect(src).toContain("sm:px-6");
		expect(src).toContain("lg:px-8");
		expect(src).toContain("py-8");
		// main must be max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
		expect(src).toMatch(/<main[^>]*max-w-7xl[^>]*mx-auto[^>]*px-4/);
	});

	it("main gutters triangulation — Navbar inner row and main share same max-w-7xl gutters", () => {
		const layout = read("app/(app)/layout.tsx");
		const navbar = read("components/layout/Navbar.tsx");
		// Layout main
		expect(layout).toMatch(/max-w-7xl[^>]*mx-auto[^>]*px-4[^>]*sm:px-6[^>]*lg:px-8/);
		// Navbar inner container also max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
		expect(navbar).toMatch(/max-w-7xl[^"]*mx-auto[^"]*px-4[^"]*sm:px-6[^"]*lg:px-8/);
		// Both have py perspective: layout main has py-8, navbar row has h-16 (65px total with border)
		expect(layout).toContain("py-8");
		expect(navbar).toContain("h-16");
	});

	it("auth gate: imports getAuthUser and redirect, redirects to /login when null", () => {
		const src = read("app/(app)/layout.tsx");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('from "@/lib/auth"');
		expect(src).toContain("redirect");
		expect(src).toContain('from "next/navigation"');
		expect(src).toContain('redirect("/login")');
		expect(src).toMatch(/getAuthUser\(\)[\s\S]*?if\s*\(\s*!user\s*\)[\s\S]*?redirect/);
	});

	it("calls ensureDefaultLocation — Unit 7 default-location invariant", () => {
		const src = read("app/(app)/layout.tsx");
		expect(src).toContain("ensureDefaultLocation");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('redirect("/login")');
		expect(src).toMatch(/ensureDefaultLocation\s*\(\s*user\.id/);
	});

	it("layout does not wrap shell in extra p-4 md:p-8 frame (triangulate auth gate second case)", () => {
		const src = read("app/(app)/layout.tsx");
		// Layout itself should not have extra p-4 md:p-8 outer wrapper beyond main gutters
		// It should have single min-h-dvh wrapper + Navbar + main
		expect(src).not.toMatch(/p-4 md:p-8/);
		// Should have bg-background on shell container
		expect(src).toContain("bg-background");
	});
});

describe("Navbar geometry — top0 65px (h-16 + border) and no glass", () => {
	it("header is sticky top-0 with border-b h-16 and no backdrop-blur/glass", () => {
		const src = read("components/layout/Navbar.tsx");
		// Must be sticky top-0
		expect(src).toContain("sticky");
		expect(src).toContain("top-0");
		// Must have h-16 (64px) plus border-b (1px) = 65px total
		expect(src).toContain("h-16");
		expect(src).toContain("border-b");
		// Must NOT have glass/blurs — Taller Claro light
		expect(src).not.toContain("backdrop-blur");
		expect(src).not.toContain("backdrop-blur-md");
		expect(src).not.toContain("backdrop-blur-xl");
		expect(src).not.toContain("glass-card");
		expect(src).not.toContain("glass-effect");
		expect(src).not.toContain("bg-background/50");
		expect(src).not.toContain("bg-white/5");
		expect(src).not.toContain("bg-slate-900/95");
		// Should use Taller tokens: bg-surface or bg-background solid, border-border
		expect(src).toMatch(/bg-surface|bg-background/);
		expect(src).toMatch(/border-border|border-b/);
	});

	it("inner row and layout main share max-w-7xl and gutters px-4 sm:px-6 lg:px-8 (triangulate second Navbar geometry case)", () => {
		const navbar = read("components/layout/Navbar.tsx");
		// Check gutters explicit
		expect(navbar).toContain("max-w-7xl");
		expect(navbar).toContain("mx-auto");
		expect(navbar).toContain("px-4");
		expect(navbar).toContain("sm:px-6");
		expect(navbar).toContain("lg:px-8");
		// Ensure header class ordering is not broken: should have flex justify-between items-center h-16 inside max-w-7xl
		expect(navbar).toMatch(/max-w-7xl[\s\S]*?flex[\s\S]*?h-16/);
	});

	it("mobile menu top aligns to header bottom (top-16) and uses surface tokens", () => {
		const src = read("components/layout/Navbar.tsx");
		expect(src).toContain("top-16");
		// mobile menu should be absolute top-16 left-0 right-0
		expect(src).toMatch(/top-16[\s\S]*?left-0[\s\S]*?right-0|absolute[\s\S]*?top-16/);
		// Should NOT use dark slate tokens
		expect(src).not.toContain("bg-slate-800");
		expect(src).not.toContain("bg-slate-900");
		expect(src).not.toContain("text-slate-400");
		// text-white banned except for on-primary logo — check not used for nav items
		expect(src).not.toContain("hover:text-white");
		expect(src).not.toContain("group-hover:text-white");
		// Should use Taller foreground tokens
		expect(src).toMatch(/text-foreground|text-foreground-muted/);
	});

	it("header geometry second triangulation — header has z-40 and Navbar is direct child of min-h-dvh", () => {
		const layout = read("app/(app)/layout.tsx");
		const navbar = read("components/layout/Navbar.tsx");
		// Navbar header should have z-40 for overlay
		expect(navbar).toContain("z-40");
		// Layout should have Navbar as direct child of min-h-dvh container, then main
		expect(layout).toMatch(/min-h-dvh[\s\S]*?<Navbar[\s\S]*?<main/);
	});
});

describe("Hard-rename /locationLogs → /service-events (Unit 2 2.1 RED)", () => {
	it("Navbar href and label is /service-events Registro, not /locationLogs Movimientos (file content)", () => {
		const src = read("components/layout/Navbar.tsx");
		expect(src).toContain('href="/service-events"');
		expect(src).toContain("Registro");
		expect(src).not.toContain('href="/locationLogs"');
		expect(src).not.toContain("Movimientos");
		expect(src).not.toContain("/locationLogs");
	});

	it("Navbar Registro appears in both desktop and mobile nav (triangulate href count)", () => {
		const src = read("components/layout/Navbar.tsx");
		const matches = (src.match(/href="\/service-events"/g) || []).length;
		// Should have at least 2 occurrences: desktop + mobile
		expect(matches).toBeGreaterThanOrEqual(2);
		const labelMatches = (src.match(/Registro/g) || []).length;
		expect(labelMatches).toBeGreaterThanOrEqual(2);
		// isActive should check /service-events
		expect(src).toContain('isActive("/service-events")');
		expect(src).not.toContain('isActive("/locationLogs")');
	});

	it("Navbar renders Registro link with href /service-events (behavioral)", async () => {
		const { Navbar } = await import("@/components/layout/Navbar");
		render(React.createElement(Navbar as any, { user: { name: "Test", email: "t@t.com" } }));
		// Should have two Registro links (desktop + mobile hidden? mobile is conditional but href exists in source)
		// At least desktop link visible
		const link = screen.getByRole("link", { name: "Registro" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/service-events");
		// Movimientos must NOT exist
		expect(screen.queryByText("Movimientos")).not.toBeInTheDocument();
		expect(screen.queryByText("Movimientos")?.getAttribute?.("href")).toBeUndefined();
	});

	it("filesystem hard-rename: old app/locationLogs does NOT exist, new app/(app)/service-events exists", () => {
		expect(exists("app/locationLogs")).toBe(false);
		expect(exists("app/locationLogs/page.tsx")).toBe(false);
		expect(exists("app/(app)/service-events")).toBe(true);
		expect(exists("app/(app)/service-events/page.tsx")).toBe(true);
		const registroPage = read("app/(app)/service-events/page.tsx");
		// Registro page heading should say Registro, not Movimientos
		expect(registroPage).toMatch(/Registro/);
		expect(registroPage).not.toContain("Movimientos");
		// Should NOT contain old import path
		expect(registroPage).not.toContain("locationLogs");
	});

	it("registro page keeps tenant isolation: getAuthUser + redirect + tenant-bound data (triangulate second registro case)", () => {
		const src = read("app/(app)/service-events/page.tsx");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('redirect("/login")');
		// Should fetch logs and locations
		expect(src).toMatch(/getServiceEvents|getLocations/);
		// Should import LogsManager from relative
		expect(src).toMatch(/ServiceEventsManager|serviceEventsManager/);
	});

	it("old app/dashboard and app/locations removed, new app/(app)/dashboard and app/(app)/locations exist", () => {
		expect(exists("app/dashboard")).toBe(false);
		expect(exists("app/dashboard/page.tsx")).toBe(false);
		expect(exists("app/locations")).toBe(false);
		expect(exists("app/locations/page.tsx")).toBe(false);
		expect(exists("app/(app)/dashboard")).toBe(true);
		expect(exists("app/(app)/dashboard/page.tsx")).toBe(true);
		expect(exists("app/(app)/locations")).toBe(true);
		expect(exists("app/(app)/locations/page.tsx")).toBe(true);
	});

	it("no stale /locationLogs references remain in app or components (except legacy .next)", () => {
		const candidates = [
			"components/layout/Navbar.tsx",
			"app/(app)/layout.tsx",
			"app/(app)/dashboard/page.tsx",
			"app/(app)/locations/page.tsx",
			"app/(app)/service-events/page.tsx",
		];
		for (const rel of candidates) {
			if (!exists(rel)) continue;
			const src = read(rel);
			expect(src).not.toContain("/locationLogs");
			expect(src).not.toContain("Movimientos");
		}
	});
});

describe("Dashboard 32px displacement removed — no extra p-4 md:p-8 wrappers", () => {
	it("app/(app)/dashboard/page.tsx has no outer p-4 md:p-8 and drops Navbar/min-h-screen", () => {
		const src = read("app/(app)/dashboard/page.tsx");
		expect(src).not.toContain("p-4 md:p-8");
		expect(src).not.toContain("p-4");
		expect(src).not.toContain("Navbar");
		expect(src).not.toContain("min-h-screen");
		expect(src).not.toContain("min-h-dvh");
		// Should NOT have max-w-7xl wrapper — shell provides it
		expect(src).not.toContain("max-w-7xl");
		// Should still fetch services with getServices and getAuthUser
		expect(src).toContain("getServices");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('redirect("/login")');
		// Should render ServiceDashboard without outer main decoration
		expect(src).toMatch(/<ServiceDashboard|ServiceDashboard/);
	});

	it("app/(app)/locations/page.tsx drops Navbar and min-h-screen (triangulate second no-wrapper case)", () => {
		const src = read("app/(app)/locations/page.tsx");
		expect(src).not.toContain("Navbar");
		expect(src).not.toContain("min-h-screen");
		expect(src).not.toContain("min-h-dvh");
		expect(src).not.toContain("p-4 md:p-8");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('redirect("/login")');
		expect(src).toContain("getLocations");
		expect(src).toMatch(/LocationsManager/);
	});

	it("app/(app)/service-events/page.tsx drops Navbar and min-h-screen (triangulate third no-wrapper case)", () => {
		const src = read("app/(app)/service-events/page.tsx");
		expect(src).not.toContain("Navbar");
		expect(src).not.toContain("min-h-screen");
		expect(src).not.toContain("min-h-dvh");
		expect(src).not.toContain("p-4 md:p-8");
		expect(src).toContain("getAuthUser");
		expect(src).toContain('redirect("/login")');
	});

	it("ServicesDashboard no longer owns Navbar or min-h-screen wrapper — shell owns chrome", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		// Should NOT import or render Navbar
		expect(src).not.toContain('from "@/components/layout/Navbar"');
		expect(src).not.toContain("<Navbar");
		// Should NOT have min-h-screen outer
		expect(src).not.toContain("min-h-screen");
		// Should NOT be wrapped in glass-card legacy
		// But keep main stats logic — ensure it still has stats calculations
		expect(src).toContain("pending");
	});

	it("Navbar.tsx path is components/layout/Navbar.tsx (not components/Navbar.tsx)", () => {
		expect(exists("components/layout/Navbar.tsx")).toBe(true);
		expect(exists("components/Navbar.tsx")).toBe(false);
		// All imports should use layout path
		const layout = read("app/(app)/layout.tsx");
		expect(layout).toContain("components/layout/Navbar");
		const dash = read("app/(app)/dashboard/page.tsx");
		// dash should not import Navbar at all, but if it did, must be correct path
		if (dash.includes("Navbar")) {
			expect(dash).toContain("components/layout/Navbar");
		}
	});
});
