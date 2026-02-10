"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save, ChevronDown, CheckCircle2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmationDialog";
import { Service } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import {
	formatRut,
	formatChileanPhone,
	formatCurrency,
	parseCurrency,
} from "@/lib/utils";

const serviceSchema = z.object({
	entryDate: z.string().min(1, "La fecha es obligatoria"),
	invoiceNumber: z.string().min(1, "El número de boleta es obligatorio"),
	sku: z.string().min(1, "El SKU es obligatorio"),
	clientName: z.string().min(1, "El cliente es obligatorio"),
	rut: z.string().min(1, "El RUT es obligatorio"),
	contact: z.string()
		.min(15, "El teléfono debe estar completo")
		.regex(/^\+56 9 \d{4} \d{4}$/, "Formato de teléfono inválido"),
	product: z.string().min(1, "El producto es obligatorio"),
	locationId: z.string().min(1, "La sede es obligatoria"),
	status: z.enum(["pending", "ready", "completed", "cancelled"]),
	failureDescription: z.string().min(1, "La descripción del problema es obligatoria"),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	repairCost: z.number().min(0),
	notes: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

function calculateStatusDates(data: ServiceFormData, isEditing: boolean, ServiceToEdit?: Service | null) {
	const dates: { readyDate?: string | null; deliveryDate?: string | null; cancellationDate?: string | null } = {
		readyDate: ServiceToEdit?.readyDate,
		deliveryDate: ServiceToEdit?.deliveryDate,
		cancellationDate: ServiceToEdit?.cancellationDate,
	};

	if (isEditing) {
		if (data.status !== ServiceToEdit?.status) {
			if (data.status === "ready") dates.readyDate = new Date().toISOString();
			else if (data.status === "completed") dates.deliveryDate = new Date().toISOString();
			else if (data.status === "cancelled") dates.cancellationDate = new Date().toISOString();
			else if (data.status === "pending") {
				dates.readyDate = null;
				dates.deliveryDate = null;
				dates.cancellationDate = null;
			}
		}
	} else if (data.status === "ready") {
		dates.readyDate = new Date().toISOString();
	} else if (data.status === "completed") {
		dates.readyDate = new Date().toISOString();
		dates.deliveryDate = new Date().toISOString();
	} else if (data.status === "cancelled") {
		dates.cancellationDate = new Date().toISOString();
	}
	return dates;
}

const getSubmitButtonText = (loading: boolean, isEditing: boolean) => {
	if (loading) return "Guardando...";
	return isEditing ? "Actualizar" : "Guardar servicio";
};

interface ServiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	ServiceToEdit?: Service | null;
	availableLocations: { id: string; name: string }[];
}

export function ServiceModal({
	isOpen,
	onClose,
	onSuccess,
	ServiceToEdit,
	availableLocations,
}: Readonly<ServiceModalProps>) {
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
	const [showConfirm, setShowConfirm] = useState(false);
	const [pendingData, setPendingData] = useState<ServiceFormData | null>(null);

	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const locationDropdownRef = useRef<HTMLDivElement>(null);

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

	const confirmDescription = useMemo(() => {
		if (!pendingData) return "";
		const isCompleted = pendingData.status === "completed";
		const statusText = isCompleted ? "Completada" : "Cancelada";
		return `Está por marcar este servicio como "${statusText}". Una vez guardado, el registro se dará por cerrado y NO podrá ser modificado ni eliminado posteriormente. ¿Desea continuar?`;
	}, [pendingData]);

	const LOCATIONS = useMemo(() => availableLocations, [availableLocations]);
	const isEditing = !!ServiceToEdit;

	const form = useForm<ServiceFormData>({
		resolver: zodResolver(serviceSchema),
		defaultValues: {
			entryDate: new Date().toISOString().split("T")[0],
			invoiceNumber: "",
			sku: "",
			clientName: "",
			rut: "",
			contact: "+56 9 ",
			product: "",
			locationId: LOCATIONS.length > 0 ? LOCATIONS[0].id : "",
			status: "pending",
			failureDescription: "",
			email: "",
			repairCost: 0,
			notes: "",
		},
	});

	useEffect(() => {
		if (!isOpen) {
			setAlert(null);
			setLoading(false);
			return;
		}
		setLoading(false);

		if (ServiceToEdit) {
			const resetValues: ServiceFormData = {
				entryDate: ServiceToEdit.entryDate,
				invoiceNumber: ServiceToEdit.invoiceNumber || "",
				sku: ServiceToEdit.sku || "",
				clientName: ServiceToEdit.clientName,
				rut: ServiceToEdit.rut || "",
				contact: ServiceToEdit.contact || "+56 9 ",
				product: ServiceToEdit.product,
				locationId: ServiceToEdit.locationId,
				status: ServiceToEdit.status,
				failureDescription: ServiceToEdit.failureDescription || "",
				email: ServiceToEdit.email || "",
				repairCost: ServiceToEdit.repairCost ?? 0,
				notes: ServiceToEdit.notes || "",
			};
			form.reset(resetValues);
		} else {
			form.reset({
				entryDate: new Date().toISOString().split("T")[0],
				invoiceNumber: "",
				sku: "",
				clientName: "",
				rut: "",
				contact: "+56 9 ",
				product: "",
				locationId: LOCATIONS.length > 0 ? LOCATIONS[0].id : "",
				status: "pending",
				failureDescription: "",
				email: "",
				repairCost: 0,
				notes: "",
			});
		}
		setShowLocationDropdown(false);
	}, [ServiceToEdit, isOpen, LOCATIONS, form]);

	const performSubmit = async (data: ServiceFormData) => {
		setLoading(true);
		setAlert(null);
		setShowConfirm(false);

		try {
			const url = "/api/services";
			const method = isEditing ? "PUT" : "POST";

			// Prepare payload with dates from helper
			const statusDates = calculateStatusDates(data, isEditing, ServiceToEdit);
			const payload: any = {
				...data,
				...statusDates,
				id: ServiceToEdit?.id,
			};

			const body = JSON.stringify(payload);

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body,
			});

			if (res.ok) {
				setAlert({ type: "success", message: "Servicio guardado correctamente" });
				setTimeout(() => {
					onSuccess();
					onClose();
				}, 1500);
			} else {
				setAlert({ type: "error", message: "Error al guardar el servicio" });
				setLoading(false);
			}
		} catch (error) {
			console.error(error);
			setAlert({ type: "error", message: "Error de conexión" });
			setLoading(false);
		}
	};

	const onSubmit = (data: ServiceFormData) => {
		if (data.status === "completed" || data.status === "cancelled") {
			setPendingData(data);
			setShowConfirm(true);
		} else {
			performSubmit(data);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="glass-effect w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				<div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<span className="text-primary">✓</span>
							{isEditing ? "Actualizar Servicio" : "Nueva servicio"}
						</h2>
						<p className="text-slate-400 text-xs mt-0.5">
							Complete los detalles para iniciar el seguimiento del servicio.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="px-6 py-6 overflow-y-auto custom-scrollbar">
					{alert && (
						<div className="mb-4">
							<Alert
								variant={alert.type === "error" ? "error" : "success"}
								message={alert.message}
								onClose={() => setAlert(null)}
							/>
						</div>
					)}

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<fieldset disabled={loading} className="space-y-6 contents">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="space-y-4">
								{!isEditing && (
									<>
										<div>
											<label
												htmlFor="entryDate"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												Fecha de Ingreso <span className="text-red-500">*</span>
											</label>
											<div className="relative">
												<input
													id="entryDate"
													type="date"
													max={new Date().toISOString().split("T")[0]}
													{...form.register("entryDate")}
													className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all scheme-dark"
												/>
											</div>
											{form.formState.errors.entryDate && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.entryDate.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="sku"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												SKU <span className="text-red-500">*</span>
											</label>
											<input
												id="sku"
												type="text"
												placeholder="Ej: PRD-7721-X"
												maxLength={20}
												{...form.register("sku")}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.sku && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.sku.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="rut"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												RUT <span className="text-red-500">*</span>
											</label>
											<input
												id="rut"
												type="text"
												placeholder="12.345.678-9"
												maxLength={12}
												{...form.register("rut", {
													onChange: (event) => {
														const formatted = formatRut(event.target.value);
														form.setValue("rut", formatted, { shouldDirty: true });
													},
												})}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.rut && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.rut.message}
												</span>
											)}
										</div>
									</>
								)}

								<div>
									<label
										htmlFor="email"
										className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
									>
										Email
									</label>
									<input
										id="email"
										type="email"
										placeholder="cliente@ejemplo.com"
										maxLength={320}
										{...form.register("email")}
										className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
									/>
									{form.formState.errors.email && (
										<span className="text-red-500 text-xs mt-1 ml-1">
											{form.formState.errors.email.message}
										</span>
									)}
								</div>

								<div>
									<label
										htmlFor="locationId"
										className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
									>
										Sede <span className="text-red-500">*</span>
									</label>
									<div className="relative" ref={locationDropdownRef}>
										<button
											type="button"
											onClick={() => setShowLocationDropdown(!showLocationDropdown)}
											className="w-full bg-surface border border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all flex items-center justify-between"
										>
											<span className="truncate">
												{LOCATIONS.find((l) => l.id === form.watch("locationId"))?.name ||
													"Seleccione Sede"}
											</span>
											<ChevronDown
												className={`w-4 h-4 text-slate-400 transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
											/>
										</button>

										{showLocationDropdown && (
											<div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
												{LOCATIONS.map((loc) => (
													<button
														key={loc.id}
														type="button"
														onClick={() => {
															form.setValue("locationId", loc.id, {
																shouldValidate: true,
																shouldDirty: true,
															});
															setShowLocationDropdown(false);
														}}
														className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
															form.watch("locationId") === loc.id
																? "bg-primary text-white"
																: "text-slate-300 hover:bg-slate-700"
														}`}
													>
														<span>{loc.name}</span>
														{form.watch("locationId") === loc.id && (
															<CheckCircle2 className="w-4 h-4" />
														)}
													</button>
												))}
											</div>
										)}
									</div>
									{form.formState.errors.locationId && (
										<span className="text-red-500 text-xs mt-1 ml-1">
											{form.formState.errors.locationId.message}
										</span>
									)}
								</div>
							</div>

							<div className="space-y-4">
								{!isEditing && (
									<>
										<div>
											<label
												htmlFor="invoiceNumber"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												N° Boleta <span className="text-red-500">*</span>
											</label>
											<input
												id="invoiceNumber"
												type="text"
												placeholder="000123"
												maxLength={20}
												{...form.register("invoiceNumber")}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.invoiceNumber && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.invoiceNumber.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="clientName"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												Cliente <span className="text-red-500">*</span>
											</label>
											<input
												id="clientName"
												type="text"
												placeholder="Nombre completo"
												maxLength={25}
												{...form.register("clientName")}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.clientName && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.clientName.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="contact"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												Teléfono <span className="text-red-500">*</span>
											</label>
											<input
												id="contact"
												type="tel"
												placeholder="+56 9 1234 5678"
												maxLength={15}
												{...form.register("contact", {
													onChange: (event) => {
														const formatted = formatChileanPhone(event.target.value);
														form.setValue("contact", formatted, { shouldDirty: true });
													},
												})}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.contact && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.contact.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="product"
												className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
											>
												Producto <span className="text-red-500">*</span>
											</label>
											<input
												id="product"
												type="text"
												placeholder="Nombre del equipo"
												maxLength={40}
												{...form.register("product")}
												className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
											/>
											{form.formState.errors.product && (
												<span className="text-red-500 text-xs mt-1 ml-1">
													{form.formState.errors.product.message}
												</span>
											)}
										</div>
									</>
								)}

								<div>
									<label
										htmlFor="repairCost"
										className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
									>
										Costo reparación
									</label>
									<div className="relative">
										<span className="absolute left-4 top-2.5 text-slate-500">$</span>
										<input
											id="repairCost"
											type="text"
											placeholder="0.00"
											value={formatCurrency(form.watch("repairCost") || 0)}
											onChange={(event) => {
												const num = parseCurrency(event.target.value);
												if (num <= 999999999) {
													form.setValue("repairCost", num, { shouldDirty: true });
												}
											}}
											className="w-full bg-surface border-slate-700 text-white rounded-lg pl-8 pr-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500"
										/>
									</div>
									{form.formState.errors.repairCost && (
										<span className="text-red-500 text-xs mt-1 ml-1">
											{form.formState.errors.repairCost.message}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="space-y-4 pt-2">
							<div>
								<div className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
									Estado <span className="text-red-500">*</span>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
									<label className="cursor-pointer">
										<input
											{...form.register("status")}
											type="radio"
											value="pending"
											className="peer hidden"
										/>
										<div className="bg-surface border border-slate-700 peer-checked:border-yellow-500/50 peer-checked:bg-yellow-500/10 text-slate-400 peer-checked:text-yellow-500 p-2.5 rounded-lg text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter">
											<span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
											Pendiente
										</div>
									</label>
									<label className="cursor-pointer">
										<input
											{...form.register("status")}
											type="radio"
											value="ready"
											className="peer hidden"
										/>
										<div className="bg-surface border border-slate-700 peer-checked:border-primary/50 peer-checked:bg-primary/10 text-slate-400 peer-checked:text-primary p-2.5 rounded-lg text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter">
											<span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
											Reparada
										</div>
									</label>
									<label className="cursor-pointer">
										<input
											{...form.register("status")}
											type="radio"
											value="completed"
											className="peer hidden"
										/>
										<div className="bg-surface border border-slate-700 peer-checked:border-emerald-500/50 peer-checked:bg-emerald-500/10 text-slate-400 peer-checked:text-emerald-500 p-2.5 rounded-lg text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
											Completada
										</div>
									</label>
									<label className="cursor-pointer">
										<input
											{...form.register("status")}
											type="radio"
											value="cancelled"
											className="peer hidden"
										/>
										<div className="bg-surface border border-slate-700 peer-checked:border-red-600/50 peer-checked:bg-red-600/10 text-slate-400 peer-checked:text-red-600/80 p-2.5 rounded-lg text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter">
											<span className="w-1.5 h-1.5 rounded-full bg-red-600/80 shrink-0" />
											Cancelada
										</div>
									</label>
								</div>
								{form.formState.errors.status && (
									<span className="text-red-500 text-xs mt-1 ml-1">
										{form.formState.errors.status.message}
									</span>
								)}
							</div>

							{!isEditing && (
								<div>
									<label
										htmlFor="failureDescription"
										className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
									>
										Descripción del Problema <span className="text-red-500">*</span>
									</label>
									<textarea
										id="failureDescription"
										placeholder="Describa detalladamente la falla reportada por el cliente..."
										maxLength={500}
										rows={4}
										{...form.register("failureDescription")}
										className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500 custom-scrollbar"
									/>
									{form.formState.errors.failureDescription && (
										<span className="text-red-500 text-xs mt-1 ml-1">
											{form.formState.errors.failureDescription.message}
										</span>
									)}
								</div>
							)}

							<div>
								<label
									htmlFor="notes"
									className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1"
								>
									Notas
								</label>
								<textarea
									id="notes"
									placeholder="Notas adicionales sobre el servicio..."
									maxLength={500}
									rows={3}
									{...form.register("notes")}
									className="w-full bg-surface border-slate-700 text-white rounded-lg px-4 py-2.5 input-focus-glow transition-all placeholder:text-slate-500 custom-scrollbar"
								/>
								{form.formState.errors.notes && (
									<span className="text-red-500 text-xs mt-1 ml-1">
										{form.formState.errors.notes.message}
									</span>
								)}
							</div>
						</div>
						</fieldset>
					</form>
				</div>

				<div className="px-6 py-5 border-t border-white/10 bg-white/5 flex items-center justify-between gap-4">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading || (isEditing && !form.formState.isDirty)}
						onClick={form.handleSubmit(onSubmit)}
						className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-primary hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:shadow-none"
					>
						<Save className="h-4 w-4" />
						{getSubmitButtonText(loading, isEditing)}
					</button>
				</div>
			</div>

			<ConfirmationDialog
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={() => pendingData && performSubmit(pendingData)}
				title="Confirmar Cierre de Registro"
				description={confirmDescription}
				confirmText="Sí, Cerrar Registro"
				cancelText="No, Revisar"
				variant="warning"
				isLoading={loading}
			/>
		</div>
	);
}
