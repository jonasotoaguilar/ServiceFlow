"use client";

import { useEffect, useState, useCallback } from "react";
import { getLocations } from "@/app/actions/locations";
import { logout } from "@/app/actions/auth";
import { Warranty, WarrantyStatus } from "@/lib/types";
import { WarrantyTable } from "./WarrantyTable";
import { WarrantyModal } from "./WarrantyModal";
import { WarrantyDetailsModal } from "./WarrantyDetailsModal";
import { Button } from "./ui/button";
import {
  Plus,
  LayoutDashboard,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  History,
} from "lucide-react";
import Link from "next/link";
import { Input } from "./ui/input";
import { ConfirmationDialog } from "./ui/confirmationDialog";

export function WarrantyDashboard() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filtro de estados
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus[]>([
    "pending",
    "ready",
  ]);

  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [viewingWarranty, setViewingWarranty] = useState<Warranty | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    warranty: Warranty | null;
  }>({
    isOpen: false,
    warranty: null,
  });

  const fetchLocations = useCallback(async () => {
    const result = await getLocations(true);
    if (result.data) {
      setLocations(result.data);
    }
  }, []);

  const fetchWarranties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
      if (locationFilter) params.set("location", locationFilter);

      const res = await fetch(`/api/warranties?${params.toString()}`);
      if (res.ok) {
        const responseData = await res.json();
        const data: Warranty[] = responseData.data || [];
        const total = responseData.total || 0;

        setWarranties(data);
        setTotalPages(Math.max(1, Math.ceil(total / 20)));
      }
    } catch (e) {
      console.error("Error fetching warranties", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, locationFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarranties();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchWarranties]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter]);

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setIsModalOpen(true);
  };

  const handleView = (warranty: Warranty) => {
    setViewingWarranty(warranty);
    setIsDetailsOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingWarranty(null), 300);
  };

  const toggleStatusFilter = (status: WarrantyStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
            Control de Garantías
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Gestiona servicios, estados y ubicaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <Link href="/logs">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              <History className="mr-2 h-4 w-4" /> Movimientos
            </Button>
          </Link>
          <Link href="/locations">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              <MapPin className="mr-2 h-4 w-4" /> Ubicaciones
            </Button>
          </Link>
          <Button
            onClick={() => {
              setEditingWarranty(null);
              setIsModalOpen(true);
            }}
            className="bg-white text-zinc-950 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Garantía
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
            }}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800 ml-auto sm:ml-0"
          >
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      <section
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        aria-label="Filtros de búsqueda y estados"
      >
        <div className="relative w-full max-w-sm">
          <label htmlFor="dashboard-search" className="sr-only">
            Buscar garantías
          </label>
          <Search
            className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          <Input
            id="dashboard-search"
            placeholder="Buscar por cliente, RUT o N° boleta..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col items-start gap-1.5 w-full sm:w-auto">
            <label
              htmlFor="location-filter"
              className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0 px-1"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" /> Ubicación:
            </label>
            <select
              id="location-filter"
              className="flex h-9 w-full sm:w-45 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset
            className="flex flex-col items-start gap-1.5 pb-2 sm:pb-0"
            aria-labelledby="status-filter-label"
          >
            <legend
              id="status-filter-label"
              className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0 px-1"
            >
              <Filter className="h-4 w-4" aria-hidden="true" /> Estados:
            </legend>
            <div className="flex items-center gap-2 overflow-x-auto">
              {(["pending", "ready", "completed"] as WarrantyStatus[]).map(
                (status) => {
                  const isActive = statusFilter.includes(status);
                  const labels = {
                    pending: "Pendientes",
                    ready: "Listas",
                    completed: "Completadas",
                  };
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatusFilter(status)}
                      aria-pressed={isActive}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isActive
                          ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                          : "bg-transparent text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {labels[status]}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="relative min-h-75" aria-label="Lista de garantías">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="text-zinc-500 text-sm">Cargando...</div>
          </div>
        )}
        <WarrantyTable
          warranties={warranties}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={(warranty) => setDeleteConfirm({ isOpen: true, warranty })}
        />
      </section>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, warranty: null })}
        title="Eliminar Garantía"
        description={`¿Estás seguro de eliminar la garantía #${
          deleteConfirm.warranty?.invoiceNumber || "S/N"
        } de ${
          deleteConfirm.warranty?.clientName
        }? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deleteConfirm.warranty) return;
          try {
            const res = await fetch(
              `/api/warranties?id=${deleteConfirm.warranty.id}`,
              {
                method: "DELETE",
              }
            );
            if (res.ok) {
              fetchWarranties();
              setDeleteConfirm({ isOpen: false, warranty: null });
            } else {
              alert("Error al eliminar");
            }
          } catch (e) {
            console.error(e);
            alert("Error de conexión");
          }
        }}
      />

      {/* Controles de Paginación */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "ghost"}
              size="sm"
              className={`w-8 h-8 p-0 text-xs ${
                p === currentPage ? "" : "text-zinc-500"
              }`}
              onClick={() => handlePageChange(p)}
              disabled={isLoading}
            >
              {p}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0 || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <WarrantyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        warrantyToEdit={editingWarranty}
        availableLocations={locations.map((l) => ({
          id: l.id,
          name: l.name,
        }))}
        onSuccess={() => {
          fetchWarranties();
        }}
      />

      <WarrantyDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        warranty={viewingWarranty}
      />
    </main>
  );
}
