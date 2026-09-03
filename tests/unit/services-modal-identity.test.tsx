import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	usePathname: () => "/dashboard",
	redirect: vi.fn(),
	useSearchParams: () => new URLSearchParams(),
}));

describe("ServiceModal identity immutability — UI blocks identity edits", () => {
	beforeEach(() => vi.clearAllMocks());

	it("source shows identity fields read-only or omitted when editing and strips from PUT payload", () => {
		const src = fs.readFileSync(
			path.join(process.cwd(), "components/services/ServicesModal.tsx"),
			"utf8",
		);
		// must reference identity keys
		expect(src).toContain("clientName");
		expect(src).toContain("invoiceNumber");
		expect(src).toContain("sku");
		// edit mode must render them read-only (disabled/readOnly or plain) not as writable register
		// check that isEditing branch treats identity as readOnly/disabled or omits register
		expect(src).toMatch(
			/isEditing[\s\S]*?clientName[\s\S]*?(readOnly|disabled|Read.only|omitted)/i,
		);
		expect(src).toMatch(
			/isEditing[\s\S]*?invoiceNumber[\s\S]*?(readOnly|disabled|Read.only|omitted)/i,
		);
		expect(src).toMatch(/isEditing[\s\S]*?sku[\s\S]*?(readOnly|disabled|Read.only|omitted)/i);
		// performSubmit must strip identity before fetch for PUT
		expect(src).toContain("clientName");
		expect(src).toContain("invoiceNumber");
		// payload stripping for edit should include identity keys in destructuring
		expect(src).toMatch(/const\s*\{\s*status[^}]*clientName|clientName[^}]*invoiceNumber[^}]*sku/);
		// or explicit delete / omit
		expect(src).toMatch(/_clientName|_invoiceNumber|_sku|clientName.*invoiceNumber.*sku/);
	});

	it("rendered edit: identity not editable, mutable fields editable", async () => {
		const { ServiceModal } = await import("@/components/services/ServicesModal");
		const service = {
			id: "pb15svc00010010",
			clientName: "Cliente A",
			invoiceNumber: "INV-B",
			sku: "SKU-C",
			rut: "12.345.678-5",
			contact: "+56 9 1234 5678",
			product: "Laptop",
			locationId: "loc1",
			entryDate: new Date().toISOString(),
			status: "pending" as const,
			failureDescription: "No enciende",
			email: "a@b.com",
			repairCost: 1000,
			notes: "nota",
			userId: "u1",
		} as any;
		const { container } = render(
			React.createElement(ServiceModal, {
				isOpen: true,
				onClose: () => {},
				onSuccess: () => {},
				ServiceToEdit: service,
				availableLocations: [{ id: "loc1", name: "Sede 1" }],
			}),
		);
		// identity fields must be present but not as editable inputs with register (readOnly/disabled or plain text)
		// We check they are NOT writable text inputs that accept typing
		// For sku/invoiceNumber/clientName, they should be readOnly/disabled or not present as enabled inputs
		const skuInput = container.querySelector("#sku") as HTMLInputElement | null;
		if (skuInput) {
			expect(skuInput.readOnly || skuInput.disabled).toBe(true);
		} else {
			// if omitted, check that text is displayed read-only
			expect(container.textContent).toContain("SKU-C");
		}
		const invInput = container.querySelector("#invoiceNumber") as HTMLInputElement | null;
		if (invInput) {
			expect(invInput.readOnly || invInput.disabled).toBe(true);
		} else {
			expect(container.textContent).toContain("INV-B");
		}
		const clientInput = container.querySelector("#clientName") as HTMLInputElement | null;
		if (clientInput) {
			expect(clientInput.readOnly || clientInput.disabled).toBe(true);
		} else {
			expect(container.textContent).toContain("Cliente A");
		}
		// mutable fields must be editable
		const contact = container.querySelector("#contact") as HTMLInputElement | null;
		expect(contact, "contact must be editable in edit").not.toBeNull();
		expect(contact!.readOnly).toBe(false);
		expect(contact!.disabled).toBe(false);

		const failure = container.querySelector("#failureDescription") as HTMLTextAreaElement | null;
		expect(failure, "failureDescription must be editable in edit").not.toBeNull();
		expect(failure!.readOnly).toBe(false);
		expect(failure!.disabled).toBe(false);

		const email = container.querySelector("#email") as HTMLInputElement | null;
		expect(email).not.toBeNull();
		expect(email!.readOnly).toBe(false);

		const repair = container.querySelector("#repairCost") as HTMLInputElement | null;
		expect(repair).not.toBeNull();

		const notes = container.querySelector("#notes") as HTMLTextAreaElement | null;
		expect(notes).not.toBeNull();
	});

	it("submit in edit strips identity from PUT payload", async () => {
		const { ServiceModal } = await import("@/components/services/ServicesModal");
		const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
		(global as any).fetch = fetchMock;
		const service = {
			id: "pb15svc00010011",
			clientName: "Cliente A",
			invoiceNumber: "INV-B",
			sku: "SKU-C",
			rut: "12.345.678-5",
			contact: "+56 9 1234 5678",
			product: "Laptop",
			locationId: "loc1",
			entryDate: new Date().toISOString(),
			status: "pending" as const,
			failureDescription: "No enciende",
			email: "a@b.com",
			repairCost: 1000,
			notes: "nota",
			userId: "u1",
		} as any;
		const { container } = render(
			React.createElement(ServiceModal, {
				isOpen: true,
				onClose: () => {},
				onSuccess: () => {},
				ServiceToEdit: service,
				availableLocations: [{ id: "loc1", name: "Sede 1" }],
			}),
		);
		// change mutable field
		const contact = container.querySelector("#contact") as HTMLInputElement;
		// contact is formatted Chilean phone, but we can fire change
		await act(async () => {
			fireEvent.change(contact, { target: { value: "+56 9 8765 4321" } });
		});
		const notes = container.querySelector("#notes") as HTMLTextAreaElement;
		await act(async () => {
			fireEvent.change(notes, { target: { value: "nueva" } });
		});
		// submit via button
		const submitBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Actualizar"),
		) as HTMLButtonElement;
		expect(submitBtn).toBeDefined();
		await act(async () => {
			fireEvent.click(submitBtn!);
		});
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [url, opts] = fetchMock.mock.calls[0] as unknown as [string, any];
		expect(url).toBe("/api/services");
		expect(opts.method).toBe("PUT");
		const payload = JSON.parse(opts.body as string);
		expect(payload.id).toBe("pb15svc00010011");
		expect(payload).not.toHaveProperty("clientName");
		expect(payload).not.toHaveProperty("invoiceNumber");
		expect(payload).not.toHaveProperty("sku");
		expect(payload).not.toHaveProperty("status");
		expect(payload).not.toHaveProperty("locationId");
		// mutable should be present
		expect(payload.notes).toBe("nueva");
		(global as any).fetch = undefined;
	});

	it("create still sends identity fields via POST", async () => {
		const { ServiceModal } = await import("@/components/services/ServicesModal");
		const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
		(global as any).fetch = fetchMock;
		const { container } = render(
			React.createElement(ServiceModal, {
				isOpen: true,
				onClose: () => {},
				onSuccess: () => {},
				ServiceToEdit: null,
				availableLocations: [{ id: "loc1", name: "Sede 1" }],
			}),
		);
		// fill required create fields
		const inv = container.querySelector("#invoiceNumber") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(inv, { target: { value: "INV-NEW" } });
		});
		const sku = container.querySelector("#sku") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(sku, { target: { value: "SKU-NEW" } });
		});
		const client = container.querySelector("#clientName") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(client, { target: { value: "Cliente Nuevo" } });
		});
		const prod = container.querySelector("#product") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(prod, { target: { value: "Equipo" } });
		});
		const rut = container.querySelector("#rut") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(rut, { target: { value: "12.345.678-5" } });
		});
		const contact = container.querySelector("#contact") as HTMLInputElement;
		await act(async () => {
			fireEvent.change(contact, { target: { value: "+56 9 1111 2222" } });
		});
		const fail = container.querySelector("#failureDescription") as HTMLTextAreaElement;
		await act(async () => {
			fireEvent.change(fail, { target: { value: "Falla" } });
		});
		const submitBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Guardar servicio"),
		) as HTMLButtonElement;
		expect(submitBtn).toBeDefined();
		await act(async () => {
			fireEvent.click(submitBtn!);
		});
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [, opts] = fetchMock.mock.calls[0] as unknown as [string, any];
		expect(opts.method).toBe("POST");
		const payload = JSON.parse(opts.body as string);
		expect(payload.invoiceNumber).toBe("INV-NEW");
		expect(payload.clientName).toBe("Cliente Nuevo");
		expect(payload.sku).toBe("SKU-NEW");
		(global as any).fetch = undefined;
	});
});
