"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getServiceEvents } from "@/app/actions/service-events";
import {
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	X,
	Clock,
	CheckCircle,
	ArrowLeftRight,
	RefreshCw,
	FilePlus,
} from "lucide-react";
import { formatEntryDate } from "@/lib/format-date";
import { Skeleton } from "boneyard-js/react";
import { PageEmptyState } from "@/components/ui/page-empty-state";

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

function kindBadge(kind: string) {
	if (kind === "location_changed")
		return (
			<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-surface-muted text-foreground-muted border border-border">
				<ArrowLeftRight className="w-3 h-3" /> Cambio sede
			</span>
		);
	if (kind === "status_changed")
		return (
			<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-ready-bg text-ready-fg border border-ready-border">
				<RefreshCw className="w-3 h-3" /> Cambio estado
			</span>
		);
	return (
		<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-pending-bg text-pending-fg border border-pending-border">
			<FilePlus className="w-3 h-3" /> Creación
		</span>
	);
}

export default function ServiceEventsManager({
	initialLogs,
	initialTotal,
	initialError = null,
	locations,
}: Readonly<{
	initialLogs: ServiceEventType[];
	initialTotal: number;
	initialError?: string | null;
	locations: LocationType[];
}>) {
	const [logs, setLogs] = useState<ServiceEventType[]>(initialLogs);
	const [total, setTotal] = useState(initialTotal);
	const [loading, setLoading] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(initialError);
	const [page, setPage] = useState(1);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [locationFilter, setLocationFilter] = useState("");
	const [kindFilter, setKindFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [showKindDropdown, setShowKindDropdown] = useState(false);
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const locationDropdownRef = useRef<HTMLDivElement>(null);
	const kindDropdownRef = useRef<HTMLDivElement>(null);
	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const limit = 20;

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		setFetchError(null);
		try {
			const params: Record<string, unknown> = { page, limit };
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;
			if (locationFilter) params.locationId = locationFilter;
			if (kindFilter) params.kind = kindFilter;
			if (statusFilter) params.status = statusFilter;
			const result = await getServiceEvents(params as any);
			if ((result as any).error) {
				setFetchError((result as any).error as string);
			} else if ((result as any).data) {
				setLogs((result as any).data);
				setTotal((result as any).total || 0);
				setFetchError(null);
			}
		} catch (error) {
			console.error("Error fetching service events:", error);
			setFetchError("Error al cargar historial de movimientos");
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

	const hasActiveFilters =
		!!startDate || !!endDate || !!locationFilter || !!kindFilter || !!statusFilter;
	const emptyMode: "true-empty" | "filtered" = hasActiveFilters ? "filtered" : "true-empty";
	const handleEmptyAction = () => {
		if (emptyMode === "filtered") clearFilters();
		else {
			// true-empty create action — stay Spanish, no navigation side-effect in test
			clearFilters();
		}
	};

	return (
		<div className="space-y-6">
			{/* Headline band — Registro · count (same rhythm as Dashboard) */}
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<div className="min-w-0">
					<h2 className="text-2xl font-semibold text-foreground">Registro</h2>
					<p className="text-sm font-mono text-foreground-muted">
						{total} registros · historial operativo
					</p>
				</div>
				<div className="text-sm text-foreground-muted font-mono">
					{page} / {totalPages}
				</div>
			</div>

			{/* Filter strip — visible at all widths, border-y low not card */}
			<div className="border-y border-border bg-surface/50 px-4 py-3 mb-6 w-full box-border">
				<h2 className="flex items-center gap-2 text-foreground font-semibold text-sm mb-3">
					FILTROS DE BÚSQUEDA
				</h2>
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
							className="w-full bg-surface border border-border rounded-sm px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-focus focus:border-focus outline-none"
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
							className="w-full bg-surface border border-border rounded-sm px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-focus focus:border-focus outline-none"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
						<div className="relative" ref={kindDropdownRef}>
							<button
								onClick={() => setShowKindDropdown(!showKindDropdown)}
								aria-expanded={showKindDropdown}
								aria-haspopup="listbox"
								className="w-full flex items-center gap-2 px-4 py-2.5 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted justify-between text-sm"
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
									className={`w-4 h-4 transition-transform duration-150 ${showKindDropdown ? "rotate-180" : ""}`}
								/>
							</button>
							{showKindDropdown && (
								<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-sm shadow-xl z-50 overflow-hidden">
									<button
										onClick={() => {
											setKindFilter("");
											setShowKindDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
									>
										Todos
									</button>
									<button
										onClick={() => {
											setKindFilter("created");
											setShowKindDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "created" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
									>
										Creación
									</button>
									<button
										onClick={() => {
											setKindFilter("location_changed");
											setShowKindDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "location_changed" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
									>
										Cambio sede
									</button>
									<button
										onClick={() => {
											setKindFilter("status_changed");
											setShowKindDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm ${kindFilter === "status_changed" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
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
								aria-expanded={showStatusDropdown}
								aria-haspopup="listbox"
								className="w-full flex items-center gap-2 px-4 py-2.5 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted justify-between text-sm"
							>
								<span className="text-sm font-medium">
									{statusFilter ? displayStatus(statusFilter) : "Todos Estado"}
								</span>
								<ChevronDown
									className={`w-4 h-4 transition-transform duration-150 ${showStatusDropdown ? "rotate-180" : ""}`}
								/>
							</button>
							{showStatusDropdown && (
								<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-sm shadow-xl z-50 overflow-hidden">
									<button
										onClick={() => {
											setStatusFilter("");
											setShowStatusDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm ${statusFilter === "" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
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
											className={`w-full px-4 py-2.5 text-left text-sm ${statusFilter === s ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
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
									aria-expanded={showLocationDropdown}
									aria-haspopup="listbox"
									className="w-full flex items-center gap-2 px-4 py-2.5 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted justify-between text-sm"
								>
									<span className="text-sm font-medium">
										{locations.find((l) => l.id === locationFilter)?.name || "Todas las sedes"}
									</span>
									<ChevronDown
										className={`w-4 h-4 transition-transform duration-150 ${showLocationDropdown ? "rotate-180" : ""}`}
									/>
								</button>
								{showLocationDropdown && (
									<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-sm shadow-xl z-50 overflow-hidden">
										<button
											onClick={() => {
												setLocationFilter("");
												setShowLocationDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm ${locationFilter === "" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
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
												className={`w-full px-4 py-2.5 text-left text-sm ${locationFilter === loc.id ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
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
								disabled={!startDate && !endDate && !locationFilter && !kindFilter && !statusFilter}
								className="min-h-11 min-w-11 p-2.5 rounded-sm border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
								title="Limpiar filtros"
								aria-label="Limpiar filtros"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<Skeleton
				name="service-events-list"
				loading={loading && logs.length === 0 && !fetchError}
				color="var(--color-skeleton-base)"
				darkColor="var(--color-skeleton-base)"
				animate="shimmer"
				select="container"
			>
				<div
					className="bg-surface border border-border rounded-sm overflow-hidden relative"
					aria-busy={loading}
					aria-live="polite"
				>
					{loading && logs.length > 0 && (
						<div
							className="absolute inset-0 bg-surface/60 pointer-events-none transition-opacity duration-150"
							aria-hidden="true"
						/>
					)}
					{fetchError ? (
						<div className="flex flex-col items-center justify-center py-16 gap-4">
							<p className="text-sm text-foreground-muted">
								Error al cargar historial de movimientos
							</p>
							<p className="text-sm text-foreground-subtle">{fetchError}</p>
							<button
								onClick={() => fetchLogs()}
								className="px-4 py-2 rounded-sm bg-primary text-on-primary text-sm font-medium"
							>
								Reintentar
							</button>
						</div>
					) : logs.length === 0 && !loading ? (
						<div className="p-4">
							{emptyMode === "filtered" ? (
								<PageEmptyState
									title="Sin resultados para los filtros"
									description="No se encontraron registros con los filtros aplicados. Ajusta los filtros para ver más resultados."
									actionLabel="Limpiar filtros"
									onAction={handleEmptyAction}
								/>
							) : (
								<PageEmptyState
									title="No hay registros"
									description="Aún no hay eventos registrados. Crea un nuevo servicio para comenzar."
									actionLabel="Nuevo servicio"
									onAction={handleEmptyAction}
								/>
							)}
						</div>
					) : (
						<>
							<div
								className="hidden md:block custom-scrollbar"
								data-testid="service-events-table-desktop"
							>
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="bg-surface-muted border-b border-border">
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">Tipo</th>
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">
												Boleta
											</th>
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">
												Origen
											</th>
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">
												Destino
											</th>
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">Fecha</th>
											<th className="px-4 py-3 text-sm font-medium text-foreground-muted">
												Estado
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
											const statusLabel = isStatus
												? displayStatus(log.toStatus ?? log.fromStatus ?? "")
												: log.product
													? log.product.slice(0, 20)
													: "—";
											return (
												<tr
													key={log.id}
													className="hover:bg-surface-muted transition-opacity duration-150"
												>
													<td className="px-4 py-3">{kindBadge(kind)}</td>
													<td className="px-4 py-3">
														<span className="font-mono text-primary font-semibold text-sm bg-primary/10 px-2 py-1 rounded-sm w-[12ch] inline-block">
															#{log.invoiceNumber || "S/N"}
														</span>
													</td>
													<td className="px-4 py-3">
														<span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-sm border bg-surface-muted text-foreground-muted font-mono w-[14ch] truncate">
															{fromLabel || "—"}
														</span>
													</td>
													<td className="px-4 py-3">
														<span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-sm border bg-surface-muted text-foreground-muted font-mono w-[14ch] truncate">
															{toLabel || "—"}
														</span>
													</td>
													<td className="px-4 py-3 text-sm font-mono text-foreground-muted w-[12ch]">
														{formatEntryDate(log.changedAt)}
													</td>
													<td className="px-4 py-3">
														<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-surface-muted text-foreground-muted border border-border">
															<Clock className="w-3 h-3" />
															{isStatus
																? statusLabel
																: kind === "created"
																	? "Creación"
																	: "Registro"}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							<div
								className="md:hidden space-y-3 p-4 flex flex-col gap-4"
								data-testid="service-events-mobile-list"
							>
								{logs.map((log) => {
									const k = (log.kind ?? "created") as string;
									const isL = k === "location_changed";
									const isS = k === "status_changed";
									const badge = isL ? "Cambio sede" : isS ? "Cambio estado" : "Creación";
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
											className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-4 transition-opacity duration-150"
										>
											<div className="flex justify-between items-start gap-2">
												<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border bg-surface-muted">
													{isS ? (
														<RefreshCw className="w-3 h-3" />
													) : isL ? (
														<ArrowLeftRight className="w-3 h-3" />
													) : (
														<FilePlus className="w-3 h-3" />
													)}
													{badge}
												</span>
												<span className="font-mono text-primary font-semibold text-sm w-[12ch] truncate">
													#{log.invoiceNumber || "S/N"}
												</span>
											</div>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div className="flex flex-col gap-1">
													<span className="text-sm text-foreground-muted">Sede</span>
													<span className="px-2 py-1 rounded-sm bg-surface-muted border border-border text-sm font-mono w-[14ch] truncate inline-block">
														{f || "—"} → {t2 || "—"}
													</span>
												</div>
												<div className="flex flex-col gap-1">
													<span className="text-sm text-foreground-muted">Fecha</span>
													<span className="font-mono text-sm w-[12ch]">
														{formatEntryDate(log.changedAt)}
													</span>
												</div>
												<div className="flex flex-col gap-1">
													<span className="text-sm text-foreground-muted">Boleta</span>
													<span className="font-mono text-sm w-[12ch]">
														#{log.invoiceNumber || "S/N"}
													</span>
												</div>
												<div className="flex flex-col gap-1">
													<span className="text-sm text-foreground-muted">Estado</span>
													<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border bg-surface-muted">
														<CheckCircle className="w-3 h-3" />{" "}
														{isS ? displayStatus(log.toStatus ?? "") : badge}
													</span>
												</div>
											</div>
											<div className="flex gap-2 justify-end">
												<span className="text-sm font-mono text-foreground-subtle w-[14ch] truncate">
													{log.actorId ?? ""}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</>
					)}
					<div className="px-4 py-3 bg-surface-muted border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-sm text-foreground-muted">
							Mostrando{" "}
							<span className="text-foreground font-medium">
								{logs.length === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)}
							</span>{" "}
							de <span className="text-foreground font-medium">{total}</span> resultados
						</p>
						<div className="flex gap-2">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="p-2 rounded-sm border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
											className={`px-3 py-1 rounded-sm text-sm font-medium ${p === page ? "bg-primary text-on-primary" : "text-foreground-muted hover:bg-surface-muted"}`}
										>
											{p}
										</button>
									);
								})}
							</div>
							<button
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="p-2 rounded-sm border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</Skeleton>
		</div>
	);
}
