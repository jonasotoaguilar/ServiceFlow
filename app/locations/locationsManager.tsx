"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
	createLocation,
	deleteLocation,
	toggleLocationActive,
	updateLocation,
} from "@/app/actions/locations";
import { Dialog } from "@/components/ui/dialog";
import {
	Trash2,
	Plus,
	Ban,
	CheckCircle2,
	Search,
	MapPin,
	Building2,
	ChevronLeft,
	ChevronRight,
	Edit2,
	ChevronDown,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmationDialog";

type LocationType = {
	id: string;
	name: string;
	address?: string;
	isActive: boolean;
	activeCount: number;
	completedCount: number;
	hasHistory: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export default function LocationsManager({
	locations,
}: Readonly<{
	locations: LocationType[];
}>) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingLocation, setEditingLocation] = useState<LocationType | null>(null);
	const [newLocationName, setNewLocationName] = useState("");
	const [newLocationAddress, setNewLocationAddress] = useState("");
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [confirmState, setConfirmState] = useState<{
		isOpen: boolean;
		title: string;
		description: string;
		onConfirm: () => void;
		variant: "danger" | "warning";
	}>({
		isOpen: false,
		title: "",
		description: "",
		onConfirm: () => {},
		variant: "danger",
	});

	// Validation
	const [nameError, setNameError] = useState("");
	const [addressError, setAddressError] = useState("");

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Filtered locations
	const filteredLocations = useMemo(() => {
		return locations.filter((loc) => {
			const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(loc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
			const matchesStatus = statusFilter === "all" ||
				(statusFilter === "active" && loc.isActive) ||
				(statusFilter === "inactive" && !loc.isActive);
			return matchesSearch && matchesStatus;
		});
	}, [locations, searchTerm, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredLocations.length / itemsPerPage));
	const currentItems = filteredLocations.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const validateForm = () => {
		let isValid = true;
		setNameError("");
		setAddressError("");

		if (!newLocationName.trim()) {
			setNameError("El nombre es requerido");
			isValid = false;
		} else if (newLocationName.trim().length < 3) {
			setNameError("El nombre debe tener al menos 3 caracteres");
			isValid = false;
		} else if (newLocationName.trim().length > 20) {
			setNameError("El nombre no puede exceder 20 caracteres");
			isValid = false;
		}

		if (newLocationAddress.trim() && newLocationAddress.trim().length > 100) {
			setAddressError("La dirección no puede exceder 100 caracteres");
			isValid = false;
		}

		return isValid;
	};

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();

		if (!validateForm()) return;

		setError(null);
		const formData = new FormData();
		formData.append("name", newLocationName.trim());
		if (newLocationAddress.trim()) {
			formData.append("address", newLocationAddress.trim());
		}

		startTransition(async () => {
			const result = await createLocation(null, formData);
			if (result.error) {
				setError(result.error);
			} else {
				setNewLocationName("");
				setNewLocationAddress("");
				setIsDialogOpen(false);
			}
		});
	}

	async function handleUpdate(e: React.FormEvent) {
		e.preventDefault();

		if (!validateForm() || !editingLocation) return;

		setError(null);
		const formData = new FormData();
		formData.append("id", editingLocation.id);
		formData.append("name", newLocationName.trim());
		if (newLocationAddress.trim()) {
			formData.append("address", newLocationAddress.trim());
		}

		startTransition(async () => {
			const result = await updateLocation(null, formData);
			if (result.error) {
				setError(result.error);
			} else {
				setNewLocationName("");
				setNewLocationAddress("");
				setEditingLocation(null);
				setIsDialogOpen(false);
			}
		});
	}

	function openEditDialog(location: LocationType) {
		setEditingLocation(location);
		setNewLocationName(location.name);
		setNewLocationAddress(location.address || "");
		setError(null);
		setNameError("");
		setAddressError("");
		setIsDialogOpen(true);
	}

	function closeDialog() {
		setIsDialogOpen(false);
		setEditingLocation(null);
		setNewLocationName("");
		setNewLocationAddress("");
		setError(null);
		setNameError("");
		setAddressError("");
	}

	async function handleDelete(id: string, name: string) {
		setConfirmState({
			isOpen: true,
			title: "Eliminar Sede",
			description: `¿Estás seguro de eliminar la Sede "${name}"? Esta acción no se puede deshacer.`,
			variant: "danger",
			onConfirm: () => {
				startTransition(async () => {
					const result = await deleteLocation(id, name);
					if (result.error) {
						alert(result.error);
					}
				});
				setConfirmState((prev) => ({ ...prev, isOpen: false }));
			},
		});
	}

	async function handleToggleActive(id: string, currentStatus: boolean) {
		const action = currentStatus ? "desactivar" : "habilitar";
		setConfirmState({
			isOpen: true,
			title: `${currentStatus ? "Desactivar" : "Habilitar"} Sede`,
			description: `¿Estás seguro de ${action} esta Sede?`,
			variant: currentStatus ? "warning" : ("default" as any),
			onConfirm: () => {
				startTransition(async () => {
					const result = await toggleLocationActive(id, !currentStatus);
					if (result.error) {
						alert(result.error);
					}
				});
				setConfirmState((prev) => ({ ...prev, isOpen: false }));
			},
		});
	}

	const statusOptions = [
		{ value: "active", label: "Activas" },
		{ value: "inactive", label: "Inactivas" },
		{ value: "all", label: "Todas" },
	];

	const selectedStatus = statusOptions.find(opt => opt.value === statusFilter);

	return (
		<>
			<main className="max-w-7xl mx-auto px-6 py-10">
				{/* Header Section */}
				<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-white tracking-tight relative w-fit">
							Gestión de Sedes
							<span className="absolute bottom-0 left-0 w-1/3 h-1 bg-linear-to-r from-primary to-transparent rounded-full -mb-2" />
						</h1>
						<p className="text-slate-400 pt-3 text-lg max-w-2xl">
							Administra y supervisa las sedes operativas de tu red de
							servicios.
						</p>
					</div>

					{/* Stats Card */}
					<div className="glass-card p-5 border-l-4 border-primary bg-surface/40 flex items-center gap-4 min-w-50">
						<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
							<Building2 className="w-6 h-6 text-primary" />
						</div>
						<div>
							<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
								Total Sedes
							</p>
							<p className="text-2xl font-bold text-white">
								{locations.length}
							</p>
						</div>
					</div>
				</header>

				{/* Toolbar */}
				<div className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/40">
					<div className="relative w-full md:w-96 group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
						<input
							className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500 transition-all outline-none"
							placeholder="Buscar Sede..."
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto">
						{/* Status Dropdown */}
						<div className="relative">
							<button
								onClick={() => setShowStatusDropdown(!showStatusDropdown)}
								className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all min-w-35 justify-between"
							>
								<span className="text-sm font-medium">{selectedStatus?.label}</span>
								<ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
							</button>
							{showStatusDropdown && (
								<div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
									{statusOptions.map((option) => (
										<button
											key={option.value}
											onClick={() => {
												setStatusFilter(option.value as any);
												setShowStatusDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
												statusFilter === option.value
													? "bg-primary text-white"
													: "text-slate-300 hover:bg-slate-700"
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
							)}
						</div>

						<button
							onClick={() => {
								setEditingLocation(null);
								setNewLocationName("");
								setNewLocationAddress("");
								setError(null);
								setNameError("");
								setAddressError("");
								setIsDialogOpen(true);
							}}
							className="bg-linear-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
						>
							<Plus className="w-5 h-5" />
							Nueva Sede
						</button>
					</div>
				</div>

				{/* Data Table Container */}
				<div className="glass-card rounded-xl overflow-hidden bg-surface/40 border-white/5">
					<div className="overflow-x-auto custom-scrollbar">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-slate-800/40 border-b border-white/5">
									<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">
										Nombre
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
										S. Activos
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
										S. Completados
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
										Estado Sede
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/5">
								{currentItems.map((loc) => (
									<tr
										key={loc.id}
										className="hover:bg-white/3 transition-colors group"
									>
										<td className="px-6 py-5">
											<div className="flex items-center gap-4">
												<div
													className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
														loc.isActive
															? "bg-emerald-500/10 border-emerald-500/20"
															: "bg-slate-500/10 border-slate-500/20"
													}`}
												>
													<MapPin
														className={`w-5 h-5 ${
															loc.isActive ? "text-emerald-500" : "text-slate-500"
														}`}
													/>
												</div>
												<div>
													<p className="font-semibold text-white text-base">
														{loc.name}
													</p>
													<p className="text-xs text-slate-400 mt-0.5">
														{loc.address || "Sin dirección"}
													</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-5 text-center">
											<span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg">
												{loc.activeCount}
											</span>
										</td>
										<td className="px-6 py-5 text-center">
											<span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-lg">
												{loc.completedCount}
											</span>
										</td>
										<td className="px-6 py-5 text-center">
											{loc.isActive ? (
												<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
													<CheckCircle2 className="w-3.5 h-3.5" />
													Activa
												</span>
											) : (
												<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
													<Ban className="w-3.5 h-3.5" />
													Inactiva
												</span>
											)}
										</td>
										<td className="px-6 py-5">
											<div className="flex items-center justify-center gap-2">
												<button
													onClick={() => openEditDialog(loc)}
													disabled={isPending}
													className="p-2 rounded-lg border border-white/10 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
													title="Editar Sede"
												>
													<Edit2 className="w-4 h-4" />
												</button>
												{loc.isActive ? (
													<button
														onClick={() => handleToggleActive(loc.id, loc.isActive)}
														disabled={isPending}
														className="p-2 rounded-lg border border-white/10 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
														title="Desactivar Sede"
													>
														<Ban className="w-4 h-4" />
													</button>
												) : null}
												<button
													onClick={() => handleDelete(loc.id, loc.name)}
													disabled={isPending || loc.hasHistory}
													className="p-2 rounded-lg border border-white/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
													title={
														loc.hasHistory
															? "No se puede eliminar (tiene historial)"
															: "Eliminar Sede"
													}
												>
													<Trash2 className="w-4 h-4" />
												</button>
												{loc.isActive ? null : (
													<button
														onClick={() => handleToggleActive(loc.id, loc.isActive)}
														disabled={isPending}
														className="p-2 rounded-lg border border-white/10 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
														title="Habilitar Sede"
													>
														<CheckCircle2 className="w-4 h-4" />
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
								{currentItems.length === 0 && (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-16 text-center text-slate-500 italic"
										>
											No hay Sedes registradas aún.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					<div className="px-6 py-4 bg-slate-800/40 border-t border-slate-700/50 flex items-center justify-between">
						<p className="text-sm text-slate-400">
							Mostrando página{" "}
							<span className="text-white font-medium">{currentPage}</span> de{" "}
							<span className="text-white font-medium">{totalPages}</span>
						</p>
						<div className="flex gap-2">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
											onClick={() => setCurrentPage(p)}
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
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</main>

			{/* Create/Edit Dialog */}
			<Dialog
				isOpen={isDialogOpen}
				onClose={closeDialog}
				title={editingLocation ? "Editar Sede" : "Crear Nueva Sede"}
				maxWidth="md"
			>
				<form onSubmit={editingLocation ? handleUpdate : handleCreate} className="space-y-6">
					{error && (
						<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
							{error}
						</div>
					)}
					<div>
						<label
							htmlFor="locationName"
							className="block text-sm font-medium text-slate-300 mb-2"
						>
							Nombre de la Sede <span className="text-red-500">*</span>
						</label>
						<input
							id="locationName"
							type="text"
							value={newLocationName}
							onChange={(e) => {
								setNewLocationName(e.target.value);
								setNameError("");
							}}
							maxLength={20}
							className={`w-full bg-slate-800 border ${nameError ? "border-red-500" : "border-slate-700"} rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none`}
							placeholder="Ej: Sede Central"
							required
						/>
						{nameError && (
							<p className="text-red-500 text-xs mt-1">{nameError}</p>
						)}
					</div>
					<div>
						<label
							htmlFor="locationAddress"
							className="block text-sm font-medium text-slate-300 mb-2"
						>
							Dirección
						</label>
						<input
							id="locationAddress"
							type="text"
							value={newLocationAddress}
							onChange={(e) => {
								setNewLocationAddress(e.target.value);
								setAddressError("");
							}}
							maxLength={100}
							className={`w-full bg-slate-800 border ${addressError ? "border-red-500" : "border-slate-700"} rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none`}
							placeholder="Ej: Calle Mayor 12"
						/>
						{addressError && (
							<p className="text-red-500 text-xs mt-1">{addressError}</p>
						)}
					</div>
					<div className="flex gap-3 justify-end pt-4">
						<button
							type="button"
							onClick={closeDialog}
							className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isPending || !newLocationName.trim()}
							className="px-6 py-2 rounded-lg bg-linear-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{isPending
								? "Guardando..."
								: (editingLocation ? "Actualizar Sede" : "Guardar Sede")}
						</button>
					</div>
				</form>
			</Dialog>

			{/* Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={confirmState.isOpen}
				onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
				title={confirmState.title}
				description={confirmState.description}
				onConfirm={confirmState.onConfirm}
				variant={confirmState.variant}
				isLoading={isPending}
			/>
		</>
	);
}
