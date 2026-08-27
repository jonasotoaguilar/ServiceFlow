"use client";

import { useEffect, useState } from "react";
import { differenceInBusinessDays, parseISO } from "date-fns";
import { Service } from "@/lib/types";
import {
	Pencil,
	Eye,
	Trash2,
	Clock,
	CheckCircle,
	X,
	ArrowLeftRight,
	RefreshCw,
} from "lucide-react";
import { formatEntryDate } from "@/lib/format-date";
import { IconButton } from "@/components/ui/icon-button";

export function calculateDays(
	entryDate: string,
	deliveryDate?: string,
	status?: Service["status"],
	now: Date | null = null,
): number {
	try {
		const startPart = entryDate.split("T")[0].split(" ")[0];
		const start = parseISO(startPart);
		const end =
			status === "completed" && deliveryDate
				? parseISO(deliveryDate.split("T")[0].split(" ")[0])
				: (now ?? start);
		return differenceInBusinessDays(end, start);
	} catch (e) {
		console.error(e);
		return 0;
	}
}

interface ServiceTableProps {
	Services: Service[];
	onEdit: (Service: Service) => void;
	onView: (Service: Service) => void;
	onDelete: (Service: Service) => void;
	onStatusChange?: (Service: Service) => void;
	onTransfer?: (Service: Service) => void;
}

