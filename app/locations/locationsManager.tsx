"use client";

import { useState, useTransition } from "react";
import {
  createLocation,
  deleteLocation,
  toggleLocationActive,
} from "@/app/actions/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Trash2, Plus, ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmationDialog";

type LocationType = {
  id: string;
  name: string;
  isActive: boolean;
  activeCount: number;
  completedCount: number;
  hasHistory: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function LocationsManager({
  locations,
}: Readonly<{
  locations: LocationType[];
}>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "danger",
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(locations.length / itemsPerPage);
  const currentItems = locations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    setError(null);
    const formData = new FormData();
    formData.append("name", newLocationName);

    startTransition(async () => {
      const result = await createLocation(null, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setNewLocationName("");
        setIsDialogOpen(false);
      }
    });
  }

  async function handleDelete(id: string, name: string) {
    setConfirmState({
      isOpen: true,
      title: "Eliminar Ubicación",
      description: `¿Estás seguro de eliminar la ubicación "${name}"? Esta acción no se puede deshacer.`,
      variant: "danger",
      onConfirm: async () => {
        startTransition(async () => {
          const result = await deleteLocation(id, name);
          if (result.error) {
            alert(result.error);
          }
        });
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    const action = currentStatus ? "desactivar" : "habilitar";
    setConfirmState({
      isOpen: true,
      title: `${currentStatus ? "Desactivar" : "Habilitar"} Ubicación`,
      description: `¿Estás seguro de ${action} esta ubicación?`,
      variant: currentStatus ? "warning" : ("default" as any),
      onConfirm: async () => {
        startTransition(async () => {
          const result = await toggleLocationActive(id, !currentStatus);
          if (result.error) {
            alert(result.error);
          }
        });
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="bg-white text-zinc-950 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Gestión de Ubicaciones
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Administra los puntos de control para las garantías.
            </p>
          </div>
        </div>

        <Button
          className="gap-2 bg-white text-zinc-950 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva Ubicación
        </Button>

        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title="Crear Nueva Ubicación"
        >
          <form
            onSubmit={handleCreate}
            className="space-y-4 pt-4 text-zinc-900 dark:text-zinc-100"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre de la ubicación
              </label>
              <Input
                id="name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Ej: Taller, Bodega, Recepción"
                disabled={isPending}
                maxLength={25}
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar Ubicación"}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden transition-all">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4 text-center">Garantías Activas</th>
              <th className="px-6 py-4 text-center">Garantías Completadas</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {currentItems.map((loc) => (
              <tr
                key={loc.id}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {loc.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge variant="outline" className="font-mono">
                    {loc.activeCount}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge variant="outline" className="font-mono">
                    {loc.completedCount}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  {loc.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                      Activa
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                    >
                      Inactiva
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1">
                    {loc.isActive ? (
                      <>
                        {loc.activeCount > 0 || loc.hasHistory ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            onClick={() =>
                              handleToggleActive(loc.id, loc.isActive)
                            }
                            disabled={isPending}
                            title="Desactivar ubicación"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:hover:bg-red-900/20"
                            onClick={() => handleDelete(loc.id, loc.name)}
                            disabled={isPending}
                            title="Eliminar ubicación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleToggleActive(loc.id, loc.isActive)}
                        disabled={isPending}
                        title="Habilitar ubicación"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-20 text-center text-zinc-500 dark:text-zinc-400 italic"
                >
                  No hay ubicaciones registradas aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mostrando del {(currentPage - 1) * itemsPerPage + 1} al{" "}
              {Math.min(currentPage * itemsPerPage, locations.length)} de{" "}
              {locations.length} resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 dark:bg-zinc-900 dark:border-zinc-800"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 dark:bg-zinc-900 dark:border-zinc-800"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
      <ConfirmationDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant={confirmState.variant}
        isLoading={isPending}
      />
    </div>
  );
}
