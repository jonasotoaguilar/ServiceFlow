import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";

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

// helpers
const mockGetServiceEvents = vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 }));
vi.mock("@/app/actions/service-events", () => ({
	getServiceEvents: (...a: unknown[]) => (mockGetServiceEvents as any)(...a),
}));
vi.mock("@/lib/format-date", () => ({ formatEntryDate: (d: string) => d.split("T")[0] }));

describe("Registro nav rank 2 Servicios→Registro→Sedes", () => {
	it("desktop and mobile nav order Servicios then Registro then Sedes with active text-foreground+border-primary", () => {
		const src = read("components/layout/Navbar.tsx");
		// order by index in file for desktop nav
		const idxServ = src.indexOf('href="/dashboard"');
		const idxReg = src.indexOf('href="/service-events"');
		const idxSedes = src.indexOf('href="/locations"');
		expect(idxServ).toBeGreaterThan(-1);
		expect(idxReg).toBeGreaterThan(-1);
		expect(idxSedes).toBeGreaterThan(-1);
		expect(idxServ).toBeLessThan(idxReg);
		expect(idxReg).toBeLessThan(idxSedes);
		// active uses text-foreground or text-primary with border-primary not muted
		expect(src).toMatch(/text-foreground|text-primary/);
		expect(src).toContain("border-primary");
		expect(src).not.toContain("border-l-4");
		// mobile section same order
		const mobilePart = src.slice(src.indexOf("Mobile Navigation Menu"));
		const mServ = mobilePart.indexOf('href="/dashboard"');
		const mReg = mobilePart.indexOf('href="/service-events"');
		const mSedes = mobilePart.indexOf('href="/locations"');
		expect(mServ).toBeLessThan(mReg);
		expect(mReg).toBeLessThan(mSedes);
	});
	it("no rejected directions or Mesa second ply", () => {
		const nav = read("components/layout/Navbar.tsx");
		const mgr = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(nav).not.toContain("border-l-4");
		expect(mgr).not.toContain("border-l-4");
		expect(mgr).not.toContain("tracking-widest");
		expect(mgr).not.toContain("gradient");
	});
});

describe("Registro filters always visible Desde/Hasta/Tipo/Estado/Sede no collapse", () => {
	it("source has visible filter strip no outer collapse", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(src).toContain("Desde");
		expect(src).toContain("Hasta");
		expect(src).toMatch(/>Tipo</);
		expect(src).toMatch(/>Estado</);
		expect(src).toMatch(/>Sede</);
		expect(src).not.toMatch(/showFilters/);
		expect(src).not.toMatch(/setShowFilters/);
		expect(src).not.toMatch(/\{showFilters &&/);
		// filter grid must be visible without outer button
		expect(src).toMatch(/grid grid-cols-1|flex.*gap-3|border-y/);
		// heading static h2 not button
		expect(src).toMatch(/<h2[^>]*>\s*FILTROS DE BÚSQUEDA/);
		const headingLine = src.split("\n").find((l) => l.includes("FILTROS DE BÚSQUEDA")) ?? "";
		expect(headingLine).not.toMatch(/aria-expanded/);
		// no outer collapse control
		expect(src).not.toMatch(/onClick.*setShowFilters/);
	});
	it("rendered filters visible at all widths", async () => {
		const ServiceEventsManager = (await import("@/app/(app)/service-events/serviceEventsManager"))
			.default;
		render(
			React.createElement(ServiceEventsManager as any, {
				initialLogs: [],
				initialTotal: 0,
				initialError: null,
				locations: [{ id: "locA", name: "Sede A" }],
			}),
		);
		expect(screen.getByRole("heading", { name: /FILTROS DE BÚSQUEDA/i }).tagName).toBe("H2");
		expect(screen.getByLabelText(/Desde/i)).toBeVisible();
		expect(screen.getByLabelText(/Hasta/i)).toBeVisible();
		// Tipo/Estado/Sede triggers visible (text content)
		expect(screen.getByText(/^Tipo$/i)).toBeVisible();
		expect(screen.getByText(/^Estado$/i)).toBeVisible();
		expect(screen.getByText(/^Sede$/i)).toBeVisible();
	});
});

