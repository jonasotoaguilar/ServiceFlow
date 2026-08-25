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
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === "string" && parsed.record) {
        pb.authStore.save(parsed.token, parsed.record as RecordModel);
      }
    } catch {
      // ignore malformed
    }
  }
  return pb;
}

export async function saveAuthCookie(token: string, record: unknown): Promise<void> {
  const store = await cookies();
  const value = JSON.stringify({ token, record });
  const exp = getExpFromToken(token);
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
    secure: isProd,
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
