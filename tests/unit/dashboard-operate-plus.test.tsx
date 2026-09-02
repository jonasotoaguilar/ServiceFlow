import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
function read(rel: string) {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard",
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	redirect: vi.fn(),
}));
vi.mock("@/app/actions/locations", () => ({ getLocations: vi.fn(async () => ({ data: [] })) }));
vi.mock("boneyard-js/react", () => ({
	Skeleton: ({ loading, children, name, ...p }: any) =>
		loading
			? React.createElement(
					"div",
					{ "data-testid": `skeleton-${name}`, "data-boneyard": name, ...p },
					"skeleton",
				)
			: React.createElement(React.Fragment, null, children),
}));
describe("S2a headline Servicios + count + Nuevo servicio before metrics", () => {
	it("headline band Servicios h2 mono count before metrics and Nuevo servicio in band", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		const h = src.indexOf("Servicios"),
			a = src.indexOf("<article");
		expect(h).toBeGreaterThan(-1);
		expect(a).toBeGreaterThan(-1);
		expect(h).toBeLessThan(a);
		expect(src).toMatch(/<h2[^>]*>.*Servicios/);
		expect(src).toMatch(/registros/);
		expect(src).toContain("font-mono");
		expect(src).toMatch(/text-sm|text-\[13px\]/);
		const n = src.indexOf("Nuevo servicio");
		expect(n).toBeGreaterThan(-1);
		expect(n).toBeLessThan(a);
		expect(src).toMatch(/flex-wrap/);
		expect(src).not.toMatch(/headline.*overflow-x-auto/);
	});
	it("headline count uses totalRecords/pending no forbidden craft", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toMatch(/totalRecords|stats\.pending/);
		expect(src.slice(src.indexOf("Servicios") - 500, src.indexOf("Servicios") + 800)).not.toContain(
			"border-l-4",
		);
		expect(src).not.toContain("tracking-widest");
		expect(src).toContain("Nuevo servicio");
	});
});
describe("S2a facts 2 large + 3 muted not buttons", () => {
	it("5 articles Pendientes/Entregadas + Por Vencer/Críticos/Canceladas no five-equal no border-l-4", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect((src.match(/<article/g) || []).length).toBe(5);
		expect(src).toContain("Pendientes");
		expect(src).toContain("Entregadas");
		expect(src).toContain("Por Vencer");
		expect(src).toContain("Críticos");
		expect(src).toContain("Canceladas");
		expect(src).not.toMatch(/grid-cols-5/);
		expect(src).not.toContain("border-l-4");
		expect(src).toMatch(/text-3xl|text-\[32px\]|text-2xl/);
		expect(src).toMatch(/text-xl|text-\[20px\]/);
	});
	it("metrics not buttons no toggleStatus tabbable", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("toggleStatusInFilter");
		expect(src).not.toMatch(/toggleStatus\s*\(\s*["']pending["']\s*\)/);
		expect(src).not.toMatch(/onClick\s*=\s*\{[^}]*\btoggleStatus\s*\(/);
		const blocks = src.split("<article");
		for (const b of blocks.slice(1)) {
			const h = b.slice(0, 800);
			expect(h).not.toMatch(/role\s*=\s*["']button["']/);
			expect(h).not.toMatch(/tabIndex/);
			expect(h).not.toMatch(/onClick/);
			expect(h).not.toMatch(/onKeyDown/);
		}
	});
	it("metrics not focusable pointer/keyboard", async () => {
		const { ServiceDashboard } = await import("@/components/services/ServicesDashboard");
		const orig = (global as any).fetch as any;
		(global as any).fetch = vi.fn(
			async () => ({ ok: true, json: async () => ({ data: [], total: 0 }) }) as any,
		);
		const { container } = render(
			React.createElement(ServiceDashboard, {
				initialData: { data: [], total: 0, page: 1, limit: 20 },
				user: { name: "Test" },
			}),
		);
		const arts = container.querySelectorAll("article");
		expect(arts.length).toBe(5);
		for (const a of Array.from(arts)) {
			expect(a.tagName.toLowerCase()).toBe("article");
			expect(a.getAttribute("role")).not.toBe("button");
			expect(a.getAttribute("tabindex")).toBeNull();
		}
		const foc = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		expect(Array.from(foc).filter((el) => el.closest("article")).length).toBe(0);
		(global as any).fetch = orig;
	});
	it("p-4 gap rhythm >=13px quiet motion", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toMatch(/<article[^>]*p-4/);
		expect(src).toContain("gap-4");
		expect(src).toContain("gap-6");
		const blocks = [...src.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
		expect(blocks.length).toBe(5);
		for (const b of blocks) {
			expect(b).not.toContain("text-xs");
			expect(b).not.toContain("text-[10px]");
			expect(b).not.toContain("text-[11px]");
		}
		expect(src).toMatch(/duration-150|duration-200/);
		expect(src).not.toMatch(/<article[^>]*transition-all/);
	});
	it("Spanish labels scale", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("Pendientes");
		expect(src).toContain("Entregadas");
		expect(src).toContain("Por Vencer");
		expect(src).toContain("Críticos");
		expect(src).toContain("Canceladas");
		expect(src).toMatch(/font-mono|font-bold|font-semibold/);
	});
});
describe("S2a Boneyard and aria-busy", () => {
	it("skeletons dashboard-stats/table with isLoading && Services.length===0", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("boneyard-js/react");
		expect(src).toContain('name="dashboard-stats"');
		expect(src).toContain('name="dashboard-table"');
		expect(src).toMatch(/isLoading\s*&&\s*Services\.length\s*===\s*0/);
	});
	it("populated refetch aria-busy without replacing table", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("aria-busy");
		expect(src).toMatch(/aria-busy\s*=\s*\{?\s*isLoading/);
		expect(src).not.toMatch(/\{\s*!isLoading\s*&&\s*\(?\s*<ServiceTable/);
		expect(src).toContain("<ServiceTable");
	});
});
describe("S2a delete toggleStatus keep InFilter", () => {
	it("deletes toggleStatus keeps toggleStatusInFilter", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).not.toMatch(/const\s+toggleStatus\s*=\s*\(/);
		expect(src).not.toMatch(/function\s+toggleStatus\s*\(/);
		expect(src).toContain("toggleStatusInFilter");
	});
});
describe("S2b strip low border-y not card", () => {
	it("toolbar strip uses border-y low strip not elevated card with shadow or rounded-lg", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("border-y");
		expect(src).not.toMatch(/bg-surface\s+border\s+border-border\s+rounded-lg\s+p-4\s+mb-8/);
		expect(src).not.toMatch(/shadow-xl.*toolbar|toolbar.*shadow|rounded-xl.*mb-8/);
		const toolbarIdx = src.indexOf("border-y");
		expect(toolbarIdx).toBeGreaterThan(-1);
		const toolbarSlice = src.slice(toolbarIdx, toolbarIdx + 1200);
		expect(toolbarSlice).not.toContain("rounded-lg");
		expect(toolbarSlice).not.toContain("shadow");
	});
	it("strip contains search+sort and compact sede/estado controls with gap-3", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toMatch(/Buscar por boleta/);
		expect(src).toMatch(/ArrowUpNarrowWide|ArrowDownWideNarrow/);
		expect(src).toContain("Todas las Sedes");
		expect(src).toContain("Todos los estados");
		expect(src).toContain("gap-3");
		const stripIdx = src.indexOf("border-y");
		const stripSlice = src.slice(stripIdx, stripIdx + 2000);
		expect(stripSlice).toContain("gap-3");
	});
	it("gap-6 between sections and gap-3 inside strip, quiet motion only", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("gap-6");
		expect(src).toContain("gap-3");
		expect(src).not.toMatch(/<article[^>]*transition-all/);
		expect(src).not.toMatch(/tracking-widest/);
		expect(src).not.toMatch(/border-l-4/);
		expect(src).not.toMatch(/backdrop-blur|glass|gradient|glow/);
	});
	it("only toggleStatusInFilter may filter", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toContain("toggleStatusInFilter");
		expect(src).not.toMatch(/toggleStatus\s*\(\s*["']pending["']\s*\)/);
		expect(src).not.toMatch(/onClick\s*=\s*\{[^}]*\btoggleStatus\s*\(/);
		const countToggle = (src.match(/toggleStatusInFilter/g) || []).length;
		expect(countToggle).toBeGreaterThanOrEqual(1);
		const bareToggle = src.split("toggleStatusInFilter").join("");
		expect(bareToggle).not.toMatch(/const\s+toggleStatus\s*=/);
	});
});
describe("S2b true-empty vs filtered-empty contextual Spanish actions and error retry", () => {
	it("ServicesTable distinguishes true-empty vs filtered-empty with Spanish actions", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		expect(tbl).toMatch(/emptyMode|true-empty|filtered/);
		expect(tbl).toContain("Limpiar filtros");
		expect(tbl).toMatch(/No hay servicios|Sin resultados|No se encontraron/);
		expect(tbl).toContain("Nuevo servicio");
	});
	it("ServicesDashboard wires emptyMode to ServicesTable with contextual onEmptyAction", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).toMatch(/emptyMode|filtered/i);
		expect(src).toContain("onEmptyAction");
		expect(src).toMatch(/searchTerm|statusFilter|locationFilter/);
		expect(src).toContain("emptyMode");
	});
	it("error/retry Spanish no English status/transfer leakage in visible UI", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		const tbl = read("components/services/ServicesTable.tsx");
		expect(src).toMatch(/Reintentar|intentar de nuevo|Error/);
		expect(src).toContain("Reintentar");
		expect(src).not.toMatch(/Cambiar estado status/);
		expect(src).not.toMatch(/Transferir sede transfer/);
		for (const file of [src, tbl]) {
			const lower = file.toLowerCase();
			expect(lower).not.toMatch(/>status</);
			expect(lower).not.toMatch(/>transfer</);
		}
		if (tbl.includes("Reintentar") || tbl.includes("Error")) {
			expect(tbl).toContain("Reintentar");
		}
	});
});
describe("S2b ServicesTable craft floor", () => {
	it("≥13px floor, no text-xs/text-[10px] tracking-widest, rounded-sm px-4 py-3", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		expect(tbl).toContain("rounded-sm");
		expect(tbl).toContain("px-4");
		expect(tbl).toContain("py-3");
		expect(tbl).not.toContain("rounded-xl");
		expect(tbl).not.toMatch(/text-\[10px\]/);
		expect(tbl).not.toContain("text-xs");
		expect(tbl).not.toContain("tracking-widest");
		expect(tbl).not.toContain("tracking-wider");
		expect(tbl).not.toContain("border-l-4");
		expect(tbl).toContain("text-sm");
	});
	it("ch-aligned mono boleta/RUT/dates and semantic days/status icon+text", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		expect(tbl).toContain("font-mono");
		expect(tbl).toMatch(/ch|w-\[.*ch\]/);
		expect(tbl).toMatch(/bg-pending-bg|bg-ready-bg|bg-cancelled-bg|bg-completed-bg/);
		expect(tbl).not.toMatch(/bg-red-500\/10|bg-amber-500\/10|bg-emerald-500\/10/);
		expect(tbl).toMatch(/Clock|CheckCircle|X/);
		expect(tbl).toContain("Pendiente");
		expect(tbl).toContain("Reparada");
	});
	it("390 structural stack no horizontal overflow, product may truncate, desktop full table", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		expect(tbl).not.toMatch(/overflow-x-auto/);
		expect(tbl).toContain("hidden md:block");
		expect(tbl).toContain("md:hidden");
		expect(tbl).toMatch(/boleta|sede|ingreso|días|estado|Acciones/i);
		expect(tbl).toMatch(/truncate|max-w/);
		expect(tbl).toContain('data-testid="services-table-desktop"');
		expect(tbl).toContain('data-testid="services-mobile-list"');
	});
});

