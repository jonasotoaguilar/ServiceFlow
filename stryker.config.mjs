// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	$schema: "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
	testRunner: "vitest",
	plugins: ["@stryker-mutator/vitest-runner"],
	coverageAnalysis: "perTest",
	mutate: ["lib/**/*.ts", "!lib/**/*.d.ts"],
	vitest: {
		configFile: "vitest.config.ts",
	},
	thresholds: { high: 80, low: 60, break: null },
	ignorePatterns: [
		".codegraph/**",
		".agents",
		".agents/**",
		".claude",
		".claude/**",
		".sdd",
		".sdd/**",
		".herdr",
		".herdr/**",
		".stryker-tmp/**",
		"coverage/**",
		"reports/**",
		".reports/**",
		"playwright-report/**",
		"test-results/**",
		".next/**",
	],

	reporters: ["progress", "clear-text", "html"],
	htmlReporter: { fileName: "reports/mutation/mutation.html" },
	timeoutMS: 10000,
	timeoutFactor: 1.5,
	concurrency: 4,
};
export default config;
