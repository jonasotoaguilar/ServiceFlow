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
	emptyMode?: "true-empty" | "filtered";
	onEmptyAction?: () => void;
}

export function ServiceTable({
	Services,
	onEdit,
	onView,
	onDelete,
	onStatusChange,
	onTransfer,
	emptyMode = "true-empty",
	onEmptyAction,
}: Readonly<ServiceTableProps>) {
	const getStatusBadge = (status: Service["status"]) => {
		switch (status) {
			case "ready":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-ready-bg text-ready-fg border border-ready-border">
						<CheckCircle className="w-3 h-3" /> Reparada
					</span>
				);
			case "pending":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-pending-bg text-pending-fg border border-pending-border">
						<Clock className="w-3 h-3" /> Pendiente
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-completed-bg text-completed-fg border border-completed-border">
						<CheckCircle className="w-3 h-3" /> Entregada
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-cancelled-bg text-cancelled-fg border border-cancelled-border">
						<X className="w-3 h-3" /> Cancelada
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-surface-muted text-foreground-muted border border-border">
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
		if (days >= 15) return "bg-cancelled-bg text-cancelled-fg border-cancelled-border";
		if (days >= 10) return "bg-pending-bg text-pending-fg border-pending-border";
		return "bg-ready-bg text-ready-fg border-ready-border";
	};

	if (Services.length === 0) {
		const isFiltered = emptyMode === "filtered";
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-4 text-foreground-muted">
				<div className="bg-surface-muted p-4 rounded-sm border border-border">
					<svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<p className="text-sm font-medium text-foreground">
					{isFiltered ? "Sin resultados para los filtros" : "No hay servicios registrados"}
				</p>
				<p className="text-sm text-foreground-muted">
					{isFiltered
						? "Ajusta los filtros para ver más resultados."
						: "Crea un nuevo servicio para comenzar."}
				</p>
				<button
					onClick={onEmptyAction}
					className="px-4 py-2 rounded-sm bg-primary text-on-primary text-sm font-medium"
				>
					{isFiltered ? "Limpiar filtros" : "Nuevo servicio"}
				</button>
			</div>
		);
	}

	return (
		<>
			<div className="hidden md:block custom-scrollbar" data-testid="services-table-desktop">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-surface-muted border-b border-border">
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted text-center">
								Boleta
							</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted w-full">
								Producto
							</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted">Cliente</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted">Sede</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted text-center">
								Ingreso
							</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted text-center">
								Días
							</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted text-center">
								Estado
							</th>
							<th className="px-4 py-3 text-sm font-medium text-foreground-muted text-center">
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
									<td className="px-4 py-3 text-center">
										<span className="font-mono text-primary font-semibold text-sm bg-primary/10 px-2 py-1 rounded-sm w-[12ch] inline-block">
											#{Service.invoiceNumber || "S/N"}
										</span>
									</td>
									<td className="px-4 py-3">
										<span
											className="text-sm font-medium text-foreground truncate max-w-[20ch] block"
											title={Service.product}
										>
											{Service.product}
										</span>
									</td>
									<td className="px-4 py-3 text-left">
										<div className="flex flex-col">
											<span
												className="text-sm font-medium text-foreground truncate max-w-[18ch]"
												title={Service.clientName}
											>
												{Service.clientName}
											</span>
											{Service.rut && (
												<span className="text-sm text-foreground-subtle font-mono mt-0.5 whitespace-nowrap w-[14ch]">
													{Service.rut}
												</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3 text-left">
										<span className="text-sm px-2 py-1 rounded-sm bg-surface-muted text-foreground-muted border border-border whitespace-nowrap inline-block">
											{Service.location}
										</span>
									</td>
									<td className="px-4 py-3 text-center text-sm text-foreground-muted font-mono w-[12ch]">
										{formatEntryDate(Service.entryDate)}
									</td>
									<td className="px-4 py-3 text-center">
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium border ${getDaysBadgeColor(
												days,
											)}`}
										>
											{days}d
										</span>
									</td>
									<td className="px-4 py-3 text-center">{getStatusBadge(Service.status)}</td>
									<td className="px-4 py-3 text-center">
										<div className="flex flex-row items-center justify-center gap-2">
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
			<div className="md:hidden space-y-3 p-4" data-testid="services-mobile-list">
				{Services.map((s) => {
					const days = calculateDays(s.entryDate, s.deliveryDate, s.status, clientNow);
					return (
						<div
							key={s.id}
							data-testid="service-card-mobile"
							className="bg-surface border border-border rounded-sm p-4 space-y-3"
						>
							<div className="flex justify-between items-start gap-2">
								<span className="font-mono text-primary font-semibold text-sm w-[12ch]">
									#{s.invoiceNumber || "S/N"}
								</span>
								{getStatusBadge(s.status)}
							</div>
							<p
								className="text-sm font-medium text-foreground truncate max-w-full"
								title={s.product}
							>
								{s.product}
							</p>
							<p className="text-sm text-foreground-muted truncate" title={s.clientName}>
								{s.clientName}
							</p>
							{s.rut && (
								<p className="text-sm font-mono text-foreground-subtle w-[14ch]">{s.rut}</p>
							)}
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div className="flex flex-col gap-1">
									<span className="text-sm text-foreground-muted">Sede</span>
									<span className="px-2 py-1 rounded-sm bg-surface-muted border border-border text-sm inline-block">
										{s.location}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm text-foreground-muted">Ingreso</span>
									<span className="font-mono text-sm w-[12ch]">{formatEntryDate(s.entryDate)}</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm text-foreground-muted">Días</span>
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium border w-fit ${getDaysBadgeColor(days)}`}
									>
										{days}d
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm text-foreground-muted">Estado</span>
									{getStatusBadge(s.status)}
								</div>
							</div>
							<div className="flex gap-2 justify-end flex-wrap">
								<IconButton variant="neutral" aria-label="Ver detalles" onClick={() => onView(s)}>
									<Eye className="w-4 h-4" />
								</IconButton>
								{s.status !== "completed" && s.status !== "cancelled" && onStatusChange && (
									<IconButton
										variant="neutral"
										aria-label="Cambiar estado"
										onClick={() => onStatusChange(s)}
									>
										<RefreshCw className="w-4 h-4" />
									</IconButton>
								)}
								{s.status !== "completed" && s.status !== "cancelled" && onTransfer && (
									<IconButton
										variant="neutral"
										aria-label="Transferir sede"
										onClick={() => onTransfer(s)}
									>
										<ArrowLeftRight className="w-4 h-4" />
									</IconButton>
								)}
								{s.status !== "completed" && s.status !== "cancelled" && (
									<IconButton variant="primary" aria-label="Editar" onClick={() => onEdit(s)}>
										<Pencil className="w-4 h-4" />
									</IconButton>
								)}
								{s.status !== "completed" && s.status !== "cancelled" && (
									<IconButton variant="danger" aria-label="Eliminar" onClick={() => onDelete(s)}>
										<Trash2 className="w-4 h-4" />
									</IconButton>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
