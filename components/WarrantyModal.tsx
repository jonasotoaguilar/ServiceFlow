"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Warranty } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { formatRut, formatChileanPhone } from "@/lib/utils";

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warrantyToEdit?: Warranty | null;
  availableLocations: string[];
  onAddLocation: (loc: string) => void;
  onDeleteLocation: (loc: string) => void;
}

export function WarrantyModal({
  isOpen,
  onClose,
  onSuccess,
  warrantyToEdit,
  availableLocations,
  onAddLocation,
  onDeleteLocation,
}: Readonly<WarrantyModalProps>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Warranty>>({});

  // Estado para nueva ubicación
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState("");

  const LOCATIONS =
    availableLocations.length > 0
      ? availableLocations
      : ["Recepcion", "Taller", "Bodega", "Proveedor", "Cliente"];

  // Bloqueo solo si la garantía YA estaba completada y sigue estando completada durante la edición.
  const isLocked =
    !!warrantyToEdit &&
    warrantyToEdit.status === "completed" &&
    (formData.status ?? warrantyToEdit.status) === "completed";

  useEffect(() => {
    if (warrantyToEdit) {
      setFormData(warrantyToEdit);
    } else {
      setFormData({
        clientName: "",
        product: "",
        failureDescription: "",
        location: LOCATIONS[0],
        repairCost: 0,
        invoiceNumber: undefined,
        status: "pending",
        contact: "+56 9 ",
        email: "",
        rut: "",
      });
    }
    setIsAddingLocation(false);
  }, [warrantyToEdit, isOpen]);

  // Efecto para manejar fecha de entrega y fecha de lista
  useEffect(() => {
    // Lógica para Delivery Date (Completada)
    if (formData.status === "completed") {
      if (!formData.deliveryDate) {
        setFormData((prev) => ({
          ...prev,
          deliveryDate: new Date().toISOString(),
        }));
      }
      // Mantener readyDate si ya existía (ej: pasó de ready a completed), si no, asumimos que quedó lista ahora mismo también?
      // Generalmente si se completa directo, también está lista.
      if (!formData.readyDate) {
        setFormData((prev) => ({
          ...prev,
          readyDate: new Date().toISOString(),
        }));
      }
    } else if (formData.status === "ready") {
      // Lógica para Ready Date (Lista)
      // Si cambiamos a lista y no tiene fecha, la ponemos. Eliminamos fecha de entrega si existiera.
      setFormData((prev) => ({
        ...prev,
        readyDate: prev.readyDate || new Date().toISOString(),
        deliveryDate: undefined,
      }));
    } else if (formData.deliveryDate || formData.readyDate) {
      // Si volvemos a pendiente (o cualquier otro estado inicial), limpiamos ambas fechas
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
    // Prevenir caracteres no numéricos excepto teclas de control
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

    // Validación de Teléfono
    // Formato esperado: +56 9 1234 5678 (15 caracteres)
    const phoneRegex = /^\+56 9 \d{4} \d{4}$/;
    if (!formData.contact || !phoneRegex.test(formData.contact)) {
      alert("El teléfono debe estar completo: +56 9 1234 5678");
      setLoading(false);
      return;
    }

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

  const handleAddNewLocation = () => {
    if (newLocation.trim()) {
      onAddLocation(newLocation);
      setFormData({ ...formData, location: newLocation });
      setIsAddingLocation(false);
      setNewLocation("");
    }
  };

  const handleDeleteCurrentLocation = () => {
    if (formData.location && LOCATIONS.includes(formData.location)) {
      if (confirm(`¿Eliminar ubicación "${formData.location}"?`)) {
        onDeleteLocation(formData.location);
        setFormData({ ...formData, location: LOCATIONS[0] });
      }
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
        {/* Fila 1: Boleta y SKU */}
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">N° Boleta *</span>
            <Input
              required
              autoFocus
              disabled={isLocked}
              placeholder="123456"
              value={formData.invoiceNumber || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  invoiceNumber: e.target.value || undefined,
                })
              }
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">SKU</span>
            <Input
              disabled={isLocked}
              placeholder="Código producto"
              value={formData.sku || ""}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
            />
          </label>
        </div>

        {/* Fila 2: Cliente y RUT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="sm:col-span-2 grid gap-2">
            <span className="text-sm font-medium">Cliente *</span>
            <Input
              disabled={isLocked}
              required
              placeholder="Nombre completo"
              value={formData.clientName || ""}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">RUT</span>
            <Input
              disabled={isLocked}
              placeholder="12.345.678-9"
              value={formData.rut || ""}
              onChange={handleRutChange}
              maxLength={12} // XX.XXX.XXX-X
            />
          </label>
        </div>

        {/* Fila 3: Contacto */}
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
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
          <label className="grid gap-2">
            <span className="text-sm font-medium">Teléfono *</span>
            <Input
              required
              disabled={isLocked}
              placeholder="+56 9..."
              value={formData.contact || ""}
              onChange={handlePhoneChange}
              maxLength={15}
            />
          </label>
        </div>

        {/* Fila 4: Producto y Falla */}
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Producto *</span>
            <Input
              disabled={isLocked}
              required
              placeholder="Nombre del producto"
              value={formData.product || ""}
              onChange={(e) =>
                setFormData({ ...formData, product: e.target.value })
              }
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Falla / Motivo *</span>
            <Input
              disabled={isLocked}
              required
              placeholder="Descripción de la falla"
              value={formData.failureDescription || ""}
              onChange={(e) =>
                setFormData({ ...formData, failureDescription: e.target.value })
              }
            />
          </label>
        </div>

        {/* Fila 5: Ubicación y Costo */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Ubicación</span>
            {isAddingLocation ? (
              <span className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Nueva ubicación..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
                <Button type="button" size="sm" onClick={handleAddNewLocation}>
                  OK
                </Button>
              </span>
            ) : (
              <span className="flex gap-2 items-center">
                <select
                  disabled={isLocked}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 disabled:opacity-50"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  {formData.location &&
                    !LOCATIONS.includes(formData.location) && (
                      <option value={formData.location}>
                        {formData.location}
                      </option>
                    )}
                </select>
                {!isLocked && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setIsAddingLocation(true)}
                      title="Nueva ubicación"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={handleDeleteCurrentLocation}
                      title="Eliminar esta ubicación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </span>
            )}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Costo ($)</span>
            <Input
              disabled={isLocked}
              type="number"
              min="0"
              placeholder="0"
              onKeyDown={handleNumberInput}
              value={formData.repairCost === 0 ? "" : formData.repairCost}
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

        {/* Fila 6: Estado y Notas (Estado editable siempre, o restringido? El prompt dice "excepto 'estado' y 'notas internas' no seran editables". O sea estado y notas SI son editables) */}
        <label className="grid gap-2">
          <span className="text-sm font-medium">Estado</span>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
          >
            <option value="pending">Pendiente</option>
            <option value="ready">Lista (Para retiro)</option>
            <option value="completed">Completada (Entregada/Cerrada)</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Notas internas</span>
          <Input
            placeholder="Detalles adicionales..."
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : getSubmitButtonText()}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
