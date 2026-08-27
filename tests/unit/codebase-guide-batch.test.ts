import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readGuide(): string {
	return fs.readFileSync(path.join(process.cwd(), "docs/CODEBASE-GUIDE.md"), "utf8");
}

describe("CODEBASE-GUIDE batch enablement matrix — WU1 1.1 RED", () => {
	it("has an environment matrix for dev/staging/prod with Dashboard path and observed limits", () => {
		const guide = readGuide();
		// matrix must list all three environments
		expect(guide, "must list dev environment in matrix").toMatch(/\|\s*dev\s*\|/i);
		expect(guide, "must list staging environment in matrix").toMatch(/\|\s*staging\s*\|/i);
		expect(guide, "must list prod environment in matrix").toMatch(/\|\s*prod\s*\|/i);
		// dashboard path discovered via live 0.40.1 inspection
		expect(guide, "must document Dashboard path Settings → Application → Batch").toMatch(
			/Settings.*Application.*Batch/i,
		);
		// field names observed
		expect(guide, "must name batch.maxRequests field").toMatch(/maxRequests|Max requests/i);
		expect(guide, "must name batch.timeout field").toMatch(/Max processing time|timeout/i);
		expect(guide, "must name batch.maxBodySize field").toMatch(/Max body size|maxBodySize/i);
		// PocketBase version anchored
		expect(guide, "must anchor PocketBase 0.40.1").toMatch(/0\.40\.1/);
	});

	it("keeps uninspected values explicitly UNKNOWN and records observed dev state", () => {
		const guide = readGuide();
		// staging and prod are inaccessible — must remain UNKNOWN per spec, not fabricated
		expect(guide, "staging row must stay UNKNOWN where not observed").toMatch(
			/staging[\s\S]*?UNKNOWN/i,
		);
		expect(guide, "prod row must stay UNKNOWN where not observed").toMatch(/prod[\s\S]*?UNKNOWN/i);
		expect(guide, "must contain explicit UNKNOWN sentinel").toContain("UNKNOWN");
		// dev observed values: enabled false via live API
		expect(guide, "dev must document batch.enabled false as observed live").toMatch(
			/dev[\s\S]*?false/i,
		);
		// observation date required
		expect(guide, "must record observation date").toMatch(/2026-08-2[67]/);
	});

	it("documents 403 Batch requests are not allowed, forbids silent sequential fallback, and forbids 403 retry", () => {
		const guide = readGuide();
		expect(guide, "must document literal 403 message").toContain("Batch requests are not allowed");
		expect(guide, "must mention 403 status").toMatch(/\b403\b/);
		// forbids silent sequential fallback — spec requires MUST NOT fall back to sequential writes
		expect(guide, "must forbid silent sequential fallback (MUST NOT / never sequential)").toMatch(
			/MUST NOT[\s\S]*?sequential|never[\s\S]*?sequential|forbid[\s\S]*?sequential/i,
		);
		expect(guide, "must explicitly state no sequential fallback on 403").toMatch(/sequential/i);
		// must forbid retry on 403
		expect(guide, "must forbid retry on 403").toMatch(/MUST NOT[\s\S]*?retry|never[\s\S]*?retry/i);
	});

	it("names the operator runbook action and blocks batch sends where enablement is undocumented", () => {
		const guide = readGuide();
		expect(guide, "must describe operator runbook").toMatch(/runbook/i);
		expect(guide, "must name operator action").toMatch(/operator/i);
		// runbook must instruct Dashboard enablement using documented path
		expect(guide, "runbook must instruct enablement via Dashboard").toMatch(
			/Enable.*Dashboard|Dashboard.*Enable/i,
		);
		// must block batch where enablement undocumented / UNKNOWN
		expect(guide, "must block batch sends where enablement is UNKNOWN/undocumented").toMatch(
			/UNKNOWN[\s\S]*?MUST NOT[\s\S]*?batch|MUST NOT[\s\S]*?UNKNOWN[\s\S]*?batch|blocked where.*undocumented/i,
		);
	});

	it("does not invent Dashboard paths or limits for inaccessible envs (evidence gap recorded)", () => {
		const guide = readGuide();
		// evidence gap must be acknowledged — staging/prod remain UNKNOWN, not inferred
		expect(guide, "must record evidence gap for inaccessible envs").toMatch(
			/inaccessible|not observed|evidence gap|no trusted access/i,
		);
		// ensure we do not hallucinate numeric limits for staging/prod — check that UNKNOWN surrounds them
		const stagingSection = guide.match(/staging[\s\S]{0,300}/i)?.[0] ?? "";
		expect(
			stagingSection,
			"staging row must not contain fabricated 50/3 values without UNKNOWN",
		).toMatch(/UNKNOWN/i);
	});
});
