"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { normalizeString } from "@/lib/utils";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { locationListBinding, applyBinding } from "@/lib/pocketbase-filter";
import { LocationCreateSchema, LocationUpdateSchema } from "@/lib/schemas";

export async function getLocations(onlyActive = false) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const pb = await createPocketBaseClient();
    const binding = locationListBinding({ userId: user.id, onlyActive });
    const filter = applyBinding(pb, binding);
    const result = await pb.collection("locations").getList(1, 50, {
      filter,
      sort: "-createdAt",
    });

    const locations = result.items.map((doc: any) => ({
      ...doc,
      id: doc.id,
    }));

    const enrichedLocations = locations.map((loc: any) => ({
      ...loc,
      activeCount: typeof loc.activeCount === "number" ? loc.activeCount : 0,
      completedCount: typeof loc.completedCount === "number" ? loc.completedCount : 0,
      hasHistory: typeof loc.hasHistory === "boolean" ? loc.hasHistory : false,
    }));

    return { data: enrichedLocations };
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return { error: "Error al cargar Sedes" };
  }
}

export async function createLocation(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const rawName = formData.get("name") as string | null;
  const rawAddress = formData.get("address") as string | null;

  const parsed = LocationCreateSchema.safeParse({
    name: rawName ?? "",
    address: rawAddress ?? undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "El nombre es requerido";
    return { error: first };
  }

  const { name, address } = parsed.data;

  try {
    const pb = await createPocketBaseClient();
    const normalizedNew = normalizeString(name);

    const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
    const existingResult = await pb.collection("locations").getList(1, 100, { filter });

    const isDuplicate = (existingResult.items as unknown as Array<{ name: string }>).some(
      (loc) => normalizeString(loc.name) === normalizedNew,
    );

    if (isDuplicate) {
      return { error: "Ya existe una Sede con este nombre (o similar)" };
    }

    const docData: Record<string, unknown> = {
      name,
      userId: user.id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (address !== undefined) {
      docData.address = address;
    }

    await pb.collection("locations").create(docData);

    revalidatePath("/locations");
    return { success: true, message: "Sede creada correctamente" };
  } catch (error: any) {
    console.error("Error creating location:", error);
    return { error: "Error al crear la Sede" };
  }
}

export async function updateLocation(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const id = formData.get("id") as string | null;
  const rawName = formData.get("name") as string | null;
  const rawAddress = formData.get("address") as string | null;

  if (!id) {
    return { error: "ID de Sede requerido" };
  }

  const parsed = LocationUpdateSchema.safeParse({
    name: rawName ?? "",
    address: rawAddress ?? undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "El nombre es requerido";
    return { error: first };
  }

  const { name, address } = parsed.data;

  try {
    const pb = await createPocketBaseClient();
    let location: any;
    try {
      location = await pb.collection("locations").getOne(id);
    } catch {
      return { error: "Sede no encontrada" };
    }

    if (!location || location.userId !== user.id) {
      return { error: "Sede no encontrada" };
    }

    const normalizedNew = normalizeString(name);

    const filter = applyBinding(pb, { filter: "userId = {:uid}", params: { uid: user.id } });
    const existingResult = await pb.collection("locations").getList(1, 100, { filter });

    const isDuplicate = (existingResult.items as unknown as Array<{ id: string; name: string }>).some(
      (loc) => loc.id !== id && normalizeString(loc.name) === normalizedNew,
    );

    if (isDuplicate) {
      return { error: "Ya existe otra Sede con este nombre (o similar)" };
    }

    const updateData: Record<string, unknown> = {
      name,
      updatedAt: new Date().toISOString(),
    };

    if (address !== undefined) {
      updateData.address = address;
    }

    await pb.collection("locations").update(id, updateData);

    revalidatePath("/locations");
    return { success: true, message: "Sede actualizada correctamente" };
  } catch (error: any) {
    console.error("Error updating location:", error);
    return { error: "Error al actualizar la Sede" };
  }
}

export async function toggleLocationActive(id: string, active: boolean) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const pb = await createPocketBaseClient();
    let doc: any;
    try {
      doc = await pb.collection("locations").getOne(id);
    } catch {
      return { error: "No autorizado" };
    }
    if (doc.userId !== user.id) {
      return { error: "No autorizado" };
    }

    await pb.collection("locations").update(id, {
      isActive: active,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error toggling location active:", error);
    return { error: "Error al actualizar la Sede" };
  }
}

export async function deleteLocation(id: string, name: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const pb = await createPocketBaseClient();
    let location: any;
    try {
      location = await pb.collection("locations").getOne(id);
    } catch {
      return { error: "Sede no encontrada" };
    }

    if (!location || location.userId !== user.id) {
      return { error: "Sede no encontrada" };
    }

    const serviceFilter = applyBinding(pb, {
      filter: "userId = {:uid} && locationId = {:locationId}",
      params: { uid: user.id, locationId: id },
    });
    const servicesRes = await pb.collection("services").getList(1, 1, { filter: serviceFilter });

    const logFilter = applyBinding(pb, {
      filter: "userId = {:uid} && (fromLocationId = {:lid} || toLocationId = {:lid})",
      params: { uid: user.id, lid: id },
    });
    const logsRes = await pb.collection("location_logs").getList(1, 1, { filter: logFilter });

    const hasServices =
      typeof (servicesRes as { totalItems?: number }).totalItems === "number"
        ? (servicesRes as { totalItems: number }).totalItems > 0
        : (servicesRes.items?.length ?? 0) > 0;
    const hasLogs =
      typeof (logsRes as { totalItems?: number }).totalItems === "number"
        ? (logsRes as { totalItems: number }).totalItems > 0
        : (logsRes.items?.length ?? 0) > 0;

    if (hasServices || hasLogs) {
      return {
        error: "No se puede eliminar una Sede con historial de servicios o movimientos.",
      };
    }

    await pb.collection("locations").delete(id);
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Error al eliminar la Sede" };
  }
}
