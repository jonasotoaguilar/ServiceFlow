"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getServiceEvents } from "@/app/actions/service-events";
import { ChevronLeft, ChevronRight, ChevronDown, X, FileText } from "lucide-react";
import { formatEntryDate } from "@/lib/format-date";

type ServiceEventType = {
	id: string;
	ServiceId: string;
	invoiceNumber: string;
	product: string;
	clientName: string;
	fromLocation: string;
	toLocation: string;
	changedAt: string;
	kind?: "created" | "location_changed" | "status_changed";
	fromStatus?: string;
	toStatus?: string;
	actorId?: string;
	fromLocationId?: string;
	toLocationId?: string;
};

type LocationType = {
	id: string;
	name: string;
	address?: string;
};

function displayStatus(s: string): string {
	if (s === "pending") return "Pendiente";
	if (s === "ready") return "Reparada";
	if (s === "completed") return "Entregada";
	if (s === "cancelled") return "Cancelada";
	return s;
}

export default function ServiceEventsManager({
	initialLogs,
	initialTotal,
	locations,
}: Readonly<{
	initialLogs: ServiceEventType[];
	initialTotal: number;
	locations: LocationType[];
}>) {
	const [logs, setLogs] = useState<ServiceEventType[]>(initialLogs);
	const [total, setTotal] = useState(initialTotal);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [locationFilter, setLocationFilter] = useState("");
	const [kindFilter, setKindFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [showKindDropdown, setShowKindDropdown] = useState(false);
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const locationDropdownRef = useRef<HTMLDivElement>(null);
	const kindDropdownRef = useRef<HTMLDivElement>(null);
	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const limit = 20;

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		try {
			const params: any = { page, limit };
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;
			if (locationFilter) params.locationId = locationFilter;
			if (kindFilter) params.kind = kindFilter;
			if (statusFilter) params.status = statusFilter;
			const result = await getServiceEvents(params);
			if (result.data) {
				setLogs(result.data);
				setTotal(result.total || 0);
			}
		} catch (error) {
			console.error("Error fetching service events:", error);
		} finally {
			setLoading(false);
		}
	}, [page, startDate, endDate, locationFilter, kindFilter, statusFilter]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				locationDropdownRef.current &&
				!locationDropdownRef.current.contains(event.target as Node)
			)
				setShowLocationDropdown(false);
			if (kindDropdownRef.current && !kindDropdownRef.current.contains(event.target as Node))
				setShowKindDropdown(false);
			if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node))
				setShowStatusDropdown(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	const clearFilters = () => {
		setStartDate("");
		setEndDate("");
		setLocationFilter("");
		setKindFilter("");
		setStatusFilter("");
		setPage(1);
	};

	return (
		<div>
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold text-foreground tracking-tight relative w-fit">
						Registro
						<span className="absolute bottom-0 left-0 w-1/3 h-1 bg-linear-to-r from-primary to-transparent rounded-full -mb-2" />
					</h1>
					<p className="text-foreground-muted pt-3 text-lg max-w-2xl">
						Registro detallado de flujo de servicios y logística en tiempo real.
					</p>
				</div>
				<div className="bg-surface border border-border shadow-sm p-5 border-l-4 border-primary flex items-center gap-4 min-w-55">
					<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
						<FileText className="w-6 h-6 text-primary" />
					</div>
					<div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mb-0.5">
							Total Registro
						</p>
						<p className="text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
					</div>
				</div>
			</header>

			<div className="bg-surface border border-border shadow-sm p-6 mb-8">
				<button
					onClick={() => setShowFilters(!showFilters)}
					className="flex items-center gap-2 text-primary font-semibold text-sm mb-4 hover:text-blue-400 transition-colors"
				>
					<ChevronDown
						className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
					/>
					FILTROS DE BÚSQUEDA
				</button>

				{showFilters && (
					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
						<div>
							<label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
								Desde
							</label>
							<input
								id="startDate"
								type="date"
								value={startDate}
								max={endDate || undefined}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
							/>
						</div>
						<div>
							<label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
								Hasta
							</label>
							<input
								id="endDate"
								type="date"
								value={endDate}
								min={startDate || undefined}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
							<div className="relative" ref={kindDropdownRef}>
								<button
									onClick={() => setShowKindDropdown(!showKindDropdown)}
									className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-muted transition-all justify-between"
								>
									<span className="text-sm font-medium">
										{kindFilter
											? kindFilter === "created"
												? "Creación"
												: kindFilter === "location_changed"
													? "Cambio sede"
													: "Cambio estado"
											: "Todos"}
									</span>
									<ChevronDown
										className={`w-4 h-4 transition-transform ${showKindDropdown ? "rotate-180" : ""}`}
									/>
								</button>
								{showKindDropdown && (
									<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
										<button
											onClick={() => {
												setKindFilter("");
												setShowKindDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
										>
											Todos
										</button>
										<button
											onClick={() => {
												setKindFilter("created");
												setShowKindDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "created" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
										>
											Creación
										</button>
										<button
											onClick={() => {
												setKindFilter("location_changed");
												setShowKindDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "location_changed" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
										>
											Cambio sede
										</button>
										<button
											onClick={() => {
												setKindFilter("status_changed");
												setShowKindDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "status_changed" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
										>
											Cambio estado
										</button>
									</div>
								)}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-foreground mb-2">Estado</label>
							<div className="relative" ref={statusDropdownRef}>
								<button
									onClick={() => setShowStatusDropdown(!showStatusDropdown)}
									className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-muted transition-all justify-between"
								>
									<span className="text-sm font-medium">
										{statusFilter ? displayStatus(statusFilter) : "Todos Estado"}
									</span>
									<ChevronDown
										className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
									/>
								</button>
								{showStatusDropdown && (
									<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
										<button
											onClick={() => {
												setStatusFilter("");
												setShowStatusDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${statusFilter === "" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
										>
											Todos
										</button>
										{["pending", "ready", "completed", "cancelled"].map((s) => (
											<button
												key={s}
												onClick={() => {
													setStatusFilter(s);
													setShowStatusDropdown(false);
												}}
												className={`w-full px-4 py-2.5 text-left text-sm ${statusFilter === s ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
											>
												{displayStatus(s)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
						<div className="flex gap-2">
							<div className="flex-1">
								<label
									htmlFor="locationFilter"
									className="block text-sm font-medium text-foreground mb-2"
								>
									Sede
								</label>
								<div className="relative" ref={locationDropdownRef}>
									<button
										onClick={() => setShowLocationDropdown(!showLocationDropdown)}
										className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-muted transition-all justify-between"
									>
										<span className="text-sm font-medium">
											{locations.find((l) => l.id === locationFilter)?.name || "Todas las sedes"}
										</span>
										<ChevronDown
											className={`w-4 h-4 transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
										/>
									</button>
									{showLocationDropdown && (
										<div className="absolute top-full mt-2 w-full bg-surface-muted border border-border rounded-lg shadow-xl z-50 overflow-hidden">
											<button
												onClick={() => {
													setLocationFilter("");
													setShowLocationDropdown(false);
												}}
												className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${locationFilter === "" ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
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
													className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${locationFilter === loc.id ? "bg-primary text-foreground" : "text-foreground hover:bg-surface-muted"}`}
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
									disabled={
										!startDate && !endDate && !locationFilter && !kindFilter && !statusFilter
									}
									className="p-2.5 rounded-lg border border-border text-foreground-muted hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
									title="Limpiar filtros"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden mb-8">
				<div
					className="hidden md:block overflow-x-auto custom-scrollbar"
					data-testid="service-events-table-desktop"
				>
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-surface-muted border-b border-border">
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									Tipo
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									N° Boleta
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									Producto / Cliente
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									Origen
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									Destino
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest">
									Fecha / Hora
								</th>
								<th className="px-6 py-4 text-xs font-bold text-foreground-muted uppercase tracking-widest hidden md:table-cell">
									Actor
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{logs.map((log) => {
								const kind = (log.kind ?? "created") as string;
								const isLocation = kind === "location_changed";
								const isStatus = kind === "status_changed";
								const isCreated = kind === "created";
								const fromLabel = isLocation
									? log.fromLocation || log.fromLocationId || ""
									: isStatus
										? displayStatus(log.fromStatus ?? "")
										: isCreated
											? ""
											: displayStatus(log.fromStatus ?? "");
								const toLabel = isLocation
									? log.toLocation || log.toLocationId || ""
									: isStatus
										? displayStatus(log.toStatus ?? "")
										: isCreated
											? log.toLocation || log.fromLocation || ""
											: displayStatus(log.toStatus ?? "");
								return (
									<tr key={log.id} className="hover:bg-surface-muted transition-colors group">
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${isLocation ? "bg-surface-muted text-foreground-muted border-border" : isStatus ? "bg-ready-bg text-ready-fg border-ready-border" : "bg-pending-bg text-pending-fg border-pending-border"}`}
											>
												{isLocation ? "Cambio sede" : isStatus ? "Cambio estado" : "Creación"}
											</span>
										</td>
										<td className="px-6 py-4">
											<span className="text-primary font-semibold text-sm">
												#{log.invoiceNumber}
											</span>
										</td>
										<td className="px-6 py-4">
											<div>
												<p className="font-semibold text-foreground text-sm truncate max-w-[150px] flex flex-wrap">
													{log.product}
												</p>
												<p className="text-xs text-foreground-muted mt-0.5 truncate">
													{log.clientName}
												</p>
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-muted text-foreground border border-border truncate max-w-[120px]">
												{fromLabel || "—"}
											</span>
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-completed-bg text-completed-fg border border-completed-border truncate max-w-[120px]">
												{toLabel || "—"} {toLabel === "Entregada" ? "Entregada" : ""}
											</span>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm">
												<p className="text-foreground font-medium">
													{formatEntryDate(log.changedAt)}
												</p>
												<p className="text-xs text-foreground-muted mt-0.5">
													{(log.changedAt.split("T")[1] ?? log.changedAt.split(" ")[1] ?? "").slice(
														0,
														5,
													)}
												</p>
											</div>
										</td>
										<td className="px-6 py-4 hidden md:table-cell">
											<span className="text-xs font-mono text-foreground-muted truncate">
												{log.actorId ?? ""}
											</span>
										</td>
									</tr>
								);
							})}
							{logs.length === 0 && !loading && (
								<tr>
									<td colSpan={7} className="px-6 py-16 text-center text-foreground-subtle italic">
										No se encontraron registros en este periodo.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="md:hidden p-3 space-y-3" data-testid="service-events-mobile-list">
					{logs.map((log) => {
						const k = (log.kind ?? "created") as string;
						const isL = k === "location_changed";
						const isS = k === "status_changed";
						const b = isL ? "Cambio sede" : isS ? "Cambio estado" : "Creación";
						const f = isL
							? log.fromLocation || log.fromLocationId || ""
							: isS
								? displayStatus(log.fromStatus ?? "")
								: "";
						const t2 = isL
							? log.toLocation || log.toLocationId || ""
							: isS
								? displayStatus(log.toStatus ?? "")
								: log.toLocation || log.fromLocation || "";
						return (
							<div
								key={log.id}
								data-testid="service-event-card-mobile"
								className="bg-surface border rounded-xl p-3 flex flex-col gap-2"
							>
								<div className="flex justify-between">
									<span className="text-xs font-bold px-2 py-1 rounded-full border">{b}</span>
									<span className="text-primary text-sm">#{log.invoiceNumber}</span>
								</div>
								<div className="flex gap-1 text-xs">
									<span>
										{f || "—"} → {t2 || "—"}
									</span>
									<span className="ml-auto">
										{formatEntryDate(log.changedAt)}{" "}
										{(log.changedAt.split("T")[1] ?? log.changedAt.split(" ")[1] ?? "").slice(0, 5)}
									</span>
								</div>
								<p className="text-[10px] font-mono truncate">{log.actorId ?? ""}</p>
							</div>
						);
					})}
					{logs.length === 0 && !loading && (
						<p className="text-center italic py-4">No se encontraron registros.</p>
					)}
				</div>
				<div className="px-6 py-4 bg-surface-muted border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-foreground-muted">
						Mostrando{" "}
						<span className="text-foreground font-medium">
							{logs.length === 0 ? 0 : (page - 1) * limit + 1}-
							{Math.min(page * limit, total)}
						</span>{" "}
						de <span className="text-foreground font-medium">{total}</span> resultados
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="p-2 rounded-lg border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<div className="flex items-center gap-1">
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								let p = i + 1;
								if (totalPages > 5 && page > 3) p = page - 2 + i;
								if (p > totalPages) return null;
								return (
									<button
										key={p}
										onClick={() => setPage(p)}
										className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-primary text-foreground" : "text-foreground-muted hover:bg-surface-muted"}`}
									>
										{p}
									</button>
								);
							})}
						</div>
						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="p-2 rounded-lg border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
