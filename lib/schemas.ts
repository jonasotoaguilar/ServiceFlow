import { z } from "zod";

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
    .string()
    .optional()
    .transform((val) => val?.trim()),
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
