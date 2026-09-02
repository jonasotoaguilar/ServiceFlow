import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react";
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
	it("metrics not buttons - no status toggle tabbable inside articles", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		// exclusive status: no multi-toggle helper inside metrics
		expect(src).not.toContain("toggleStatusInFilter");
		expect(src).not.toMatch(/toggleStatus\s*\(\s*["']pending["']\s*\)/);
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
describe("Exclusive status — no multi-select helpers", () => {
	it("removes toggleStatusInFilter, uses scalar ServiceStatus | ''", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).not.toContain("toggleStatusInFilter");
		// scalar statusFilter
		expect(src).toMatch(/useState<ServiceStatus \| "">/);
		expect(src).not.toMatch(/useState<ServiceStatus\[\]>/);
		expect(src).not.toMatch(/toggleStatus\s*=\s*\(/);
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
	it("exclusive status uses scalar setStatusFilter, no multi-toggle", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		expect(src).not.toContain("toggleStatusInFilter");
		// scalar setter with "" for all-status and option.value for single
		expect(src).toMatch(/setStatusFilter\(""/);
		expect(src).toMatch(/setStatusFilter\(option\.value\)/);
		expect(src).not.toMatch(/const\s+toggleStatus\s*=/);
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
		expect(slice).toMatch(/className="flex[^"]*justify-center[^"]*gap-2/);
		expect(slice, "desktop actions must be explicit flex-row for horizontal remediation").toContain(
			"flex-row",
		);
		expect(slice).not.toMatch(/className="flex flex-col[^"]*justify-center/);
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
		expect(slice).toContain('aria-label="Editar"');
		expect(slice).toContain('aria-label="Eliminar"');
		expect(slice).toContain('data-testid="service-card-mobile"');
		expect(slice).toContain("rounded-sm");
	});
});

// ── Exclusive Single Status Filter — RED for unit-1 ──
describe("Exclusive Single Status Filter (unit-1)", () => {
	it("scalar statusFilter, exclusive query carries at most one status, closes on pick", () => {
		const src = read("components/services/ServicesDashboard.tsx");
		// scalar type
		expect(src).toMatch(/ServiceStatus \| ""/);
		expect(src).not.toContain("ServiceStatus[]");
		expect(src).not.toContain("toggleStatusInFilter");
		expect(src).not.toContain("statusFilter.includes");
		expect(src).not.toContain("statusFilter.length");
		expect(src).not.toContain('statusFilter.join(",")');
		expect(src).not.toContain("estados selec");
		// query carries at most one
		expect(src).toMatch(/if\s*\(\s*statusFilter\s*\)\s*params\.set\("status",\s*statusFilter\)/);
		// close on pick — at least two closes (all-status + option)
		const closes = (src.match(/setShowStatusDropdown\(false\)/g) || []).length;
		expect(closes).toBeGreaterThanOrEqual(2);
		// single-select label and active filter
		expect(src).toMatch(/statusFilter === ""/);
		expect(src).toMatch(/statusFilter === option\.value/);
		// hasActiveFilters and clear use scalar
		expect(src).toMatch(/statusFilter !== ""/);
		expect(src).toMatch(/setStatusFilter\(""/);
		// handleClearFilters clears scalar
		expect(src).not.toMatch(/setStatusFilter\(\[\]\)/);
	});

	it("GET route accepts at most one allowlisted status, first token only", () => {
		const route = read("app/api/services/route.ts");
		// must not preserve comma multi-select
		expect(route).not.toMatch(/statusParam\.split\(","\)\s*as any\[\]/);
		// must handle single allowlisted token
		expect(route).toMatch(/ALLOWED_STATUSES|allowlisted|allowed/i);
		// should take first token only, not all
		expect(route).toMatch(/split\(","\)\[0\]|first/i);
		// should not pass raw comma-joined array
		expect(route).not.toMatch(/statusParam\.split\(","\) as/);
		// ensure it builds single-element status array or undefined
		expect(route).toMatch(/status/);
	});

	it("pointer: selecting a status replaces prior, all-status removes filter, query has at most one", async () => {
		const { ServiceDashboard } = await import("@/components/services/ServicesDashboard");
		const fetchCalls: string[] = [];
		const orig = (global as any).fetch as any;
		(global as any).fetch = vi.fn(async (url: string) => {
			fetchCalls.push(url);
			return { ok: true, json: async () => ({ data: [], total: 0 }) } as any;
		});
		const { container } = render(
			React.createElement(ServiceDashboard, {
				initialData: { data: [], total: 0, page: 1, limit: 20 },
				user: { name: "Test" },
			}),
		);
		// open status dropdown
		const trigger = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Todos los estados"),
		);
		expect(trigger, "status trigger must exist").toBeDefined();
		await act(async () => {
			fireEvent.click(trigger!);
		});
		// click Pendientes (pending)
		const pendientesOpt = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Pendientes"),
		);
		expect(pendientesOpt, "Pendientes option must exist").toBeDefined();
		await act(async () => {
			fireEvent.click(pendientesOpt!);
		});
		// menu must close after pick (option buttons disappear from dropdown)
		// trigger should now show Pendientes label
		await waitFor(() => {
			const t = Array.from(container.querySelectorAll("button")).find((b) =>
				b.textContent?.includes("Pendientes"),
			);
			expect(t).toBeDefined();
		});
		// dropdown should be closed — Pendientes option as menu item should not be visible twice
		// reopen and select Reparadas — should replace Pendientes
		const triggerAfterPending = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Pendientes",
		);
		expect(triggerAfterPending, "trigger should show Pendientes after first pick").toBeDefined();
		await act(async () => {
			fireEvent.click(triggerAfterPending!);
		});
		const reparadasOpt = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Reparadas"),
		);
		expect(reparadasOpt, "Reparadas option must exist").toBeDefined();
		await act(async () => {
			fireEvent.click(reparadasOpt!);
		});
		await waitFor(() => {
			const t = Array.from(container.querySelectorAll("button")).find(
				(b) => b.textContent?.trim() === "Reparadas",
			);
			expect(t).toBeDefined();
		});
		// should NOT show multi-count like "2 estados" nor still show Pendientes as selected trigger
		expect(container.textContent).not.toContain("estados selec");
		expect(container.textContent).not.toContain("2 estados");
		// wait for debounced fetch (300ms)
		await act(async () => {
			await new Promise((r) => setTimeout(r, 400));
		});
		const lastUrl = fetchCalls[fetchCalls.length - 1] || "";
		// query must carry at most one status, no comma-joined list
		if (lastUrl.includes("status=")) {
			const statusVal = new URL(lastUrl, "http://localhost").searchParams.get("status") || "";
			expect(statusVal).not.toContain(",");
			expect(["pending", "ready", "completed", "cancelled"]).toContain(statusVal);
			expect(statusVal).toBe("ready");
		}
		// all-status reset: reopen and click Todos los estados
		const triggerReady = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Reparadas",
		);
		await act(async () => {
			fireEvent.click(triggerReady!);
		});
		const allOpt = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Todos los estados",
		);
		expect(allOpt, "Todos los estados option must exist").toBeDefined();
		await act(async () => {
			fireEvent.click(allOpt!);
		});
		await waitFor(() => {
			const t = Array.from(container.querySelectorAll("button")).find((b) =>
				b.textContent?.includes("Todos los estados"),
			);
			expect(t).toBeDefined();
		});
		await act(async () => {
			await new Promise((r) => setTimeout(r, 400));
		});
		const afterAllUrl = fetchCalls[fetchCalls.length - 1] || "";
		if (afterAllUrl) {
			expect(new URL(afterAllUrl, "http://localhost").searchParams.get("status")).toBeNull();
		}
		(global as any).fetch = orig;
	});

	it("keyboard: Enter/Space on status option selects exclusively and closes menu", async () => {
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
		const trigger = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Todos los estados"),
		);
		await act(async () => {
			fireEvent.click(trigger!);
		});
		// keyboard activation: focus Pendientes and press Enter
		const pendientesBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Pendientes"),
		);
		expect(pendientesBtn).toBeDefined();
		pendientesBtn!.focus();
		await act(async () => {
			fireEvent.keyDown(pendientesBtn!, { key: "Enter", code: "Enter" });
			fireEvent.click(pendientesBtn!);
		});
		await waitFor(() => {
			const t = Array.from(container.querySelectorAll("button")).find(
				(b) => b.textContent?.trim() === "Pendientes",
			);
			expect(t).toBeDefined();
		});
		// menu should be closed after keyboard activation (no duplicate option visible as open menu)
		// reopen and use Space on Reparadas
		const trigPend = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Pendientes",
		);
		await act(async () => {
			fireEvent.click(trigPend!);
		});
		const reparadasBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Reparadas"),
		);
		expect(reparadasBtn).toBeDefined();
		reparadasBtn!.focus();
		await act(async () => {
			fireEvent.keyDown(reparadasBtn!, { key: " ", code: "Space" });
			fireEvent.click(reparadasBtn!);
		});
		await waitFor(() => {
			const t = Array.from(container.querySelectorAll("button")).find(
				(b) => b.textContent?.trim() === "Reparadas",
			);
			expect(t).toBeDefined();
		});
		// exactly one selected — not multi
		expect(container.textContent).not.toContain("estados selec");
		(global as any).fetch = orig;
	});

	it("exclusive: second status does not remain selected alongside first", async () => {
		const { ServiceDashboard } = await import("@/components/services/ServicesDashboard");
		const orig = (global as any).fetch as any;
		(global as any).fetch = vi.fn(
			async () => ({ ok: true, json: async () => ({ data: [], total: 0 }) }) as any,
		);
		const { container, unmount } = render(
			React.createElement(ServiceDashboard, {
				initialData: { data: [], total: 0, page: 1, limit: 20 },
				user: { name: "Test" },
			}),
		);
		const getTrigger = () =>
			Array.from(container.querySelectorAll("button")).find(
				(b) =>
					b.textContent?.includes("Todos los estados") ||
					b.textContent?.trim() === "Pendientes" ||
					b.textContent?.trim() === "Reparadas",
			);
		// pick pending
		let trig = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Todos los estados"),
		);
		await act(async () => {
			fireEvent.click(trig!);
		});
		let opt = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Pendientes"),
		);
		await act(async () => {
			fireEvent.click(opt!);
		});
		await waitFor(() =>
			expect(
				Array.from(container.querySelectorAll("button")).find(
					(b) => b.textContent?.trim() === "Pendientes",
				),
			).toBeDefined(),
		);
		// pick completed — should replace, not add
		trig = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Pendientes",
		)!;
		await act(async () => {
			fireEvent.click(trig!);
		});
		opt = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Entregada"),
		);
		await act(async () => {
			fireEvent.click(opt!);
		});
		await waitFor(() =>
			expect(
				Array.from(container.querySelectorAll("button")).find(
					(b) => b.textContent?.trim() === "Entregada",
				),
			).toBeDefined(),
		);
		// trigger shows only Entregada — not Pendientes as selected filter (metrics still contain Pendientes word, so check trigger not whole container)
		const finalTrig = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Entregada",
		);
		expect(finalTrig).toBeDefined();
		expect(finalTrig?.textContent?.trim()).toBe("Entregada");
		// ensure Pendientes is not shown as the active filter trigger (only as metric)
		const pendingTrigger = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.trim() === "Pendientes",
		);
		// after exclusive pick, Pendientes trigger should not exist; only Entregada trigger exists
		// (pending option still exists in hidden menu only when reopened, not as trigger)
		// verify no button with exact Pendientes is the status trigger (metrics are articles not buttons)
		expect(pendingTrigger).toBeUndefined();
		unmount();
		(global as any).fetch = orig;
	});
});