describe("Remediation — ServicesTable desktop actions horizontal not vertical", () => {
	it("desktop row actions are arranged horizontally (flex-row) not stacked vertical column", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		const desktopIdx = tbl.indexOf('data-testid="services-table-desktop"');
		expect(desktopIdx).toBeGreaterThan(-1);
		const mobileIdx = tbl.indexOf('data-testid="services-mobile-list"');
		expect(mobileIdx).toBeGreaterThan(desktopIdx);
		const slice = tbl.slice(desktopIdx, mobileIdx);
		// desktop actions container must be horizontal row, not vertical column
		// the actions div is the one with justify-center gap-2 inside the desktop table
		expect(slice).toMatch(/className="flex[^"]*justify-center[^"]*gap-2/);
		expect(slice, "desktop actions must be explicit flex-row for horizontal remediation").toContain(
			"flex-row",
		);
		expect(slice).not.toMatch(/className="flex flex-col[^"]*justify-center/);
		// ensure no flex-col inside desktop actions cell (desktop slice should not have vertical stack for actions)
		const actionsDivMatch = slice.match(/<div className="flex[^"]*justify-center[^"]*">/);
		expect(actionsDivMatch, "desktop actions div must exist with flex-row").not.toBeNull();
		expect(actionsDivMatch![0]).toContain("flex-row");
	});
	it("mobile actions remain compact/responsive with flex-wrap and justify-end", () => {
		const tbl = read("components/services/ServicesTable.tsx");
		const mobileIdx = tbl.indexOf('data-testid="services-mobile-list"');
		expect(mobileIdx).toBeGreaterThan(-1);
		const slice = tbl.slice(mobileIdx, mobileIdx + 6000);
		expect(slice).toContain("flex");
		expect(slice).toContain("justify-end");
		expect(slice).toContain("flex-wrap");
		// mobile must still have all actions (Edit/Delete) — not hidden desktop-only
		expect(slice).toContain('aria-label="Editar"');
		expect(slice).toContain('aria-label="Eliminar"');
		// mobile adaptation preserved: cards still responsive
		expect(slice).toContain('data-testid="service-card-mobile"');
		expect(slice).toContain("rounded-sm");
	});
});
