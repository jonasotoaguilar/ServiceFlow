"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, MapPin, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLocationLogs } from "@/app/actions/logs";

interface LogEntry {
  id: string;
  warrantyId: string;
  invoiceNumber: string | null;
  product: string;
  clientName: string;
  fromLocation: string;
  toLocation: string;
  changedAt: string;
}

interface LogsManagerProps {
  initialLogs: LogEntry[];
  initialTotal: number;
  locations: any[];
}

export default function LogsManager({
  initialLogs,
  initialTotal,
  locations,
}: Readonly<LogsManagerProps>) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locationId, setLocationId] = useState("");

  const fetchLogs = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const result = await getLocationLogs({
          page,
          limit,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          locationId: locationId || undefined,
        });

        if (result.data) {
          setLogs(result.data);
          setTotal(result.total);
        }
      } catch (e) {
        console.error("Error fetching logs:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, locationId]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchLogs(1);
  }, [startDate, endDate, locationId, fetchLogs]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="bg-white text-zinc-950 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Historial de Movimientos
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Seguimiento de cambios de ubicación de las garantías.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(currentPage)}
          disabled={isLoading}
          className="bg-white dark:bg-zinc-900"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-2">
          <label
            htmlFor="startDate"
            className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1"
          >
            Desde
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="endDate"
            className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1"
          >
            Hasta
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="locationSelect"
            className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1"
          >
            Ubicación
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <select
              id="locationSelect"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/50 px-10 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                  N° Boleta
                </th>
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  Producto / Cliente
                </th>
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                  Origen
                </th>
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                  Destino
                </th>
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                  Fecha / Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-zinc-200 dark:text-zinc-800" />
                      <p>No se encontraron movimientos registrados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant="outline"
                        className="font-mono bg-zinc-50 dark:bg-zinc-900"
                      >
                        {log.invoiceNumber || "S/N"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {log.product}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {log.clientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800">
                        {log.fromLocation}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                        {log.toLocation}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {new Date(log.changedAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">
                          {new Date(log.changedAt).toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mostrando página {currentPage} de {totalPages} ({total} movimientos)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-8 bg-white dark:bg-zinc-900"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 bg-white dark:bg-zinc-900"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
