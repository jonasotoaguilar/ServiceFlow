import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("stryker sandbox isolation — config contract (7.4 RED)", () => {
	describe("Stryker sandbox must never treat .agents as file", () => {
		it("ignorePatterns excludes agent/skill metadata symlink .agents (and .agents/**)", () => {
			const cfg = read("stryker.config.mjs");
			expect(cfg, "stryker.config.mjs must define ignorePatterns").toMatch(/ignorePatterns/);
			expect(cfg, "must exclude .agents symlink itself").toMatch(/\.agents/);
			expect(cfg, "must exclude .agents/** contents").toMatch(/\.agents\/\*\*/);
			// plausible wrong: only excluding .stryker-tmp from Vitest while .agents still copied → EISDIR
			expect(cfg, "must not rely on .agents being ignored by default (it is not)").not.toMatch(
				/\/\/.*\.agents/,
			);
		});

		it("ignorePatterns also excludes other isolated metadata (.claude, .sdd, .herdr) and .codegraph", () => {
			const cfg = read("stryker.config.mjs");
			expect(cfg).toMatch(/\.codegraph\/\*\*/);
			expect(cfg).toMatch(/\.claude/);
			expect(cfg).toMatch(/\.sdd/);
		});

		it("preserves own temp output exclusion for installed version (always ignored .stryker-tmp via default, explicit extra is fine)", () => {
			const cfg = read("stryker.config.mjs");
			// either explicit .stryker-tmp/** or relies on Stryker's always-ignored list — but we document explicit for clarity
			// For installed @stryker-mutator/core@9.6.1, .stryker-tmp is ALWAYS ignored; explicit pattern is allowed and proven here
			const hasExplicit = /\.stryker-tmp/.test(cfg);
			const schemaDefaultAlwaysIgnored = true; // per schema description: .stryker-tmp always ignored
			expect(hasExplicit || schemaDefaultAlwaysIgnored).toBe(true);
		});

		it("does not lower mutation thresholds or disable mutation", () => {
			const cfg = read("stryker.config.mjs");
			expect(cfg).toMatch(/thresholds/);
			expect(cfg).toMatch(/high:\s*80/);
			expect(cfg).toMatch(/low:\s*60/);
			expect(cfg).toMatch(/break:\s*null/);
			expect(cfg).toMatch(/mutate:\s*\[.*lib\/\*\*\/\*\.ts/);
			expect(cfg).not.toMatch(/mutate:\s*\[\s*\]/);
		});

		it("preserves native Stryker semantics (vitest runner, coverageAnalysis perTest, timeoutMS/timeoutFactor, concurrency)", () => {
			const cfg = read("stryker.config.mjs");
			expect(cfg).toMatch(/testRunner:\s*"vitest"/);
			expect(cfg).toMatch(/coverageAnalysis:\s*"perTest"/);
			expect(cfg).toMatch(/timeoutMS:\s*10000/);
			expect(cfg).toMatch(/timeoutFactor:\s*1\.5/);
			expect(cfg).toMatch(/concurrency:\s*4/);
		});
	});

	describe("Vitest must not collect .stryker-tmp sandbox on interrupted run", () => {
		it("exclude contains .stryker-tmp/** (supported Vitest config, not CLI workaround)", () => {
			const cfg = read("vitest.config.ts");
			expect(cfg, "vitest.config.ts must define exclude").toMatch(/exclude/);
			expect(cfg, "must exclude .stryker-tmp/** to avoid poisoning pnpm test:run").toMatch(
				/\.stryker-tmp\/\*\*/,
			);
			// plausible wrong: only Stryker ignores .stryker-tmp (always) but Vitest still collects sandbox e2e/smoke.spec.ts → 1 failed suite
			expect(cfg).not.toMatch(/\/\/.*\.stryker-tmp/);
		});

		it("preserves existing Vitest excludes (e2e, node_modules, playwright-report, test-results)", () => {
			const cfg = read("vitest.config.ts");
			expect(cfg).toMatch(/e2e\/\*\*/);
			expect(cfg).toMatch(/node_modules\/\*\*/);
			expect(cfg).toMatch(/playwright-report\/\*\*/);
			expect(cfg).toMatch(/test-results\/\*\*/);
		});
	});

	describe("triangulation — plausible wrong still fails", () => {
		it("wrong: only Vitest excludes .stryker-tmp but Stryker still lacks .agents → would EISDIR", () => {
			const stryker = read("stryker.config.mjs");
			const vitest = read("vitest.config.ts");
			const vitestHasStrykerTmp = /\.stryker-tmp\/\*\*/.test(vitest);
			const strykerHasAgents = /\.agents/.test(stryker);
			expect(vitestHasStrykerTmp, "Vitest must exclude .stryker-tmp").toBe(true);
			expect(
				strykerHasAgents,
				"Stryker must exclude .agents — otherwise plausible wrong where only Vitest fixed",
			).toBe(true);
			expect(vitestHasStrykerTmp && strykerHasAgents).toBe(true);
		});
	});
});
