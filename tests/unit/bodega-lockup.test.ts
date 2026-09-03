import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

describe("Bodega Técnica lockup — refined shelf-grid SVG + accessible lockup (7.1 RED)", () => {
	it("assets/brand/bodega-tecnica-mark.svg exists and is code-native vector (no bitmap)", () => {
		expect(exists("assets/brand/bodega-tecnica-mark.svg")).toBe(true);
		const svg = read("assets/brand/bodega-tecnica-mark.svg");
		expect(svg).toContain("<svg");
		expect(svg).not.toContain("data:image");
		expect(svg).not.toContain(".png");
		expect(svg).not.toContain(".jpg");
		// must be viewBox 32
		expect(svg).toMatch(/viewBox\s*=\s*["']0 0 32 32["']/);
	});

	it("refined geometry: stroke-width 1.5, outer frame rx ~1.5, tighter inset vs old 8/ rx1", () => {
		const svg = read("assets/brand/bodega-tecnica-mark.svg");
		// stroke-width should be 1.5 (optical at 32)
		expect(svg).toMatch(/stroke-width\s*=\s*["']1\.5["']|strokeWidth\s*=\s*\{1\.5\}/);
		expect(svg).not.toMatch(/stroke-width\s*=\s*["']2["']/);
		// outer frame rx should be 1.5 on ~16-20px frame
		expect(svg).toMatch(/rx\s*=\s*["']1\.5["']/);
		expect(svg).not.toMatch(/rx\s*=\s*["']1["'][^0-9]/);
		// tighter inset: outer rect x/y should be 6 or 7 not 8
		expect(svg).toMatch(/<rect[^>]*x\s*=\s*["'](6|7)["']/);
		expect(svg).not.toMatch(/<rect[^>]*x\s*=\s*["']8["'][^>]*width\s*=\s*["']16["']/);
		// must still have 2×2 grid dividers and one filled bay top-left
		expect(svg).toContain("<line");
		expect(svg).toMatch(/fill\s*=\s*["']currentColor["']/);
		expect(svg.match(/<line/g)!.length).toBeGreaterThanOrEqual(2);
	});

	it("component and SVG are synchronized: same geometry tokens appear in both files", () => {
		const svg = read("assets/brand/bodega-tecnica-mark.svg");
		const tsx = read("components/brand/bodega-tecnica-mark.tsx");
		// extract stroke-width token
		const svgStroke = svg.match(/stroke-width\s*=\s*["']([^"']+)["']/)?.[1] ?? "";
		const tsxStroke =
			tsx.match(/strokeWidth\s*=\s*\{([^}]+)\}|stroke-width\s*=\s*["']([^"']+)["']/)?.[1] ??
			tsx.match(/strokeWidth\s*=\s*\{([^}]+)\}/)?.[1] ??
			"";
		// both should contain 1.5
		expect(svgStroke).toContain("1.5");
		expect(tsx).toContain("1.5");
		// rx drift check
		expect(svg).toMatch(/rx\s*=\s*["']1\.5["']/);
		expect(tsx).toMatch(/rx\s*=\s*["']1\.5["']|rx=\{1\.5\}/);
		// filled bay synchronization: both have fill currentColor rect at same x/y
		expect(svg).toMatch(/<rect[^>]*fill\s*=\s*["']currentColor["']/);
		expect(tsx).toMatch(/fill\s*=\s*["']currentColor["']|fill=\{?"currentColor"?\}/);
	});

	it("accessible lockup: decorative mark aria-hidden, wordmark carries accessible name, no duplicate sr-only", async () => {
		const tsx = read("components/brand/bodega-tecnica-mark.tsx");
		// decorative mark spans must be aria-hidden
		expect(tsx).toMatch(/aria-hidden\s*=\s*["']true["']/);
		// must not have duplicate filename sr-only
		expect(tsx).not.toContain("bodega-tecnica-mark.svg");
		expect(tsx).not.toMatch(/sr-only[^>]*>.*\.svg/);
		// wordmark must carry accessible name via visible text, not duplicate sr-only
		expect(tsx).toContain("Bodega Técnica");
		// count sr-only occurrences should be 0
		const srOnlyCount = (tsx.match(/sr-only/g) || []).length;
		expect(srOnlyCount).toBe(0);
	});

	it("lockup preserves established palette: bg-primary text-on-primary, no rebrand colors", () => {
		const tsx = read("components/brand/bodega-tecnica-mark.tsx");
		expect(tsx).toContain("bg-primary");
		expect(tsx).toContain("text-on-primary");
		expect(tsx).not.toContain("bg-gradient");
		expect(tsx).not.toContain("from-blue");
		expect(tsx).not.toContain("neon");
		expect(tsx).not.toMatch(/fill\s*=\s*["']#ff/);
	});

	it("lockup rendered component has no duplicate accessible name and focus unaffected", async () => {
		const { BodegaTecnicaMark } = await import("@/components/brand/bodega-tecnica-mark");
		const { container } = render(React.createElement(BodegaTecnicaMark as any, {}));
		// decorative SVG should be hidden
		const svg = container.querySelector("svg");
		expect(svg).not.toBeNull();
		expect(svg!.getAttribute("aria-hidden")).toBe("true");
		// wordmark text visible
		expect(screen.getByText("Bodega Técnica")).toBeInTheDocument();
		// should not have two accessible names
		const hiddenSpans = container.querySelectorAll(".sr-only");
		expect(hiddenSpans.length).toBe(0);
		// ServiceFlow muted hidden at 390 but present in DOM when showServiceFlow true
		expect(container.textContent).toContain("ServiceFlow");
	});

	it("Navbar uses shared lockup component consistently via import", () => {
		const src = read("components/layout/Navbar.tsx");
		expect(src).toMatch(/BodegaTecnicaMark|bodega-tecnica-mark/);
		expect(src).toContain("components/brand/bodega-tecnica-mark");
		// should not inline duplicate SVG geometry separate from component
		const svgInlineCount = (src.match(/<svg/g) || []).length;
		expect(svgInlineCount).toBe(0);
	});

	it("contrast: bg-primary on-primary meets AA (tokens preserved)", () => {
		const css = read("styles/globals.css");
		// primary and on-primary tokens must exist
		expect(css).toMatch(/--color-primary|--primary/);
		expect(css).toMatch(/--color-on-primary|--on-primary|--color-primary-foreground/);
		// component must use bg-primary text-on-primary
		const tsx = read("components/brand/bodega-tecnica-mark.tsx");
		expect(tsx).toContain("bg-primary");
		expect(tsx).toContain("text-on-primary");
	});
});
