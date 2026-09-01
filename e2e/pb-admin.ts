import { test as base } from "@playwright/test";

const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "admin@local.test";
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "admin123456";

async function getAdminToken(): Promise<string> {
	const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
	});
	if (!res.ok) {
		throw new Error(`superuser auth failed ${res.status}`);
	}
	const data = (await res.json()) as { token?: string };
	if (!data.token) throw new Error("missing superuser token");
	return data.token;
}

async function listAll(
	token: string,
	collection: string,
	filter?: string,
): Promise<Array<{ id: string }>> {
	const perPage = 200;
	let page = 1;
	const all: Array<{ id: string }> = [];
	while (true) {
		const params = new URLSearchParams({ perPage: String(perPage), page: String(page) });
		if (filter) params.set("filter", filter);
		const res = await fetch(
			`${PB_URL}/api/collections/${collection}/records?${params.toString()}`,
			{
				headers: { Authorization: token },
			},
		);
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`list ${collection} failed ${res.status} ${text.slice(0, 200)}`);
		}
		const data = (await res.json()) as {
			items: Array<{ id: string }>;
			totalPages: number;
		};
		all.push(...data.items);
		if (page >= data.totalPages || data.items.length === 0) break;
		page += 1;
	}
	return all;
}

async function deleteRecord(token: string, collection: string, id: string): Promise<void> {
	const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
		method: "DELETE",
		headers: { Authorization: token },
	});
	if (!res.ok && res.status !== 404) {
		const text = await res.text().catch(() => "");
		throw new Error(`delete ${collection}/${id} failed ${res.status} ${text.slice(0, 200)}`);
	}
}

export async function cleanupE2EUsers(): Promise<void> {
	const token = await getAdminToken();
	const users = await listAll(token, "users", `email ~ "e2e-"`);
	if (users.length === 0) return;

	const userIds = users.map((u) => u.id);

	// Delete in order: service_events → services → locations → users
	for (const uid of userIds) {
		const logs = await listAll(token, "service_events", `userId = "${uid}"`);
		for (const r of logs) await deleteRecord(token, "service_events", r.id);
	}
	for (const uid of userIds) {
		const services = await listAll(token, "services", `userId = "${uid}"`);
		for (const r of services) await deleteRecord(token, "services", r.id);
	}
	for (const uid of userIds) {
		const locations = await listAll(token, "locations", `userId = "${uid}"`);
		for (const r of locations) await deleteRecord(token, "locations", r.id);
	}
	for (const u of users) {
		await deleteRecord(token, "users", u.id);
	}
}

// Fixture with teardown that always runs, even if test failed.
// Auto fixture ensures cleanup after each test without explicit use.
// biome-ignore lint/suspicious/noConfusingVoidType: Playwright fixture requires void
// biome-ignore lint/complexity/noBannedTypes: Playwright fixture empty object
export const test = base.extend<{}, { _pbCleanup: void }>({
	_pbCleanup: [
		// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires empty destructure
		async ({}, use) => {
			await use();
			try {
				await cleanupE2EUsers();
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`[pb-admin] cleanup failed: ${msg}`);
			}
		},
		{ auto: true, scope: "worker" },
	],
});

export const expect = base.expect;
