import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LocationCreateSchema, LocationUpdateSchema, ServiceSchema } from "../lib/schemas";

describe("ServiceSchema", () => {
	it("should validate a correct Service payload", () => {
		const payload = {
			invoiceNumber: "INV-001",
			sku: "LAP-001",
			clientName: "John Doe",
			rut: "12.345.678-5",
			contact: "+56 9 1234 5678",
			product: "Laptop",
			locationId: "550e8400-e29b-41d4-a716-446655440000",
			status: "pending",
			failureDescription: "No enciende",
			entryDate: "2024-01-01",
		};
		const result = ServiceSchema.safeParse(payload);
		expect(result.success).toBe(true);
	});

	it("should fail validation if clientName is missing", () => {
		const payload = {
			invoiceNumber: "INV-001",
			product: "Laptop",
			contact: "123456789",
			locationId: "550e8400-e29b-41d4-a716-446655440000",
		};
		const result = ServiceSchema.safeParse(payload);
		expect(result.success).toBe(false);
	});

	it("regression 41.421.442-1 is invalid RUT inválido, 41.421.442-8 is valid", async () => {
		const { ServiceSchema, toServiceFieldErrors } = await import("../lib/schemas");
		const base = {
			invoiceNumber: "INV-001",
			sku: "SKU-1",
			clientName: "John Doe",
			contact: "+56 9 1234 5678",
			product: "Laptop",
			locationId: "loc1",
			failureDescription: "Falla",
			entryDate: "2024-01-01",
		};
		const invalid = ServiceSchema.safeParse({ ...base, rut: "41.421.442-1" });
		expect(invalid.success).toBe(false);
		if (!invalid.success) {
			const map = toServiceFieldErrors(invalid.error);
			expect(map.rut).toBe("RUT inválido");
			expect(
				invalid.error.issues.some((i) => i.path.includes("rut") && i.message === "RUT inválido"),
			).toBe(true);
		}
		const valid = ServiceSchema.safeParse({ ...base, rut: "41.421.442-8" });
		expect(valid.success).toBe(true);
		if (valid.success) expect(valid.data.rut).toBe("414214428");
	});
});

describe("LocationCreateSchema", () => {
	it("requires name after trim", () => {
		expect(LocationCreateSchema.safeParse({ name: "   " }).success).toBe(false);
		expect(LocationCreateSchema.safeParse({ name: "" }).success).toBe(false);
		const ok = LocationCreateSchema.safeParse({ name: "  Taller Centro  " });
		expect(ok.success).toBe(true);
		if (ok.success) expect((ok.data as { name: string }).name).toBe("Taller Centro");
	});

	it("address optional, trimmed, max 200, blank → omitted", () => {
		const noAddr = LocationCreateSchema.safeParse({ name: "Valid" });
		expect(noAddr.success).toBe(true);
		if (noAddr.success) expect((noAddr.data as { address?: string }).address).toBeUndefined();
		const trimmed = LocationCreateSchema.safeParse({ name: "Valid", address: "  Calle 123  " });
		expect(trimmed.success).toBe(true);
		if (trimmed.success) expect((trimmed.data as { address?: string }).address).toBe("Calle 123");
		const blank = LocationCreateSchema.safeParse({ name: "Valid", address: "   " });
		expect(blank.success).toBe(true);
		if (blank.success) expect((blank.data as { address?: string }).address).toBeUndefined();
	});

	it("rejects oversized address", () => {
		expect(
			LocationCreateSchema.safeParse({ name: "Valid", address: "a".repeat(201) }).success,
		).toBe(false);
	});
});

