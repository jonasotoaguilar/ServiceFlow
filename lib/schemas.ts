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
		.min(1, "El número de boleta es obligatorio")
		.transform((val) => val.trim())
		.pipe(z.string().min(1, "El número de boleta es obligatorio")),
	clientName: z
		.string()
		.min(1, "El cliente es obligatorio")
		.transform((val) => val.trim())
		.pipe(z.string().min(1, "El cliente es obligatorio")),
	rut: z
		.string({ error: "El RUT es obligatorio" })
		.min(1, { message: "El RUT es obligatorio" })
		.transform((val) => normalizeRut(val))
		.pipe(
			z
				.string()
				.min(1, { message: "El RUT es obligatorio" })
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
		.min(1, "El producto es obligatorio")
		.transform((val) => val.trim())
		.pipe(z.string().min(1, "El producto es obligatorio")),
	sku: z.string().optional(),
	failureDescription: z.string().optional(),
	locationId: z.string().min(1, "La sede es obligatoria"),
	entryDate: z.string().optional(),
	deliveryDate: z.string().optional().nullable(),
	readyDate: z.string().optional().nullable(),
	cancellationDate: z.string().optional().nullable(),
	status: z.enum(["pending", "ready", "completed", "cancelled"]).default("pending"),
	repairCost: z.number().min(0, "El costo no puede ser negativo").optional(),
	notes: z.string().optional(),
});

export type ServiceValues = z.infer<typeof ServiceSchema>;

export const ALLOWED_SERVICE_FIELDS = [
	"invoiceNumber",
	"sku",
	"clientName",
	"rut",
	"contact",
	"product",
	"locationId",
	"status",
	"failureDescription",
	"email",
	"repairCost",
	"notes",
	"entryDate",
	"deliveryDate",
	"readyDate",
	"cancellationDate",
	"id",
] as const;

export function toServiceFieldErrors(error: z.ZodError): Record<string, string> {
	const map: Record<string, string> = {};
	for (const issue of error.issues) {
		const field = String(issue.path[0] ?? "");
		if (!field) continue;
		if (!(ALLOWED_SERVICE_FIELDS as readonly string[]).includes(field)) continue;
		if (map[field]) continue;
		map[field] = issue.message;
	}
	return map;
}

// Generic edit may not mutate lifecycle nor identity — keep in sync with PUT guard and storage omit
export const GENERIC_EDIT_OMIT = [
	"status",
	"locationId",
	"deliveryDate",
	"readyDate",
	"cancellationDate",
	"clientName",
	"invoiceNumber",
	"sku",
] as const;

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
