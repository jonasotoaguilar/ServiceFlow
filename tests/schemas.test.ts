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
