"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save, ChevronDown, CheckCircle2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmationDialog";
import { Dialog } from "@/components/ui/dialog";
import { Service } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { formatRut, formatChileanPhone, formatCurrency, parseCurrency } from "@/lib/utils";
import { ServiceSchema } from "@/lib/schemas";

type ServiceFormData = z.infer<typeof ServiceSchema>;

function calculateStatusDates(
	data: ServiceFormData,
	isEditing: boolean,
	ServiceToEdit?: Service | null,
) {
	const dates: {
		readyDate?: string | null;
		deliveryDate?: string | null;
		cancellationDate?: string | null;
	} = {
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

	const confirmDescription = useMemo(() => {
		if (!pendingData) return "";
		const isCompleted = pendingData.status === "completed";
		const statusText = isCompleted ? "Entregada" : "Cancelada";
		return `Está por marcar este servicio como "${statusText}". Una vez guardado, el registro se dará por cerrado y NO podrá ser modificado ni eliminado posteriormente. ¿Desea continuar?`;
	}, [pendingData]);

	const LOCATIONS = useMemo(() => availableLocations, [availableLocations]);
	const isEditing = !!ServiceToEdit;

	const form = useForm<ServiceFormData>({
		resolver: zodResolver(ServiceSchema),
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

	const prevIsOpenRef = useRef(false);

	useEffect(() => {
		if (!isOpen) {
			setAlert(null);
			setLoading(false);
			prevIsOpenRef.current = false;
			return;
		}
		if (prevIsOpenRef.current) return;
		prevIsOpenRef.current = true;
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

	useEffect(() => {
		if (!isOpen || ServiceToEdit) return;
		if (LOCATIONS.length === 0) return;
		const current = form.getValues("locationId");
		if (!current) {
			form.setValue("locationId", LOCATIONS[0].id, { shouldDirty: false });
		}
	}, [isOpen, LOCATIONS, ServiceToEdit, form]);

	const performSubmit = async (data: ServiceFormData) => {
		setLoading(true);
		setAlert(null);
		setShowConfirm(false);

		try {
			const url = "/api/services";
			const method = isEditing ? "PUT" : "POST";

			// Generic create/edit: never send status or location via generic path
			// POST keeps locationId but ignores status/dates (server forces pending)
			// PUT rejects status/locationId and identity (server 400) — we strip them here
			let payload: any;
			if (isEditing) {
				const {
					status: _status,
					locationId: _locationId,
					clientName: _clientName,
					invoiceNumber: _invoiceNumber,
					sku: _sku,
					...rest
				} = data as any;
				payload = {
					...rest,
					id: ServiceToEdit?.id,
				};
			} else {
				const { status: _status, ...rest } = data as any;
				payload = { ...rest };
			}
			// Ensure no status dates leak via generic payload
			delete payload.readyDate;
			delete payload.deliveryDate;
			delete payload.cancellationDate;

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
				const dataJson = await res.json().catch(() => ({}) as any);
				const fieldErrors = (dataJson as any).fieldErrors as Record<string, string> | undefined;
				if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0) {
					Object.entries(fieldErrors).forEach(([field, msg]) => {
						form.setError(field as keyof ServiceFormData, { type: "server", message: String(msg) });
					});
					setAlert({ type: "error", message: "Revisa los campos marcados con error" });
					const first = Object.keys(fieldErrors)[0];
					setTimeout(() => document.getElementById(first)?.focus(), 0);
				} else {
					const msg =
						(dataJson as any).error || (dataJson as any).message || "Error al guardar el servicio";
					setAlert({ type: "error", message: String(msg) });
				}
				setLoading(false);
			}
		} catch (error) {
			console.error(error);
			setAlert({ type: "error", message: "Error de conexión. Intente nuevamente." });
			setLoading(false);
		}
	};

	const onSubmit = (data: ServiceFormData) => {
		performSubmit(data);
	};

	const onInvalid = (errors: Record<string, unknown>) => {
		setAlert({ type: "error", message: "Revisa los campos marcados con error" });
		const order: (keyof ServiceFormData)[] = [
			"entryDate",
			"invoiceNumber",
			"sku",
			"clientName",
			"rut",
			"contact",
			"product",
			"locationId",
			"failureDescription",
			"email",
			"repairCost",
			"notes",
		];
		for (const key of order) {
			if (errors[key]) {
				document.getElementById(key)?.focus();
				break;
			}
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<Dialog
				isOpen={isOpen}
				onClose={onClose}
				title={isEditing ? "Actualizar Servicio" : "Nuevo servicio"}
				maxWidth="3xl"
			>
				<div className="w-full flex flex-col max-h-[90dvh] overflow-hidden bg-surface">
					<div className="px-1 pb-2">
						<p className="text-foreground-muted text-xs">
							Complete los detalles para iniciar el seguimiento del servicio.
						</p>
					</div>

					<div className="px-6 py-6 overflow-y-auto custom-scrollbar">
						{alert && (
							<div className="mb-4" role="alert" aria-live="polite">
								<Alert
									variant={alert.type === "error" ? "error" : "success"}
									message={alert.message}
									onClose={() => setAlert(null)}
								/>
							</div>
						)}

						<form
							onSubmit={form.handleSubmit(onSubmit, onInvalid)}
							className="space-y-6"
							noValidate
						>
							<fieldset disabled={loading} className="space-y-6 contents">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div className="space-y-4">
										{!isEditing && (
											<>
												<div>
													<label
														htmlFor="entryDate"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														Fecha de Ingreso <span className="text-red-500">*</span>
													</label>
													<div className="relative">
														<input
															id="entryDate"
															type="date"
															max={new Date().toISOString().split("T")[0]}
															{...form.register("entryDate")}
															aria-invalid={!!form.formState.errors.entryDate}
															aria-describedby={
																form.formState.errors.entryDate ? "entryDate-error" : undefined
															}
															className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all ${form.formState.errors.entryDate ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
														/>
													</div>
													{form.formState.errors.entryDate && (
														<span
															id="entryDate-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.entryDate.message}
														</span>
													)}
												</div>

												<div>
													<label
														htmlFor="sku"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														SKU <span className="text-red-500">*</span>
													</label>
													<input
														id="sku"
														type="text"
														placeholder="Ej: PRD-7721-X"
														maxLength={20}
														{...form.register("sku")}
														aria-invalid={!!form.formState.errors.sku}
														aria-describedby={form.formState.errors.sku ? "sku-error" : undefined}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.sku ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													/>
													{form.formState.errors.sku && (
														<span
															id="sku-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.sku.message}
														</span>
													)}
												</div>

												<div>
													<label
														htmlFor="rut"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
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
																form.setValue("rut", formatted, {
																	shouldDirty: true,
																	shouldValidate: true,
																});
															},
														})}
														aria-invalid={!!form.formState.errors.rut}
														aria-describedby={form.formState.errors.rut ? "rut-error" : undefined}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.rut ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													/>
													{form.formState.errors.rut && (
														<span
															id="rut-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.rut.message}
														</span>
													)}
												</div>
											</>
										)}
										{isEditing && (
											<div>
												<label
													htmlFor="sku"
													className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
												>
													SKU
												</label>
												<input
													id="sku"
													type="text"
													readOnly
													disabled
													value={ServiceToEdit?.sku ?? ""}
													className="w-full bg-surface-muted border-input text-foreground-muted rounded-lg px-4 py-2.5 opacity-70"
												/>
											</div>
										)}

										<div>
											<label
												htmlFor="email"
												className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
											>
												Email
											</label>
											<input
												id="email"
												type="email"
												placeholder="cliente@ejemplo.com"
												maxLength={320}
												{...form.register("email")}
												aria-invalid={!!form.formState.errors.email}
												aria-describedby={form.formState.errors.email ? "email-error" : undefined}
												className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
											/>
											{form.formState.errors.email && (
												<span
													id="email-error"
													role="alert"
													className="text-red-500 text-xs mt-1 ml-1"
												>
													{form.formState.errors.email.message}
												</span>
											)}
										</div>
										{!isEditing && (
											<div>
												<label
													htmlFor="locationId"
													className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
												>
													Sede <span className="text-red-500">*</span>
												</label>
												<div className="relative" ref={locationDropdownRef}>
													<button
														id="locationId"
														type="button"
														onClick={() => setShowLocationDropdown(!showLocationDropdown)}
														aria-invalid={!!form.formState.errors.locationId}
														aria-describedby={
															form.formState.errors.locationId ? "locationId-error" : undefined
														}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all flex items-center justify-between ${form.formState.errors.locationId ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													>
														<span className="truncate">
															{LOCATIONS.find((l) => l.id === form.watch("locationId"))?.name ||
																"Seleccione Sede"}
														</span>
														<ChevronDown
															className={`w-4 h-4 text-foreground-muted transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
														/>
													</button>

													{showLocationDropdown && (
														<div className="absolute top-full mt-2 w-full bg-surface-muted border border-input rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
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
																			? "bg-primary text-foreground"
																			: "text-foreground-muted hover:bg-surface-muted"
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
													<span
														id="locationId-error"
														role="alert"
														className="text-red-500 text-xs mt-1 ml-1"
													>
														{form.formState.errors.locationId.message}
													</span>
												)}
											</div>
										)}
									</div>

									<div className="space-y-4">
										{!isEditing && (
											<>
												<div>
													<label
														htmlFor="invoiceNumber"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														N° Boleta <span className="text-red-500">*</span>
													</label>
													<input
														id="invoiceNumber"
														type="text"
														placeholder="000123"
														maxLength={20}
														{...form.register("invoiceNumber")}
														aria-invalid={!!form.formState.errors.invoiceNumber}
														aria-describedby={
															form.formState.errors.invoiceNumber
																? "invoiceNumber-error"
																: undefined
														}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.invoiceNumber ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													/>
													{form.formState.errors.invoiceNumber && (
														<span
															id="invoiceNumber-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.invoiceNumber.message}
														</span>
													)}
												</div>

												<div>
													<label
														htmlFor="clientName"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														Cliente <span className="text-red-500">*</span>
													</label>
													<input
														id="clientName"
														type="text"
														placeholder="Nombre completo"
														maxLength={25}
														{...form.register("clientName")}
														aria-invalid={!!form.formState.errors.clientName}
														aria-describedby={
															form.formState.errors.clientName ? "clientName-error" : undefined
														}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.clientName ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													/>
													{form.formState.errors.clientName && (
														<span
															id="clientName-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.clientName.message}
														</span>
													)}
												</div>

												<div>
													<label
														htmlFor="product"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														Producto <span className="text-red-500">*</span>
													</label>
													<input
														id="product"
														type="text"
														placeholder="Nombre del equipo"
														maxLength={40}
														{...form.register("product")}
														aria-invalid={!!form.formState.errors.product}
														aria-describedby={
															form.formState.errors.product ? "product-error" : undefined
														}
														className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.product ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
													/>
													{form.formState.errors.product && (
														<span
															id="product-error"
															role="alert"
															className="text-red-500 text-xs mt-1 ml-1"
														>
															{form.formState.errors.product.message}
														</span>
													)}
												</div>
											</>
										)}
										{isEditing && (
											<>
												<div>
													<label
														htmlFor="invoiceNumber"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														N° Boleta
													</label>
													<input
														id="invoiceNumber"
														type="text"
														readOnly
														disabled
														value={ServiceToEdit?.invoiceNumber ?? ""}
														className="w-full bg-surface-muted border-input text-foreground-muted rounded-lg px-4 py-2.5 opacity-70"
													/>
												</div>
												<div>
													<label
														htmlFor="clientName"
														className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
													>
														Cliente
													</label>
													<input
														id="clientName"
														type="text"
														readOnly
														disabled
														value={ServiceToEdit?.clientName ?? ""}
														className="w-full bg-surface-muted border-input text-foreground-muted rounded-lg px-4 py-2.5 opacity-70"
													/>
												</div>
											</>
										)}
										<div>
											<label
												htmlFor="contact"
												className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
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
														form.setValue("contact", formatted, {
															shouldDirty: true,
															shouldValidate: true,
														});
													},
												})}
												aria-invalid={!!form.formState.errors.contact}
												aria-describedby={
													form.formState.errors.contact ? "contact-error" : undefined
												}
												className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.contact ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
											/>
											{form.formState.errors.contact && (
												<span
													id="contact-error"
													role="alert"
													className="text-red-500 text-xs mt-1 ml-1"
												>
													{form.formState.errors.contact.message}
												</span>
											)}
										</div>

										<div>
											<label
												htmlFor="repairCost"
												className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
											>
												Costo reparación
											</label>
											<div className="relative">
												<span className="absolute left-4 top-2.5 text-foreground-subtle">$</span>
												<input
													id="repairCost"
													type="text"
													placeholder="0.00"
													value={formatCurrency(form.watch("repairCost") || 0)}
													onChange={(event) => {
														const num = parseCurrency(event.target.value);
														if (num <= 999999999) {
															form.setValue("repairCost", num, {
																shouldDirty: true,
																shouldValidate: true,
															});
														}
													}}
													aria-invalid={!!form.formState.errors.repairCost}
													aria-describedby={
														form.formState.errors.repairCost ? "repairCost-error" : undefined
													}
													className={`w-full bg-surface border text-foreground rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle ${form.formState.errors.repairCost ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
												/>
											</div>
											{form.formState.errors.repairCost && (
												<span
													id="repairCost-error"
													role="alert"
													className="text-red-500 text-xs mt-1 ml-1"
												>
													{form.formState.errors.repairCost.message}
												</span>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-2">
									<div>
										<label
											htmlFor="failureDescription"
											className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
										>
											Descripción del Problema{" "}
											{!isEditing && <span className="text-red-500">*</span>}
										</label>
										<textarea
											id="failureDescription"
											placeholder="Describa detalladamente la falla reportada por el cliente..."
											maxLength={500}
											rows={4}
											{...form.register("failureDescription")}
											aria-invalid={!!form.formState.errors.failureDescription}
											aria-describedby={
												form.formState.errors.failureDescription
													? "failureDescription-error"
													: undefined
											}
											className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle custom-scrollbar ${form.formState.errors.failureDescription ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
										/>
										{form.formState.errors.failureDescription && (
											<span
												id="failureDescription-error"
												role="alert"
												className="text-red-500 text-xs mt-1 ml-1"
											>
												{form.formState.errors.failureDescription.message}
											</span>
										)}
									</div>

									<div>
										<label
											htmlFor="notes"
											className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5 ml-1"
										>
											Notas
										</label>
										<textarea
											id="notes"
											placeholder="Notas adicionales sobre el servicio..."
											maxLength={500}
											rows={3}
											{...form.register("notes")}
											aria-invalid={!!form.formState.errors.notes}
											aria-describedby={form.formState.errors.notes ? "notes-error" : undefined}
											className={`w-full bg-surface border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 transition-all placeholder:text-foreground-subtle custom-scrollbar ${form.formState.errors.notes ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-input focus:ring-primary focus:border-primary"}`}
										/>
										{form.formState.errors.notes && (
											<span
												id="notes-error"
												role="alert"
												className="text-red-500 text-xs mt-1 ml-1"
											>
												{form.formState.errors.notes.message}
											</span>
										)}
									</div>
								</div>
							</fieldset>
						</form>
					</div>

					<div className="px-6 py-5 border-t border-border bg-surface-muted flex items-center justify-between gap-4">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="px-6 py-2.5 rounded-lg text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-all"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={loading || (isEditing && !form.formState.isDirty)}
							onClick={form.handleSubmit(onSubmit, onInvalid)}
							className="px-8 py-2.5 rounded-lg text-sm font-semibold text-on-primary bg-primary hover:bg-primary-hover flex items-center gap-2"
						>
							<Save className="h-4 w-4" />
							{getSubmitButtonText(loading, isEditing)}
						</button>
					</div>
				</div>
			</Dialog>
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
		</>
	);
}
