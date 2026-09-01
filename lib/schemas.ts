import { z } from "zod";
import { normalizeRut, isValidRut } from "./rut";

export const loginSchema = z.object({
	email: z.string().email({ message: "Correo electrónico inválido" }),
	password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export const registerSchema = z.object({
	name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
	email: z.string().email({ message: "Correo electrónico inválido" }),
	password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

export const ServiceSchema = z.object({
	id: z.string().optional(),
	invoiceNumber: z
		.string()
		.min(1, "El número de orden es requerido")
		.transform((val) => val.trim()),
	clientName: z
		.string()
		.min(2, "El nombre del cliente debe tener al menos 2 caracteres")
		.transform((val) => val.trim()),
	rut: z
		.string({ error: "El RUT es requerido" })
		.min(1, { message: "El RUT es requerido" })
		.transform((val) => normalizeRut(val))
		.pipe(
			z
				.string()
				.min(1, { message: "El RUT es requerido" })
				.refine(isValidRut, { message: "RUT inválido" }),
		),
	email: z
		.string()
		.email("Email inválido")
		.optional()
		.or(z.literal(""))
		.transform((val) => (val === "" ? undefined : val)),
	contact: z
		.string()
		.min(6, "El teléfono de contacto es requerido")
		.transform((val) => val.trim()),
	product: z
		.string()
		.min(2, "El producto es requerido")
		.transform((val) => val.trim()),
	sku: z.string().optional(),
	failureDescription: z.string().optional(),
	locationId: z.string().min(1, "La ubicación es requerida"),
	entryDate: z.string().optional(),
	deliveryDate: z.string().optional().nullable(),
	readyDate: z.string().optional().nullable(),
	cancellationDate: z.string().optional().nullable(),
	status: z.enum(["pending", "ready", "completed", "cancelled"]).default("pending"),
	repairCost: z.number().min(0).optional(),
	notes: z.string().optional(),
});

export type ServiceValues = z.infer<typeof ServiceSchema>;

const trimmedAddress = z
	.string()
	.optional()
	.transform((val) => {
		if (val === undefined) return undefined;
		const t = val.trim();
		return t === "" ? undefined : t;
	})
	.pipe(z.string().max(200, "La dirección no puede exceder 200 caracteres").optional());

export const LocationCreateSchema = z.object({
	name: z
		.string()
		.transform((val) => val.trim())
		.pipe(z.string().min(1, "El nombre es requerido")),
	address: trimmedAddress,
});

export const LocationUpdateSchema = z.object({
	name: z
		.string()
		.transform((val) => val.trim())
		.pipe(
			z
				.string()
				.min(3, "El nombre debe tener al menos 3 caracteres")
				.max(100, "El nombre no puede exceder 100 caracteres"),
		),
	address: trimmedAddress,
});

export type LocationCreateValues = z.infer<typeof LocationCreateSchema>;
export type LocationUpdateValues = z.infer<typeof LocationUpdateSchema>;