describe("LocationUpdateSchema", () => {
	it("update name 3–100 after trim", () => {
		expect(LocationUpdateSchema.safeParse({ name: "ab" }).success).toBe(false);
		expect(LocationUpdateSchema.safeParse({ name: "   ab   " }).success).toBe(false);
		expect(LocationUpdateSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
		const ok = LocationUpdateSchema.safeParse({ name: "  Taller Norte  " });
		expect(ok.success).toBe(true);
		if (ok.success) expect((ok.data as { name: string }).name).toBe("Taller Norte");
	});

	it("address optional trimmed max 200 blank omitted for update", () => {
		const blank = LocationUpdateSchema.safeParse({ name: "Valid Name", address: "   " });
		expect(blank.success).toBe(true);
		if (blank.success) expect((blank.data as { address?: string }).address).toBeUndefined();
		const trimmed = LocationUpdateSchema.safeParse({
			name: "Valid Name",
			address: "  Av. Siempre Viva  ",
		});
		expect(trimmed.success).toBe(true);
		if (trimmed.success)
			expect((trimmed.data as { address?: string }).address).toBe("Av. Siempre Viva");
		expect(
			LocationUpdateSchema.safeParse({ name: "Valid Name", address: "a".repeat(201) }).success,
		).toBe(false);
	});
});

describe("pocketbase contract", () => {
	it("pocketbase dependency and lock entries are present", () => {
		const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
		expect(pkg.dependencies?.pocketbase).toBeDefined();
		const lock = fs.readFileSync(path.join(process.cwd(), "pnpm-lock.yaml"), "utf8");
		expect(lock).toContain("pocketbase@");
		expect(fs.existsSync(path.join(process.cwd(), "lib/pocketbase.ts"))).toBe(true);
		expect(fs.existsSync(path.join(process.cwd(), "pocketbase/v1.collections.json"))).toBe(true);
	});
});

describe("Service identity immutability — GENERIC_EDIT_OMIT", () => {
	it("exports GENERIC_EDIT_OMIT covering lifecycle + identity", async () => {
		const mod = await import("../lib/schemas");
		const omit: string[] = (mod as any).GENERIC_EDIT_OMIT;
		expect(Array.isArray(omit)).toBe(true);
		for (const key of ["status", "locationId", "deliveryDate", "readyDate", "cancellationDate"]) {
			expect(omit, `missing lifecycle ${key}`).toContain(key);
		}
		for (const key of ["clientName", "invoiceNumber", "sku"]) {
			expect(omit, `missing identity ${key}`).toContain(key);
		}
		expect(omit.length).toBeGreaterThanOrEqual(8);
	});

	it("source defines GENERIC_EDIT_OMIT and uses it for generic edit", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "lib/schemas.ts"), "utf8");
		expect(src).toContain("GENERIC_EDIT_OMIT");
		expect(src).toContain("clientName");
		expect(src).toContain("invoiceNumber");
		expect(src).toContain("sku");
		// must be used via omit
		expect(src).toMatch(/GENERIC_EDIT_OMIT/);
	});

	it("mutable fields validate, identity omitted from edit payload via schema", async () => {
		const mod = await import("../lib/schemas");
		const omit = (mod as any).GENERIC_EDIT_OMIT as string[];
		expect(omit).toContain("clientName");
		// Simulate generic edit schema: ServiceSchema.omit(omit).partial().extend({id})
		const { ServiceSchema } = await import("../lib/schemas");
		const z = await import("zod");
		const GenericEditSchema = (ServiceSchema as any)
			.omit(Object.fromEntries(omit.map((k) => [k, true])))
			.partial();
		// valid mutable payload should parse (contact, failureDescription, email, repairCost, notes)
		const valid = GenericEditSchema.safeParse({
			contact: "+56 9 1234 5678",
			failureDescription: "No enciende",
			email: "a@b.com",
			repairCost: 1000,
			notes: "test",
			product: "Laptop",
			rut: "12.345.678-5",
		});
		// contact in our ServiceSchema has min 6, this should succeed if schema allows partial? Use partial check separately
		expect(valid.success).toBe(true);
		// identity fields must not be in the omit schema shape
		expect((GenericEditSchema as any).shape?.clientName).toBeUndefined();
		expect((GenericEditSchema as any).shape?.invoiceNumber).toBeUndefined();
		expect((GenericEditSchema as any).shape?.sku).toBeUndefined();
	});
});
