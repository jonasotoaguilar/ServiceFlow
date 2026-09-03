import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

const mockGetServiceEvents = vi.fn(async () => ({ data: [], total: 100, page: 1, limit: 20 }));
vi.mock("@/app/actions/service-events", () => ({
	getServiceEvents: (...args: unknown[]) => (mockGetServiceEvents as any)(...args),
}));

vi.mock("@/lib/format-date", () => ({
	formatEntryDate: (d: string) => d,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	usePathname: () => "/service-events",
	redirect: vi.fn(),
	useSearchParams: () => new URLSearchParams(),
}));

import ServiceEventsManager from "@/app/(app)/service-events/serviceEventsManager";

const locations = [
	{ id: "locA_15_chars_01", name: "Sede A" },
	{ id: "locB_15_chars_02", name: "Sede B" },
];

function renderManager() {
	return render(<ServiceEventsManager initialLogs={[]} initialTotal={100} locations={locations} />);
}

function getPanel(): HTMLElement {
	return screen
		.getByRole("heading", { name: /FILTROS DE BÚSQUEDA/i })
		.closest("div") as HTMLElement;
}

describe("WU5 Registro filters — always visible, no outer disclosure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetServiceEvents.mockResolvedValue({ data: [], total: 100, page: 1, limit: 20 });
	});

	it("controls visible on first paint, heading is static h2 not button, no outer aria-expanded", async () => {
		renderManager();

		const heading = screen.getByRole("heading", { name: /FILTROS DE BÚSQUEDA/i });
		expect(heading.tagName).toBe("H2");
		expect(heading.textContent).toMatch(/FILTROS DE BÚSQUEDA/i);
		expect(screen.queryByRole("button", { name: /FILTROS DE BÚSQUEDA/i })).toBeNull();
		expect(heading.hasAttribute("aria-expanded")).toBe(false);

		const desdeInput = screen.getByLabelText(/Desde/i) as HTMLInputElement;
		const hastaInput = screen.getByLabelText(/Hasta/i) as HTMLInputElement;
		expect(desdeInput).toBeVisible();
		expect(hastaInput).toBeVisible();
		const panel = getPanel();
		expect(within(panel).getByText(/^Tipo$/i)).toBeVisible();
		expect(within(panel).getByText(/^Estado$/i)).toBeVisible();
		expect(within(panel).getByText(/^Sede$/i)).toBeVisible();

		const clearBtn = screen.getByTitle(/Limpiar filtros/i);
		expect(clearBtn).toBeVisible();
		expect(clearBtn.className).toMatch(/min-h-11/);
		expect(clearBtn.className).toMatch(/min-w-11/);
		expect(screen.getByLabelText(/Desde/i)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /FILTROS DE BÚSQUEDA/i })).toBeNull();
	});

	it("inner Tipo/Estado/Sede dropdowns remain interactive", async () => {
		renderManager();
		const panel = getPanel();

		const tipoLabel = within(panel).getByText(/^Tipo$/i);
		const tipoBtn = within(tipoLabel.closest("div") as HTMLElement).getByRole("button");
		fireEvent.click(tipoBtn);
		expect(await screen.findByText("Creación")).toBeVisible();
		expect(screen.getByText("Cambio sede")).toBeVisible();
		expect(screen.getByText("Cambio estado")).toBeVisible();
		fireEvent.click(tipoBtn);
		await waitFor(() => expect(screen.queryByText("Creación")).not.toBeInTheDocument());

		const estadoLabel = within(panel).getByText(/^Estado$/i);
		const estadoBtn = within(estadoLabel.closest("div") as HTMLElement).getByRole("button");
		fireEvent.click(estadoBtn);
		expect(await screen.findByText("Pendiente")).toBeVisible();
		expect(screen.getByText("Reparada")).toBeVisible();
		fireEvent.click(estadoBtn);
		await waitFor(() => expect(screen.queryByText("Pendiente")).not.toBeInTheDocument());

		const sedeTrigger = within(panel)
			.getAllByRole("button")
			.find(
				(b) => b.textContent?.includes("Todas las sedes") || b.textContent?.includes("Sede A"),
			) as HTMLElement;
		expect(sedeTrigger).toBeDefined();
		fireEvent.click(sedeTrigger);
		expect(await screen.findByText("Sede A")).toBeVisible();
		expect(screen.getByText("Sede B")).toBeVisible();
		fireEvent.click(sedeTrigger);
		await waitFor(() => expect(screen.queryByText("Sede B")).not.toBeInTheDocument());

		fireEvent.click(tipoBtn);
		expect(tipoBtn.getAttribute("aria-expanded")).toBe("true");
		fireEvent.click(tipoBtn);
		expect(tipoBtn.getAttribute("aria-expanded")).toBe("false");

		fireEvent.click(estadoBtn);
		expect(estadoBtn.getAttribute("aria-expanded")).toBe("true");
		fireEvent.click(estadoBtn);
		expect(estadoBtn.getAttribute("aria-expanded")).toBe("false");

		fireEvent.click(sedeTrigger);
		expect(sedeTrigger.getAttribute("aria-expanded")).toBe("true");
		fireEvent.click(sedeTrigger);
		expect(sedeTrigger.getAttribute("aria-expanded")).toBe("false");
	});

	it("filter changes preserve current page (page 2 stays 2) and clear resets to page 1", async () => {
		renderManager();
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		mockGetServiceEvents.mockClear();

		const page2Btn = screen.getByRole("button", { name: /^2$/ });
		fireEvent.click(page2Btn);
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		let lastCall = (mockGetServiceEvents.mock.calls.at(-1) as unknown as any[])![0] as any;
		expect(lastCall.page).toBe(2);
		mockGetServiceEvents.mockClear();

		const desdeInput = screen.getByLabelText(/Desde/i) as HTMLInputElement;
		fireEvent.change(desdeInput, { target: { value: "2025-01-01" } });
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		lastCall = (mockGetServiceEvents.mock.calls.at(-1) as unknown as any[])![0] as any;
		expect(lastCall.page).toBe(2);
		expect(lastCall.startDate).toBe("2025-01-01");
		mockGetServiceEvents.mockClear();

		const panel = getPanel();
		const tipoLabel = within(panel).getByText(/^Tipo$/i);
		const tipoBtn = within(tipoLabel.closest("div") as HTMLElement).getByRole("button");
		fireEvent.click(tipoBtn);
		const creacionOption = await screen.findByText("Creación");
		fireEvent.click(creacionOption);
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		lastCall = (mockGetServiceEvents.mock.calls.at(-1) as unknown as any[])![0] as any;
		expect(lastCall.page).toBe(2);
		expect(lastCall.kind).toBe("created");
		mockGetServiceEvents.mockClear();

		const estadoLabel = within(panel).getByText(/^Estado$/i);
		const estadoBtn = within(estadoLabel.closest("div") as HTMLElement).getByRole("button");
		fireEvent.click(estadoBtn);
		const pendienteOption = await screen.findByText("Pendiente");
		fireEvent.click(pendienteOption);
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		lastCall = (mockGetServiceEvents.mock.calls.at(-1) as unknown as any[])![0] as any;
		expect(lastCall.page).toBe(2);
		expect(lastCall.status).toBe("pending");
		mockGetServiceEvents.mockClear();

		const clearBtn = screen.getByTitle(/Limpiar filtros/i);
		fireEvent.click(clearBtn);
		await waitFor(() => expect(mockGetServiceEvents).toHaveBeenCalled());
		lastCall = (mockGetServiceEvents.mock.calls.at(-1) as unknown as any[])![0] as any;
		expect(lastCall.page).toBe(1);
		expect(lastCall.startDate).toBeUndefined();
		expect(lastCall.kind).toBeUndefined();
		expect(lastCall.status).toBeUndefined();
	});

	it("removed outer disclosure affordances are absent (source-level)", async () => {
		const fs = await import("node:fs");
		const path = await import("node:path");
		const src = fs.readFileSync(
			path.join(process.cwd(), "app/(app)/service-events/serviceEventsManager.tsx"),
			"utf8",
		);
		expect(src).not.toMatch(/showFilters/);
		expect(src).not.toMatch(/\{showFilters &&/);
		expect(src).not.toMatch(/setShowFilters/);
		expect(src).toMatch(/<h2[^>]*>\s*FILTROS DE BÚSQUEDA\s*<\/h2>/);
		expect(src).not.toMatch(/onClick.*setShowFilters/);
		const headingLine = src.split("\n").find((l) => l.includes("FILTROS DE BÚSQUEDA")) ?? "";
		expect(headingLine).not.toMatch(/aria-expanded/);
		expect(src).toMatch(/className="grid grid-cols-1/);
	});
});
