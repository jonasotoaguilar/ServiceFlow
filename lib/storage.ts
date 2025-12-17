import { prisma } from "@/lib/prisma";
// Force recompile
import { Warranty, WarrantyStatus } from "./types";

// Helper to convert Prisma result to Warranty type (Dates to strings)
function mapToWarranty(item: any): Warranty {
  return {
    ...item,
    entryDate: item.entryDate.toISOString(),
    deliveryDate: item.deliveryDate
      ? item.deliveryDate.toISOString()
      : undefined,
    readyDate: item.readyDate ? item.readyDate.toISOString() : undefined,
    status: item.status as WarrantyStatus,
    locationLogs: item.locationLogs?.map((log: any) => ({
      ...log,
      changedAt: log.changedAt.toISOString(),
    })),
  };
}

export async function getWarranties(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: WarrantyStatus[];
  userId?: string;
}): Promise<{ data: Warranty[]; total: number; page: number; limit: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  // Construir filtros
  const where: any = {};

  if (params?.userId) {
    where.userId = params.userId;
  }

  if (params?.status && params.status.length > 0) {
    where.status = { in: params.status };
  }

  // Nota: La búsqueda difusa en Prisma SQLite es limitada, pero intentaremos algo básico.
  // Para search real, normalmente se usa un índice FullText o similar.
  if (params?.search) {
    const search = params.search;
    // Búsqueda simple OR en varios campos
    where.OR = [
      { clientName: { contains: search } },
      { product: { contains: search } },
      { invoiceNumber: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.warranty.findMany({
      where,
      skip,
      take: limit,
      orderBy: { entryDate: "desc" },
      include: {
        locationLogs: {
          orderBy: { changedAt: "desc" },
        },
      },
    } as any),
    prisma.warranty.count({ where }),
  ]);

  return {
    data: items.map(mapToWarranty),
    total,
    page,
    limit,
  };
}

export async function saveWarranty(warranty: Warranty): Promise<void> {
  // Usar transacción para crear garantía y log inicial
  await prisma.$transaction(async (tx) => {
    // 1. Crear Garantía
    const created = await tx.warranty.create({
      data: {
        id: warranty.id,
        userId: warranty.userId,
        invoiceNumber: warranty.invoiceNumber as any,
        clientName: warranty.clientName,
        rut: warranty.rut,
        contact: warranty.contact,
        email: warranty.email,
        product: warranty.product,
        failureDescription: warranty.failureDescription,
        sku: warranty.sku,
        location: warranty.location,
        entryDate: new Date(warranty.entryDate),
        deliveryDate: warranty.deliveryDate
          ? new Date(warranty.deliveryDate)
          : null,
        readyDate: warranty.readyDate ? new Date(warranty.readyDate) : null,
        status: warranty.status,
        repairCost: warranty.repairCost,
        notes: warranty.notes,
      },
    });

    // 2. Crear Log Inicial (Recepcion -> Ubicación Inicial)
    // Asumimos "Recepcion" como el punto de origen del sistema antes de asignarse a una ubicación física.
    // Si la ubicación inicial es "Recepcion", el log será "Ingreso -> Recepcion" para más claridad.
    const initialOrigin = "Ingreso";

    await (tx as any).locationLog.create({
      data: {
        warrantyId: created.id,
        fromLocation: initialOrigin,
        toLocation: created.location,
        changedAt: created.entryDate, // Usar la misma fecha de ingreso
      },
    });
  });
}

export async function updateWarranty(
  updatedWarranty: Warranty,
  userId?: string
): Promise<void> {
  const where: any = { id: updatedWarranty.id };
  if (userId) {
    where.userId = userId;
  }

  // 1. Obtener la garantía actual para verificar propiedad y comparar ubicación
  const currentWarranty = await prisma.warranty.findFirst({
    where,
  });

  if (!currentWarranty) {
    throw new Error("No warranty found or access denied");
  }

  // 2. Preparar operaciones en transacción
  const operations: any[] = [];

  // Actualización de la garantía
  const updateOp = prisma.warranty.update({
    where: { id: updatedWarranty.id },
    data: {
      invoiceNumber: updatedWarranty.invoiceNumber as any,
      clientName: updatedWarranty.clientName,
      rut: updatedWarranty.rut,
      contact: updatedWarranty.contact,
      email: updatedWarranty.email,
      product: updatedWarranty.product,
      failureDescription: updatedWarranty.failureDescription,
      sku: updatedWarranty.sku,
      location: updatedWarranty.location,
      entryDate: new Date(updatedWarranty.entryDate),
      deliveryDate: updatedWarranty.deliveryDate
        ? new Date(updatedWarranty.deliveryDate)
        : null,
      readyDate: updatedWarranty.readyDate
        ? new Date(updatedWarranty.readyDate)
        : null,
      status: updatedWarranty.status,
      repairCost: updatedWarranty.repairCost,
      notes: updatedWarranty.notes,
    },
  });
  operations.push(updateOp);

  // 3. Verificar cambio de ubicación y crear log
  if (currentWarranty.location !== updatedWarranty.location) {
    const logOp = (prisma as any).locationLog.create({
      data: {
        warrantyId: updatedWarranty.id,
        fromLocation: currentWarranty.location,
        toLocation: updatedWarranty.location,
      },
    });
    operations.push(logOp);
  }

  // 4. Verificar cambio a estado "completed" (Entregada)
  // Si pasa a completed y NO se registró ya un cambio de ubicación a algo como "Entregado/Cliente"
  // forzamos un log que indique la entrega.
  if (
    updatedWarranty.status === "completed" &&
    currentWarranty.status !== "completed"
  ) {
    // Solo si no acabamos de registrar un movimiento hacia "Cliente" o "Entregada" explícito
    // (Aunque en este sistema la ubicación y el estado son ortogonales, asumimos que "completed" implica entrega al cliente)
    const logOp = (prisma as any).locationLog.create({
      data: {
        warrantyId: updatedWarranty.id,
        fromLocation: updatedWarranty.location, // Sale de la ubicación donde estaba
        toLocation: "Entregada",
      },
    });
    operations.push(logOp);
  }

  // Ejecutar transacción
  await prisma.$transaction(operations);
}

export async function deleteWarranty(
  id: string,
  userId?: string
): Promise<void> {
  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  const result = await prisma.warranty.deleteMany({
    where,
  });

  if (result.count === 0) {
    throw new Error("No warranty found or access denied");
  }
}
