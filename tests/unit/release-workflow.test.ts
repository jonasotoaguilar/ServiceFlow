import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readReleaseWorkflow(): string {
	return fs.readFileSync(path.join(process.cwd(), ".github/workflows/release.yml"), "utf8");
}

describe("release.yml — GITHUB_TOKEN least-privilege with setup step inheritance", () => {
	it("keeps job-level blank GITHUB_TOKEN in release job for least privilege", () => {
		const yml = readReleaseWorkflow();
		// release job must still blank the token by default
		expect(yml).toMatch(/release:\s*\n[\s\S]*?env:\s*\n[\s\S]*?GITHUB_TOKEN:\s*""/);
		// only the publish hook opts back in via GH_TOKEN, not GITHUB_TOKEN
		expect(yml).toMatch(
			/Run release publication hook[\s\S]*?GH_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/,
		);
	});

	it("restores GITHUB_TOKEN per setup step in release job (QEMU + Buildx)", () => {
		const yml = readReleaseWorkflow();
		// extract release job section up to verify job
		const releaseSection = yml.split(/\n\s*verify:/)[0] ?? "";
		// both setup steps must have step-scoped env GITHUB_TOKEN: ${{ github.token }}
		const qemuBlock =
			/Set up QEMU[\s\S]*?uses:\s*docker\/setup-qemu-action@v4[\s\S]*?env:\s*\n[\s\S]*?GITHUB_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/;
		const buildxBlock =
			/Set up Docker Buildx[\s\S]*?uses:\s*docker\/setup-buildx-action@v4[\s\S]*?env:\s*\n[\s\S]*?GITHUB_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/;
		expect(releaseSection).toMatch(qemuBlock);
		expect(releaseSection).toMatch(buildxBlock);
		// ensure no blank-only setup remains (both must be token-scoped)
		const setupMatches = [
			...releaseSection.matchAll(/uses:\s*docker\/setup-(qemu|buildx)-action@v4/g),
		];
		expect(setupMatches.length).toBe(2);
	});

	it("restores GITHUB_TOKEN per setup step in verify job", () => {
		const yml = readReleaseWorkflow();
		const verifySection = yml.split(/\n\s*verify:/)[1] ?? "";
		expect(verifySection).toContain("Set up Docker Buildx");
		expect(verifySection).toMatch(
			/Set up Docker Buildx[\s\S]*?uses:\s*docker\/setup-buildx-action@v4[\s\S]*?env:\s*\n[\s\S]*?GITHUB_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/,
		);
		// verify job itself must not have a job-level blank GITHUB_TOKEN (read-only job)
		// it should not contain env: GITHUB_TOKEN: "" at job level
		const verifyJobHeader = verifySection.slice(0, 400);
		expect(verifyJobHeader).not.toMatch(/GITHUB_TOKEN:\s*""/);
	});

	it("preserves core release contract invariants", () => {
		const yml = readReleaseWorkflow();
		expect(yml).toContain("name: Release");
		expect(yml).toMatch(/on:\s*\n\s*push:\s*\n\s*tags:\s*\n\s*- "v\*"/);
		expect(yml).toContain("!v*-*");
		expect(yml).toContain("environment: release");
		expect(yml).toMatch(/permissions:\s*\n\s*contents:\s*read/);
		expect(yml).toContain("concurrency:");
		expect(yml).toContain("fetch-tags: true");
		expect(yml).toContain("persist-credentials: false");
		expect(yml).toContain("docker/setup-qemu-action@v4");
		expect(yml).toContain("docker/setup-buildx-action@v4");
	});
});
