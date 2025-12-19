"use client";

import { Dialog } from "./ui/dialog";
import { Warranty } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "./ui/badge";
import { formatCurrency } from "@/lib/utils";

interface WarrantyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  warranty: Warranty | null;
}

export function WarrantyDetailsModal({
  isOpen,
  onClose,
  warranty,
}: Readonly<WarrantyDetailsModalProps>) {
  if (!warranty) return null;

  const formatDate = (date: string) =>
    format(parseISO(date), "dd MMM yyyy HH:mm", { locale: es });

  const getStatusBadge = (status: Warranty["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:text-white">
            Lista
          </Badge>
        );
      case "pending":
        return <Badge variant="warning">Pendiente</Badge>;
      case "completed":
        return (
          <Badge className="bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
            Completada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles Garantía #${warranty.invoiceNumber || "S/N"}`}
    >
      <div className="space-y-4 text-sm mt-4">
        <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="min-w-0">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Cliente</p>
            <p className="font-medium text-lg break-all">
              {warranty.clientName}
            </p>
            {warranty.rut && (
              <p className="text-zinc-500 font-mono text-xs">{warranty.rut}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Estado</p>
            {getStatusBadge(warranty.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Producto</p>
            <p className="font-medium break-all">{warranty.product}</p>
            {warranty.sku && (
              <p className="text-xs text-zinc-500 break-all">
                SKU: {warranty.sku}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Contacto</p>
            <div className="flex flex-col">
              {warranty.email && (
                <span className="break-all" title={warranty.email}>
                  {warranty.email}
                </span>
              )}
              {warranty.contact && (
                <span className="break-all">{warranty.contact}</span>
              )}
              {!warranty.email && !warranty.contact && (
                <span className="italic text-zinc-400">No registrado</span>
              )}
            </div>
          </div>
        </div>

        {warranty.failureDescription && (
          <div className="text-xs">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
              Falla reportada
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded wrap-break-word">
              {warranty.failureDescription}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Ubicación Actual
            </p>
            <p className="font-medium text-base">{warranty.location}</p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Costo Reparación
            </p>
            <p className="font-medium text-base">
              {warranty.repairCost && warranty.repairCost > 0
                ? formatCurrency(warranty.repairCost)
                : "Sin costo"}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
          <p className="text-blue-700 dark:text-blue-400 text-xs font-semibold">
            Fecha Ingreso
          </p>
          <p className="text-blue-900 dark:text-blue-100">
            {formatDate(warranty.entryDate)}
          </p>
        </div>

        {warranty.readyDate && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/50">
            <p className="text-yellow-700 dark:text-yellow-400 text-xs font-semibold">
              Fecha Reparada
            </p>
            <p className="text-yellow-900 dark:text-yellow-100">
              {formatDate(warranty.readyDate)}
            </p>
          </div>
        )}

        {warranty.deliveryDate && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900/50">
            <p className="text-green-700 dark:text-green-400 text-xs font-semibold">
              Fecha Entrega
            </p>
            <p className="text-green-900 dark:text-green-100">
              {formatDate(warranty.deliveryDate)}
            </p>
          </div>
        )}

        {warranty.notes && (
          <div className="min-w-0">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
              Notas
            </p>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-md text-zinc-700 dark:text-zinc-300 italic wrap-break-word overflow-hidden">
              "{warranty.notes}"
            </div>
          </div>
        )}

        {warranty.locationLogs && warranty.locationLogs.length > 0 && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 font-medium">
              Historial de Movimientos
            </p>
            <div className="space-y-2">
              {warranty.locationLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center text-xs p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-sm"
                >
                  <span className="text-zinc-500 font-mono">
                    {formatDate(log.changedAt)}
                  </span>
                  <span className="font-medium">
                    {log.fromLocation} <span className="text-zinc-400">→</span>{" "}
                    {log.toLocation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
