"use client";

import { Dialog } from "@/components/ui/dialog";
import { Service } from "@/lib/types";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatEntryDate } from "@/lib/format-date";

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

		const costText =
			Service.repairCost && Service.repairCost > 0
				? formatCurrency(Service.repairCost)
				: "______________";

		printWindow.document.write(`
			<html>
				<head>
					<title>Etiqueta de Servicio #${Service.invoiceNumber}</title>
					<style>
						@page { margin: 0; }
						body {
							font-family: sans-serif;
							width: 58mm;
							margin: 0;
							padding: 5mm;
							font-size: 10pt;
							line-height: 1.2;
						}
						.header {
							text-align: center;
							border-bottom: 1pt dashed #000;
							margin-bottom: 3mm;
							padding-bottom: 2mm;
						}
						.invoice { font-size: 14pt; font-weight: bold; }
						.field { margin-bottom: 2mm; }
						.label { font-size: 8pt; text-transform: uppercase; color: #555; }
						.value { font-weight: bold; display: block; word-break: break-word; }
						.cost-section {
							margin-top: 4mm;
							padding: 2mm;
							border: 1pt solid #000;
							text-align: center;
						}
						.footer {
							margin-top: 5mm;
							text-align: center;
							font-size: 8pt;
							border-top: 1pt dashed #000;
							padding-top: 2mm;
						}
					</style>
				</head>
				<body>
					<div class="header">
						<div class="label">Comprobante de Servicio</div>
						<div class="invoice">#${Service.invoiceNumber}</div>
					</div>

					<div class="field">
						<span class="label">Cliente</span>
						<span class="value">${Service.clientName}</span>
						${Service.rut ? `<span class="value" style="font-size: 9pt;">${Service.rut}</span>` : ""}
					</div>

					<div class="field">
						<span class="label">Contacto</span>
						<span class="value">${Service.contact || "Sin teléfono"}</span>
						${Service.email ? `<span class="value" style="font-size: 9pt;">${Service.email}</span>` : ""}
					</div>

					<div class="field">
						<span class="label">Producto</span>
						<span class="value">${Service.product}</span>
						${Service.sku ? `<span class="label">SKU:</span> <span class="value" style="display:inline; font-size:9pt;">${Service.sku}</span>` : ""}
					</div>

					<div class="field">
						<span class="label">Fecha Ingreso</span>
						<span class="value">${formatEntryDate(Service.entryDate)}</span>
					</div>

					${
						Service.deliveryDate
							? `
					<div class="field">
						<span class="label">Fecha Entrega</span>
						<span class="value">${formatEntryDate(Service.deliveryDate)}</span>
					</div>
					`
							: ""
					}

					<div class="field">
						<span class="label">Sede</span>
						<span class="value">${Service.location}</span>
					</div>

					${
						Service.failureDescription
							? `
					<div class="field">
						<span class="label">Falla Reportada</span>
						<span class="value" style="font-weight: normal; font-size: 9pt;">${Service.failureDescription}</span>
					</div>
					`
							: ""
					}

					${
						Service.notes
							? `
					<div class="field">
						<span class="label">Notas</span>
						<span class="value" style="font-weight: normal; font-size: 9pt; font-style: italic;">${Service.notes}</span>
					</div>
					`
							: ""
					}

					<div class="cost-section">
						<span class="label">Costo Reparación</span>
						<div style="font-size: 14pt; font-weight: bold; margin-top: 1mm;">${costText}</div>
					</div>

					<div class="footer">
						Gracias por su preferencia
					</div>

					<script>
						window.onload = function() {
							window.print();
							window.onafterprint = function() { window.close(); };
						};
					</script>
				</body>
			</html>
		`);
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
