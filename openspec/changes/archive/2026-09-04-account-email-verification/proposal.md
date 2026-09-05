# Proposal: Account Email Verification

## Intent

Register issues a session with no email check. Every operational account must be verified before token issuance. PocketBase v0.40.1 `authRule: "verified = true"` is the gate (issue #108). No production users; no grandfathering.

## Scope

### In Scope
- Persist `authRule: "verified = true"` on `users`; live-check import representation
- Register: create unverified record, `requestVerification`, no authenticate/cookie, redirect `/login`
- Login callout: verification email sent; required before sign-in; enumeration-neutral login/resend
- `/verify`: consume `{TOKEN}` server-side, never log, confirm via PocketBase, redirect without token in URL
- PocketBase settings apply Resend SMTP from env (always set password); sender `ServiceFlow <no-reply@serviceflow.jonasotoaguilar.space>`; origin `https://serviceflow.jonasotoaguilar.space`
- Preserve `router.push`/`router.refresh` in login and register forms
- Live checks: per-enabled-method gating, settings apply, one staging verification email
- Tests without real SMTP except that send; admin-side E2E token setup
- Update README/release-facing docs if stale

### Out of Scope
- Version bump, tag, or publication
- Password-reset, MFA, or OAuth2 product work
- Hardcoded Resend DNS (provider-generated runtime inputs)
- User-supplied env except at runtime verification

## Capabilities

### New Capabilities
- `account-email-verification`: verified-only tokens, register/request/confirm/resend, callback, enumeration-neutral UX, SMTP/settings, fail-closed session guard

### Modified Capabilities
- None

## Approach

Exploration approach 1. Superuser `PATCH /api/settings` always sets SMTP from env. Template URL: `{APP_URL}` plus callback with `{TOKEN}`. `getAuthUser` rejects `verified !== true`. E2E mints tokens via superuser harness.

## Affected Areas

- `pocketbase/v1.collections.json`, `scripts/pb-init.mjs` — Modified: `authRule`; settings
- `app/actions/auth.ts`, `lib/auth.ts` — Modified: no register session; confirm/resend; fail-closed
- `app/verify/page.tsx` — New: server-side token consume
- Login/register pages and auth forms — Modified: callout, resend, `/login` redirect, preserve router
- `compose.yaml`, `.env.example`, README — Modified: SMTP env; docs
- `tests/auth-session.test.ts`, `e2e/smoke.spec.ts`, `e2e/pb-admin.ts` — Modified: unverified denial; confirm

## Risks

- Import drops `authRule` (Med): live import check
- Token in logs or URL (Med): server consume, no log, redirect
- Enumeration via login/resend (Low): neutral responses; PB 204
- SMTP deliverability (Med): one staging test-email
- Auth-rule change rotates tokens (Low): expected; no production users

## Rollback Plan

Restore empty `authRule`, revert app/tests/docs, disable SMTP. Token-secret rotation expected; re-login after rollback.

## Dependencies

PocketBase v0.40.1; Resend SMTP env at runtime verification; Resend DNS from dashboard/API; issue #108

## Success Criteria

- [ ] Unverified auth issues no token per enabled method
- [ ] Register never sets `pb_auth`; login shows verification callout
- [ ] Callback confirms without logging token or leaving it in URL
- [ ] Login/resend stay enumeration-neutral
- [ ] Import preserves `authRule`; settings apply from env
- [ ] Staging email sends; tests pass without SMTP except that check
- [ ] Stale README/release docs updated; no version bump or tag
