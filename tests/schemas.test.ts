import { describe, it, expect } from "vitest";
import { ServiceSchema } from "../lib/schemas";

describe("ServiceSchema", () => {
	it("should validate a correct Service payload", () => {
		const payload = {
			invoiceNumber: "INV-001",
			sku: "LAP-001",
			clientName: "John Doe",
			rut: "12.345.678-9",
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
