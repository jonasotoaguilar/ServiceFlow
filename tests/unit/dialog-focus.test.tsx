import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Dialog } from "@/components/ui/dialog";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	usePathname: () => "/dashboard",
	redirect: vi.fn(),
	useSearchParams: () => new URLSearchParams(),
}));

describe("Dialog focus stability — rerender with new onClose identity does not steal focus", () => {
	it("keeps focus on field after onClose identity changes (alert rerender)", async () => {
		function Wrapper({ onClose }: { onClose: () => void }) {
			return React.createElement(
				Dialog as any,
				{ isOpen: true, onClose, title: "Focus test" },
				React.createElement("input", { id: "rut", placeholder: "rut" }),
				React.createElement("input", { id: "other", placeholder: "other" }),
			);
		}

		const onClose1 = vi.fn();
		const { rerender } = render(React.createElement(Wrapper, { onClose: onClose1 }));

		// Wait for initial rAF focus (Dialog focuses first focusable — close button)
		await act(async () => {
			await new Promise((r) => setTimeout(r, 30));
		});

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();

		const rut = document.getElementById("rut") as HTMLInputElement;
		expect(rut).not.toBeNull();

		// Simulate user focusing field after open
		await act(async () => {
			rut.focus();
		});
		expect(document.activeElement).toBe(rut);

		// Rerender with new onClose identity (simulates alert state causing parent rerender)
		const onClose2 = vi.fn();
		await act(async () => {
			rerender(React.createElement(Wrapper, { onClose: onClose2 }));
		});

		// Allow any spurious rAF that would steal focus to run
		await act(async () => {
			await new Promise((r) => setTimeout(r, 30));
		});

		// Focus must remain on field, not stolen back to close button
		expect(document.activeElement).toBe(rut);
		expect(document.activeElement?.getAttribute("aria-label")).not.toBe("Cerrar");

		const closeBtn = screen.getByRole("button", { name: /cerrar/i });
		expect(document.activeElement).not.toBe(closeBtn);

		// Escape must still call latest onClose
		await act(async () => {
			fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
		});
		expect(onClose2).toHaveBeenCalledTimes(1);
		expect(onClose1).not.toHaveBeenCalled();
	});

	it("ServiceModal invalid RUT keeps focus on RUT with inline error", async () => {
		const { ServiceModal } = await import("@/components/services/ServicesModal");

		const { container } = render(
			React.createElement(ServiceModal as any, {
				isOpen: true,
				onClose: vi.fn(),
				onSuccess: vi.fn(),
				ServiceToEdit: null,
				availableLocations: [{ id: "loc1", name: "Sede 1" }],
			}),
		);

		// Wait for dialog open focus
		await act(async () => {
			await new Promise((r) => setTimeout(r, 30));
		});

		// Fill required fields with valid data except RUT invalid
		const entryDate = container.querySelector("#entryDate") as HTMLInputElement;
		const invoice = container.querySelector("#invoiceNumber") as HTMLInputElement;
		const sku = container.querySelector("#sku") as HTMLInputElement;
		const client = container.querySelector("#clientName") as HTMLInputElement;
		const rut = container.querySelector("#rut") as HTMLInputElement;
		const contact = container.querySelector("#contact") as HTMLInputElement;
		const product = container.querySelector("#product") as HTMLInputElement;
		const failure = container.querySelector("#failureDescription") as HTMLTextAreaElement;

		expect(entryDate).not.toBeNull();
		expect(rut).not.toBeNull();

		// Mock fetch to ensure validation failure does not hit network
		const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
		(global as any).fetch = fetchMock;

		await act(async () => {
			fireEvent.change(entryDate, { target: { value: "2026-09-03" } });
			fireEvent.change(invoice, { target: { value: "INV-001" } });
			fireEvent.change(sku, { target: { value: "SKU-001" } });
			fireEvent.change(client, { target: { value: "Juan Perez" } });
			// Invalid RUT (bad check digit — valid would be 12.345.678-5)
			fireEvent.change(rut, { target: { value: "12.345.678-9" } });
			fireEvent.change(contact, { target: { value: "+56 9 1234 5678" } });
			fireEvent.change(product, { target: { value: "Laptop" } });
			fireEvent.change(failure, { target: { value: "No enciende" } });
		});

		// Location already defaults to loc1

		const submit = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Guardar servicio"),
		) as HTMLButtonElement;
		expect(submit).toBeDefined();

		await act(async () => {
			fireEvent.click(submit);
		});

		// Wait for validation and focus
		await waitFor(() => {
			expect(rut.getAttribute("aria-invalid")).toBe("true");
		});

		await waitFor(() => {
			const err = container.querySelector("#rut-error");
			expect(err).not.toBeNull();
			expect(err?.textContent).toMatch(/RUT inválido/);
		});

		// Focus must be on RUT, not close button
		await waitFor(() => {
			expect(document.activeElement).toBe(rut);
		});

		const closeBtn = screen.getByRole("button", { name: /cerrar/i });
		expect(document.activeElement).not.toBe(closeBtn);

		// Values retained, fetch must not have been called (validation blocked)
		expect(fetchMock).not.toHaveBeenCalled();
		expect(invoice.value).toBe("INV-001");
		expect(client.value).toBe("Juan Perez");
		expect(rut.value).toContain("12.345.678-9");
		(global as any).fetch = undefined;
	});
});
