#!/usr/bin/env node
import fs from "node:fs";

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

async function main() {
	console.log(`[pb-init] starting — url=${POCKETBASE_URL}`);
	await waitForHealth();
	const token = await authenticate();
	await importCollections(token);
	console.log("[pb-init] done");
}

main().catch((e) => {
	console.error("[pb-init] fatal:", e.message);
	process.exit(1);
});
