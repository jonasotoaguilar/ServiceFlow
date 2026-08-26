import PocketBase, { type RecordModel } from "pocketbase";
import { cookies } from "next/headers";
import { getPocketBaseUrl } from "./env";

export const PB_AUTH_COOKIE = "pb_auth";

export const PB_AUTH_COOKIE_NAME = PB_AUTH_COOKIE;

function getExpFromToken(token: string): number | undefined {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return undefined;
		const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
		const decoded =
			typeof Buffer !== "undefined"
				? Buffer.from(padded, "base64").toString("utf-8")
				: atob(padded);
		const obj = JSON.parse(decoded);
		if (typeof obj.exp === "number" && Number.isFinite(obj.exp)) return obj.exp;
	} catch {
		// ignore malformed token
	}
	return undefined;
}

export async function createPocketBaseClient() {
	const url = getPocketBaseUrl();
	const pb = new PocketBase(url);
	const store = await cookies();
	const raw = store.get(PB_AUTH_COOKIE)?.value;
	if (raw) {
		let parsed: unknown = null;
		try {
			parsed = JSON.parse(decodeURIComponent(raw));
		} catch {
			try {
				parsed = JSON.parse(raw);
			} catch {
				parsed = null;
			}
		}
		if (
			parsed &&
			typeof (parsed as { token?: unknown }).token === "string" &&
			(parsed as { record?: unknown }).record
		) {
			const p = parsed as { token: string; record: RecordModel };
			pb.authStore.save(p.token, p.record);
		}
	}
	return pb;
}

export async function saveAuthCookie(token: string, record: unknown): Promise<void> {
	const store = await cookies();
	const value = JSON.stringify({ token, record });
	const exp = getExpFromToken(token);
	const rawUrl = process.env.POCKETBASE_URL || "";
	let isHttps = false;
	try {
		isHttps = new URL(rawUrl).protocol === "https:";
	} catch {
		isHttps = false;
	}
	const isProd = process.env.NODE_ENV === "production";
	const options: {
		httpOnly: boolean;
		sameSite: "lax";
		path: string;
		secure: boolean;
		expires?: Date;
	} = {
		httpOnly: true,
		sameSite: "lax" as const,
		path: "/",
		secure: isProd && isHttps,
	};
	if (exp !== undefined) {
		options.expires = new Date(exp * 1000);
	}
	store.set(PB_AUTH_COOKIE, value, options);
}

export async function clearAuthCookie(): Promise<void> {
	const store = await cookies();
	const del = (store as unknown as { delete?: (name: string) => void }).delete;
	if (typeof del === "function") {
		del.call(store, PB_AUTH_COOKIE);
	} else {
		store.set(PB_AUTH_COOKIE, "", { path: "/", maxAge: 0 } as unknown as Record<string, unknown>);
	}
}
