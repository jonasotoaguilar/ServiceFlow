import type { ServiceStatus } from "./types";

export const ALLOWED: Record<ServiceStatus, ServiceStatus[]> = {
	pending: ["ready", "cancelled"],
	ready: ["completed", "cancelled", "pending"],
	completed: [],
	cancelled: [],
};

export function canTransition(from: ServiceStatus, to: ServiceStatus): boolean {
	return (ALLOWED[from] ?? []).includes(to);
}

export function transitionDates(
	current: {
		status: ServiceStatus;
		readyDate?: string | null;
		deliveryDate?: string | null;
		cancellationDate?: string | null;
	},
	next: ServiceStatus,
	now: string,
): { readyDate: string | null; deliveryDate: string | null; cancellationDate: string | null } {
	if (next === "ready")
		return { readyDate: now, deliveryDate: current.deliveryDate ?? null, cancellationDate: null };
	if (next === "completed")
		return {
			readyDate: current.readyDate ?? null,
			deliveryDate: now,
			cancellationDate: current.cancellationDate ?? null,
		};
	if (next === "cancelled")
		return {
			readyDate: current.readyDate ?? null,
			deliveryDate: current.deliveryDate ?? null,
			cancellationDate: now,
		};
	if (next === "pending") return { readyDate: null, deliveryDate: null, cancellationDate: null };
	return {
		readyDate: current.readyDate ?? null,
		deliveryDate: current.deliveryDate ?? null,
		cancellationDate: current.cancellationDate ?? null,
	};
}
