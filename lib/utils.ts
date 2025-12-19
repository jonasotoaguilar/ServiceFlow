import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRut(value: string) {
  // Eliminar todo lo que no sea números o K
  let actual = value.replaceAll(/(^0+)|([^0-9kK]+)/g, "").toUpperCase();

  if (actual.length === 0) return "";

  // Separar cuerpo y dígito verificador
  let cuerpo = actual.slice(0, -1);
  let dv = actual.slice(-1);

  // Si estoy escribiendo (menos de 2 caracteres), devuelvo tal cual para no entorpecer
  if (actual.length < 2) return actual;

  // Formatear cuerpo con puntos
  cuerpo = cuerpo.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${cuerpo}-${dv}`;
}

export function formatChileanPhone(value: string) {
  // Eliminar todo lo que no sea números
  let raw = value.replaceAll(/\D/g, "");

  // Si está vacío, devolver vacío
  if (!raw) return "";

  // Si empieza con 56, lo quitamos para normalizar, o manejamos el input
  if (raw.startsWith("56")) raw = raw.slice(2);

  // Construir formato +56 9 XXXX XXXX
  // Si no empieza con 9, lo agregamos forzosamente (para cumplir "no borrar el 9")
  if (!raw.startsWith("9")) {
    raw = "9" + raw;
  }

  // Limitar a 9 dígitos (9 + 8 dígitos del número)
  raw = raw.slice(0, 9);

  let formatted = "+56 9";
  const rest = raw.slice(1);

  if (rest.length > 0) {
    formatted += " " + rest.substring(0, 4);
  }
  if (rest.length > 4) {
    formatted += " " + rest.substring(4, 8);
  }

  return formatted;
}

export function normalizeString(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim();
}

export function formatCurrency(value: string | number) {
  const amount =
    typeof value === "string" ? value.replaceAll(/\D/g, "") : value.toString();
  if (!amount || amount === "0") return "";

  const formatted = new Intl.NumberFormat("es-CL").format(Number(amount));
  return `$${formatted}`;
}

export function parseCurrency(value: string) {
  const raw = value.replaceAll(/\D/g, "");
  return raw ? Number(raw) : 0;
}
