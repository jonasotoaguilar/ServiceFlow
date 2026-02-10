"use server";

import { Client, Account, ID } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/appwrite";

function createPublicClient() {
	const client = new Client()
		.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
		.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
		.setKey(process.env.APPWRITE_API_KEY!);
	return {
		get account() {
			return new Account(client);
		},
	};
}

export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	const { account } = createPublicClient();

	try {
		const session = await account.createEmailPasswordSession(email, password);

		(await cookies()).set(SESSION_COOKIE, session.secret, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			expires: new Date(session.expire),
		});
	} catch (e: any) {
		console.error("Login error:", e);
		return { error: "Credenciales inválidas" };
	}

	return { success: true };
}

export async function register(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const name = formData.get("name") as string;

	const { account } = createPublicClient();

	try {
		await account.create(ID.unique(), email, password, name);


		// Auto login after signup
		const session = await account.createEmailPasswordSession(email, password);

		(await cookies()).set(SESSION_COOKIE, session.secret, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			expires: new Date(session.expire),
		});

		return { success: true };
	} catch (e: any) {
		console.error("Signup error:", e);
		return { error: e.message || "Error al registrarse" };
	}
}

export async function logout() {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE);
	redirect("/login");
}
