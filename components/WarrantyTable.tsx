"use client";

import { differenceInBusinessDays, parseISO, format } from "date-fns";
import { Warranty } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Pencil, Eye, Trash2 } from "lucide-react";

interface WarrantyTableProps {
  warranties: Warranty[];
  onEdit: (warranty: Warranty) => void;
  onView: (warranty: Warranty) => void;
  onDelete: (warranty: Warranty) => void;
}

export function WarrantyTable({
  warranties,
  onEdit,
  onView,
  onDelete,
}: Readonly<WarrantyTableProps>) {
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

  const calculateDays = (
    entryDate: string,
    deliveryDate?: string,
    status?: Warranty["status"]
  ) => {
    try {
      const start = parseISO(entryDate);
      const end =
        status === "completed" && deliveryDate
          ? parseISO(deliveryDate)
          : new Date();
      return differenceInBusinessDays(end, start);
    } catch (e) {
      console.error(e);
      return 0;
    }
  };

  const getDaysBadgeColor = (days: number) => {
    if (days >= 15)
      return "bg-red-500 text-white hover:bg-red-600 dark:bg-red-900 dark:text-red-100";
    if (days >= 10)
      return "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-800 dark:text-orange-100";
    return "bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:text-green-100";
  };

  if (warranties.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        No hay garantías registradas.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Boleta</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3 text-center">Fecha Ingreso</th>
              <th className="px-4 py-3 text-center">Días Transc.</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {warranties.map((warranty) => {
              const days = calculateDays(
                warranty.entryDate,
                warranty.deliveryDate,
                warranty.status
              );
              return (
                <tr
                  key={warranty.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    {warranty.invoiceNumber || "-"}
                  </td>
                  <td className="px-4 py-3">{warranty.product}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {warranty.clientName}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-sm">
                      {warranty.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                    {format(parseISO(warranty.entryDate), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={getDaysBadgeColor(days)}>
                      {days} días
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(warranty.status)}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(warranty)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 text-zinc-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(warranty)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(warranty)}
                      title="Eliminar"
                      className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
