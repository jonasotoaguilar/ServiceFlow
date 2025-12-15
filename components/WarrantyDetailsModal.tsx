"use client";

import { Dialog } from "./ui/dialog";
import { Warranty } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "./ui/badge";

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

  const getBadgeVariant = (status: Warranty["status"]) => {
    if (status === "ready") return "success";
    if (status === "completed") return "default";
    return "secondary";
  };

  const getBadgeLabel = (status: Warranty["status"]) => {
    if (status === "pending") return "Pendiente";
    if (status === "ready") return "Lista";
    return "Completada";
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles Garantía #${warranty.invoiceNumber || "S/N"}`}
    >
      <div className="space-y-4 text-sm mt-4">
        <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Cliente</p>
            <p className="font-medium text-lg">{warranty.clientName}</p>
            {warranty.rut && <p className="text-zinc-500">{warranty.rut}</p>}
          </div>
          <div className="text-right">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Estado</p>
            <Badge variant={getBadgeVariant(warranty.status)}>
              {getBadgeLabel(warranty.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Producto</p>
            <p className="font-medium">{warranty.product}</p>
            {warranty.sku && (
              <p className="text-xs text-zinc-500">SKU: {warranty.sku}</p>
            )}
            {warranty.failureDescription && (
              <div className="mt-2 text-xs">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Falla reportada:
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded mt-0.5">
                  {warranty.failureDescription}
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Contacto</p>
            <div className="flex flex-col">
              {warranty.email && (
                <span className="truncate">{warranty.email}</span>
              )}
              {warranty.contact && <span>{warranty.contact}</span>}
              {!warranty.email && !warranty.contact && (
                <span className="italic text-zinc-400">No registrado</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Ubicación Actual
            </p>
            <p className="font-medium">{warranty.location}</p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Fecha Ingreso
            </p>
            <p>{formatDate(warranty.entryDate)}</p>
          </div>
        </div>

        {warranty.readyDate && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 mb-4 rounded-md border border-yellow-100 dark:border-yellow-900/50">
            <p className="text-yellow-700 dark:text-yellow-400 text-xs font-semibold">
              Fecha Lista/Reparada
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
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
              Notas
            </p>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-md text-zinc-700 dark:text-zinc-300 italic">
              "{warranty.notes}"
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
