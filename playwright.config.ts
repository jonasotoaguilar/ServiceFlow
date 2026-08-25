import { defineConfig, devices } from "@playwright/test";

// Compose must be up before running: docker compose up --build -d --wait
// App http://127.0.0.1:3000 and PocketBase http://127.0.0.1:8090
export default defineConfig({
	testDir: "./e2e",
	timeout: 90_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: "http://127.0.0.1:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	globalSetup: "./e2e/global-setup.ts",
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
