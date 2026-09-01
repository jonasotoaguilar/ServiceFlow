import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

describe("audit remediation — local theme (next-themes removed)", () => {
	it("package.json no longer depends on next-themes (removed, no fallback)", () => {
		const pkg = JSON.parse(read("package.json"));
		const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
		expect(deps["next-themes"], "next-themes must be removed").toBeUndefined();
	});
	it("components/theme-provider implements local context without next-themes or plain script", () => {
		const src = read("components/theme-provider.tsx");
		expect(src).not.toContain("next-themes");
		expect(src).not.toContain("NextThemesProvider");
		expect(src).not.toContain('createElement("script"');
		expect(src).toContain("ThemeContext");
		expect(src).toContain("useTheme");
		expect(src).toContain("localStorage");
		expect(src).toContain("matchMedia");
		expect(src).toContain("classList");
	});
	it("app/layout.tsx uses next/script beforeInteractive initializer for flash-free theme", () => {
		const src = read("app/layout.tsx");
		expect(src).toContain('from "next/script"');
		expect(src).toContain('strategy="beforeInteractive"');
		expect(src).toContain('id="theme-init"');
		expect(src).toContain("localStorage.getItem");
		expect(src).toContain("matchMedia");
		expect(src).toContain("document.documentElement.classList");
		expect(src).not.toContain("next-themes");
	});
	it("components/layout/Navbar uses local useTheme hook", () => {
		const src = read("components/layout/Navbar.tsx");
		expect(src).toContain("@/components/theme-provider");
		expect(src).not.toContain("next-themes");
		expect(src).toContain("useTheme");
		expect(src).toContain("resolvedTheme");
	});
});

describe("audit remediation — ServicesTable hydration deterministic", () => {
	it("calculateDays is deterministic (no inline new Date ternary, calendar-stable)", () => {
		const src = read("components/services/ServicesTable.tsx");
		expect(src).not.toMatch(/\? parseISO\(deliveryDate\) : new Date\(\)/);
		expect(src).not.toMatch(/:\s*new Date\(\)/);
		expect(src).toMatch(/calculateDays[\s\S]*?now/);
		expect(
			src.includes("now ?? start") || src.includes("now ?? parseISO"),
			"fallback to start",
		).toBe(true);
		expect(src.includes('split("T")') || src.includes("businessDaysSince"), "calendar-stable").toBe(
			true,
		);
	});
});

describe("audit remediation — KPI wording Entregadas", () => {
	it("ServicesDashboard KPI is Entregadas plural, not Reparadas / Entregada", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toMatch(/Entregadas/);
		expect(src).not.toContain("Reparadas / Entregada");
	});
});

describe("audit remediation — field affordance semantic tokens", () => {
	it("globals.css defines visible field tokens distinct from surface", () => {
		const css = read("styles/globals.css");
		expect(css).toMatch(/--color-input/);
		expect(css).toContain("--color-foreground-subtle");
		expect(css).toContain("--color-ring");
		expect(css).toMatch(/input[\s\S]*border|select[\s\S]*border|textarea[\s\S]*border/);
		expect(css).toContain("input::placeholder");
	});
});

describe("audit remediation — bones tautology replaced", () => {
	it("tests/unit/bones.test.ts has no tautology and has meaningful skeleton contract", () => {
		const src = read("tests/unit/bones.test.ts");
		expect(src).not.toContain("expect(true).toBe(true)");
		expect(src).toMatch(/skeleton|bone|data-testid|aria-busy/i);
		expect(
			exists("bones/dashboard-stats.bones.json") || exists("bones/dashboard-table.bones.json"),
			"bones json",
		).toBe(true);
	});
});

describe("audit remediation — date ISO leakage uses calendar-stable formatter", () => {
	it("ServicesTable uses formatEntryDate and calendar-stable formatter is correct", async () => {
		const src = read("components/services/ServicesTable.tsx");
		expect(src).toContain("formatEntryDate");
		const mod: any = await import("@/lib/format-date");
		const fmt = mod.formatEntryDate;
		expect(fmt("2024-01-15T00:00:00.000Z")).toBe(fmt("2024-01-15"));
		expect(fmt("2024-01-15")).toBe("15 ene 2024");
		expect(fmt("")).toBe("");
	});
	it("logsManager uses formatEntryDate for changedAt (not raw new Date format)", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(src).toContain("formatEntryDate");
		expect(src).not.toContain('from "date-fns"');
		expect(src).not.toContain("format(new Date");
	});
});
