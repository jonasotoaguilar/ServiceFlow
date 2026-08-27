import { differenceInBusinessDays, parseISO } from "date-fns";

export const UPCOMING_MIN = 10;
export const UPCOMING_MAX = 14;
export const CRITICAL_MIN = 15;

export function businessDaysSince(entryDate: string, now: Date = new Date()): number {
	try {
		const start = parseISO(entryDate);
		return differenceInBusinessDays(now, start);
	} catch {
		return 0;
	}
}

export function isUpcoming(days: number): boolean {
	return days >= UPCOMING_MIN && days <= UPCOMING_MAX;
}

export function isCritical(days: number): boolean {
	return days >= CRITICAL_MIN;
}

export function classifyPendingDays(days: number, status: string): "upcoming" | "critical" | null {
	if (status !== "pending") return null;
	if (isUpcoming(days)) return "upcoming";
	if (isCritical(days)) return "critical";
	return null;
}

export function getServiceDays(
	service: { status: string; entryDate: string; deliveryDate?: string },
	now: Date = new Date(),
): number {
	return businessDaysSince(service.entryDate, now);
}
