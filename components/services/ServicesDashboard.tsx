"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { differenceInBusinessDays, parseISO } from "date-fns";
import { getLocations } from "@/app/actions/locations";
import { Service, ServiceStatus } from "@/lib/types";
import { ServiceTable } from "./ServicesTable";
import { ServiceModal } from "./ServicesModal";
import { ServiceDetailsModal } from "./ServicesDetailsModal";
import { Navbar } from "@/components/layout/Navbar";
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
	const [Services, setServices] = useState<Service[]>(
		initialData?.data || [],
	);
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
	const [statusFilter, setStatusFilter] = useState<ServiceStatus[]>(["pending", "ready"]);
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const [editingService, setEditingService] = useState<Service | null>(null);
	const [viewingService, setViewingService] = useState<Service | null>(null);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [locations, setLocations] = useState<any[]>([]);
	const [locationFilter, setLocationFilter] = useState<string>("");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		Service: Service | null;
	}>({ isOpen: false, Service: null });

	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const locationDropdownRef = useRef<HTMLDivElement>(null);

	// Data Fetching
	const fetchLocations = useCallback(async () => {
		const result = await getLocations(true);
		if (result.data) {
			setLocations(result.data);
		}
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
		setCurrentPage(1);
	}, [searchTerm, statusFilter, locationFilter, sortOrder]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
				setShowStatusDropdown(false);
			}
			if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
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

	// Helper function to calculate days
	const calculateDays = (entryDate: string, deliveryDate?: string, status?: Service["status"]) => {
		try {
			const start = parseISO(entryDate);
			const end = status === "completed" && deliveryDate ? parseISO(deliveryDate) : new Date();
			return differenceInBusinessDays(end, start);
		} catch (e) {
			console.error(e);
			return 0;
		}
	};


	// Calculated Stats
	const pendingCount = Services.filter((w) => w.status === "pending").length;
	const readyAndCompletedCount = Services.filter((w) => w.status === "ready" || w.status === "completed").length;
	const cancelledCount = Services.filter((w) => w.status === "cancelled").length;

	// Vencimiento Próximo: >= 10 días Y < 15 días, solo pendientes
	const upcomingExpirationCount = Services.filter((service) => {
		if (service.status !== "pending") return false;
		const days = calculateDays(service.entryDate, service.deliveryDate, service.status);
		return days >= 10 && days < 15;
	}).length;

	// Servicios Críticos: >= 15 días, solo pendientes
	const criticalServicesCount = Services.filter((service) => {
		if (service.status !== "pending") return false;
		const days = calculateDays(service.entryDate, service.deliveryDate, service.status);
		return days >= 15;
	}).length;

	const stats = {
		pending: pendingCount,
		upcoming: upcomingExpirationCount,
		critical: criticalServicesCount,
		readyCompleted: readyAndCompletedCount,
		cancelled: cancelledCount,
	};

	// Pagination handler
	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	const statusOptions: { value: ServiceStatus; label: string; color: string }[] = [
		{ value: "pending", label: "Pendientes", color: "amber" },
		{ value: "ready", label: "Reparadas", color: "blue" },
		{ value: "completed", label: "Completadas", color: "emerald" },
		{ value: "cancelled", label: "Canceladas", color: "red" },
	];

	const getSelectedLabel = () => {
		if (statusFilter.length === 0) return "Todos los estados";
		if (statusFilter.length === statusOptions.length) return "Todos los estados";
		if (statusFilter.length === 1) {
			const option = statusOptions.find(opt => opt.value === statusFilter[0]);
			return option?.label || "Filtrar por estado";
		}
		return `${statusFilter.length} estados selec.`;
	};

	return (
    <div className="min-h-screen bg-background font-sans text-slate-100">
      {/* Navigation Header */}
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <button
            onClick={() => toggleStatus("pending")}
            className={`glass-card p-6 border-l-4 border-slate-700/50 bg-surface/20 transition-all cursor-pointer hover:bg-surface/30 text-left w-full ${
              statusFilter.length === 0 || statusFilter.includes("pending") ? "border-primary!" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.pending}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Pendientes
            </p>
          </button>

          <button
            onClick={() => toggleStatus("pending")}
            className={`glass-card p-6 border-l-4 border-slate-700/50 bg-surface/20 transition-all cursor-pointer hover:bg-surface/30 text-left w-full ${
              statusFilter.length === 0 || statusFilter.includes("pending") ? "border-amber-500!" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.upcoming}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Por Vencer
            </p>
          </button>

          <button
            onClick={() => toggleStatus("pending")}
            className={`glass-card p-6 border-l-4 border-slate-700/50 bg-surface/20 transition-all cursor-pointer hover:bg-surface/30 text-left w-full ${
              statusFilter.length === 0 || statusFilter.includes("pending") ? "border-red-500!" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.critical}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Críticos
            </p>
          </button>

          <button
            onClick={() => toggleStatus("ready")}
            className={`glass-card p-6 border-l-4 border-slate-700/50 bg-surface/20 transition-all cursor-pointer hover:bg-surface/30 text-left w-full ${
              statusFilter.length === 0 || statusFilter.includes("ready") ? "border-emerald-500!" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.readyCompleted}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Reparadas / Completadas
            </p>
          </button>

          <button
            onClick={() => toggleStatus("cancelled")}
            className={`glass-card p-6 border-l-4 border-slate-700/50 bg-surface/20 transition-all cursor-pointer hover:bg-surface/30 text-left w-full ${
              statusFilter.length === 0 || statusFilter.includes("cancelled") ? "border-red-600/80!" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-red-600/10 rounded-lg">
                <X className="w-5 h-5 text-red-600/80" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.cancelled}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
              Canceladas
            </p>
          </button>
        </div>

        {/* Toolbar Section */}
        <div className="glass-card p-4 mb-8 bg-surface/40">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-57.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder-slate-500 text-slate-200 outline-none transition-all"
                placeholder="Buscar por boleta o cliente..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all group relative"
              title={sortOrder === "asc" ? "Ver más recientes primero" : "Ver más antiguos primero"}
            >
              {sortOrder === "asc" ? (
                <ArrowUpNarrowWide className="w-5 h-5" />
              ) : (
                <ArrowDownWideNarrow className="w-5 h-5" />
              )}
              {/* Tooltip text (optional since we have title, but styled for CSS) */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                {sortOrder === "asc" ? "Orden: Antiguos primero" : "Orden: Recientes primero"}
              </span>
            </button>

						{/* Location Dropdown */}
						<div className="relative" ref={locationDropdownRef}>
							<button
								onClick={() => setShowLocationDropdown(!showLocationDropdown)}
								className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all min-w-50 justify-between"
							>
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4 text-slate-400" />
									<span className="text-sm font-medium">
										{locations.find((l) => l.id === locationFilter)?.name || "Todas las Sedes"}
									</span>
								</div>
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
										Todas las Sedes
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

						{/* Status Filter Dropdown */}
						<div className="relative" ref={statusDropdownRef}>
							<button
								onClick={() => setShowStatusDropdown(!showStatusDropdown)}
								className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all min-w-50 justify-between"
							>
								<span className="text-sm font-medium">{getSelectedLabel()}</span>
								<ChevronDown
									className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
								/>
							</button>
							{showStatusDropdown && (
								<div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
									<button
										onClick={() => {
											setStatusFilter([]);
											// setShowStatusDropdown(false); // Optional: keep open for multiple selection
										}}
										className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-700 flex items-center justify-between ${
											statusFilter.length === 0 ? "text-primary font-bold" : "text-slate-300"
										}`}
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
												className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-700 flex items-center justify-between"
											>
												<span
													className={
														isSelected ? `text-${option.color}-500` : "text-slate-300"
													}
												>
													{option.label}
												</span>
												{isSelected && (
													<svg
														className={`w-4 h-4 text-${option.color}-500`}
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
												)}
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
              className="bg-linear-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo servicio
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="glass-card rounded-xl overflow-hidden bg-surface/40">
          {isLoading && (
            <div className="w-full h-32 flex items-center justify-center text-slate-400">
              Cargando datos...
            </div>
          )}
          {!isLoading && (
            <ServiceTable
              Services={Services}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={(Service) =>
                setDeleteConfirm({ isOpen: true, Service })
              }
            />
          )}

          {/* Pagination footer */}
          <div className="px-6 py-4 bg-slate-800/40 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Mostrando página{" "}
              <span className="text-white font-medium">{currentPage}</span> de{" "}
              <span className="text-white font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Simple pagination numbers */}
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
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        p === currentPage
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        ServiceToEdit={editingService}
        availableLocations={locations.map((l) => ({
          id: l.id,
          name: l.name,
        }))}
        onSuccess={() => {
          fetchServices();
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
            const res = await fetch(
              `/api/services?id=${deleteConfirm.Service.id}`,
              { method: "DELETE" },
            );
            if (res.ok) {
              fetchServices();
              setDeleteConfirm({ isOpen: false, Service: null });
            } else {
              alert("Error al eliminar");
            }
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );
}
