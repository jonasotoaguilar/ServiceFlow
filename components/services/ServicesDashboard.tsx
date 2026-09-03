"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getLocations } from "@/app/actions/locations";
import { Service, ServiceStatus } from "@/lib/types";
import { ServiceTable } from "./ServicesTable";
import { ServiceModal } from "./ServicesModal";
import { ServiceDetailsModal } from "./ServicesDetailsModal";
import {
	Plus,
	Search,
	MapPin,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Clock,
	AlertTriangle,
	Zap,
	CheckCircle,
	ArrowUpNarrowWide,
	ArrowDownWideNarrow,
	X,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmationDialog";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "boneyard-js/react";
import { useRouter } from "next/navigation";

export const STATUS_CARD = {
	pending: "bg-pending-bg text-pending-fg border-pending-border",
	upcoming: "bg-pending-bg text-pending-fg border-pending-border",
	critical: "bg-cancelled-bg text-cancelled-fg border-cancelled-border",
	ready: "bg-ready-bg text-ready-fg border-ready-border",
	completed: "bg-completed-bg text-completed-fg border-completed-border",
	cancelled: "bg-cancelled-bg text-cancelled-fg border-cancelled-border",
} as const;

export const STATUS_BADGE = {
	pending: "bg-pending-bg text-pending-fg border-pending-border",
	ready: "bg-ready-bg text-ready-fg border-ready-border",
	completed: "bg-completed-bg text-completed-fg border-completed-border",
	cancelled: "bg-cancelled-bg text-cancelled-fg border-cancelled-border",
} as const;

interface ServiceDashboardProps {
	initialData?: {
		data: Service[];
		total: number;
		page: number;
		limit: number;
	};
	user?: {
		name: string;
		email?: string | null;
	} | null;
	initialCreateService?: boolean;
}

export function ServiceDashboard({
	initialData,
	user,
	initialCreateService = false,
}: Readonly<ServiceDashboardProps>) {
	// State Management
	const [Services, setServices] = useState<Service[]>(initialData?.data || []);
	const [totalRecords, setTotalRecords] = useState(initialData?.total || 0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(initialData?.page || 1);
	const [totalPages, setTotalPages] = useState(
		initialData ? Math.max(1, Math.ceil(initialData.total / 20)) : 1,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMounted, setHasMounted] = useState(false);
	const [statusFilter, setStatusFilter] = useState<ServiceStatus | "">("");
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [editingService, setEditingService] = useState<Service | null>(null);
	const [viewingService, setViewingService] = useState<Service | null>(null);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [locations, setLocations] = useState<any[]>([]);
	const availableLocations = useMemo(
		() => locations.map((l) => ({ id: l.id, name: l.name })),
		[locations],
	);
	const [locationFilter, setLocationFilter] = useState<string>("");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		Service: Service | null;
	}>({ isOpen: false, Service: null });
	const [statusDialog, setStatusDialog] = useState<{ isOpen: boolean; service: Service | null }>({
		isOpen: false,
		service: null,
	});
	const [transferDialog, setTransferDialog] = useState<{
		isOpen: boolean;
		service: Service | null;
	}>({ isOpen: false, service: null });
	const [nextStatus, setNextStatus] = useState<ServiceStatus>("ready");
	const [targetLocation, setTargetLocation] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [stats, setStats] = useState({
		pending: 0,
		ready: 0,
		completed: 0,
		cancelled: 0,
		upcoming: 0,
		critical: 0,
	});

	const getStatusLabel = (s: ServiceStatus) =>
		s === "pending"
			? "Pendiente"
			: s === "ready"
				? "Reparada"
				: s === "completed"
					? "Entregada"
					: "Cancelada";

	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const locationDropdownRef = useRef<HTMLDivElement>(null);

	// Data Fetching
	const fetchLocations = useCallback(async () => {
		const result = await getLocations(true);
		if (result.data) {
			setLocations(result.data);
		}
	}, []);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/services/stats");
			if (res.ok) {
				const data = await res.json();
				setStats({
					pending: data.pending ?? 0,
					ready: data.ready ?? 0,
					completed: data.completed ?? 0,
					cancelled: data.cancelled ?? 0,
					upcoming: data.upcoming ?? 0,
					critical: data.critical ?? 0,
				});
			}
		} catch {}
	}, []);

	const fetchServices = useCallback(async () => {
		setIsLoading(true);
		setFetchError(null);
		try {
			const params = new URLSearchParams();
			params.set("page", currentPage.toString());
			params.set("limit", "20");
			if (searchTerm) params.set("search", searchTerm);
			if (statusFilter) params.set("status", statusFilter);
			if (locationFilter) params.set("location", locationFilter);
			params.set("sortOrder", sortOrder);

			const res = await fetch(`/api/services?${params.toString()}`);
			if (res.ok) {
				const responseData = await res.json();
				const data: Service[] = responseData.data || [];
				const total = responseData.total || 0;

				setServices(data);
				setTotalRecords(total);
				setTotalPages(Math.max(1, Math.ceil(total / 20)));
			} else {
				setFetchError("No se pudo cargar los servicios. Reintentar");
			}
		} catch (e) {
			console.error("Error fetching Services", e);
			setFetchError("No se pudo cargar los servicios. Reintentar");
		} finally {
			setIsLoading(false);
		}
	}, [currentPage, searchTerm, statusFilter, locationFilter, sortOrder]);

	// Effects
	useEffect(() => {
		if (!hasMounted) {
			setHasMounted(true);
			return;
		}
		const timer = setTimeout(() => {
			fetchServices();
		}, 300);
		return () => clearTimeout(timer);
	}, [fetchServices, hasMounted]);

	useEffect(() => {
		fetchLocations();
	}, [fetchLocations]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, statusFilter, locationFilter, sortOrder]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
				setShowStatusDropdown(false);
			}
			if (
				locationDropdownRef.current &&
				!locationDropdownRef.current.contains(event.target as Node)
			) {
				setShowLocationDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const router = useRouter();
	const hasConsumedCreateServiceRef = useRef(false);
	useEffect(() => {
		if (initialCreateService && !hasConsumedCreateServiceRef.current) {
			hasConsumedCreateServiceRef.current = true;
			setEditingService(null);
			setIsModalOpen(true);
			router.replace("/dashboard");
		}
	}, [initialCreateService, router]);

	// Handlers
	const handleEdit = (Service: Service) => {
		setEditingService(Service);
		setIsModalOpen(true);
	};

	const handleView = (Service: Service) => {
		setViewingService(Service);
		setIsDetailsOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setTimeout(() => setEditingService(null), 300);
	};

	const handleStatusChange = (svc: Service) => {
		setNextStatus(
			svc.status === "pending" ? "ready" : svc.status === "ready" ? "completed" : "pending",
		);
		setActionError(null);
		setStatusDialog({ isOpen: true, service: svc });
	};
	const handleTransfer = (svc: Service) => {
		setTargetLocation(svc.locationId);
		setActionError(null);
		setTransferDialog({ isOpen: true, service: svc });
	};
	const submitStatus = async () => {
		if (!statusDialog.service) return;
		setActionError(null);
		try {
			const operationKey = crypto.randomUUID();
			const res = await fetch(`/api/services/${statusDialog.service.id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json", "Idempotency-Key": operationKey },
				body: JSON.stringify({ status: nextStatus, operationKey }),
			});
			if (res.ok) {
				setStatusDialog({ isOpen: false, service: null });
				fetchServices();
				fetchStats();
			} else {
				const j = await res.json().catch(() => ({}));
				const msg = (j as any).error || "No se pudo Cambiar estado";
				const code = (j as any).code ? ` (${(j as any).code})` : "";
				setActionError(`${msg}${code}`);
			}
		} catch {
			setActionError("Error de red al Cambiar estado");
		}
	};
	const submitTransfer = async () => {
		if (!transferDialog.service) return;
		setActionError(null);
		try {
			const operationKey = crypto.randomUUID();
			const res = await fetch(`/api/services/${transferDialog.service.id}/transfer`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json", "Idempotency-Key": operationKey },
				body: JSON.stringify({ locationId: targetLocation, operationKey }),
			});
			if (res.ok) {
				setTransferDialog({ isOpen: false, service: null });
				fetchServices();
			} else {
				const j = await res.json().catch(() => ({}));
				const msg = (j as any).error || "No se pudo Transferir sede";
				const code = (j as any).code ? ` (${(j as any).code})` : "";
				setActionError(`${msg}${code}`);
			}
		} catch {
			setActionError("Error de red al Transferir sede");
		}
	};

	const hasActiveFilters =
		searchTerm.length > 0 || statusFilter !== "" || locationFilter.length > 0;
	const emptyMode: "true-empty" | "filtered" = hasActiveFilters ? "filtered" : "true-empty";
	const handleClearFilters = () => {
		setSearchTerm("");
		setStatusFilter("");
		setLocationFilter("");
	};
	const handleEmptyAction = () => {
		if (emptyMode === "filtered") handleClearFilters();
		else {
			setEditingService(null);
			setIsModalOpen(true);
		}
	};
	// Pagination handler
	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	const statusOptions: { value: ServiceStatus; label: string; badgeClass: string }[] = [
		{ value: "pending", label: "Pendientes", badgeClass: STATUS_BADGE.pending },
		{ value: "ready", label: "Reparadas", badgeClass: STATUS_BADGE.ready },
		{ value: "completed", label: "Entregada", badgeClass: STATUS_BADGE.completed },
		{ value: "cancelled", label: "Canceladas", badgeClass: STATUS_BADGE.cancelled },
	];

	const getSelectedLabel = () => {
		if (statusFilter === "") return "Todos los estados";
		const option = statusOptions.find((opt) => opt.value === statusFilter);
		return option?.label || "Filtrar por estado";
	};

	return (
		<>
			{/* Headline band — Servicios + mono count + Nuevo servicio (before metrics, wraps at 390) */}
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<div className="min-w-0">
					<h2 className="text-2xl font-semibold text-foreground tracking-tight">Servicios</h2>
					<p className="text-sm font-mono text-foreground-muted">
						{totalRecords} registros · {stats.pending} pendientes
					</p>
				</div>
				<button
					onClick={() => {
						setEditingService(null);
						setIsModalOpen(true);
					}}
					className="bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-sm font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-opacity duration-150"
				>
					<Plus className="w-4 h-4" />
					Nuevo servicio
				</button>
			</div>

			{/* Metrics — 2 large + 3 muted facts as semantic articles, not equal tiles */}
			<Skeleton
				name="dashboard-stats"
				loading={isLoading && Services.length === 0}
				color="var(--color-skeleton-base)"
				darkColor="var(--color-skeleton-base)"
				animate="shimmer"
				select="container"
			>
				<div className="flex flex-col gap-6 mb-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<article
							data-testid="metric-pending"
							className="p-4 rounded-sm border bg-surface flex items-center justify-between gap-4 transition-opacity duration-150"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-pending-bg rounded-lg">
									<Clock className="w-5 h-5 text-pending-fg" />
								</div>
								<p className="text-sm font-medium text-foreground">Pendientes</p>
							</div>
							<span className="text-3xl font-semibold text-foreground font-mono">
								{stats.pending}
							</span>
						</article>

						<article
							data-testid="metric-ready"
							className="p-4 rounded-sm border bg-surface flex items-center justify-between gap-4 transition-opacity duration-150"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-ready-bg rounded-lg">
									<CheckCircle className="w-5 h-5 text-ready-fg" />
								</div>
								<p className="text-sm font-medium text-foreground">Entregadas</p>
							</div>
							<span className="text-3xl font-semibold text-foreground font-mono">
								{stats.ready + stats.completed}
							</span>
						</article>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<article
							data-testid="metric-upcoming"
							className="p-4 rounded-sm border bg-surface flex items-center justify-between gap-3 transition-opacity duration-150 opacity-90"
						>
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-pending-bg rounded-lg">
									<AlertTriangle className="w-4 h-4 text-pending-fg" />
								</div>
								<p className="text-sm font-medium text-foreground-muted">Por Vencer</p>
							</div>
							<span className="text-xl font-semibold text-foreground font-mono">
								{stats.upcoming}
							</span>
						</article>

						<article
							data-testid="metric-critical"
							className="p-4 rounded-sm border bg-surface flex items-center justify-between gap-3 transition-opacity duration-150 opacity-90"
						>
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-cancelled-bg rounded-lg">
									<Zap className="w-4 h-4 text-cancelled-fg" />
								</div>
								<p className="text-sm font-medium text-foreground-muted">Críticos</p>
							</div>
							<span className="text-xl font-semibold text-foreground font-mono">
								{stats.critical}
							</span>
						</article>

						<article
							data-testid="metric-cancelled"
							className="p-4 rounded-sm border bg-surface flex items-center justify-between gap-3 transition-opacity duration-150 opacity-90"
						>
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-cancelled-bg rounded-lg">
									<X className="w-4 h-4 text-cancelled-fg" />
								</div>
								<p className="text-sm font-medium text-foreground-muted">Canceladas</p>
							</div>
							<span className="text-xl font-semibold text-foreground font-mono">
								{stats.cancelled}
							</span>
						</article>
					</div>
				</div>
			</Skeleton>

			{/* Toolbar strip — low border-y not card, gap-3 inside */}
			<div className="border-y border-border bg-surface/50 px-4 py-3 mb-6 w-full box-border">
				<div className="flex items-center gap-3 flex-wrap w-full">
					{/* Search — full width at 390, flex at desktop */}
					<div className="relative w-full sm:flex-1 sm:min-w-[180px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted w-4 h-4" />
						<input
							className="w-full bg-surface border border-border rounded-sm pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-focus focus:border-focus placeholder:text-foreground-subtle text-foreground outline-none transition-colors"
							placeholder="Buscar por boleta o cliente..."
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Sort Toggle */}
					<button
						onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
						className="p-2 rounded-sm bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors group relative"
						title={sortOrder === "asc" ? "Ver más recientes primero" : "Ver más antiguos primero"}
					>
						{sortOrder === "asc" ? (
							<ArrowUpNarrowWide className="w-4 h-4" />
						) : (
							<ArrowDownWideNarrow className="w-4 h-4" />
						)}
						<span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-sm font-medium text-white bg-zinc-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border">
							{sortOrder === "asc" ? "Orden: Antiguos primero" : "Orden: Recientes primero"}
						</span>
					</button>

					{/* Location Dropdown — compact */}
					<div className="relative flex-1 sm:flex-none" ref={locationDropdownRef}>
						<button
							onClick={() => setShowLocationDropdown(!showLocationDropdown)}
							className="flex items-center gap-2 px-3 py-2 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted transition-colors min-w-[140px] w-full sm:w-auto justify-between text-sm"
						>
							<div className="flex items-center gap-2">
								<MapPin className="w-4 h-4 text-foreground-muted" />
								<span className="text-sm font-medium">
									{locations.find((l) => l.id === locationFilter)?.name || "Todas las Sedes"}
								</span>
							</div>
							<ChevronDown
								className={`w-4 h-4 transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
							/>
						</button>
						{showLocationDropdown && (
							<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-sm shadow-xl z-50 overflow-hidden">
								<button
									onClick={() => {
										setLocationFilter("");
										setShowLocationDropdown(false);
									}}
									className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${locationFilter === "" ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
								>
									Todas las Sedes
								</button>
								{locations.map((loc) => (
									<button
										key={loc.id}
										onClick={() => {
											setLocationFilter(loc.id);
											setShowLocationDropdown(false);
										}}
										className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${locationFilter === loc.id ? "bg-primary text-on-primary" : "text-foreground hover:bg-surface-muted"}`}
									>
										{loc.name}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Status Filter Dropdown — compact */}
					<div className="relative flex-1 sm:flex-none" ref={statusDropdownRef}>
						<button
							onClick={() => setShowStatusDropdown(!showStatusDropdown)}
							className="flex items-center gap-2 px-3 py-2 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted transition-colors min-w-[140px] w-full sm:w-auto justify-between text-sm"
						>
							<span className="text-sm font-medium">{getSelectedLabel()}</span>
							<ChevronDown
								className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
							/>
						</button>
						{showStatusDropdown && (
							<div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-sm shadow-xl z-50 overflow-hidden">
								<button
									onClick={() => {
										setStatusFilter("");
										setShowStatusDropdown(false);
									}}
									className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted flex items-center justify-between ${statusFilter === "" ? "text-primary font-bold" : "text-foreground"}`}
								>
									<span>Todos los estados</span>
									{statusFilter === "" && <CheckCircle className="w-4 h-4" />}
								</button>
								{statusOptions.map((option) => {
									const isSelected = statusFilter === option.value;
									return (
										<button
											key={option.value}
											onClick={() => {
												setStatusFilter(option.value);
												setShowStatusDropdown(false);
											}}
											className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted flex items-center justify-between"
										>
											<span
												className={
													isSelected
														? `${option.badgeClass} px-2 py-0.5 rounded-full text-sm border`
														: "text-foreground"
												}
											>
												{option.label}
											</span>
											{isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Data Table Section — exact-layout skeleton on initial load, aria-busy on refetch */}
			<Skeleton
				name="dashboard-table"
				loading={isLoading && Services.length === 0 && !fetchError}
				color="var(--color-skeleton-base)"
				darkColor="var(--color-skeleton-base)"
				animate="shimmer"
				select="container"
			>
				<div
					className="bg-surface border border-border rounded-sm relative"
					aria-busy={isLoading}
					aria-live="polite"
				>
					{isLoading && Services.length > 0 && (
						<div
							className="absolute inset-0 bg-surface/60 pointer-events-none transition-opacity"
							aria-hidden="true"
						/>
					)}
					{fetchError ? (
						<div className="flex flex-col items-center justify-center py-16 gap-4">
							<p className="text-sm text-foreground-muted">{fetchError}</p>
							<button
								onClick={() => fetchServices()}
								className="px-4 py-2 rounded-sm bg-primary text-on-primary text-sm font-medium"
							>
								Reintentar
							</button>
						</div>
					) : (
						<ServiceTable
							Services={Services}
							onEdit={handleEdit}
							onView={handleView}
							onDelete={(Service) => setDeleteConfirm({ isOpen: true, Service })}
							onStatusChange={handleStatusChange}
							onTransfer={handleTransfer}
							emptyMode={emptyMode}
							onEmptyAction={handleEmptyAction}
						/>
					)}

					<div className="px-4 py-3 bg-surface-muted border-t border-border flex items-center justify-between">
						<p className="text-sm text-foreground-muted">
							Mostrando página <span className="text-foreground font-medium">{currentPage}</span> de{" "}
							<span className="text-foreground font-medium">{totalPages}</span>
						</p>
						<div className="flex gap-2">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1 || isLoading}
								className="p-2 rounded-sm border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<div className="flex items-center gap-1">
								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									let p = i + 1;
									if (totalPages > 5 && currentPage > 3) {
										p = currentPage - 2 + i;
									}
									if (p > totalPages) return null;

									return (
										<button
											key={p}
											onClick={() => handlePageChange(p)}
											className={`px-3 py-1 rounded-sm text-sm font-medium transition-all ${p === currentPage ? "bg-primary text-on-primary" : "text-foreground-muted hover:bg-surface-muted"}`}
										>
											{p}
										</button>
									);
								})}
							</div>

							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages || isLoading}
								className="p-2 rounded-sm border border-border text-foreground-muted hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</Skeleton>

			<ServiceModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				ServiceToEdit={editingService}
				availableLocations={availableLocations}
				onSuccess={() => {
					fetchServices();
					fetchStats();
				}}
			/>

			<ServiceDetailsModal
				isOpen={isDetailsOpen}
				onClose={() => setIsDetailsOpen(false)}
				Service={viewingService}
			/>

			<ConfirmationDialog
				isOpen={deleteConfirm.isOpen}
				onClose={() => setDeleteConfirm({ isOpen: false, Service: null })}
				title="Eliminar servicio"
				description={`¿Estás seguro de eliminar la servicio #${
					deleteConfirm.Service?.invoiceNumber || "S/N"
				}?`}
				onConfirm={async () => {
					if (!deleteConfirm.Service) return;
					try {
						const res = await fetch(`/api/services?id=${deleteConfirm.Service.id}`, {
							method: "DELETE",
						});
						if (res.ok) {
							fetchServices();
							fetchStats();
							setDeleteConfirm({ isOpen: false, Service: null });
						} else {
							alert("Error al eliminar");
						}
					} catch (e) {
						console.error(e);
					}
				}}
			/>

			{/* Status change — dedicated action, not generic edit */}
			<Dialog
				isOpen={statusDialog.isOpen}
				onClose={() => setStatusDialog({ isOpen: false, service: null })}
				title="Cambiar estado"
			>
				<div className="space-y-4">
					<p className="text-sm text-foreground-muted">
						Servicio #{statusDialog.service?.invoiceNumber} — actual{" "}
						<span className="font-medium">
							{statusDialog.service ? getStatusLabel(statusDialog.service.status) : ""}
						</span>
					</p>
					<select
						value={nextStatus}
						onChange={(e) => setNextStatus(e.target.value as ServiceStatus)}
						className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground"
					>
						<option value="pending">Pendiente</option>
						<option value="ready">Reparada</option>
						<option value="completed">Entregada</option>
						<option value="cancelled">Cancelada</option>
					</select>
					{actionError && <p className="text-sm text-red-500">{actionError}</p>}
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setStatusDialog({ isOpen: false, service: null })}
							className="px-4 py-2 rounded-lg border border-border text-foreground"
						>
							Cancelar
						</button>
						<button
							onClick={submitStatus}
							className="px-4 py-2 rounded-lg bg-primary text-on-primary"
						>
							Cambiar estado
						</button>
					</div>
				</div>
			</Dialog>

			{/* Transfer — dedicated action, not generic edit */}
			<Dialog
				isOpen={transferDialog.isOpen}
				onClose={() => setTransferDialog({ isOpen: false, service: null })}
				title="Transferir sede"
			>
				<div className="space-y-4">
					<p className="text-sm text-foreground-muted">
						Transferir servicio #{transferDialog.service?.invoiceNumber} — seleccionar nueva sede
					</p>
					<select
						value={targetLocation}
						onChange={(e) => setTargetLocation(e.target.value)}
						className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground"
					>
						{locations.map((loc) => (
							<option key={loc.id} value={loc.id}>
								{loc.name}
							</option>
						))}
					</select>
					{actionError && <p className="text-sm text-red-500">{actionError}</p>}
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setTransferDialog({ isOpen: false, service: null })}
							className="px-4 py-2 rounded-lg border border-border text-foreground"
						>
							Cancelar
						</button>
						<button
							onClick={submitTransfer}
							className="px-4 py-2 rounded-lg bg-primary text-on-primary"
						>
							Transferir sede
						</button>
					</div>
				</div>
			</Dialog>
		</>
	);
}
