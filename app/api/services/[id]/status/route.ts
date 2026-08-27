import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { canTransition, transitionDates } from "@/lib/status";
import type { ServiceStatus } from "@/lib/types";

async function resolveId(ctx: unknown): Promise<string> {
	const p = (ctx as any)?.params;
	if (!p) return "";
	if (typeof p.then === "function") {
		const r = await p;
		return String(r.id ?? r?.id ?? "");
	}
	return String(p.id ?? "");
}

async function handle(request: Request, ctx: unknown) {
	const user = await getAuthUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const id = await resolveId(ctx);
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	let body: any;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid body" }, { status: 400 });
	}
	const next = body.status as ServiceStatus | undefined;
	if (!next || !["pending", "ready", "completed", "cancelled"].includes(next)) {
		return NextResponse.json(
			{ error: "Estado no válido", code: "INVALID_STATUS" },
			{ status: 400 },
		);
	}
	const pb = await createPocketBaseClient();
	let current: any;
	try {
		current = await pb.collection("services").getOne(id);
	} catch {
		return NextResponse.json(
			{ error: "Servicio no encontrado", code: "NOT_FOUND" },
			{ status: 404 },
		);
	}
	if (current.userId !== user.id)
		return NextResponse.json(
			{ error: "Servicio no encontrado", code: "NOT_FOUND" },
			{ status: 403 },
		);
	const from = current.status as ServiceStatus;
	if (from === next)
		return NextResponse.json(
			{ error: "El servicio ya está en ese estado", code: "NO_TRANSITION" },
			{ status: 400 },
		);
	if (!canTransition(from, next))
		return NextResponse.json(
			{ error: "Transición de estado no permitida", code: "INVALID_TRANSITION" },
			{ status: 400 },
		);
	const now = new Date().toISOString();
	const dates = transitionDates(current, next, now);
	const payload: Record<string, unknown> = {
		status: next,
		readyDate: dates.readyDate,
		deliveryDate: dates.deliveryDate,
		cancellationDate: dates.cancellationDate,
	};
	const canBatch = false; // batch disabled per PocketBase 0.40.1 Batch requests are not allowed
	if (canBatch) {
		try {
			const batch: any = (pb as any).createBatch();
			batch.collection("services").update(id, payload);
			batch.collection("service_events").create({
				userId: user.id,
				ServiceId: id,
				kind: "status_changed",
				fromStatus: from,
				toStatus: next,
				actorId: user.id,
				changedAt: now,
				fromLocationId: current.locationId ?? "",
				toLocationId: current.locationId ?? "",
			});
			await batch.send();
		} catch (e) {
			console.error(e);
			return NextResponse.json(
				{ error: "No se pudo cambiar el estado", code: "STATUS_FAILED" },
				{ status: 500 },
			);
		}
	} else {
		try {
			await pb.collection("services").update(id, payload);
		} catch (e) {
			console.error(e);
			return NextResponse.json(
				{ error: "No se pudo cambiar el estado", code: "STATUS_FAILED" },
				{ status: 500 },
			);
		}
		try {
			await pb.collection("service_events").create({
				userId: user.id,
				ServiceId: id,
				kind: "status_changed",
				fromStatus: from,
				toStatus: next,
				actorId: user.id,
				changedAt: now,
				fromLocationId: current.locationId ?? "",
				toLocationId: current.locationId ?? "",
			});
		} catch (e) {
			console.error(e);
			// rollback status to avoid unlogged successful mutation
			try {
				await pb.collection("services").update(id, {
					status: from,
					readyDate: current.readyDate ?? null,
					deliveryDate: current.deliveryDate ?? null,
					cancellationDate: current.cancellationDate ?? null,
				});
			} catch {}
			return NextResponse.json(
				{ error: "No se pudo registrar el evento de cambio de estado", code: "EVENT_FAILED" },
				{ status: 500 },
			);
		}
	}
	return NextResponse.json({ id, status: next, ...dates }, { status: 200 });
}

export async function PATCH(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
export async function POST(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
