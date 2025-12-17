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

  // Limitar a 9 dígitos (9 + 8 dígitos)
  raw = raw.slice(0, 9);

  // Construir formato +56 9 XXXX XXXX
  let formatted = "+56";
  if (raw.length > 0) formatted += " " + raw.substring(0, 1); // 9
  if (raw.length > 1) formatted += " " + raw.substring(1, 5); // XXXX
  if (raw.length > 5) formatted += " " + raw.substring(5, 9); // XXXX

  return formatted;
}
