"use client";

import { differenceInBusinessDays, parseISO, format } from "date-fns";
import { Service } from "@/lib/types";
import { Pencil, Eye, Trash2 } from "lucide-react";

interface ServiceTableProps {
	Services: Service[];
	onEdit: (Service: Service) => void;
	onView: (Service: Service) => void;
	onDelete: (Service: Service) => void;
}

export function ServiceTable({
	Services,
	onEdit,
	onView,
	onDelete,
}: Readonly<ServiceTableProps>) {
	const getStatusBadge = (status: Service["status"]) => {
		switch (status) {
			case "ready":
				return (
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
						Reparada
					</span>
				);
			case "pending":
				return (
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
						Pendiente
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
						Completada
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-600/10 text-red-600/80 border border-red-600/20 uppercase tracking-wider">
						Cancelada
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
						{status}
					</span>
				);
		}
	};

	const calculateDays = (
		entryDate: string,
		deliveryDate?: string,
		status?: Service["status"],
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
		if (days >= 15) return "bg-red-500/10 text-red-500 border-red-500/20";
		if (days >= 10) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
		return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
	};

	if (Services.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-slate-400">
				<div className="bg-white/5 p-4 rounded-full mb-4">
					<svg
						className="w-8 h-8 opacity-50"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<p className="text-lg font-medium text-white">
					No se encontraron registros
				</p>
				<p className="text-sm opacity-60">
					Intenta ajustar los filtros o crea una nueva servicio.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto custom-scrollbar">
			<table className="w-full text-left border-collapse">
				<thead>
					<tr className="bg-slate-800/40 border-b border-white/5">
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
							Boleta
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-full">
							Producto
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
							Cliente
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
							Sede
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
							Ingreso
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
							Días
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
							Estado
						</th>
						<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
							Acciones
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-white/5">
					{Services.map((Service) => {
						const days = calculateDays(
							Service.entryDate,
							Service.deliveryDate,
							Service.status,
						);
						return (
							<tr
								key={Service.id}
								className="hover:bg-white/5 transition-colors group"
							>
								<td className="px-6 py-4 text-center">
									<span className="font-mono text-primary font-semibold text-sm bg-primary/10 px-2 py-1 rounded">
										#{Service.invoiceNumber || "S/N"}
									</span>
								</td>
								<td className="px-6 py-4">
									<span className="text-sm font-medium text-white">
										{Service.product}
									</span>
								</td>
								<td className="px-6 py-4 text-left">
									<div className="flex flex-col">
										<span className="text-sm font-medium text-white truncate max-w-48" title={Service.clientName}>
											{Service.clientName}
										</span>
										{Service.rut && (
											<span className="text-[10px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
												{Service.rut}
											</span>
										)}
									</div>
								</td>
								<td className="px-6 py-4 text-left">
									<span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/50 whitespace-nowrap inline-block">
										{Service.location}
									</span>
								</td>
								<td className="px-6 py-4 text-center text-sm text-slate-400 font-mono">
									{format(parseISO(Service.entryDate), "dd MMM yyyy")}
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
								<td className="px-6 py-4 text-center">
									{getStatusBadge(Service.status)}
								</td>
								<td className="px-6 py-4 text-center">
									<div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
										<button
											onClick={() => onView(Service)}
											className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
											title="Ver detalles"
										>
											<Eye className="w-4 h-4" />
										</button>
										{Service.status !== "completed" && Service.status !== "cancelled" && (
											<button
												onClick={() => onEdit(Service)}
												className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
												title="Editar"
											>
												<Pencil className="w-4 h-4" />
											</button>
										)}
										{Service.status !== "completed" && Service.status !== "cancelled" && (
											<button
												onClick={() => onDelete(Service)}
												className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
												title="Eliminar"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
