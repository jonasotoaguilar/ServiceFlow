import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("RUT normalize + modulo-11 — lib/rut.ts (Unit 6 RED 3.3)", () => {
	describe("normalizeRut strips dots, hyphens, spaces and uppercases K", () => {
		it("strips dots, hyphen, spaces and uppercases trailing k", async () => {
			const { normalizeRut } = await import("@/lib/rut");
			expect(normalizeRut("12.345.678-5")).toBe("123456785");
			expect(normalizeRut("12.345.678 - 5")).toBe("123456785");
			expect(normalizeRut(" 12.345.678-5 ")).toBe("123456785");
			expect(normalizeRut("12 345 678 5")).toBe("123456785");
			expect(normalizeRut("76086428-5")).toBe("760864285");
			expect(normalizeRut("6-k")).toBe("6K");
			expect(normalizeRut("6-K")).toBe("6K");
			expect(normalizeRut("12851872-k")).toBe("12851872K");
		});

		it("triangulate: different body with dots/spaces/hyphen variants normalize identically", async () => {
			const { normalizeRut } = await import("@/lib/rut");
			expect(normalizeRut("6.643.210-8")).not.toBe("12851872K");
			expect(normalizeRut("12.851.872-K")).toBe("12851872K");
			expect(normalizeRut("12.851872-K")).toBe("12851872K");
			expect(normalizeRut("12851872K")).toBe("12851872K");
			expect(normalizeRut(" 1.285.1872 - k ")).toBe("12851872K");
		});

		it("empty and whitespace-only normalize to empty", async () => {
			const { normalizeRut } = await import("@/lib/rut");
			expect(normalizeRut("")).toBe("");
			expect(normalizeRut("   ")).toBe("");
			expect(normalizeRut(" - ")).toBe("");
		});
	});

	describe("modulo-11 valid cases — isValidRut", () => {
		it("formatted valid RUT 12.345.678-5 passes modulo-11", async () => {
			const { isValidRut } = await import("@/lib/rut");
			expect(isValidRut("12.345.678-5")).toBe(true);
			expect(isValidRut("12345678-5")).toBe(true);
			expect(isValidRut("123456785")).toBe(true);
		});

		it("valid K check digit accepted with any common punctuation and case", async () => {
			const { isValidRut } = await import("@/lib/rut");
			// 6-K is valid because 6 % 11 => K (computed)
			expect(isValidRut("6-K")).toBe(true);
			expect(isValidRut("6-k")).toBe(true);
			expect(isValidRut("6K")).toBe(true);
			// larger K body: 12851872-K known K example
			expect(isValidRut("12.851.872-K")).toBe(true);
			expect(isValidRut("12851872-K")).toBe(true);
			expect(isValidRut("12851872-k")).toBe(true);
			expect(isValidRut(" 12.851.872 - k ")).toBe(true);
		});

		it("valid zero check digit accepted", async () => {
			const { isValidRut } = await import("@/lib/rut");
			// 14-0 is valid (14 body yields 0)
			expect(isValidRut("14-0")).toBe(true);
			expect(isValidRut("14.0")).toBe(true);
			// 76000000-0 body yields 0
			expect(isValidRut("76.000.000-0")).toBe(true);
			expect(isValidRut("760000000")).toBe(true);
			expect(isValidRut("6432108-0")).toBe(true);
		});

		it("triangulate: second distinct zero case with formatting", async () => {
			const { isValidRut } = await import("@/lib/rut");
			expect(isValidRut("8.037.049-0")).toBe(true);
			expect(isValidRut("80370490")).toBe(true);
			expect(isValidRut(" 8037049 -0 ")).toBe(true);
		});
	});

	describe("modulo-11 invalid cases — must reject", () => {
		it("wrong check digit is rejected (12.345.678-0 when computed DV is 5)", async () => {
			const { isValidRut } = await import("@/lib/rut");
			expect(isValidRut("12.345.678-0")).toBe(false);
			expect(isValidRut("12.345.678-K")).toBe(false);
			expect(isValidRut("12.345.678-1")).toBe(false);
			expect(isValidRut("6-0")).toBe(false); // 6 should be K not 0
			expect(isValidRut("14-K")).toBe(false); // 14 should be 0 not K
		});

		it("regression 41.421.442-1 is invalid, 41.421.442-8 is valid (DV 8)", async () => {
			const { isValidRut, computeCheckDigit, normalizeRut } = await import("@/lib/rut");
			expect(computeCheckDigit("41421442")).toBe("8");
			expect(normalizeRut("41.421.442-1")).toBe("414214421");
			expect(normalizeRut("41.421.442-8")).toBe("414214428");
			expect(isValidRut("41.421.442-1")).toBe(false);
			expect(isValidRut("41.421.442-8")).toBe(true);
			expect(isValidRut("414214421")).toBe(false);
			expect(isValidRut("414214428")).toBe(true);
		});

		it("malformed body is rejected: missing DV, letters, DV too long, embedded letters", async () => {
			const { isValidRut } = await import("@/lib/rut");
			expect(isValidRut("12.345.678")).toBe(false); // missing DV
			expect(isValidRut("abcdefgh-k")).toBe(false);
			expect(isValidRut("12.345.678-99")).toBe(false);
			expect(isValidRut("12.345.678-K5")).toBe(false);
			expect(isValidRut("12a345678-5")).toBe(false); // embedded letter
			expect(isValidRut("12.345.678-a")).toBe(false); // invalid DV
			expect(isValidRut("")).toBe(false);
			expect(isValidRut("   ")).toBe(false);
			expect(isValidRut("-")).toBe(false);
			expect(isValidRut("K")).toBe(false);
		});

		it("triangulate malformed with hyphen/space tricks still rejected", async () => {
			const { isValidRut } = await import("@/lib/rut");
			expect(isValidRut("12.345.678-")).toBe(false);
			expect(isValidRut("--5")).toBe(false);
			// double dots/hyphens stripped still yields valid body — proves normalization strips correctly
			expect(isValidRut("12..345..678--5")).toBe(true);
			// extra trailing hyphen stripped still leaves valid RUT — normalized form strips hyphens
			expect(isValidRut("12.345.678-5-")).toBe(true);
			// truly malformed with extra DV digit (99) must still be rejected even after stripping
			expect(isValidRut("12.345.678-99")).toBe(false);
		});
	});

	describe("computeCheckDigit pure helper", () => {
		it("computes correct DV for known bodies", async () => {
			const { computeCheckDigit } = await import("@/lib/rut");
			expect(computeCheckDigit("12345678")).toBe("5");
			expect(computeCheckDigit("6")).toBe("K");
			expect(computeCheckDigit("14")).toBe("0");
			expect(computeCheckDigit("76000000")).toBe("0");
			expect(computeCheckDigit("12851872")).toBe("K");
		});
	});

	describe("ServiceSchema uses shared lib/rut — required + normalized + modulo-11 on client and server", () => {
		it("lib/schemas.ts imports from lib/rut (single algorithm, no second copy)", () => {
			const src = read("lib/schemas.ts");
			expect(src).toMatch(/from\s+["']\.\/rut["']|from\s+["']@\/lib\/rut["']|lib\/rut/);
			expect(src).toMatch(/normalizeRut|isValidRut|validateRut|rut\.ts/);
			// Ensure no duplicate modulo-11 logic in schemas.ts itself
			expect(src).not.toMatch(/factors? 2.*7|11.*remainder/i);
			// Must contain rut field with refinement
			expect(src).toMatch(/rut/);
		});

		it("lib/rut.ts exports normalize and isValid and does not duplicate elsewhere", () => {
			const src = read("lib/rut.ts");
			expect(src).toContain("normalizeRut");
			expect(src).toContain("isValidRut");
			expect(src).toMatch(/11|modulo|factor/i);
		});

		it("formatted valid RUT accepted by ServiceSchema and stored normalized", async () => {
			const { ServiceSchema } = await import("@/lib/schemas");
			const base = {
				invoiceNumber: "INV-1",
				sku: "SKU-1",
				clientName: "Juan Perez",
				contact: "+56 9 1234 5678",
				product: "Laptop",
				locationId: "loc_1",
				failureDescription: "Falla",
				entryDate: "2024-01-01",
			};
			const res = ServiceSchema.safeParse({ ...base, rut: "12.345.678-5" });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.rut).toBe("123456785");
			}
			const res2 = ServiceSchema.safeParse({ ...base, rut: "6-k" });
			expect(res2.success).toBe(true);
			if (res2.success) expect(res2.data.rut).toBe("6K");
			const res3 = ServiceSchema.safeParse({ ...base, rut: "76.000.000-0" });
			expect(res3.success).toBe(true);
			if (res3.success) expect(res3.data.rut).toBe("760000000");
		});

		it("missing RUT is rejected on create and on edit (empty, whitespace, omitted)", async () => {
			const { ServiceSchema } = await import("@/lib/schemas");
			const base = {
				invoiceNumber: "INV-1",
				clientName: "Juan Perez",
				contact: "+56 9 1234 5678",
				product: "Laptop",
				locationId: "loc_1",
			};
			expect(ServiceSchema.safeParse({ ...base, rut: "" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "   " }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: undefined }).success).toBe(false);
			// omitted entirely
			const { rut: _omit, ...withoutRut } = { ...base, rut: "12.345.678-5" } as any;
			delete (withoutRut as any).rut;
			expect(ServiceSchema.safeParse(withoutRut).success).toBe(false);
		});

		it("wrong check digit rejected by ServiceSchema (client and server share same rules)", async () => {
			const { ServiceSchema } = await import("@/lib/schemas");
			const base = {
				invoiceNumber: "INV-1",
				sku: "SKU-1",
				clientName: "Juan Perez",
				contact: "+56 9 1234 5678",
				product: "Laptop",
				locationId: "loc_1",
				failureDescription: "Falla",
				entryDate: "2024-01-01",
			};
			expect(ServiceSchema.safeParse({ ...base, rut: "12.345.678-0" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "6-0" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "14-K" }).success).toBe(false);
		});

		it("malformed RUT rejected by ServiceSchema (both client and server)", async () => {
			const { ServiceSchema } = await import("@/lib/schemas");
			const base = {
				invoiceNumber: "INV-1",
				sku: "SKU-1",
				clientName: "Juan Perez",
				contact: "+56 9 1234 5678",
				product: "Laptop",
				locationId: "loc_1",
				failureDescription: "Falla",
				entryDate: "2024-01-01",
			};
			expect(ServiceSchema.safeParse({ ...base, rut: "12.345.678" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "abcdefgh-k" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "12.345.678-99" }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "12a345678-5" }).success).toBe(false);
		});

		it("historic invalid RUT remains readable (isValid returns false but no auto-migration); new write must fix it", async () => {
			const { isValidRut, normalizeRut } = await import("@/lib/rut");
			const { ServiceSchema } = await import("@/lib/schemas");
			const historicInvalid = "12.345.678-0"; // invalid but stored historically
			// Historic value is still readable: normalize still works, isValid is false
			expect(normalizeRut(historicInvalid)).toBe("123456780");
			expect(isValidRut(historicInvalid)).toBe(false);
			// Display does not force write — reading historic does not mutate
			// New edit that includes same invalid rut must be rejected until valid supplied
			const base = {
				invoiceNumber: "INV-1",
				sku: "SKU-1",
				clientName: "Juan Perez",
				contact: "+56 9 1234 5678",
				product: "Laptop",
				locationId: "loc_1",
				failureDescription: "Falla",
				entryDate: "2024-01-01",
			};
			expect(ServiceSchema.safeParse({ ...base, rut: historicInvalid }).success).toBe(false);
			expect(ServiceSchema.safeParse({ ...base, rut: "12.345.678-5" }).success).toBe(true);
		});

		it("server validation shares same module: safeParse rejects even if client bypassed (Zod server boundary)", async () => {
			const { ServiceSchema } = await import("@/lib/schemas");
			// Simulate server bypass: direct JSON payload with invalid RUT
			const payload = {
				invoiceNumber: "INV-999",
				sku: "SKU-999",
				clientName: "Bypass Test",
				contact: "+56 9 9999 9999",
				product: "Phone",
				locationId: "loc_99",
				failureDescription: "Falla",
				entryDate: "2024-01-01",
				rut: "12.345.678-0", // invalid but client could be bypassed
			};
			const serverResult = ServiceSchema.safeParse(payload);
			expect(serverResult.success).toBe(false);
			if (!serverResult.success) {
				expect(serverResult.error.issues.some((i) => String(i.path).includes("rut"))).toBe(true);
			}
		});
	});

	describe("isRutShapedLookup — Unit 6 RUT search shape (RED 6.1)", () => {
		it("isRutShapedLookup exists and detects RUT-shaped stripped input", async () => {
			const { isRutShapedLookup } = await import("@/lib/rut");
			expect(typeof isRutShapedLookup).toBe("function");
			// Formatted, plain, and K-case variants are RUT-shaped after stripping [.\\-\\s]
			expect(isRutShapedLookup("20.884.087-K")).toBe(true);
			expect(isRutShapedLookup("20884087-k")).toBe(true);
			expect(isRutShapedLookup("20884087k")).toBe(true);
			expect(isRutShapedLookup(" 20.884.087 - K ")).toBe(true);
			expect(isRutShapedLookup("12.345.678-5")).toBe(true);
			expect(isRutShapedLookup("12.345.678 - 5")).toBe(true);
			expect(isRutShapedLookup("123456785")).toBe(true);
		});

		it("whitespace and hyphen variants stay RUT-shaped", async () => {
			const { isRutShapedLookup } = await import("@/lib/rut");
			expect(isRutShapedLookup(" 20 884 087 K ")).toBe(true);
			expect(isRutShapedLookup("20-884-087-K")).toBe(true);
			expect(isRutShapedLookup("20 884.087- k")).toBe(true);
		});

		it("non-RUT-shaped text stays not RUT-shaped", async () => {
			const { isRutShapedLookup } = await import("@/lib/rut");
			expect(isRutShapedLookup("20Ab")).toBe(false);
			expect(isRutShapedLookup("Juan Perez")).toBe(false);
			expect(isRutShapedLookup("INV-123")).toBe(false);
			expect(isRutShapedLookup("20.884.087-KX")).toBe(false);
			expect(isRutShapedLookup("abc")).toBe(false);
			expect(isRutShapedLookup("12.345.678-99")).toBe(false);
		});

		it("empty and whitespace-only are not RUT-shaped and remain unfiltered", async () => {
			const { isRutShapedLookup } = await import("@/lib/rut");
			expect(isRutShapedLookup("")).toBe(false);
			expect(isRutShapedLookup("   ")).toBe(false);
			expect(isRutShapedLookup(" - ")).toBe(false);
			expect(isRutShapedLookup(" . ")).toBe(false);
		});

		it("triangulate: equivalent spellings normalize identically and all are RUT-shaped", async () => {
			const { isRutShapedLookup, normalizeRut } = await import("@/lib/rut");
			// Use exact normalized digits for the formatted value; never silently change digits (typo note)
			expect(normalizeRut("20.884.087-K")).toBe("20884087K");
			expect(normalizeRut("20884087-k")).toBe("20884087K");
			expect(normalizeRut("20884087k")).toBe("20884087K");
			expect(isRutShapedLookup("20.884.087-K")).toBe(true);
			expect(isRutShapedLookup("20884087-k")).toBe(true);
			expect(isRutShapedLookup("20884087k")).toBe(true);
			// distinct valid RUT also equivalence
			expect(normalizeRut("12.345.678-5")).toBe("123456785");
			expect(normalizeRut("12345678-5")).toBe("123456785");
			expect(normalizeRut("123456785")).toBe("123456785");
		});

		it("isValidRut persistence unchanged — normalizeRut + isValidRut still enforce modulo-11", async () => {
			const { isValidRut, normalizeRut } = await import("@/lib/rut");
			// Valid cases still pass
			expect(isValidRut("12.345.678-5")).toBe(true);
			expect(isValidRut("6-K")).toBe(true);
			// Wrong check digit still rejected
			expect(isValidRut("12.345.678-0")).toBe(false);
			// isRutShapedLookup does NOT weaken validation — it is lookup-only
			expect(isValidRut("20.884.087-K")).toBe(false); // stripped is K but DV mismatch → false, shape true ≠ valid
			expect(normalizeRut("20.884.087-K")).toBe("20884087K");
		});
	});
});
