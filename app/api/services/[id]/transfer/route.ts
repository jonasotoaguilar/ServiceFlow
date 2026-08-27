import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createPocketBaseClient } from "@/lib/pocketbase";

async function resolveId(ctx: unknown): Promise<string> {
	const p = (ctx as any)?.params;
	if (!p) return "";
	if (typeof p.then === "function") {
		const r = await p;
		return String(r.id ?? "");
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
	const target = (body.locationId ?? body.toLocationId ?? body.targetLocationId) as
		| string
		| undefined;
	if (!target)
		return NextResponse.json(
			{ error: "Sede no válida", code: "INVALID_LOCATION" },
			{ status: 400 },
		);
	const pb = await createPocketBaseClient();
	let current: any;
	try {
		current = await pb.collection("services").getOne(id);
	} catch {
		return NextResponse.json({ error: "Not found or access denied" }, { status: 500 });
	}
	if (current.userId !== user.id)
		return NextResponse.json({ error: "Not found or access denied" }, { status: 403 });
	if (String(current.locationId) === String(target))
		return NextResponse.json(
			{ error: "El servicio ya está en esa sede.", code: "SAME_LOCATION" },
			{ status: 400 },
		);
	let loc: any;
	try {
		loc = await pb.collection("locations").getOne(target);
	} catch {
		return NextResponse.json(
			{ error: "Sede no válida", code: "INVALID_LOCATION" },
			{ status: 400 },
		);
	}
	if (String(loc.userId) !== String(user.id) || loc.isActive === false)
		return NextResponse.json(
			{ error: "Sede no válida", code: "INVALID_LOCATION" },
			{ status: 400 },
		);
	const now = new Date().toISOString();
	const canBatch = false; // batch disabled per PocketBase 0.40.1 Batch requests are not allowed
	if (canBatch) {
		try {
			const batch: any = (pb as any).createBatch();
			batch.collection("services").update(id, { locationId: target });
			batch.collection("service_events").create({
				userId: user.id,
				ServiceId: id,
				kind: "location_changed",
				fromLocationId: current.locationId,
				toLocationId: target,
				fromStatus: current.status,
				toStatus: current.status,
				actorId: user.id,
				changedAt: now,
			});
			await batch.send();
		} catch (e) {
			console.error(e);
			return NextResponse.json(
				{ error: "No se pudo transferir la sede", code: "TRANSFER_FAILED" },
				{ status: 500 },
			);
		}
	} else {
		try {
			await pb.collection("services").update(id, { locationId: target });
		} catch (e) {
			console.error(e);
			return NextResponse.json(
				{ error: "No se pudo transferir la sede", code: "TRANSFER_FAILED" },
				{ status: 500 },
			);
		}
		try {
			await pb.collection("service_events").create({
				userId: user.id,
				ServiceId: id,
				kind: "location_changed",
				fromLocationId: current.locationId,
				toLocationId: target,
				fromStatus: current.status,
				toStatus: current.status,
				actorId: user.id,
				changedAt: now,
			});
		} catch (e) {
			console.error(e);
			// rollback to avoid unlogged successful mutation
			try {
				await pb.collection("services").update(id, { locationId: current.locationId });
			} catch {}
			return NextResponse.json(
				{ error: "No se pudo registrar el evento de traslado", code: "EVENT_FAILED" },
				{ status: 500 },
			);
		}
	}
	return NextResponse.json({ id, locationId: target }, { status: 200 });
}

export async function PATCH(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
export async function POST(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
