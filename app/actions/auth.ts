"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createPocketBaseClient, saveAuthCookie, clearAuthCookie } from "@/lib/pocketbase";
import { loginSchema, registerSchema } from "@/lib/schemas";
import { ensureDefaultLocation } from "@/lib/locations";

export async function login(formData: FormData) {
	const email = (formData.get("email") as string | null)?.toString() ?? "";
	const password = (formData.get("password") as string | null)?.toString() ?? "";
	const parsed = loginSchema.safeParse({ email, password });
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
	}
	try {
		const pb = await createPocketBaseClient();
		await pb.collection("users").authWithPassword(parsed.data.email, parsed.data.password);
		await saveAuthCookie(pb.authStore.token, pb.authStore.record);
		try {
			const userId = (pb.authStore.record as { id?: string })?.id;
			if (userId) await ensureDefaultLocation(userId);
		} catch {}
		return { success: true };
	} catch (e: unknown) {
		const err = e as {
			status?: number;
			response?: { status?: number; data?: unknown };
			message?: string;
			data?: unknown;
		};
		const status = err?.status ?? err?.response?.status;
		if (status === 400 || status === 401) {
			return { error: "Credenciales inválidas" };
		}
		if (
			typeof err?.message === "string" &&
			err.message.toLowerCase().includes("failed to authenticate")
		) {
			return { error: "Credenciales inválidas" };
		}
		return { error: "Error al iniciar sesión" };
	}
}

export async function register(formData: FormData) {
	const name = (formData.get("name") as string | null)?.toString() ?? "";
	const email = (formData.get("email") as string | null)?.toString() ?? "";
	const password = (formData.get("password") as string | null)?.toString() ?? "";
	const parsed = registerSchema.safeParse({ name, email, password });
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
	}
	let pb: Awaited<ReturnType<typeof createPocketBaseClient>>;
	try {
		pb = await createPocketBaseClient();
		await pb.collection("users").create({
			email: parsed.data.email,
			password: parsed.data.password,
			passwordConfirm: parsed.data.password,
			name: parsed.data.name,
		});
	} catch (e: unknown) {
		const err = e as {
			status?: number;
			response?: { data?: { email?: unknown }; status?: number };
			data?: { email?: unknown };
			message?: string;
		};
		const status = err?.status ?? err?.response?.status;
		const hasEmailError =
			Boolean((err as unknown as { data?: { email?: unknown } })?.data?.email) ||
			Boolean(err?.response?.data?.email);
		if (status === 400 || hasEmailError) {
			return { error: "No se pudo crear la cuenta. El correo puede estar en uso." };
		}
		if (typeof err?.message === "string" && err.message.toLowerCase().includes("already")) {
			return { error: "No se pudo crear la cuenta. El correo puede estar en uso." };
		}
		return { error: "Error al registrarse" };
	}
	try {
		await pb.collection("users").requestVerification(parsed.data.email);
	} catch {
		// Best-effort delivery; resend remains available without revealing state.
	}
	return { success: true };
}

export async function resendVerification(email: string) {
	const parsed = z.string().email({ message: "Correo electrónico inválido" }).safeParse(email);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "Correo electrónico inválido" };
	}
	try {
		const pb = await createPocketBaseClient();
		await pb.collection("users").requestVerification(parsed.data);
	} catch {
		// Enumeration-neutral: unknown, unverified, and already-verified
		// outcomes share the same observable result.
	}
	return { ok: true };
}

export async function logout() {
	await clearAuthCookie();
	redirect("/login");
}
