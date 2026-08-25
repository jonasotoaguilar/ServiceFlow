"use server";

import { getAuthUser } from "@/lib/auth";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { logListBinding, applyBinding } from "@/lib/pocketbase-filter";

export async function getLocationLogs(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const page = params.page && Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const limit = params.limit && Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : 20;

  try {
    const pb = await createPocketBaseClient();
    const binding = logListBinding({
      userId: user.id,
      locationId: params.locationId,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    const filter = applyBinding(pb, binding);
    const result = await pb.collection("location_logs").getList(page, limit, {
      filter,
      sort: "-changedAt",
    });

    const total = typeof (result as { totalItems?: number }).totalItems === "number" ? (result as { totalItems: number }).totalItems : 0;

    const data = (result.items as any[]).map((doc) => ({
      ...doc,
      id: doc.id,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch location logs:", error);
    return { error: "Error al cargar historial de movimientos" };
  }
}
