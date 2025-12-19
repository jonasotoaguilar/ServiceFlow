"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Warranty } from "@/lib/types";
import { formatRut, formatChileanPhone } from "@/lib/utils";

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warrantyToEdit?: Warranty | null;
  availableLocations: string[];
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
        location: LOCATIONS.length > 0 ? LOCATIONS[0] : "",
        repairCost: 0,
        invoiceNumber: undefined,
        status: "pending",
        contact: "+56 9 ",
        email: "",
        rut: "",
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
  }, [formData.status]);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatChileanPhone(val);
    setFormData({ ...formData, contact: formatted });
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/\d/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
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
            entryDate: new Date().toISOString(),
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
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                N° Boleta *
              </span>
              <Input
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
            </label>
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                SKU
              </span>
              <Input
                disabled={isLocked}
                placeholder="Código producto"
                value={formData.sku || ""}
                maxLength={20}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="sm:col-span-2 grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Cliente *
              </span>
              <Input
                disabled={isLocked || isEditing}
                required
                placeholder="Nombre completo"
                value={formData.clientName || ""}
                maxLength={25}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                RUT *
              </span>
              <Input
                disabled={isLocked || isEditing}
                required
                placeholder="12.345.678-9"
                value={formData.rut || ""}
                onChange={handleRutChange}
                maxLength={12}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Teléfono *
              </span>
              <Input
                required
                disabled={isLocked}
                placeholder="+56 9..."
                value={formData.contact || ""}
                onChange={handlePhoneChange}
                maxLength={15}
                pattern="\+56 9 \d{4} \d{4}"
                title="Rellene el campo con el formato: +56 9 XXXX XXXX"
              />
            </label>
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </span>
              <Input
                disabled={isLocked}
                type="email"
                placeholder="cliente@email.com"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Producto *
              </span>
              <Input
                disabled={isLocked || isEditing}
                required
                placeholder="Nombre del producto"
                value={formData.product || ""}
                maxLength={40}
                onChange={(e) =>
                  setFormData({ ...formData, product: e.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Falla / Motivo *
              </span>
              <Input
                disabled={isLocked}
                required
                placeholder="Descripción de la falla"
                value={formData.failureDescription || ""}
                maxLength={100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    failureDescription: e.target.value,
                  })
                }
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
          <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ubicación *
            </span>
            <select
              disabled={isLocked}
              required
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 disabled:opacity-50"
              value={formData.location ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            >
              <option value="" disabled>
                {LOCATIONS.length > 0
                  ? "Seleccionar ubicación"
                  : "Sin ubicaciones creadas"}
              </option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              {formData.location && !LOCATIONS.includes(formData.location) && (
                <option value={formData.location}>{formData.location}</option>
              )}
            </select>
          </label>

          <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Costo ($)
            </span>
            <Input
              disabled={isLocked}
              type="number"
              min="0"
              max="999999999"
              placeholder="0"
              onKeyDown={handleNumberInput}
              value={
                formData.repairCost === 0 || formData.repairCost === undefined
                  ? ""
                  : formData.repairCost
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setFormData({ ...formData, repairCost: undefined });
                } else {
                  const num = Number(val);
                  if (num >= 0) setFormData({ ...formData, repairCost: num });
                }
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Estado
            </span>
            <select
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
          </label>

          <label className="grid gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notas internas
            </span>
            <Input
              placeholder="Detalles adicionales..."
              value={formData.notes || ""}
              maxLength={250}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </label>
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
