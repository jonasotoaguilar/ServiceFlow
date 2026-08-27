/**
 * Calendar-stable date formatting for entryDate.
 * Avoids UTC hydration shift: parses YYYY-MM-DD as calendar date, not UTC instant.
 * Interprets date part before T as local calendar components.
 */
const MONTHS_ES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_ES_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function formatEntryDate(entryDate: string): string {
	if (!entryDate) return "";
	// Calendar-stable: take YYYY-MM-DD before T, ignore timezone
	const datePart = entryDate.split("T")[0].split(" ")[0];
	const parts = datePart.split("-");
	if (parts.length !== 3) return entryDate;
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	const d = Number(parts[2]);
	if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return entryDate;
	if (m < 1 || m > 12 || d < 1 || d > 31) return entryDate;
	const monthShort = MONTHS_ES_SHORT[m - 1];
	// dd MMM yyyy — Spanish abbreviated, matching es locale expectation (e.g., 15 ene 2024)
	const dd = String(d).padStart(2, "0");
	return `${dd} ${monthShort} ${y}`;
}

// Aliases for test compatibility
export const formatDate = formatEntryDate;
export const formatCalendarDate = formatEntryDate;
export const formatEntryDateEs = formatEntryDate;

export function formatEntryDateLong(entryDate: string): string {
	if (!entryDate) return "";
	const datePart = entryDate.split("T")[0].split(" ")[0];
	const parts = datePart.split("-");
	if (parts.length !== 3) return entryDate;
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	const d = Number(parts[2]);
	if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return entryDate;
	const monthLong = MONTHS_ES_LONG[m - 1];
	return `${d} de ${monthLong} de ${y}`;
}
