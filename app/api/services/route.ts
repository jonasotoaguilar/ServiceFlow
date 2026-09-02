import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServices, saveService, updateService, deleteService } from "@/lib/storage";
import { Service, ServiceStatus } from "@/lib/types";
import { ServiceSchema } from "@/lib/schemas";
import { createPocketBaseClient } from "@/lib/pocketbase";
import * as z from "zod";

export async function GET(request: Request) {
	const user = await getAuthUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const page = Number(searchParams.get("page")) || 1;
	const limit = Number(searchParams.get("limit")) || 20;
	const search = searchParams.get("search") || undefined;
	const statusParam = searchParams.get("status");
	const location = searchParams.get("location") || undefined;
	const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

	const ALLOWED_STATUSES = new Set<ServiceStatus>(["pending", "ready", "completed", "cancelled"]);
	let status: ServiceStatus[] | undefined;
	if (statusParam) {
		const first = statusParam.split(",")[0]?.trim() as ServiceStatus;
		if (first && ALLOWED_STATUSES.has(first)) {
			status = [first];
		}
	}

	const result = await getServices({
		page,
		limit,
		search,
		status,
		location,
		userId: user.id,
		sortOrder,
	});

	return NextResponse.json(result);
}

export async function POST(request: Request) {
	const user = await getAuthUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const jsonBody = await request.json();
		const validation = ServiceSchema.safeParse(jsonBody);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Datos inválidos", code: "VALIDATION_ERROR" },
				{ status: 400 },
			);
		}

		const { data: body } = validation;

		// Validate locationId is owned and active (generic create contract)
		const locId = (body as any).locationId as string;
		try {
			const pb = await createPocketBaseClient();
			const loc = (await pb.collection("locations").getOne(locId)) as any;
			if (loc.userId !== user.id || loc.isActive === false) {
				return NextResponse.json(
					{ error: "Sede no válida", code: "INVALID_LOCATION" },
					{ status: 400 },
				);
			}
		} catch {
			return NextResponse.json(
				{ error: "Sede no válida", code: "INVALID_LOCATION" },
				{ status: 400 },
			);
		}

		const {
			id: _ignoredId,
			userId: _ignoredUserId,
			status: _ignoredStatus,
			deliveryDate: _ignoredDelivery,
			readyDate: _ignoredReady,
			cancellationDate: _ignoredCancel,
			...rest
		} = body as any;

		const serviceToSave: Omit<Service, "id"> = {
			userId: user.id,
			invoiceNumber: rest.invoiceNumber,
			clientName: rest.clientName,
			rut: rest.rut,
			email: rest.email || undefined,
			contact: rest.contact,
			product: rest.product,
			failureDescription: rest.failureDescription,
			sku: rest.sku,
			locationId: rest.locationId,
			entryDate: rest.entryDate || new Date().toISOString(),
			deliveryDate: undefined,
			readyDate: undefined,
			cancellationDate: undefined,
			status: "pending",
			repairCost: rest.repairCost,
			notes: rest.notes || "",
		};

		const created = await saveService(serviceToSave);
		return NextResponse.json(created, { status: 201 });
	} catch (e) {
		console.error(e);
		const msg = e instanceof Error ? e.message : "";
		if (msg.includes("Sede no válida") || msg.includes("Invalid location")) {
			return NextResponse.json(
				{ error: "Sede no válida", code: "INVALID_LOCATION" },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "No se pudo crear el servicio", code: "CREATE_FAILED" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	const user = await getAuthUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const jsonBody = await request.json();

		if (
			Object.hasOwn(jsonBody, "status") ||
			Object.hasOwn(jsonBody, "locationId") ||
			Object.hasOwn(jsonBody, "deliveryDate") ||
			Object.hasOwn(jsonBody, "readyDate") ||
			Object.hasOwn(jsonBody, "cancellationDate")
		) {
			return NextResponse.json(
				{
					error: "El estado y la sede no pueden modificarse desde la edición general",
					code: "LIFECYCLE_PROTECTED",
				},
				{ status: 400 },
			);
		}

		const GenericEditSchema = ServiceSchema.omit({
			status: true,
			locationId: true,
			deliveryDate: true,
			readyDate: true,
			cancellationDate: true,
		})
			.partial()
			.extend({
				id: z.string().min(1, "ID requerido"),
			});

		const validation = GenericEditSchema.safeParse(jsonBody);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Datos inválidos", code: "VALIDATION_ERROR" },
				{ status: 400 },
			);
		}

		const { data: body } = validation;

		if (!body.id) {
			return NextResponse.json({ error: "ID requerido", code: "MISSING_ID" }, { status: 400 });
		}

		// Preserve status/locationId from current record; generic edit must not mutate them
		const pb = await createPocketBaseClient();
		let current: any;
		try {
			current = await pb.collection("services").getOne(body.id);
		} catch {
			return NextResponse.json(
				{ error: "Servicio no encontrado", code: "NOT_FOUND" },
				{ status: 404 },
			);
		}
		if (current.userId !== user.id) {
			return NextResponse.json(
				{ error: "Servicio no encontrado", code: "NOT_FOUND" },
				{ status: 404 },
			);
		}
		if (current.status === "completed" || current.status === "cancelled") {
			return NextResponse.json(
				{
					error: "No se puede modificar un servicio entregado o cancelado",
					code: "IMMUTABLE_STATUS",
				},
				{ status: 409 },
			);
		}

		const updated: Service = {
			id: body.id,
			userId: current.userId,
			invoiceNumber: (body as any).invoiceNumber ?? current.invoiceNumber,
			clientName: (body as any).clientName ?? current.clientName,
			rut: (body as any).rut ?? current.rut,
			contact: (body as any).contact ?? current.contact,
			email: (body as any).email ?? current.email,
			product: (body as any).product ?? current.product,
			sku: (body as any).sku ?? current.sku,
			failureDescription: (body as any).failureDescription ?? current.failureDescription,
			locationId: current.locationId,
			entryDate: (body as any).entryDate || current.entryDate,
			deliveryDate: current.deliveryDate,
			readyDate: current.readyDate,
			cancellationDate: current.cancellationDate,
			status: current.status,
			repairCost: (body as any).repairCost ?? current.repairCost,
			notes: (body as any).notes ?? current.notes ?? "",
		} as Service;

		try {
			await updateService(updated, user.id);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "";
			if (msg.includes("completed")) {
				return NextResponse.json(
					{ error: "No se puede modificar un servicio entregado", code: "IMMUTABLE_STATUS" },
					{ status: 409 },
				);
			}
			throw err;
		}
		return NextResponse.json(updated, { status: 200 });
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{ error: "No se pudo guardar el servicio", code: "UPDATE_FAILED" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const user = await getAuthUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "Missing ID" }, { status: 400 });
		}

		await deleteService(id, user.id);
		return NextResponse.json({ success: true }, { status: 200 });
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "Internal Server Error or Access Denied" }, { status: 500 });
	}
}
