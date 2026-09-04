#!/usr/bin/env node
// Pure helpers for scripts/pb-init.mjs — no side effects on import.
// All PocketBase settings semantics below were verified live against
// PocketBase v0.40.1 (GET /api/collections/users, PUT /api/collections/import,
// GET/PATCH /api/settings).

export const EXPECTED_AUTH_RULE = "verified = true";

export const SMTP_HOST = "smtp.resend.com";
export const SMTP_USERNAME = "resend";
export const SMTP_PORT = 465;
export const SMTP_TLS = true;
export const SMTP_AUTH_METHOD = "PLAIN";

export const SENDER_NAME = "ServiceFlow";
export const SENDER_ADDRESS = "no-reply@serviceflow.jonasotoaguilar.space";
export const APP_NAME = "ServiceFlow";
export const DEFAULT_APP_URL = "https://serviceflow.jonasotoaguilar.space";

/** True when the live users authRule differs from the verified-only gate. */
export function authRuleNeedsFix(current) {
	return current !== EXPECTED_AUTH_RULE;
}

/**
 * Retry only network-level failures. Any HTTP status fails immediately —
 * 4xx are operator/config errors that retrying cannot fix.
 */
/**
 * Retry policy: retry only network-level failures (fetch threw).
 * Every answered HTTP status — including 4xx and 5xx — fails immediately.
 *
 * @param {{ status?: number, networkError?: boolean }} outcome
 */
export function shouldRetryRequest({ networkError = false }) {
	return networkError === true;
}

/** Validate the optional app URL override; throws fail-closed on garbage. */
export function resolveAppUrl(raw) {
	if (raw === undefined || raw === null || raw === "") return DEFAULT_APP_URL;
	let parsed;
	try {
		parsed = new URL(raw);
	} catch {
		throw new Error(`Invalid PB_META_APP_URL: ${raw}`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Invalid PB_META_APP_URL protocol: ${raw}`);
	}
	return raw;
}

/**
 * Decide SMTP handling from env. Absent or empty password (compose
 * `${VAR:-}` interpolation artifact) means skip so default/local runs work.
 * Whitespace-only passwords and invalid app URL overrides fail closed.
 */
/**
 * @typedef {{ mode: "skip" }} SmtpSkipped
 * @typedef {{ mode: "apply", password: string, appURL: string }} SmtpApply
 * @returns {SmtpSkipped | SmtpApply}
 */
export function resolveSmtpConfig(env) {
	const password = env.PB_SMTP_PASSWORD;
	if (password === undefined || password === null || password === "") {
		return { mode: "skip" };
	}
	if (password.trim() === "") {
		throw new Error("PB_SMTP_PASSWORD is blank — refusing to apply partial SMTP config");
	}
	const appURL = resolveAppUrl(env.PB_META_APP_URL);
	return { mode: "apply", password, appURL };
}

/** Exact PATCH /api/settings body. The password always comes from env. */
export function buildSettingsPayload({ password, appURL }) {
	return {
		smtp: {
			enabled: true,
			host: SMTP_HOST,
			port: SMTP_PORT,
			username: SMTP_USERNAME,
			password,
			authMethod: SMTP_AUTH_METHOD,
			tls: SMTP_TLS,
		},
		meta: {
			senderName: SENDER_NAME,
			senderAddress: SENDER_ADDRESS,
			appName: APP_NAME,
			appURL,
		},
	};
}

const SECRET_KEYS = new Set(["password", "token", "secret", "apikey", "api_key"]);

/** Deep-redact secret-bearing keys so logged objects never leak credentials. */
export function redactSecrets(value) {
	if (Array.isArray(value)) return value.map(redactSecrets);
	if (value !== null && typeof value === "object") {
		const out = {};
		for (const [key, entry] of Object.entries(value)) {
			out[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[redacted]" : redactSecrets(entry);
		}
		return out;
	}
	return value;
}
