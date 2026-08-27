import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createPocketBaseClient } from "@/lib/pocketbase";
import {
	sendLifecycleBatch,
	OPERATION_KEY_REGEX,
	LifecycleBatchError,
} from "@/lib/lifecycle-batch";

async function resolveId(ctx: unknown): Promise<string> {
	const p = (ctx as any)?.params;
	if (!p) return "";
	if (typeof p.then === "function") {
		const r = await p;
		return String(r.id ?? "");
	}
	return String(p.id ?? "");
}

function resolveOperationKey(request: Request, body: any): string | null {
	const header = request.headers.get("Idempotency-Key") ?? request.headers.get("idempotency-key");
	if (header && header.length > 0) return header;
	if (body?.operationKey && typeof body.operationKey === "string") return body.operationKey;
	return null;
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
	const target = body.locationId as string | undefined;
	if (!target)
		return NextResponse.json(
			{ error: "Sede no válida", code: "INVALID_LOCATION" },
			{ status: 400 },
		);
	let operationKey = resolveOperationKey(request, body);
	if (operationKey !== null && operationKey !== "") {
		if (!OPERATION_KEY_REGEX.test(operationKey)) {
			return NextResponse.json(
				{ error: "Clave de operación no válida", code: "INVALID_OPERATION_KEY" },
				{ status: 400 },
			);
		}
	} else {
		operationKey = crypto.randomUUID();
	}
	const pb = await createPocketBaseClient();
	let current: any;
	try {
		current = await pb.collection("services").getOne(id);
	} catch {
		return NextResponse.json(
			{ error: "Servicio no encontrado", code: "NOT_FOUND" },
			{ status: 403 },
		);
	}
	if (current.userId !== user.id)
		return NextResponse.json(
			{ error: "Servicio no encontrado", code: "NOT_FOUND" },
			{ status: 403 },
		);
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
	try {
		await sendLifecycleBatch({
			pb,
			userId: user.id,
			serviceId: id,
			operationKey,
			kind: "location_changed",
			fromStatus: current.status,
			toStatus: current.status,
			fromLocationId: current.locationId,
			toLocationId: target,
			servicePatch: { locationId: target },
		});
	} catch (e: any) {
		if (e instanceof LifecycleBatchError) {
			const map: Record<string, string> = {
				INVALID_OPERATION_KEY: "Clave de operación no válida",
				NOT_FOUND: "Servicio no encontrado",
				OPERATION_KEY_REUSED: "Clave de operación ya utilizada",
				BATCH_UNAVAILABLE: "Operación no disponible — habilite Batch en PocketBase",
				TRANSITION_CONFLICT: "Conflicto de transición — reintente",
				VALIDATION_ERROR: "Datos de traslado no válidos",
				INTERNAL: "Error interno al transferir sede",
			};
			return NextResponse.json(
				{ error: map[e.code] ?? e.message, code: e.code },
				{ status: e.status },
			);
		}
		return NextResponse.json(
			{ error: "No se pudo transferir la sede", code: "TRANSFER_FAILED" },
			{ status: 500 },
		);
	}
	return NextResponse.json({ id, locationId: target }, { status: 200 });
}

export async function PATCH(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
export async function POST(request: Request, ctx: unknown) {
	return handle(request, ctx);
}
