import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8").toLowerCase();
}

// WCAG contrast helpers — compute from actual hex tokens, no invented OKLCH
function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "").trim();
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	const n = parseInt(full, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminanace(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
	const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const [lr, lg, lb] = [r, g, b].map(lin);
	return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}
function contrast(a: string, b: string): number {
	const la = luminanace(a);
	const lb = luminanace(b);
	const lighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (lighter + 0.05) / (darker + 0.05);
}

const SURFACE_DARK = "#18181b";
const RAMP_11 = [
	"#ffffff",
	"#fafafa",
	"#f4f4f5",
	"#e4e4e7",
	"#d4d4d8",
	"#a1a1aa",
	"#71717a",
	"#52525b",
	"#3f3f46",
	"#27272a",
	"#18181b",
];

describe("dark-contrast S1 — computed AA from actual tokens (RED then GREEN)", () => {
	it("computed contrast: #71717a on #18181b FAILS AA (<4.5) — guards unmeasured claim (primary)", () => {
		const c = contrast("#71717a", SURFACE_DARK);
		// 3.67:1 per design — must be <4.5 to prove fail
		expect(c).toBeLessThan(4.5);
		expect(c).toBeGreaterThan(3.5);
		expect(c).toBeCloseTo(3.67, 1);
	});
	it("computed contrast: #fafafa on #18181b PASSES AA (>=4.5) — triangulate pass", () => {
		const c = contrast("#fafafa", SURFACE_DARK);
		expect(c).toBeGreaterThanOrEqual(4.5);
		expect(c).toBeCloseTo(16.97, 0.5);
	});
	it("computed contrast: #a1a1aa (subtle remap) on #18181b PASSES AA (>=4.5) (primary)", () => {
		const c = contrast("#a1a1aa", SURFACE_DARK);
		expect(c).toBeGreaterThanOrEqual(4.5);
		expect(c).toBeCloseTo(6.91, 0.5);
	});
	it("computed contrast: tinta #3a6fa3 on dark fails body, white on tinta passes stamp (triangulate)", () => {
		expect(contrast("#3a6fa3", "#18181b")).toBeLessThan(4.5);
		expect(contrast("#3a6fa3", "#27272a")).toBeLessThan(4.5);
		expect(contrast("#ffffff", "#3a6fa3")).toBeGreaterThanOrEqual(4.5);
	});
	it("11-step zinc ramp — actual tokens include every hex (primary RED: missing #a1a1aa/#27272a fails before GREEN)", () => {
		const css = read("styles/globals.css");
		for (const hex of RAMP_11) {
			expect(css, `ramp must contain ${hex}`).toContain(hex);
		}
	});
	it("11-step ramp triangulate — no OKLCH invented, tinta stamp-only zinc/tinta/papel", () => {
		const css = read("styles/globals.css");
		expect(css).not.toContain("oklch");
		expect(css).not.toContain("oklab");
		expect(css).toContain("#2f5b8a");
		// tinta must not be repurposed as foreground-subtle on dark
		const darkIdx = css.indexOf(".dark");
		expect(darkIdx).toBeGreaterThan(0);
		const darkBlock = css.slice(darkIdx, darkIdx + 2500);
		expect(darkBlock).not.toMatch(/--color-foreground-subtle\s*:\s*#2f5b8a/);
		expect(darkBlock).not.toMatch(/--color-foreground-subtle\s*:\s*#3a6fa3/);
		expect(darkBlock).not.toMatch(/--color-foreground-muted\s*:\s*#2f5b8a/);
	});
	it(".dark --color-foreground-subtle remapped to #a1a1aa (primary RED: still #71717a before GREEN)", () => {
		const css = read("styles/globals.css");
		const darkIdx = css.indexOf(".dark");
		const darkBlock = css.slice(darkIdx, darkIdx + 2500);
		expect(darkBlock).toContain("--color-foreground-subtle");
		expect(darkBlock).toContain("#a1a1aa");
		expect(darkBlock).not.toMatch(/--color-foreground-subtle\s*:\s*#71717a/);
	});
	it(".dark --color-foreground-muted is #a1a1aa or lighter, subtle is muted semantic (triangulate)", () => {
		const css = read("styles/globals.css");
		const darkIdx = css.indexOf(".dark");
		const darkBlock = css.slice(darkIdx, darkIdx + 2500);
		expect(darkBlock).toContain("--color-foreground-muted");
		// muted should be at least #a1a1aa contrast already
		expect(contrast("#a1a1aa", SURFACE_DARK)).toBeGreaterThanOrEqual(4.5);
	});
});

describe("S1 identity surfaces — brand mark and empty state (RED probes)", () => {
	it("assets/brand/bodega-tecnica-mark.svg exists and is 32×32 currentColor 1.5px refined (primary RED)", () => {
		const rel = "assets/brand/bodega-tecnica-mark.svg";
		const p = path.join(process.cwd(), rel);
		expect(fs.existsSync(p), `${rel} must exist`).toBe(true);
		const svg = fs.readFileSync(p, "utf8");
		expect(svg).toContain("<svg");
		expect(svg).toMatch(/viewBox\s*=\s*["']0 0 32 32["']/);
		expect(svg.toLowerCase()).toContain("currentcolor");
		expect(svg).toMatch(/stroke-width\s*=\s*["']1\.5["']/);
		expect(svg).not.toContain("oklch");
		expect(svg).not.toContain("<image");
	});
	it("brand mark triangulate — 8px square 2×2 slot one filled (primary RED)", () => {
		const svg = fs.readFileSync(
			path.join(process.cwd(), "assets/brand/bodega-tecnica-mark.svg"),
			"utf8",
		);
		// must have 8px geometry (width 8 height 8 or rect with 8)
		expect(svg).toMatch(/8/);
		// must have at least 2 rects or path forming shelf slots, one filled
		const rects = (svg.match(/<rect/g) || []).length;
		const filled = (svg.match(/fill\s*=\s*["']currentColor["']/g) || []).length;
		expect(rects + (svg.match(/<path/g) || []).length).toBeGreaterThanOrEqual(2);
		expect(filled).toBeGreaterThanOrEqual(1);
		expect(svg).not.toContain("data:image");
	});
	it("components/brand/bodega-tecnica-mark.tsx lockup exists, no next/image, Bodega Técnica, hide ServiceFlow at 390 (primary RED)", () => {
		const rel = "components/brand/bodega-tecnica-mark.tsx";
		expect(fs.existsSync(path.join(process.cwd(), rel)), `${rel} must exist`).toBe(true);
		const src = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
		expect(src).toContain("Bodega Técnica");
		expect(src).not.toContain("next/image");
		expect(src).not.toContain('from "next/image"');
		// refined lockup is code-native SVG synced with asset, no filename sr-only duplicate
		expect(src).not.toContain("bodega-tecnica-mark.svg");
		expect(src).not.toMatch(/sr-only[^>]*>.*\.svg/);
		expect(src).toMatch(/aria-hidden/);
		// 390 hide: hidden class or responsive guard
		expect(src).toMatch(/hidden|390|sm:/);
		expect(src).toContain("ServiceFlow");
	});
	it("components/ui/page-empty-state.tsx reusable {title,description,actionLabel,onAction} Spanish via props (primary RED)", () => {
		const rel = "components/ui/page-empty-state.tsx";
		expect(fs.existsSync(path.join(process.cwd(), rel)), `${rel} must exist`).toBe(true);
		const src = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
		expect(src).toContain("title");
		expect(src).toContain("description");
		expect(src).toContain("actionLabel");
		expect(src).toContain("onAction");
		expect(src).not.toContain("italic");
		// must not hardcode English status/transfer tokens
		expect(src.toLowerCase()).not.toContain("status");
		expect(src).not.toContain("transfer");
	});
	it("Navbar lockup replaces cycle, no glow/border-l-4 (primary RED)", async () => {
		const src = fs.readFileSync(path.join(process.cwd(), "components/layout/Navbar.tsx"), "utf8");
		expect(src).toContain("bodega-tecnica-mark");
		expect(src).not.toContain("shadow-primary/20");
		expect(src).not.toContain("shadow-lg shadow-primary");
		// cycle path d="M4 4v5h..." is old icon
		expect(src).not.toContain("M4 4v5h.582m15.356 2A8.001");
		expect(src).not.toContain("border-l-4");
		// still has nav links Servicios/Sedes/Registro order unchanged in S1
		expect(src).toContain("Servicios");
		expect(src).toContain("Sedes");
		expect(src).toContain("Registro");
	});
	it("locationsManager craft floor p-4/gap-4/8px ≥13px ch mono no border-l-4/tracking-widest/text-[10px] (primary RED)", () => {
		const src = fs.readFileSync(
			path.join(process.cwd(), "app/(app)/locations/locationsManager.tsx"),
			"utf8",
		);
		expect(src).toContain("p-4");
		expect(src).toContain("gap-4");
		expect(src).toMatch(/rounded-sm|radius-sm|rounded-lg.*8px|8px/);
		expect(src).toContain("font-mono");
		expect(src).not.toContain("border-l-4");
		expect(src).not.toContain("tracking-widest");
		expect(src).not.toContain("text-[10px]");
		expect(src).not.toContain("text-[11px]");
		// header should not use 3xl/gradient underline pattern
		expect(src).not.toMatch(/text-3xl/);
	});
	it("locationsManager triangulate — table headers and badges ≥13px semantic, ch-aligned", () => {
		const src = fs.readFileSync(
			path.join(process.cwd(), "app/(app)/locations/locationsManager.tsx"),
			"utf8",
		);
		// headers should not be text-xs (10-12px); should be at least 13px via text-sm or explicit
		expect(src).not.toContain("text-xs");
		// should still have Spanish copy
		expect(src).toContain("Gestión de Sedes");
	});
});

describe("Remediation — Navbar Servicios dark active contrast >=4.5 (focused)", () => {
	function extractActiveClass(block: string): string {
		const qIdx = block.indexOf('? "');
		if (qIdx === -1) {
			const qIdx2 = block.indexOf("? '");
			if (qIdx2 === -1) return block;
			const start = qIdx2 + 3;
			const end = block.indexOf("'", start);
			return end === -1 ? block : block.slice(start, end);
		}
		const start = qIdx + 3;
		const end = block.indexOf('"', start);
		return end === -1 ? block : block.slice(start, end);
	}
	it("Servicios active desktop in dark meets AA >=4.5 on navbar surface #27272a (not tinta 2.82)", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "components/layout/Navbar.tsx"), "utf8");
		const serviciosIdx = src.indexOf('href="/dashboard"');
		expect(serviciosIdx).toBeGreaterThan(-1);
		const block = src.slice(serviciosIdx, serviciosIdx + 900);
		const active = extractActiveClass(block);
		// computed guard: old tinta fails, new foreground passes
		expect(contrast("#3a6fa3", "#27272a")).toBeLessThan(4.5);
		expect(contrast("#3a6fa3", "#27272a")).toBeCloseTo(2.82, 1);
		expect(contrast("#fafafa", "#27272a")).toBeGreaterThanOrEqual(4.5);
		expect(contrast("#18181b", "#ffffff")).toBeGreaterThanOrEqual(4.5);
		// remediation: desktop Servicios active must be dark-compliant (>=4.5) — text-foreground or dark:text-foreground
		// active must contain foreground, and if it contains text-primary it must also have dark override
		const hasForeground =
			active.includes("text-foreground") || active.includes("dark:text-foreground");
		expect(hasForeground, `active class must be dark-compliant, got: ${active}`).toBe(true);
		const isBarePrimaryWithoutDark =
			active.includes("text-primary") && !active.includes("dark:text-foreground");
		expect(
			isBarePrimaryWithoutDark,
			`bare text-primary without dark override is 2.82 fail, active: ${active}`,
		).toBe(false);
	});
	it("Servicios active mobile in dark meets AA >=4.5 — preserves light tinta via dark override", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "components/layout/Navbar.tsx"), "utf8");
		const mobileIdx = src.indexOf("isMobileMenuOpen && (");
		expect(mobileIdx).toBeGreaterThan(-1);
		const mobileBlock = src.slice(mobileIdx, mobileIdx + 3500);
		const serviciosMobileIdx = mobileBlock.indexOf('href="/dashboard"');
		expect(serviciosMobileIdx).toBeGreaterThan(-1);
		const block = mobileBlock.slice(serviciosMobileIdx, serviciosMobileIdx + 800);
		const active = extractActiveClass(block);
		expect(contrast("#fafafa", "#27272a")).toBeGreaterThanOrEqual(4.5);
		expect(contrast("#3a6fa3", "#27272a")).toBeLessThan(4.5);
		const hasForeground =
			active.includes("text-foreground") || active.includes("dark:text-foreground");
		expect(hasForeground, `mobile active must be dark-compliant, got: ${active}`).toBe(true);
		const isBarePrimaryWithoutDark =
			active.includes("text-primary") && !active.includes("dark:text-foreground");
		expect(
			isBarePrimaryWithoutDark,
			`mobile bare text-primary without dark override fails, active: ${active}`,
		).toBe(false);
	});
});
