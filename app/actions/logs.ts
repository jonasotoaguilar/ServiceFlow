"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getLocationLogs(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      warranty: {
        userId: user.id,
      },
    };

    if (params.locationId) {
      where.OR = [
        { fromLocationId: params.locationId },
        { toLocationId: params.locationId },
      ];
    }

    if (params.startDate || params.endDate) {
      where.changedAt = {};
      if (params.startDate) {
        where.changedAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        // Al final del día para el endDate
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.changedAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.locationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { changedAt: "desc" },
        include: {
          warranty: true,
          fromLocation: true,
          toLocation: true,
        },
      }),
      prisma.locationLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        warrantyId: log.warrantyId,
        invoiceNumber: log.warranty.invoiceNumber,
        product: log.warranty.product,
        clientName: log.warranty.clientName,
        fromLocation: log.fromLocation.name,
        toLocation: log.toLocation.name,
        changedAt: log.changedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch location logs:", error);
    return { error: "Error al cargar historial de movimientos" };
  }
}
