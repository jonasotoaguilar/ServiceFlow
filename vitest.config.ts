import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		exclude: [
			"e2e/**",
			"node_modules/**",
			"playwright-report/**",
			"test-results/**",
			".stryker-tmp/**",
		],
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage",
			include: ["**/lib/**", "**/app/**"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});
