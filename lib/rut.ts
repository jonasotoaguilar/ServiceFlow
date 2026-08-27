/**
 * Chilean RUT utilities — single source of truth for normalize + modulo-11.
 * Client and server MUST use this module; do not duplicate the algorithm.
 *
 * Normalize: strip dots, hyphens, spaces and uppercase K before validation/storage.
 * Validate: módulo-11 factors 2–7 from the right; remainder 11 → 0, 10 → K.
 */

/**
 * Normalize RUT by stripping dots, hyphens and spaces and uppercasing K.
 * Keeps other characters (letters) so validation can reject malformed bodies.
 */
export function normalizeRut(value: string): string {
	if (typeof value !== "string") return "";
	// strip dots, hyphens and whitespace (space, tab, etc.) then uppercase
	return value.replace(/[.\-\s]/g, "").toUpperCase();
}

/**
 * Compute Chilean módulo-11 check digit for a numeric body.
 * Body must be digits only; returns "" for non-numeric input.
 */
export function computeCheckDigit(body: string): string {
	if (!body || !/^\d+$/.test(body)) return "";
	let sum = 0;
	let factor = 2;
	for (let i = body.length - 1; i >= 0; i--) {
		const digit = Number(body[i]);
		if (!Number.isFinite(digit)) return "";
		sum += digit * factor;
		factor = factor === 7 ? 2 : factor + 1;
	}
	const remainder = 11 - (sum % 11);
	if (remainder === 11) return "0";
	if (remainder === 10) return "K";
	return String(remainder);
}

/**
 * Validate RUT with módulo-11 after normalization.
 * - Accepts any common punctuation (dots, hyphens, spaces) — stripped before check.
 * - Body must be 1–8 digits (covers 1-digit K cases like 6-K through 8-digit 76.000.000-0).
 * - DV must be 0–9 or K (uppercase after normalize).
 * - Empty, whitespace-only, or malformed returns false.
 */
export function isValidRut(value: string): boolean {
	if (typeof value !== "string") return false;
	const normalized = normalizeRut(value);
	if (normalized.length < 2) return false;
	const body = normalized.slice(0, -1);
	const dv = normalized.slice(-1);
	if (!/^\d+$/.test(body)) return false;
	if (!/^[0-9K]$/.test(dv)) return false;
	// Chilean RUT body typically 1–8 digits; reject absurdly long bodies (e.g., 12.345.678-99 → body 9 digits)
	if (body.length < 1 || body.length > 8) return false;
	const expected = computeCheckDigit(body);
	if (!expected) return false;
	return dv === expected;
}

/**
 * Alias for Zod integration — same validation but also usable as predicate.
 */
export const validateRut = isValidRut;