describe("Registro empty Spanish contextual create vs filtered clear", () => {
	it("source uses PageEmptyState Spanish true-empty create vs filtered clear", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(src).toContain("page-empty-state");
		expect(src).toMatch(/PageEmptyState/);
		expect(src).toMatch(/No hay registros|No hay eventos|Sin registros/);
		expect(src).toMatch(/Sin resultados|no coinciden|No se encontraron/);
		// actions
		expect(src).toMatch(/Limpiar filtros/);
		expect(src).toMatch(/Nuevo servicio|Crear|Registr/);
		// not italic-only
		expect(src).not.toMatch(/italic[^>]*>No se encontraron registros en este periodo/);
		expect(src).not.toContain("italic");
	});
	it("rendered true-empty vs filtered-empty distinction", async () => {
		const ServiceEventsManager = (await import("@/app/(app)/service-events/serviceEventsManager"))
			.default;
		// true-empty: no filters
		const { unmount } = render(
			React.createElement(ServiceEventsManager as any, {
				initialLogs: [],
				initialTotal: 0,
				initialError: null,
				locations: [{ id: "locA", name: "Sede A" }],
			}),
		);
		// wait for skeleton to resolve then true-empty appears
		await waitFor(
			() => expect(screen.queryByTestId("skeleton-service-events-list")).not.toBeInTheDocument(),
			{ timeout: 2000 },
		);
		expect(screen.getByRole("heading", { name: /No hay registros/i })).toBeVisible();
		const createBtn = screen.getByRole("button", { name: /Nuevo servicio|Crear/i });
		expect(createBtn).toBeVisible();
		unmount();
		// filtered-empty: set a filter then empty
		render(
			React.createElement(ServiceEventsManager as any, {
				initialLogs: [],
				initialTotal: 0,
				initialError: null,
				locations: [{ id: "locA", name: "Sede A" }],
			}),
		);
		await waitFor(
			() => expect(screen.queryByTestId("skeleton-service-events-list")).not.toBeInTheDocument(),
			{ timeout: 2000 },
		);
		// set Desde to trigger filtered mode
		const desde = screen.getByLabelText(/Desde/i) as HTMLInputElement;
		fireEvent.change(desde, { target: { value: "2025-01-01" } });
		// after filter, empty message should be filtered variant — may briefly skeleton again
		await waitFor(
			() => expect(screen.getByRole("heading", { name: /Sin resultados/i })).toBeVisible(),
			{ timeout: 3000 },
		);
		expect(
			screen.getAllByRole("button", { name: /Limpiar filtros/i }).length,
		).toBeGreaterThanOrEqual(1);
	});
});

describe("Registro error Spanish retry no raw English status/transfer", () => {
	it("source error Spanish+retry no English leakage", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		const pageSrc = read("app/(app)/service-events/page.tsx");
		expect(src).toMatch(/Reintentar/);
		expect(src).toMatch(/Error al cargar|No se pudo cargar/);
		// no raw English tokens in visible UI
		const lower = src.toLowerCase();
		expect(lower).not.toMatch(/>status</);
		expect(lower).not.toMatch(/>transfer</);
		expect(src).not.toMatch(/status.*transfer/);
		// page always mounts manager with initialError
		expect(pageSrc).toContain("initialError");
		expect(pageSrc).not.toMatch(/text-red-500.*Error al cargar el historial/);
		expect(pageSrc).toContain("ServiceEventsManager");
	});
	it("page mounts manager even on initialError", async () => {
		const pageSrc = read("app/(app)/service-events/page.tsx");
		expect(pageSrc).toContain("initialError");
		// ensure no early return that hides manager
		const earlyReturn = pageSrc.match(/if\s*\(logsResult\.error[\s\S]*?return \(/);
		expect(earlyReturn).toBeNull();
	});
	it("retry restores without changing query semantics", async () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		// retry calls getServiceEvents with same params (fetchLogs)
		expect(src).toMatch(/getServiceEvents/);
		expect(src).toMatch(/Reintentar/);
		// params preserved: page, limit, startDate, endDate, locationId, kind, status
		expect(src).toContain("startDate");
		expect(src).toContain("endDate");
		expect(src).toContain("locationId");
		expect(src).toContain("kind");
		expect(src).toContain("status");
	});
});

