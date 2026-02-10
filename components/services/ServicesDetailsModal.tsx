"use client";

import { Dialog } from "@/components/ui/dialog";
import { Service } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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

	const formatDate = (date: string) =>
		format(parseISO(date), "dd MMM yyyy HH:mm", { locale: es });

	const getStatusBadge = (status: Service["status"]) => {
		switch (status) {
			case "ready":
				return (
					<Badge className="bg-blue-500 text-blue-950 font-semibold hover:bg-blue-400">
						Reparada
					</Badge>
				);
			case "pending":
				return (
					<Badge
						variant="outline"
						className="text-amber-500 border-amber-500/50 bg-amber-500/10"
					>
						Pendiente
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-emerald-500 text-emerald-950 font-semibold hover:bg-emerald-400">
						Completada
					</Badge>
				);
			case "cancelled":
				return (
					<Badge
						variant="outline"
						className="text-red-600/80 border-red-600/50 bg-red-600/10 hover:bg-red-600/20"
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

		const costText = Service.repairCost && Service.repairCost > 0
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
						<span class="value">${formatDate(Service.entryDate)}</span>
					</div>

					${Service.deliveryDate ? `
					<div class="field">
						<span class="label">Fecha Entrega</span>
						<span class="value">${formatDate(Service.deliveryDate)}</span>
					</div>
					` : ""}

					<div class="field">
						<span class="label">Sede</span>
						<span class="value">${Service.location}</span>
					</div>

					${Service.failureDescription ? `
					<div class="field">
						<span class="label">Falla Reportada</span>
						<span class="value" style="font-weight: normal; font-size: 9pt;">${Service.failureDescription}</span>
					</div>
					` : ""}

					${Service.notes ? `
					<div class="field">
						<span class="label">Notas</span>
						<span class="value" style="font-weight: normal; font-size: 9pt; font-style: italic;">${Service.notes}</span>
					</div>
					` : ""}

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
					className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg"
					title="Imprimir Etiqueta"
				>
					<Printer className="h-5 w-5" />
				</button>
			}
		>
			<div className="space-y-4 text-sm font-sans pt-2">
				{/* Encabezado Cliente/Estado */}
				<div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
							Cliente
						</p>
						<p className="font-bold text-xl tracking-tight text-white leading-tight">
							{Service.clientName}
						</p>
						{Service.rut && (
							<p className="text-slate-500 font-mono text-xs mt-1">
								{Service.rut}
							</p>
						)}
					</div>
					<div className="text-right">
						<p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
							Estado Actual
						</p>
						{getStatusBadge(Service.status)}
					</div>
				</div>

				{/* Información General en Boxes (AHORA ARRIBA) */}
				<div className="grid grid-cols-2 gap-3">
					<div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
						<p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Producto</p>
						<p className="text-slate-100 font-medium wrap-break-word leading-tight" title={Service.product}>
							{Service.product}
						</p>
						{Service.sku && (
							<p className="text-[10px] text-slate-500 mt-1 font-mono break-all leading-tight">
								SKU: {Service.sku}
							</p>
						)}
					</div>

					<div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
						<p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Contacto</p>
						<p className="text-slate-100 font-medium wrap-break-word leading-tight">{Service.contact || "Sin teléfono"}</p>
						{Service.email && (
							<p className="text-[10px] text-slate-500 wrap-break-word mt-1" title={Service.email}>{Service.email}</p>
						)}
					</div>

					<div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
						<p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Sede</p>
						<p className="text-slate-100 font-medium wrap-break-word leading-tight">{Service.location}</p>
					</div>

					<div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
						<p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Costo</p>
						<p className="text-slate-100 font-medium">
							{Service.repairCost && Service.repairCost > 0
								? formatCurrency(Service.repairCost)
								: "Sin costo"}
						</p>
					</div>
				</div>

				{/* Falla Reportada */}
				{Service.failureDescription && (
					<div className="bg-slate-500/10 p-4 rounded-xl border border-slate-500/20">
						<p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
							Falla reportada
						</p>
						<p className="text-slate-200 text-sm leading-relaxed">
							{Service.failureDescription}
						</p>
					</div>
				)}

				{/* Notas */}
				{Service.notes && (
					<div className="bg-slate-500/10 p-4 rounded-xl border border-slate-500/20">
						<p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
							Notas adicionales
						</p>
						<p className="text-slate-300 text-sm italic">
							"{Service.notes}"
						</p>
					</div>
				)}

				{/* Sección de Fechas Críticas */}
				<div className="grid grid-cols-1 gap-3">
					<div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
						<p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Fecha de Ingreso</p>
						<p className="text-amber-100 font-medium">
							{formatDate(Service.entryDate)}
						</p>
					</div>

					{Service.readyDate && (
						<div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/30">
							<p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Reparación
							</p>
							<p className="text-blue-100 font-medium">
								{formatDate(Service.readyDate)}
							</p>
						</div>
					)}

					{Service.deliveryDate && (
						<div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
							<p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Entrega
							</p>
							<p className="text-emerald-100 font-medium">
								{formatDate(Service.deliveryDate)}
							</p>
						</div>
					)}

					{Service.cancellationDate && (
						<div className="bg-red-600/10 p-3 rounded-xl border border-red-600/30">
							<p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">
								Fecha de Cancelación
							</p>
							<p className="text-red-100 font-medium">
								{formatDate(Service.cancellationDate)}
							</p>
						</div>
					)}
				</div>

				{/* Historial de Movimientos */}
				{Service.locationLogs && Service.locationLogs.length > 0 && (
					<div className="pt-4 mt-2 border-t border-white/5">
						<p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">
							Historial de Movimientos
						</p>
						<div className="space-y-2">
							{Service.locationLogs.map((log) => (
								<div
									key={log.id}
									className="flex justify-between items-center text-[11px] p-2.5 bg-white/5 rounded-lg border border-white/5"
								>
									<span className="text-slate-400 font-mono">
										{formatDate(log.changedAt)}
									</span>
									<span className="font-semibold text-slate-200">
										{log.fromLocation} <span className="text-slate-600 px-1">→</span>{" "}
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
