"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeString } from "@/lib/utils";

export async function getLocations(onlyActive = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const where: any = { userId: user.id };
    if (onlyActive) {
      where.isActive = true;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Enriquecer con conteos
    const enrichedLocations = await Promise.all(
      locations.map(async (loc) => {
        const [activeCount, completedCount, hasLogs] = await Promise.all([
          prisma.warranty.count({
            where: {
              userId: user.id,
              locationId: loc.id,
              status: { in: ["pending", "ready"] },
            },
          }),
          prisma.warranty.count({
            where: {
              userId: user.id,
              locationId: loc.id,
              status: "completed",
            },
          }),
          prisma.locationLog.count({
            where: {
              OR: [{ fromLocationId: loc.id }, { toLocationId: loc.id }],
            },
          }),
        ]);

        const hasHistory = activeCount > 0 || completedCount > 0 || hasLogs > 0;

        return {
          ...loc,
          activeCount,
          completedCount,
          hasHistory,
        };
      })
    );

    return { data: enrichedLocations };
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return { error: "Error al cargar ubicaciones" };
  }
}

export async function createLocation(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { error: "El nombre es requerido" };
  }

  try {
    const normalizedNew = normalizeString(name);

    // Obtener todas las ubicaciones del usuario para comparar manual (o usar raw query)
    const existing = await prisma.location.findMany({
      where: { userId: user.id },
    });

    const isDuplicate = existing.some(
      (loc) => normalizeString(loc.name) === normalizedNew
    );

    if (isDuplicate) {
      return { error: "Ya existe una ubicación con este nombre (o similar)" };
    }

    await prisma.location.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });
    revalidatePath("/locations");
    return { success: true, message: "Ubicación creada correctamente" };
  } catch (error: any) {
    console.error("Error creating location:", error);
    return { error: "Error al crear la ubicación" };
  }
}

export async function toggleLocationActive(id: string, active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    await prisma.location.update({
      where: { id, userId: user.id },
      data: { isActive: active },
    });
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error toggling location active:", error);
    return { error: "Error al actualizar la ubicación" };
  }
}

export async function deleteLocation(id: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    // Verificar si la ubicación pertenece al usuario
    const location = await prisma.location.findFirst({
      where: { id, userId: user.id },
    });

    if (!location) {
      return { error: "Ubicación no encontrada" };
    }

    // Validar si está en uso en cualquier garantía
    const activeCount = await prisma.warranty.count({
      where: {
        userId: user.id,
        locationId: id,
        status: { in: ["pending", "ready"] },
      },
    });

    const completedCount = await prisma.warranty.count({
      where: {
        userId: user.id,
        locationId: id,
        status: "completed",
      },
    });

    const hasLogs = await prisma.locationLog.count({
      where: {
        OR: [{ fromLocationId: id }, { toLocationId: id }],
      },
    });

    if (activeCount > 0 || completedCount > 0 || hasLogs > 0) {
      return {
        error:
          "No se puede eliminar una ubicación con historial de garantías o movimientos.",
      };
    }

    await prisma.location.delete({
      where: { id },
    });
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Error al eliminar la ubicación" };
  }
}
