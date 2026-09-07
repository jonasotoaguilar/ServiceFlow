import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readReleaseWorkflow(): string {
	return fs.readFileSync(path.join(process.cwd(), ".github/workflows/release.yml"), "utf8");
}

function readPublishHook(): string {
	return fs.readFileSync(path.join(process.cwd(), "scripts/release-publish"), "utf8");
}

describe("release.yml — native multi-arch without QEMU", () => {
	it("keeps job-level blank GITHUB_TOKEN in build and release jobs for least privilege", () => {
		const yml = readReleaseWorkflow();
		for (const job of ["build-amd64:", "build-arm64:", "release:"]) {
			const section =
				yml.split(new RegExp(`\\n\\s*${job}`))[1]?.split(/\n\s*\w[\w-]*:\s*\n\s*runs-on:/)[0] ?? "";
			expect(section).toMatch(/GITHUB_TOKEN:\s*""/);
		}
		expect(yml).toMatch(
			/Run release publication hook[\s\S]*?GH_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/,
		);
	});

	it("builds natively per arch with no QEMU emulation", () => {
		const yml = readReleaseWorkflow();
		expect(yml).not.toContain("docker/setup-qemu-action");
		expect(yml).toMatch(/build-amd64:[\s\S]*?runs-on:\s*ubuntu-24\.04\n/);
		expect(yml).toMatch(/build-arm64:[\s\S]*?runs-on:\s*ubuntu-24\.04-arm\n/);
		const buildxCount = [...yml.matchAll(/uses:\s*docker\/setup-buildx-action@v4/g)].length;
		// build-amd64 + build-arm64 + release + verify
		expect(buildxCount).toBe(4);
		expect(yml).toMatch(/RELEASE_ARCH:\s*amd64/);
		expect(yml).toMatch(/RELEASE_ARCH:\s*arm64/);
	});

	it("binds manifest publication to both arches within the 45 minute outer limit", () => {
		const yml = readReleaseWorkflow();
		const releaseSection = yml.split(/\n\s*verify:/)[0]?.split(/\n {2}release:/)[1] ?? "";
		expect(releaseSection).toMatch(/timeout-minutes:\s*45/);
		expect(yml).toMatch(/needs:\s*\[preflight,\s*build-amd64,\s*build-arm64\]/);
		expect(releaseSection).toMatch(/RELEASE_ARCH:\s*manifest/);
		const hook = readPublishHook();
		expect(hook).toContain("docker buildx imagetools create");
		expect(hook).toContain("gh release create");
		expect(hook).toContain("--verify-tag");
	});

	it("fails fast inside the outer limit on hangs", () => {
		const yml = readReleaseWorkflow();
		expect(yml).toMatch(/build-amd64:[\s\S]*?timeout-minutes:\s*30/);
		expect(yml).toMatch(/build-arm64:[\s\S]*?timeout-minutes:\s*30/);
		const hook = readPublishHook();
		expect(hook).toContain("timeout 20m docker buildx build");
		expect(hook).toContain("timeout 10m docker buildx imagetools create");
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
		expect(yml).toContain("docker/setup-buildx-action@v4");
		expect(yml).not.toContain("setup-qemu-action");
		const hook = readPublishHook();
		// four tags: vX.Y.Z, X.Y, X, latest
		expect(hook).toMatch(/for t in "\$RELEASE_TAG" "\$mm" "\$m" latest/);
		expect(hook).toContain("$RELEASE_TAG-amd64");
		expect(hook).toContain("$RELEASE_TAG-arm64");
	});
});
