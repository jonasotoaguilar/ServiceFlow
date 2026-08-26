import type { FullConfig } from "@playwright/test";

async function globalSetup(_config: FullConfig) {
	const pbHealth = "http://127.0.0.1:8090/api/health";
	const appLogin = "http://127.0.0.1:3000/login";
	try {
		const pbRes = await fetch(pbHealth);
		if (!pbRes.ok) throw new Error(`PocketBase health ${pbRes.status}`);
		const pbData = await pbRes.json().catch(() => null);
		if (pbData && pbData.code !== 200) throw new Error(`PocketBase health code ${pbData.code}`);
	} catch (e) {
		throw new Error(
			`Compose not ready: PocketBase unavailable at ${pbHealth}. Run: docker compose up --build -d --wait — ${String(e)}`,
		);
	}
	try {
		const appRes = await fetch(appLogin);
		if (!appRes.ok) throw new Error(`App /login ${appRes.status}`);
		const text = await appRes.text();
		if (!text.includes("Correo") && !text.includes("Bienvenido"))
			throw new Error("App /login missing expected content");
	} catch (e) {
		throw new Error(
			`Compose not ready: app unavailable at ${appLogin}. Run: docker compose up --build -d --wait — ${String(e)}`,
		);
	}
}

export default globalSetup;
