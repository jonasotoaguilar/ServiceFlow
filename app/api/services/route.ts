import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
	getServices,
	saveService,
	updateService,
	deleteService,
} from "@/lib/storage";
import { Service } from "@/lib/types";
import { ServiceSchema } from "@/lib/schemas";

// Simple UUID generator fallback
function generateId() {
	return crypto.randomUUID();
}

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

	const status = statusParam ? (statusParam.split(",") as any[]) : undefined;

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
				{ error: "Validation failed", details: validation.error.format() },
				{ status: 400 },
			);
		}

		const { data: body } = validation;

		if (body.status === "cancelled" && !body.cancellationDate) {
			body.cancellationDate = new Date().toISOString();
		}

		const newService: Service = {
			id: generateId(),
			userId: user.id, // Assign to current user
			invoiceNumber: body.invoiceNumber,
			clientName: body.clientName,
			rut: body.rut,
			email: body.email || undefined,
			contact: body.contact,
			product: body.product,
			failureDescription: body.failureDescription,
			sku: body.sku,
			locationId: body.locationId,
			entryDate: body.entryDate || new Date().toISOString(),
			deliveryDate: body.deliveryDate || undefined,
			readyDate: body.readyDate || undefined,
			cancellationDate: body.cancellationDate || undefined,
			status: body.status || "pending",
			repairCost: body.repairCost,
			notes: body.notes || "",
		};

		await saveService(newService);
		return NextResponse.json(newService, { status: 201 });
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{ error: "Internal Server Error" },
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
		const validation = ServiceSchema.safeParse(jsonBody);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.format() },
				{ status: 400 },
			);
		}

		const { data: body } = validation;

		if (body.status === "cancelled" && !body.cancellationDate) {
			body.cancellationDate = new Date().toISOString();
		}

		if (!body.id) {
			return NextResponse.json({ error: "Missing ID" }, { status: 400 });
		}

		// Pass userId to ensure ownership
		await updateService(body as Service, user.id);
		return NextResponse.json(body, { status: 200 });
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{ error: "Internal Server Error or Access Denied" },
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
		return NextResponse.json(
			{ error: "Internal Server Error or Access Denied" },
			{ status: 500 },
		);
	}
}
