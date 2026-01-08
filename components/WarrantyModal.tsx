"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Warranty } from "@/lib/types";
import {
  formatRut,
  formatChileanPhone,
  formatCurrency,
  parseCurrency,
} from "@/lib/utils";
import { Textarea } from "./ui/textarea";

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warrantyToEdit?: Warranty | null;
  availableLocations: { id: string; name: string }[];
}

export function WarrantyModal({
  isOpen,
  onClose,
  onSuccess,
  warrantyToEdit,
  availableLocations,
}: Readonly<WarrantyModalProps>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Warranty>>({});

  const LOCATIONS = useMemo(() => {
    return availableLocations;
  }, [availableLocations]);

  const isEditing = !!warrantyToEdit;
  const isLocked =
    isEditing &&
    warrantyToEdit.status === "completed" &&
    (formData.status ?? warrantyToEdit.status) === "completed";

  useEffect(() => {
    if (!isOpen) return;

    if (warrantyToEdit) {
      setFormData(warrantyToEdit);
    } else {
      setFormData({
        clientName: "",
        product: "",
        failureDescription: "",
        locationId: LOCATIONS.length > 0 ? LOCATIONS[0].id : "",
        repairCost: 0,
        invoiceNumber: undefined,
        status: "pending",
        contact: "+56 9 ",
        email: "",
        rut: "",
        sku: "",
        entryDate: new Date().toISOString(),
      });
    }
  }, [warrantyToEdit, isOpen, LOCATIONS]);

  useEffect(() => {
    if (formData.status === "completed") {
      if (!formData.deliveryDate) {
        setFormData((prev) => ({
          ...prev,
          deliveryDate: new Date().toISOString(),
        }));
      }
      if (!formData.readyDate) {
        setFormData((prev) => ({
          ...prev,
          readyDate: new Date().toISOString(),
        }));
      }
    } else if (formData.status === "ready") {
      setFormData((prev) => ({
        ...prev,
        readyDate: prev.readyDate || new Date().toISOString(),
        deliveryDate: undefined,
      }));
    } else if (formData.deliveryDate || formData.readyDate) {
      setFormData((prev) => ({
        ...prev,
        deliveryDate: undefined,
        readyDate: undefined,
      }));
    }
  }, [formData.deliveryDate, formData.readyDate, formData.status]);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatChileanPhone(val);
    setFormData({ ...formData, contact: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!warrantyToEdit;
      const url = "/api/warranties";
      const method = isEdit ? "PUT" : "POST";

      const body = isEdit
        ? JSON.stringify(formData)
        : JSON.stringify({
            ...formData,
          });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al guardar");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const getSubmitButtonText = () => {
    if (warrantyToEdit) return "Actualizar";
    return "Registrar";
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={warrantyToEdit ? "Editar Garantía" : "Nueva Garantía"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="grid gap-2 text-zinc-900 dark:text-zinc-100 mb-4">
              <label
                htmlFor="entry-date"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Fecha de Ingreso *
              </label>
              <Input
                id="entry-date"
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={
                  formData.entryDate
                    ? new Date(formData.entryDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setFormData({ ...formData, entryDate: undefined });
                    return;
                  }

                  // Logic: If today, use current time. If past, use 10:00 AM.
                  const now = new Date();

                  // Reset hours to compare just dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  // Adjust for timezone offset to ensure correct "local" date comparison
                  // or simpler: compare date strings
                  const isToday = val === now.toISOString().split("T")[0];

                  if (isToday) {
                    // Use current time
                    const dateWithCurrentTime = new Date(val);
                    dateWithCurrentTime.setHours(
                      now.getHours(),
                      now.getMinutes(),
                      now.getSeconds()
                    );
                    // Adjust for local timezone offset when creating from YYYY-MM-DD
                    // But actually new Date(val) treats it as UTC usually for 'YYYY-MM-DD'?
                    // Let's use reliable construction
                    const [y, m, d] = val.split("-").map(Number);
                    const finalDate = new Date(
                      y,
                      m - 1,
                      d,
                      now.getHours(),
                      now.getMinutes(),
                      now.getSeconds()
                    );
                    setFormData({
                      ...formData,
                      entryDate: finalDate.toISOString(),
                    });
                  } else {
                    // Use 10:00 AM
                    const [y, m, d] = val.split("-").map(Number);
                    const finalDate = new Date(y, m - 1, d, 10, 0, 0);
                    setFormData({
                      ...formData,
                      entryDate: finalDate.toISOString(),
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="invoice-number"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  N° Boleta *
                </label>
                <Input
                  id="invoice-number"
                  required
                  autoFocus
                  disabled={isLocked || isEditing}
                  placeholder="123456"
                  value={formData.invoiceNumber || ""}
                  maxLength={20}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      invoiceNumber: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="sku"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  SKU *
                </label>
                <Input
                  id="sku"
                  required
                  disabled={isLocked || isEditing}
                  placeholder="Código producto"
                  value={formData.sku || ""}
                  maxLength={20}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="client-name"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Cliente *
                </label>
                <Input
                  id="client-name"
                  disabled={isLocked || isEditing}
                  required
                  placeholder="Nombre completo"
                  value={formData.clientName || ""}
                  maxLength={25}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="rut"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  RUT *
                </label>
                <Input
                  id="rut"
                  disabled={isLocked || isEditing}
                  required
                  placeholder="12.345.678-9"
                  value={formData.rut || ""}
                  onChange={handleRutChange}
                  maxLength={12}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="contact"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Teléfono *
                </label>
                <Input
                  id="contact"
                  required
                  disabled={isLocked}
                  placeholder="+56 9..."
                  value={formData.contact || ""}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  pattern="\+56 9 \d{4} \d{4}"
                  title="Rellene el campo con el formato: +56 9 XXXX XXXX"
                />
              </div>
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email
                </label>
                <Input
                  id="email"
                  disabled={isLocked}
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  maxLength={320}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
                <label
                  htmlFor="product"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Producto *
                </label>
                <Input
                  id="product"
                  disabled={isLocked || isEditing}
                  required
                  placeholder="Nombre del producto"
                  value={formData.product || ""}
                  maxLength={40}
                  onChange={(e) =>
                    setFormData({ ...formData, product: e.target.value })
                  }
                />
              </div>
            )}
            <div
              className={`${
                isEditing ? "col-span-2" : ""
              } grid gap-2 text-zinc-900 dark:text-zinc-100`}
            >
              <label
                htmlFor="repair-cost"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Costo reparación
              </label>
              <Input
                id="repair-cost"
                disabled={isLocked}
                type="text"
                placeholder="$0"
                value={formatCurrency(formData.repairCost || 0)}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = parseCurrency(val);
                  if (num <= 999999999) {
                    setFormData({ ...formData, repairCost: num });
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <label
              htmlFor="location-select"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Ubicación *
            </label>
            <select
              id="location-select"
              disabled={isLocked}
              required
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 disabled:opacity-50"
              value={formData.locationId ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, locationId: e.target.value })
              }
            >
              <option value="" disabled>
                {LOCATIONS.length > 0
                  ? "Seleccionar ubicación"
                  : "Sin ubicaciones creadas"}
              </option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
              {formData.locationId &&
                !LOCATIONS.some((l) => l.id === formData.locationId) && (
                  <option value={formData.locationId}>
                    {formData.location || "Ubicación anterior"}
                  </option>
                )}
            </select>
          </div>

          <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <label
              htmlFor="status-select"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Estado
            </label>
            <select
              id="status-select"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              value={formData.status ?? "pending"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
            >
              <option value="pending">Pendiente</option>
              <option value="ready">Lista (Para retiro)</option>
              <option value="completed">Completada (Entregada/Cerrada)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <label
              htmlFor="failure-description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Falla / Motivo *
            </label>
            <Textarea
              id="failure-description"
              disabled={isLocked}
              required
              placeholder="Describa la falla detalladamente..."
              value={formData.failureDescription || ""}
              maxLength={500}
              className="min-h-[100px] resize-y"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  failureDescription: e.target.value,
                })
              }
            />
          </div>

          <div className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Notas internas
            </label>
            <Textarea
              id="notes"
              placeholder="Detalles adicionales, observaciones del técnico, etc..."
              value={formData.notes || ""}
              maxLength={1000}
              className="min-h-[80px] resize-y"
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Guardando..." : getSubmitButtonText()}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
