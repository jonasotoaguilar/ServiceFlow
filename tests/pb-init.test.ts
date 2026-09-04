import { describe, it, expect } from "vitest";
import {
	EXPECTED_AUTH_RULE,
	SMTP_HOST,
	SMTP_USERNAME,
	SMTP_PORT,
	SMTP_TLS,
	SMTP_AUTH_METHOD,
	SENDER_NAME,
	SENDER_ADDRESS,
	DEFAULT_APP_URL,
	authRuleNeedsFix,
	shouldRetryRequest,
	resolveSmtpConfig,
	buildSettingsPayload,
	redactSecrets,
} from "../scripts/pb-init.lib.mjs";

describe("pb-init authRule assertion", () => {
	it("flags missing authRule for PATCH", () => {
		expect(authRuleNeedsFix("")).toBe(true);
	});
	it("flags null authRule for PATCH", () => {
		expect(authRuleNeedsFix(null)).toBe(true);
	});
	it("accepts the verified-only rule without PATCH", () => {
		expect(authRuleNeedsFix(EXPECTED_AUTH_RULE)).toBe(false);
	});
	it("flags a different rule for PATCH", () => {
		expect(authRuleNeedsFix("verified = false")).toBe(true);
	});
});

describe("pb-init retry policy", () => {
	it("retries network errors", () => {
		expect(shouldRetryRequest({ status: 0, networkError: true })).toBe(true);
	});
	it("fails immediately on 400", () => {
		expect(shouldRetryRequest({ status: 400, networkError: false })).toBe(false);
	});
	it("fails immediately on 401", () => {
		expect(shouldRetryRequest({ status: 401, networkError: false })).toBe(false);
	});
	it("fails immediately on 404", () => {
		expect(shouldRetryRequest({ status: 404, networkError: false })).toBe(false);
	});
	it("fails immediately on 500 without retry", () => {
		expect(shouldRetryRequest({ status: 500, networkError: false })).toBe(false);
	});
});

describe("pb-init SMTP config resolution", () => {
	it("skips SMTP when PB_SMTP_PASSWORD is entirely absent", () => {
		expect(resolveSmtpConfig({})).toEqual({ mode: "skip" });
	});
	it("skips SMTP when PB_SMTP_PASSWORD is empty (compose interpolation artifact)", () => {
		expect(resolveSmtpConfig({ PB_SMTP_PASSWORD: "" })).toEqual({ mode: "skip" });
	});
	it("applies Resend SMTP constants with default app URL", () => {
		const resolved = resolveSmtpConfig({ PB_SMTP_PASSWORD: "re_test_key" });
		expect(resolved.mode).toBe("apply");
		if (resolved.mode !== "apply") throw new Error("expected apply");
		expect(resolved.appURL).toBe(DEFAULT_APP_URL);
		const payload = buildSettingsPayload(resolved);
		expect(payload.smtp).toMatchObject({
			enabled: true,
			host: SMTP_HOST,
			port: SMTP_PORT,
			username: SMTP_USERNAME,
			authMethod: SMTP_AUTH_METHOD,
			tls: SMTP_TLS,
		});
		expect(payload.smtp.host).toBe("smtp.resend.com");
		expect(payload.smtp.username).toBe("resend");
		expect(payload.smtp.port).toBe(465);
		expect(payload.smtp.password).toBe("re_test_key");
		expect(payload.meta).toMatchObject({
			senderName: SENDER_NAME,
			senderAddress: SENDER_ADDRESS,
			appURL: DEFAULT_APP_URL,
		});
		expect(payload.meta.senderAddress).toBe("no-reply@serviceflow.jonasotoaguilar.space");
	});
	it("applies a valid app URL override", () => {
		const resolved = resolveSmtpConfig({
			PB_SMTP_PASSWORD: "re_test_key",
			PB_META_APP_URL: "https://staging.example.com",
		});
		expect(resolved.mode).toBe("apply");
		if (resolved.mode !== "apply") throw new Error("expected apply");
		expect(resolved.appURL).toBe("https://staging.example.com");
	});
	it("fails closed on whitespace-only password", () => {
		expect(() => resolveSmtpConfig({ PB_SMTP_PASSWORD: "   " })).toThrow();
	});
	it("fails closed on invalid app URL override", () => {
		expect(() =>
			resolveSmtpConfig({ PB_SMTP_PASSWORD: "re_test_key", PB_META_APP_URL: "not-a-url" }),
		).toThrow();
	});
});

describe("pb-init secret handling", () => {
	it("redacts the SMTP password from log objects", () => {
		const redacted = redactSecrets({ smtp: { password: "re_secret", host: SMTP_HOST } });
		expect(JSON.stringify(redacted)).not.toContain("re_secret");
		expect(redacted.smtp.host).toBe(SMTP_HOST);
	});
	it("redacts nested tokens without dropping safe fields", () => {
		const redacted = redactSecrets({ token: "abc123", status: 200 });
		expect(JSON.stringify(redacted)).not.toContain("abc123");
		expect(redacted.status).toBe(200);
	});
});
