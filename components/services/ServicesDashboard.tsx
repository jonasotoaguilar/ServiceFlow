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
}

export function ServiceDashboard({ initialData, user }: Readonly<ServiceDashboardProps>) {
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
	const [statusFilter, setStatusFilter] = useState<ServiceStatus[]>([]);
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
		try {
			const params = new URLSearchParams();
			params.set("page", currentPage.toString());
			params.set("limit", "20");
			if (searchTerm) params.set("search", searchTerm);
			if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
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
			}
		} catch (e) {
			console.error("Error fetching Services", e);
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

	const toggleStatusInFilter = (status: ServiceStatus) => {
		setStatusFilter((prev) => {
			if (prev.includes(status)) {
				return prev.filter((s) => s !== status);
			}
			return [...prev, status];
		});
	};

	const toggleStatus = (status: ServiceStatus) => {
		setStatusFilter((prev) => {
			if (prev.length === 1 && prev[0] === status) {
				return []; // If only this status is selected, deselect it
			}
			return [status]; // Select only this status
		});
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
		if (statusFilter.length === 0) return "Todos los estados";
		if (statusFilter.length === statusOptions.length) return "Todos los estados";
		if (statusFilter.length === 1) {
			const option = statusOptions.find((opt) => opt.value === statusFilter[0]);
			return option?.label || "Filtrar por estado";
		}
		return `${statusFilter.length} estados selec.`;
	};

	return (
		<>
			{/* Stats Row — exact-layout skeleton on initial load (no rows yet) */}
			<Skeleton
				name="dashboard-stats"
				loading={isLoading && Services.length === 0}
				color="var(--color-skeleton-base)"
				darkColor="var(--color-skeleton-base)"
				animate="shimmer"
				select="container"
			>
				<div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
					<button
						onClick={() => toggleStatus("pending")}
						data-testid="card-pending"
						className={`p-6 border-l-4 rounded-sm text-left w-full transition-all cursor-pointer bg-surface border ${statusFilter.includes("pending") ? "border-pending-border bg-pending-bg/30" : "border-border"}`}
					>
						<div className="flex justify-between items-start">
							<div className="p-2 bg-pending-bg rounded-lg">
								<Clock className="w-5 h-5 text-pending-fg" />
							</div>
							<span className="text-2xl font-bold text-foreground tracking-tight font-mono">
								{stats.pending}
							</span>
						</div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mt-4 flex items-center gap-1">
							<Clock className="w-3 h-3" /> Pendientes
						</p>
					</button>

					<button
						onClick={() => toggleStatus("pending")}
						data-testid="card-upcoming"
						className={`p-6 border-l-4 rounded-sm text-left w-full transition-all cursor-pointer bg-surface border ${statusFilter.includes("pending") ? "border-pending-border bg-pending-bg/30" : "border-border"}`}
					>
						<div className="flex justify-between items-start">
							<div className="p-2 bg-pending-bg rounded-lg">
								<AlertTriangle className="w-5 h-5 text-pending-fg" />
							</div>
							<span className="text-2xl font-bold text-foreground tracking-tight font-mono">
								{stats.upcoming}
							</span>
						</div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mt-4 flex items-center gap-1">
							<AlertTriangle className="w-3 h-3" /> Por Vencer
						</p>
					</button>

					<button
						onClick={() => toggleStatus("pending")}
						data-testid="card-critical"
						className={`p-6 border-l-4 rounded-sm text-left w-full transition-all cursor-pointer bg-surface border ${statusFilter.includes("pending") ? "border-cancelled-border bg-cancelled-bg/30" : "border-border"}`}
					>
						<div className="flex justify-between items-start">
							<div className="p-2 bg-cancelled-bg rounded-lg">
								<Zap className="w-5 h-5 text-cancelled-fg" />
							</div>
							<span className="text-2xl font-bold text-foreground tracking-tight font-mono">
								{stats.critical}
							</span>
						</div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mt-4 flex items-center gap-1">
							<Zap className="w-3 h-3" /> Críticos
						</p>
					</button>

					<button
						onClick={() => toggleStatus("ready")}
						data-testid="card-ready"
						className={`p-6 border-l-4 rounded-sm text-left w-full transition-all cursor-pointer bg-surface border ${statusFilter.includes("ready") || statusFilter.includes("completed") ? "border-ready-border bg-ready-bg/30" : "border-border"}`}
					>
						<div className="flex justify-between items-start">
							<div className="p-2 bg-ready-bg rounded-lg">
								<CheckCircle className="w-5 h-5 text-ready-fg" />
							</div>
							<span className="text-2xl font-bold text-foreground tracking-tight font-mono">
								{stats.ready + stats.completed}
							</span>
						</div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mt-4 flex items-center gap-1">
							<CheckCircle className="w-3 h-3" /> Entregadas
						</p>
					</button>

					<button
						onClick={() => toggleStatus("cancelled")}
						data-testid="card-cancelled"
						className={`p-6 border-l-4 rounded-sm text-left w-full transition-all cursor-pointer bg-surface border ${statusFilter.includes("cancelled") ? "border-cancelled-border bg-cancelled-bg/30" : "border-border"}`}
					>
						<div className="flex justify-between items-start">
							<div className="p-2 bg-cancelled-bg rounded-lg">
								<X className="w-5 h-5 text-cancelled-fg" />
							</div>
							<span className="text-2xl font-bold text-foreground tracking-tight font-mono">
								{stats.cancelled}
							</span>
						</div>
						<p className="text-xs font-bold text-foreground-muted uppercase tracking-widest mt-4 flex items-center gap-1">
							<X className="w-3 h-3" /> Canceladas
						</p>
					</button>
				</div>
			</Skeleton>

			{/* Toolbar Section */}
			<div className="bg-surface border border-border rounded-lg p-4 mb-8">
				<div className="flex items-center gap-3 flex-wrap">
					{/* Search Bar */}
					<div className="relative flex-1 min-w-[230px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted w-5 h-5" />
						<input
							className="w-full bg-surface border border-border rounded-sm pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-focus focus:border-focus placeholder:text-foreground-subtle text-foreground outline-none transition-all"
							placeholder="Buscar por boleta o cliente..."
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Sort Toggle */}
					<button
						onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
						className="p-2.5 rounded-sm bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-all group relative"
						title={sortOrder === "asc" ? "Ver más recientes primero" : "Ver más antiguos primero"}
					>
						{sortOrder === "asc" ? (
							<ArrowUpNarrowWide className="w-5 h-5" />
						) : (
							<ArrowDownWideNarrow className="w-5 h-5" />
						)}
						<span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold text-white bg-zinc-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border">
							{sortOrder === "asc" ? "Orden: Antiguos primero" : "Orden: Recientes primero"}
						</span>
					</button>

					{/* Location Dropdown */}
					<div className="relative" ref={locationDropdownRef}>
						<button
							onClick={() => setShowLocationDropdown(!showLocationDropdown)}
							className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted transition-all min-w-[200px] justify-between"
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

					{/* Status Filter Dropdown */}
					<div className="relative" ref={statusDropdownRef}>
						<button
							onClick={() => setShowStatusDropdown(!showStatusDropdown)}
							className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-surface border border-border text-foreground hover:bg-surface-muted transition-all min-w-[200px] justify-between"
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
										setStatusFilter([]);
									}}
									className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted flex items-center justify-between ${statusFilter.length === 0 ? "text-primary font-bold" : "text-foreground"}`}
								>
									<span>Todos los estados</span>
									{statusFilter.length === 0 && <CheckCircle className="w-4 h-4" />}
								</button>
								{statusOptions.map((option) => {
									const isSelected = statusFilter.includes(option.value);
									return (
										<button
											key={option.value}
											onClick={() => toggleStatusInFilter(option.value)}
											className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted flex items-center justify-between"
										>
											<span
												className={
													isSelected
														? `${option.badgeClass} px-2 py-0.5 rounded-full text-xs border`
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

					{/* New Service Button */}
					<button
						onClick={() => {
							setEditingService(null);
							setIsModalOpen(true);
						}}
						className="bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-sm font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
					>
						<Plus className="w-4 h-4" />
						Nuevo servicio
					</button>
				</div>
			</div>

			{/* Data Table Section — exact-layout skeleton on initial load, aria-busy on refetch */}
			<Skeleton
				name="dashboard-table"
				loading={isLoading && Services.length === 0}
				color="var(--color-skeleton-base)"
				darkColor="var(--color-skeleton-base)"
				animate="shimmer"
				select="container"
			>
				<div
					className="bg-surface border border-border rounded-xl overflow-hidden relative"
					aria-busy={isLoading}
					aria-live="polite"
				>
					{isLoading && Services.length > 0 && (
						<div
							className="absolute inset-0 bg-surface/60 pointer-events-none transition-opacity"
							aria-hidden="true"
						/>
					)}
					<ServiceTable
						Services={Services}
						onEdit={handleEdit}
						onView={handleView}
						onDelete={(Service) => setDeleteConfirm({ isOpen: true, Service })}
						onStatusChange={handleStatusChange}
						onTransfer={handleTransfer}
					/>

					<div className="px-6 py-4 bg-surface-muted border-t border-border flex items-center justify-between">
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
							Cambiar estado status
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
						Transferir servicio #{transferDialog.service?.invoiceNumber} — transfer sede
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
							Transferir sede transfer
						</button>
					</div>
				</div>
			</Dialog>
		</>
	);
}
