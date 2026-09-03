"use client";

import { Dialog } from "@/components/ui/dialog";
import { Service } from "@/lib/types";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatEntryDate } from "@/lib/format-date";
import { renderCustodyReceiptHtml } from "@/lib/custody-receipt";

interface ServiceDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	Service: Service | null;
}

export function ServiceDetailsModal({
	isOpen,
	onClose,
	Service,
}: Readonly<ServiceDetailsModalProps>) {
	if (!Service) return null;

	const getStatusBadge = (status: Service["status"]) => {
		switch (status) {
			case "ready":
				return (
					<Badge className="bg-ready-bg text-ready-fg border border-ready-border font-semibold">
						Reparada
					</Badge>
				);
			case "pending":
				return (
					<Badge variant="outline" className="bg-pending-bg text-pending-fg border-pending-border">
						Pendiente
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-completed-bg text-completed-fg border border-completed-border font-semibold">
						Entregada
					</Badge>
				);
			case "cancelled":
				return (
					<Badge
						variant="outline"
						className="bg-cancelled-bg text-cancelled-fg border-cancelled-border"
					>
						Cancelada
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const handlePrint = () => {
		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const html = renderCustodyReceiptHtml(Service);
		printWindow.document.write(html);
		printWindow.document.close();
	};

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={`Detalles servicio #${Service.invoiceNumber || "S/N"}`}
			headerActions={
				<button
					type="button"
					onClick={handlePrint}
					className="text-foreground-muted hover:text-foreground transition-colors bg-surface-muted hover:bg-surface-muted/80 p-2 rounded-lg border border-border"
					title="Imprimir Etiqueta"
				>
					<Printer className="h-5 w-5" />
				</button>
			}
		>
			<div className="space-y-4 text-sm font-sans pt-2">
				{/* Encabezado Cliente/Estado */}
				<div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">
							Cliente
						</p>
						<p className="font-bold text-xl tracking-tight text-foreground leading-tight">
							{Service.clientName}
						</p>
						{Service.rut && (
							<p className="text-foreground-subtle font-mono text-xs mt-1">{Service.rut}</p>
						)}
					</div>
					<div className="text-right">
						<p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
							Estado Actual
						</p>
						{getStatusBadge(Service.status)}
					</div>
				</div>

				{/* Información General en Boxes (AHORA ARRIBA) */}
				<div className="grid grid-cols-2 gap-3">
					<div className="bg-surface-muted p-3 rounded-xl border border-border">
						<p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">
							Producto
						</p>
						<p
							className="text-foreground font-medium wrap-break-word leading-tight"
							title={Service.product}
						>
							{Service.product}
						</p>
						{Service.sku && (
							<p className="text-[10px] text-foreground-subtle mt-1 font-mono break-all leading-tight">
								SKU: {Service.sku}
							</p>
						)}
					</div>

					<div className="bg-surface-muted p-3 rounded-xl border border-border">
						<p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">
							Contacto
						</p>
						<p className="text-foreground font-medium wrap-break-word leading-tight">
							{Service.contact || "Sin teléfono"}
						</p>
						{Service.email && (
							<p
								className="text-[10px] text-foreground-subtle wrap-break-word mt-1"
								title={Service.email}
							>
								{Service.email}
							</p>
						)}
					</div>

					<div className="bg-surface-muted p-3 rounded-xl border border-border">
						<p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">
							Sede
						</p>
						<p className="text-foreground font-medium wrap-break-word leading-tight">
							{Service.location}
						</p>
					</div>

					<div className="bg-surface-muted p-3 rounded-xl border border-border">
						<p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">
							Costo
						</p>
						<p className="text-foreground font-medium">
							{Service.repairCost && Service.repairCost > 0
								? formatCurrency(Service.repairCost)
								: "Sin costo"}
						</p>
					</div>
				</div>

				{/* Falla Reportada */}
				{Service.failureDescription && (
					<div className="bg-surface-muted p-4 rounded-xl border border-border">
						<p className="text-foreground-muted text-xs font-semibold uppercase tracking-widest mb-2">
							Falla reportada
						</p>
						<p className="text-foreground text-sm leading-relaxed">{Service.failureDescription}</p>
					</div>
				)}

				{/* Notas */}
				{Service.notes && (
					<div className="bg-surface-muted p-4 rounded-xl border border-border">
						<p className="text-foreground-muted text-xs font-semibold uppercase tracking-widest mb-2">
							Notas adicionales
						</p>
						<p className="text-foreground-muted text-sm italic">"{Service.notes}"</p>
					</div>
				)}

				{/* Sección de Fechas Críticas */}
				<div className="grid grid-cols-1 gap-3">
					<div className="bg-pending-bg p-3 rounded-xl border border-pending-border">
						<p className="text-pending-fg text-[10px] font-bold uppercase tracking-widest mb-1">
							Fecha de Ingreso
						</p>
						<p className="text-pending-fg font-medium">{formatEntryDate(Service.entryDate)}</p>
					</div>

					{Service.readyDate && (
						<div className="bg-ready-bg p-3 rounded-xl border border-ready-border">
							<p className="text-ready-fg text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Reparación
							</p>
							<p className="text-ready-fg font-medium">{formatEntryDate(Service.readyDate)}</p>
						</div>
					)}

					{Service.deliveryDate && (
						<div className="bg-completed-bg p-3 rounded-xl border border-completed-border">
							<p className="text-completed-fg text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Entrega
							</p>
							<p className="text-completed-fg font-medium">
								{formatEntryDate(Service.deliveryDate)}
							</p>
						</div>
					)}

					{Service.cancellationDate && (
						<div className="bg-cancelled-bg p-3 rounded-xl border border-cancelled-border">
							<p className="text-cancelled-fg text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Cancelación
							</p>
							<p className="text-cancelled-fg font-medium">
								{formatEntryDate(Service.cancellationDate)}
							</p>
						</div>
					)}
				</div>

				{/* Historial de Movimientos */}
				{Service.serviceEvents && Service.serviceEvents.length > 0 && (
					<div className="pt-4 mt-2 border-t border-border">
						<p className="text-foreground-subtle text-[10px] font-bold uppercase tracking-widest mb-3">
							Historial de Movimientos
						</p>
						<div className="space-y-2">
							{Service.serviceEvents.map((event) => (
								<div
									key={event.id}
									className="flex justify-between items-center text-[11px] p-2.5 bg-surface-muted rounded-lg border border-border"
								>
									<span className="text-foreground-muted font-mono">
										{formatEntryDate(event.changedAt)}
									</span>
									<span className="font-semibold text-foreground">
										{event.fromLocation} <span className="text-foreground-subtle px-1">→</span>{" "}
										{event.toLocation}
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
