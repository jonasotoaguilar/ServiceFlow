"use server";

import { databases, COLLECTIONS, DB_ID, Query, ID } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { normalizeString } from "@/lib/utils";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { locationListBinding, applyBinding } from "@/lib/pocketbase-filter";

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

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  if (!name || name.trim() === "") {
    return { error: "El nombre es requerido" };
  }

  try {
    const normalizedNew = normalizeString(name);

    // Obtener todas las Sedes del usuario para comparar
    const existingResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      [Query.equal("userId", user.id), Query.limit(100)]
    );

    const isDuplicate = existingResult.documents.some(
      (loc: any) => normalizeString(loc.name) === normalizedNew
    );

    if (isDuplicate) {
      return { error: "Ya existe una Sede con este nombre (o similar)" };
    }

    const docData: any = {
      name: name.trim(),
      userId: user.id,
      isActive: true, // Default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (address && address.trim()) {
      docData.address = address.trim();
    }

    await databases.createDocument(DB_ID, COLLECTIONS.LOCATIONS, ID.unique(), docData);

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

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  if (!id) {
    return { error: "ID de Sede requerido" };
  }

  if (!name || name.trim() === "") {
    return { error: "El nombre es requerido" };
  }

  if (name.trim().length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres" };
  }

  if (name.trim().length > 100) {
    return { error: "El nombre no puede exceder 100 caracteres" };
  }

  if (address && address.trim().length > 200) {
    return { error: "La dirección no puede exceder 200 caracteres" };
  }

  try {
    // Verificar que la Sede pertenece al usuario
    const location = await databases.getDocument(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      id
    );

    if (!location || location.userId !== user.id) {
      return { error: "Sede no encontrada" };
    }

    const normalizedNew = normalizeString(name);

    // Verificar duplicados (excluyendo la Sede actual)
    const existingResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      [Query.equal("userId", user.id), Query.limit(100)]
    );

    const isDuplicate = existingResult.documents.some(
      (loc: any) => loc.$id !== id && normalizeString(loc.name) === normalizedNew
    );

    if (isDuplicate) {
      return { error: "Ya existe otra Sede con este nombre (o similar)" };
    }

    const updateData: any = {
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (address && address.trim()) {
      updateData.address = address.trim();
    } else {
      updateData.address = null;
    }

    await databases.updateDocument(DB_ID, COLLECTIONS.LOCATIONS, id, updateData);

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
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.LOCATIONS, id);
    if (doc.userId !== user.id) {
      return { error: "No autorizado" };
    }

    await databases.updateDocument(DB_ID, COLLECTIONS.LOCATIONS, id, {
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
    // Verificar si la Sede pertenece al usuario
    const location = await databases.getDocument(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      id
    );

    if (!location || location.userId !== user.id) {
      return { error: "Sede no encontrada" };
    }

    // Validar si está en uso en cualquier servicio (cualquier status)
    const ServicesRes = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.Services,
      [
        Query.equal("userId", user.id),
        Query.equal("locationId", id),
        Query.limit(1), // Just check total
      ]
    );

    const logsRes = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATION_LOGS,
      [
        Query.or([
          Query.equal("fromLocationId", id),
          Query.equal("toLocationId", id),
        ]),
        Query.limit(1),
      ]
    );

    if (ServicesRes.total > 0 || logsRes.total > 0) {
      return {
        error:
          "No se puede eliminar una Sede con historial de servicios o movimientos.",
      };
    }

    await databases.deleteDocument(DB_ID, COLLECTIONS.LOCATIONS, id);
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Error al eliminar la Sede" };
  }
}
