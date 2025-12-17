import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getWarranties,
  saveWarranty,
  updateWarranty,
  deleteWarranty,
} from "@/lib/storage";
import { Warranty, NewWarrantyPayload } from "@/lib/types";

// Simple UUID generator fallback
function generateId() {
  return crypto.randomUUID();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;
  const statusParam = searchParams.get("status");

  const status = statusParam ? (statusParam.split(",") as any[]) : undefined;

  const result = await getWarranties({
    page,
    limit,
    search,
    status,
    userId: user.id,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: NewWarrantyPayload = await request.json();

    if (!body.clientName || !body.product) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newWarranty: Warranty = {
      id: generateId(),
      userId: user.id, // Assign to current user
      invoiceNumber: body.invoiceNumber,
      clientName: body.clientName,
      rut: body.rut,
      email: body.email,
      contact: body.contact,
      product: body.product,
      failureDescription: body.failureDescription,
      sku: body.sku,
      location: body.location || "Ingreso",
      entryDate: body.entryDate || new Date().toISOString(),
      deliveryDate: body.deliveryDate,
      readyDate: body.readyDate,
      status: body.status || "pending",
      repairCost: body.repairCost,
      notes: body.notes || "",
    };

    await saveWarranty(newWarranty);
    return NextResponse.json(newWarranty, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: Warranty = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Pass userId to ensure ownership
    await updateWarranty(body, user.id);
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    console.error(e);
    // If our storage throws "No warranty found or access denied" it comes here
    return NextResponse.json(
      { error: "Internal Server Error or Access Denied" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await deleteWarranty(id, user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error or Access Denied" },
      { status: 500 }
    );
  }
}
