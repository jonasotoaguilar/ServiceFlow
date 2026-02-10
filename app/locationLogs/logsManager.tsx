"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLocationLogs } from "@/app/actions/logs";
import { ChevronLeft, ChevronRight, ChevronDown, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type LogType = {
	id: string;
	ServiceId: string;
	invoiceNumber: string;
	product: string;
	clientName: string;
	fromLocation: string;
	toLocation: string;
	changedAt: string;
};

type LocationType = {
	id: string;
	name: string;
	address?: string;
};

export default function LogsManager({
	initialLogs,
	initialTotal,
	locations,
}: Readonly<{
	initialLogs: LogType[];
	initialTotal: number;
	locations: LocationType[];
}>) {
	const [logs, setLogs] = useState<LogType[]>(initialLogs);
	const [total, setTotal] = useState(initialTotal);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [locationFilter, setLocationFilter] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const locationDropdownRef = useRef<HTMLDivElement>(null);
	const limit = 20;

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		try {
			const params: any = {
				page,
				limit,
			};

			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;
			if (locationFilter) params.locationId = locationFilter;

			const result = await getLocationLogs(params);

			if (result.data) {
				setLogs(result.data);
				setTotal(result.total || 0);
			}
		} catch (error) {
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
		}
	}, [page, startDate, endDate, locationFilter]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
				setShowLocationDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	const clearFilters = () => {
		setStartDate("");
		setEndDate("");
		setLocationFilter("");
		setPage(1);
	};

	return (
		<main className="max-w-7xl mx-auto px-6 py-10">
			{/* Header Section */}
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold text-white tracking-tight relative w-fit">
						Historial de Movimientos
						<span className="absolute bottom-0 left-0 w-1/3 h-1 bg-linear-to-r from-primary to-transparent rounded-full -mb-2" />
					</h1>
					<p className="text-slate-400 pt-3 text-lg max-w-2xl">
						Registro detallado de flujo de servicios y logística en tiempo real.
					</p>
				</div>

				{/* Stats Card */}
				<div className="glass-card p-5 border-l-4 border-primary bg-surface/40 flex items-center gap-4 min-w-55">
					<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
						<FileText className="w-6 h-6 text-primary" />
					</div>
					<div>
						<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
							Total Movimientos
						</p>
						<p className="text-2xl font-bold text-white">
							{total.toLocaleString()}
						</p>
					</div>
				</div>
			</header>

			{/* Filters Section */}
			<div className="glass-card p-6 mb-8 bg-surface/40 border-white/5">
				<button
					onClick={() => setShowFilters(!showFilters)}
					className="flex items-center gap-2 text-primary font-semibold text-sm mb-4 hover:text-blue-400 transition-colors"
				>
					<ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
					FILTROS DE BÚSQUEDA
				</button>

				{showFilters && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
								Desde
							</label>
							<input
								id="startDate"
								type="date"
								value={startDate}
								max={endDate || undefined}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
							/>
						</div>
						<div>
							<label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">
								Hasta
							</label>
							<input
								id="endDate"
								type="date"
								value={endDate}
								min={startDate || undefined}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
							/>
						</div>
						<div className="flex gap-2">
							<div className="flex-1">
								<label htmlFor="locationFilter" className="block text-sm font-medium text-slate-300 mb-2">
									Sede
								</label>
								<div className="relative" ref={locationDropdownRef}>
									<button
										onClick={() => setShowLocationDropdown(!showLocationDropdown)}
										className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all justify-between"
									>
										<span className="text-sm font-medium">
											{locations.find((l) => l.id === locationFilter)?.name || "Todas las sedes"}
										</span>
										<ChevronDown
											className={`w-4 h-4 transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
										/>
									</button>
									{showLocationDropdown && (
										<div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
											<button
												onClick={() => {
													setLocationFilter("");
													setShowLocationDropdown(false);
												}}
												className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
													locationFilter === ""
														? "bg-primary text-white"
														: "text-slate-300 hover:bg-slate-700"
												}`}
											>
												Todas las sedes
											</button>
											{locations.map((loc) => (
												<button
													key={loc.id}
													onClick={() => {
														setLocationFilter(loc.id);
														setShowLocationDropdown(false);
													}}
													className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
														locationFilter === loc.id
															? "bg-primary text-white"
															: "text-slate-300 hover:bg-slate-700"
													}`}
												>
													{loc.name}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="flex items-end">
								<button
									onClick={clearFilters}
									disabled={!startDate && !endDate && !locationFilter}
									className="p-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
									title="Limpiar filtros"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Data Table Container */}
			<div className="glass-card rounded-xl overflow-hidden bg-surface/40 border-white/5 mb-8">
				<div className="overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-800/40 border-b border-white/5">
								<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
									N° Boleta
								</th>
								<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
									Producto / Cliente
								</th>
								<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
									Origen
								</th>
								<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
									Destino
								</th>
								<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
									Fecha / Hora
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/5">
							{logs.map((log) => (
								<tr
									key={log.id}
									className="hover:bg-white/3 transition-colors group"
								>
									<td className="px-6 py-4">
										<span className="text-primary font-semibold text-sm">
											#{log.invoiceNumber}
										</span>
									</td>
									<td className="px-6 py-4">
										<div>
											<p className="font-semibold text-white text-sm">
												{log.product}
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{log.clientName}
											</p>
										</div>
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
											{log.fromLocation}
										</span>
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
											{log.toLocation}
										</span>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm">
											<p className="text-white font-medium">
												{format(new Date(log.changedAt), "dd MMM yyyy", { locale: es })}
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{format(new Date(log.changedAt), "HH:mm", { locale: es })}
											</p>
										</div>
									</td>
								</tr>
							))}
							{logs.length === 0 && !loading && (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-16 text-center text-slate-500 italic"
									>
										No se encontraron movimientos en este periodo.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="px-6 py-4 bg-slate-800/40 border-t border-slate-700/50 flex items-center justify-between">
					<p className="text-sm text-slate-400">
						Mostrando{" "}
						<span className="text-white font-medium">
							{logs.length === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)}
						</span>{" "}
						de <span className="text-white font-medium">{total}</span> resultados
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<div className="flex items-center gap-1">
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								let p = i + 1;
								if (totalPages > 5 && page > 3) {
									p = page - 2 + i;
								}
								if (p > totalPages) return null;

								return (
									<button
										key={p}
										onClick={() => setPage(p)}
										className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
											p === page
												? "bg-primary text-white"
												: "text-slate-400 hover:bg-slate-700"
										}`}
									>
										{p}
									</button>
								);
							})}
						</div>
						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</main>
	);
}
