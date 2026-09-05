#!/usr/bin/env node
import fs from "node:fs";
import {
	EXPECTED_AUTH_RULE,
	authRuleNeedsFix,
	shouldRetryRequest,
	resolveSmtpConfig,
	buildSettingsPayload,
	redactSecrets,
} from "./pb-init.lib.mjs";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://pocketbase:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const COLLECTIONS_PATH = "/app/pocketbase/v1.collections.json";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error("[pb-init] Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD");
	process.exit(1);
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts, retries = 10) {
	let lastErr;
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(url, opts);
			return res;
		} catch (e) {
			lastErr = e;
			console.log(`[pb-init] fetch failed attempt ${i + 1}/${retries}: ${e.message} — retrying`);
			await sleep(1000 * (i + 1));
		}
	}
	throw lastErr;
}

async function waitForHealth() {
	for (let i = 0; i < 30; i++) {
		try {
			const res = await fetch(`${POCKETBASE_URL}/api/health`);
			if (res.ok) {
				const data = await res.json().catch(() => ({}));
				if (data.code === 200 || res.status === 200) {
					console.log("[pb-init] PocketBase healthy");
					return;
				}
			}
		} catch {}
		await sleep(1000);
	}
	throw new Error("PocketBase health check timed out");
}

async function authenticate() {
	const url = `${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`;
	for (let attempt = 1; attempt <= 15; attempt++) {
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
			});
			const body = await res.text();
			let json;
			try {
				json = JSON.parse(body);
			} catch {
				json = {};
			}
			if (res.ok && json.token) {
				console.log(`[pb-init] authenticated as superuser (attempt ${attempt})`);
				return json.token;
			}
			console.log(`[pb-init] auth attempt ${attempt} failed: ${res.status} ${body.slice(0, 200)}`);
		} catch (e) {
			console.log(`[pb-init] auth attempt ${attempt} error: ${e.message}`);
		}
		await sleep(2000);
	}
	throw new Error("Failed to authenticate superuser after 15 attempts");
}

async function importCollections(token) {
	const raw = fs.readFileSync(COLLECTIONS_PATH, "utf8");
	const data = JSON.parse(raw);
	const collections = Array.isArray(data) ? data : (data.collections ?? data.data ?? []);
	if (!Array.isArray(collections) || collections.length === 0) {
		throw new Error("No collections found in v1.collections.json");
	}
	const payload = { collections, deleteMissing: false };
	const url = `${POCKETBASE_URL}/api/collections/import`;
	const res = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: token,
		},
		body: JSON.stringify(payload),
	});
	const text = await res.text();
	if (res.status === 204 || res.ok) {
		console.log("[pb-init] collections import succeeded");
		return;
	}
	console.error(`[pb-init] import failed ${res.status}: ${text.slice(0, 1000)}`);
	throw new Error(`Import failed ${res.status}: ${text.slice(0, 500)}`);
}

async function api(token, path, opts = {}) {
	const url = `${POCKETBASE_URL}${path}`;
	let lastErr;
	for (let attempt = 1; attempt <= 10; attempt++) {
		let res;
		try {
			res = await fetch(url, {
				...opts,
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
					...(opts.headers ?? {}),
				},
			});
		} catch (e) {
			lastErr = e;
			if (!shouldRetryRequest({ networkError: true })) throw e;
			console.log(`[pb-init] fetch failed attempt ${attempt}/10: ${e.message} — retrying`);
			await sleep(1000 * attempt);
			continue;
		}
		// HTTP statuses fail immediately — only network errors retry.
		if (!res.ok) {
			if (shouldRetryRequest({ status: res.status, networkError: false })) continue;
			const text = await res.text().catch(() => "");
			throw new Error(
				`${opts.method ?? "GET"} ${path} failed ${res.status}: ${text.slice(0, 500)}`,
			);
		}
		return res;
	}
	throw lastErr;
}

async function getUsersAuthRule(token) {
	const res = await api(token, "/api/collections/users");
	const json = await res.json().catch(() => ({}));
	return json.authRule ?? null;
}

async function assertUsersAuthRule(token) {
	const current = await getUsersAuthRule(token);
	if (!authRuleNeedsFix(current)) {
		console.log(`[pb-init] users authRule verified: ${JSON.stringify(EXPECTED_AUTH_RULE)}`);
		return;
	}
	console.log(`[pb-init] users authRule is ${JSON.stringify(current)} — patching`);
	await api(token, "/api/collections/users", {
		method: "PATCH",
		body: JSON.stringify({ authRule: EXPECTED_AUTH_RULE }),
	});
	const after = await getUsersAuthRule(token);
	if (authRuleNeedsFix(after)) {
		throw new Error(`users authRule still ${JSON.stringify(after)} after PATCH — failing closed`);
	}
	console.log(`[pb-init] users authRule patched and re-verified`);
}

async function applyMailSettings(token) {
	const resolved = resolveSmtpConfig(process.env);
	if (resolved.mode === "skip") {
		console.log("[pb-init] PB_SMTP_PASSWORD unset — skipping SMTP settings (local/test default)");
		return;
	}
	const payload = buildSettingsPayload(resolved);
	await api(token, "/api/settings", { method: "PATCH", body: JSON.stringify(payload) });
	console.log(
		`[pb-init] SMTP settings applied: ${JSON.stringify(redactSecrets({ smtp: { host: payload.smtp.host, port: payload.smtp.port, username: payload.smtp.username, password: payload.smtp.password }, meta: payload.meta }))}`,
	);
}

async function main() {
	console.log(`[pb-init] starting — url=${POCKETBASE_URL}`);
	await waitForHealth();
	const token = await authenticate();
	await importCollections(token);
	await assertUsersAuthRule(token);
	await applyMailSettings(token);
	console.log("[pb-init] done");
}

main().catch((e) => {
	console.error("[pb-init] fatal:", e.message);
	process.exit(1);
});