export function ServiceTable({
	Services,
	onEdit,
	onView,
	onDelete,
	onStatusChange,
	onTransfer,
}: Readonly<ServiceTableProps>) {
	const getStatusBadge = (status: Service["status"]) => {
		switch (status) {
			case "ready":
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-ready-bg text-ready-fg border border-ready-border uppercase tracking-wider">
						<CheckCircle className="w-3 h-3" /> Reparada
					</span>
				);
			case "pending":
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pending-bg text-pending-fg border border-pending-border uppercase tracking-wider">
						<Clock className="w-3 h-3" /> Pendiente
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-completed-bg text-completed-fg border border-completed-border uppercase tracking-wider">
						<CheckCircle className="w-3 h-3" /> Entregada
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cancelled-bg text-cancelled-fg border border-cancelled-border uppercase tracking-wider">
						<X className="w-3 h-3" /> Cancelada
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-muted text-foreground-muted border border-border uppercase tracking-wider">
						{status}
					</span>
				);
		}
	};

	const [clientNow, setClientNow] = useState<Date | null>(null);
	useEffect(() => {
		setClientNow(new Date());
	}, []);

	const getDaysBadgeColor = (days: number) => {
		if (days >= 15) return "bg-red-500/10 text-red-500 border-red-500/20";
		if (days >= 10) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
		return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
	};

	if (Services.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
				<div className="bg-surface-muted p-4 rounded-full mb-4 border border-border">
					<svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<p className="text-lg font-medium text-foreground">No se encontraron registros</p>
				<p className="text-sm text-foreground-muted opacity-80">
					Intenta ajustar los filtros o crea una nueva servicio.
				</p>
			</div>
		);
	}

	return (
		<>
		<div className="hidden md:block overflow-x-auto custom-scrollbar" data-testid="services-table-desktop">
			<table className="w-full text-left border-collapse">
				<thead>
					<tr className="bg-surface-muted border-b border-border">
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
							Boleta
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider w-full">
							Producto
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider">
							Cliente
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider">
							Sede
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
							Ingreso
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
							Días
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
							Estado
						</th>
						<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
							Acciones
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{Services.map((Service) => {
						const days = calculateDays(
							Service.entryDate,
							Service.deliveryDate,
							Service.status,
							clientNow,
						);
						return (
							<tr key={Service.id} className="hover:bg-surface-muted transition-colors group">
								<td className="px-6 py-4 text-center">
									<span className="font-mono text-primary font-semibold text-sm bg-primary/10 px-2 py-1 rounded">
										#{Service.invoiceNumber || "S/N"}
									</span>
								</td>
								<td className="px-6 py-4">
									<span className="text-sm font-medium text-foreground">{Service.product}</span>
								</td>
								<td className="px-6 py-4 text-left">
									<div className="flex flex-col">
										<span
											className="text-sm font-medium text-foreground truncate max-w-48"
											title={Service.clientName}
										>
											{Service.clientName}
										</span>
										{Service.rut && (
											<span className="text-[10px] text-foreground-subtle font-mono mt-0.5 whitespace-nowrap">
												{Service.rut}
											</span>
										)}
									</div>
								</td>
								<td className="px-6 py-4 text-left">
									<span className="text-xs px-2 py-1 rounded bg-surface-muted text-foreground-muted border border-border whitespace-nowrap inline-block">
										{Service.location}
									</span>
								</td>
								<td className="px-6 py-4 text-center text-sm text-foreground-muted font-mono">
									{formatEntryDate(Service.entryDate)}
								</td>
								<td className="px-6 py-4 text-center">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDaysBadgeColor(
											days,
										)}`}
									>
										{days}d
									</span>
								</td>
								<td className="px-6 py-4 text-center">{getStatusBadge(Service.status)}</td>
								<td className="px-6 py-4 text-center">
									<div className="flex justify-center gap-2 flex-wrap">
										<IconButton
											variant="neutral"
											aria-label="Ver detalles"
											onClick={() => onView(Service)}
											title="Ver detalles"
										>
											<Eye className="w-4 h-4" />
										</IconButton>
										{Service.status !== "completed" &&
											Service.status !== "cancelled" &&
											onStatusChange && (
												<IconButton
													variant="neutral"
													aria-label="Cambiar estado"
													onClick={() => onStatusChange(Service)}
													title="Cambiar estado"
												>
													<RefreshCw className="w-4 h-4" />
												</IconButton>
											)}
										{Service.status !== "completed" &&
											Service.status !== "cancelled" &&
											onTransfer && (
												<IconButton
													variant="neutral"
													aria-label="Transferir sede"
													onClick={() => onTransfer(Service)}
													title="Transferir sede"
												>
													<ArrowLeftRight className="w-4 h-4" />
												</IconButton>
											)}
										{Service.status !== "completed" && Service.status !== "cancelled" && (
											<IconButton
												variant="primary"
												aria-label="Editar"
												onClick={() => onEdit(Service)}
												title="Editar"
											>
												<Pencil className="w-4 h-4" />
											</IconButton>
										)}
										{Service.status !== "completed" && Service.status !== "cancelled" && (
											<IconButton
												variant="danger"
												aria-label="Eliminar"
												onClick={() => onDelete(Service)}
												title="Eliminar"
											>
												<Trash2 className="w-4 h-4" />
											</IconButton>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
		<div className="md:hidden space-y-3" data-testid="services-mobile-list">
			{Services.map((s) => (
				<div key={s.id} data-testid="service-card-mobile" className="bg-surface border border-border rounded-xl p-3 space-y-2">
					<div className="flex justify-between"><span className="font-mono text-primary">#{s.invoiceNumber}</span>{getStatusBadge(s.status)}</div>
					<p className="text-sm font-medium truncate">{s.product} — {s.clientName}</p>
					<div className="flex gap-2 text-xs"><span className="px-2 py-1 bg-surface-muted border rounded">{s.location}</span><span className="font-mono">{formatEntryDate(s.entryDate)}</span><span className={`px-2 py-0.5 rounded-full text-xs border ${getDaysBadgeColor(calculateDays(s.entryDate, s.deliveryDate, s.status, clientNow))}`}>{calculateDays(s.entryDate, s.deliveryDate, s.status, clientNow)}d</span></div>
					<div className="flex gap-2 justify-center"><IconButton variant="neutral" aria-label="Ver detalles" onClick={() => onView(s)}><Eye className="w-4 h-4"/></IconButton>{s.status !== "completed" && s.status !== "cancelled" && onStatusChange && (<IconButton variant="neutral" aria-label="Cambiar estado" onClick={() => onStatusChange(s)}><RefreshCw className="w-4 h-4"/></IconButton>)}{s.status !== "completed" && s.status !== "cancelled" && onTransfer && (<IconButton variant="neutral" aria-label="Transferir sede" onClick={() => onTransfer(s)}><ArrowLeftRight className="w-4 h-4"/></IconButton>)}</div>
				</div>
			))}
		</div>
		</>
	);
}