describe("Registro 390 ficha boleta/location/date/tipo-estado/actions without overflow", () => {
	it("source 390 ficha has required fields and no overflow craft floor", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(src).toContain("p-4");
		expect(src).toContain("gap-4");
		expect(src).toMatch(/rounded-sm/);
		expect(src).not.toContain("border-l-4");
		expect(src).not.toContain("tracking-widest");
		expect(src).not.toContain("text-[10px]");
		expect(src).not.toContain("overflow-x-auto");
		expect(src).not.toContain("rounded-xl");
		// >=13px: no text-xs
		expect(src).not.toMatch(/text-xs/);
		expect(src).toContain("text-sm");
		// ch-aligned mono
		expect(src).toContain("font-mono");
		expect(src).toMatch(/w-\[.*ch\]|ch/);
		// boleta, location, date, tipo/estado, actions present
		expect(src).toMatch(/invoiceNumber|Boleta|#\{/);
		expect(src).toMatch(/fromLocation|toLocation|Sede|Origen|Destino/);
		expect(src).toMatch(/changedAt|Fecha|formatEntryDate/);
		expect(src).toMatch(/kind|Tipo|Cambio sede|Cambio estado|Creación/);
		expect(src).toMatch(/displayStatus|Estado|Pendiente|Reparada/);
		// mobile ficha: data-testid or md:hidden
		expect(src).toContain("md:hidden");
		expect(src).toContain("hidden md:block");
		// p-4/gap-4/8px
		expect(src).toMatch(/gap-4|gap-3/);
	});
	it("icon+text badges and aria-busy", () => {
		const src = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(src).toContain("aria-busy");
		expect(src).toMatch(/aria-busy\s*=\s*\{?\s*loading|isLoading/);
		// icon+text: lucide icons alongside badge text
		expect(src).toMatch(/Clock|CheckCircle|ArrowLeftRight|RefreshCw|X|FileText/);
		// badges have icon+text pattern inline-flex items-center gap
		expect(src).toMatch(/inline-flex.*items-center.*gap/);
		expect(src).toMatch(/boneyard-js|Skeleton|Boneyard/);
		// quiet motion
		expect(src).toMatch(/duration-150|duration-200/);
		expect(src).not.toMatch(/transition-all/);
		expect(src).not.toMatch(/backdrop-blur|glass|gradient|glow/);
	});
});

describe("Registro query/getServiceEvents parameters unchanged", () => {
	it("preserves backend params and pagination semantics", async () => {
		const actionSrc = read("app/actions/service-events.ts");
		// allowed params
		expect(actionSrc).toContain("page");
		expect(actionSrc).toContain("limit");
		expect(actionSrc).toContain("startDate");
		expect(actionSrc).toContain("endDate");
		expect(actionSrc).toContain("locationId");
		expect(actionSrc).toContain("kind");
		expect(actionSrc).toContain("status");
		// no new fields
		expect(actionSrc).not.toMatch(/search/);
		// manager passes same keys
		const mgr = read("app/(app)/service-events/serviceEventsManager.tsx");
		expect(mgr).toMatch(/page,\s*limit|page:\s*page/);
		expect(mgr).toContain("startDate");
		expect(mgr).toContain("endDate");
		expect(mgr).toContain("locationId");
		expect(mgr).toContain("kind");
		expect(mgr).toContain("status");
	});
});
