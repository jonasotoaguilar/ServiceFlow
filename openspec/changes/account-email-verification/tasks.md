# Tasks: Account Email Verification

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–800 (session budget 800) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | authRule + init/SMTP | PR 1 | `pnpm test:run tests/schema-artifact.test.ts` | compose `pocketbase-init`, password unset | Phase 1 files |
| 2 | Server auth + verify | PR 2 | `pnpm test:run tests/auth-session.test.ts` | N/A — mocks, no SMTP | Phase 2 files |
| 3 | UI + E2E + docs | PR 3 | `pnpm test:run tests/auth-session.test.ts`; `pnpm test:e2e e2e/smoke.spec.ts` | Playwright; `markUserVerified`; no SMTP. Operator: user-env test-email `verification` | Phase 3 files |

feature-branch-chain: PR1 base=tracker; PR2=PR1; PR3=PR2. stacked-to-main: each → main. Do not choose.

Apply-time (research rev 2): live GET then PATCH+GET `authRule`; always set SMTP password from env; no DNS constants; no public token API.

## Phase 1: Artifact and init (PR 1)

- [x] 1.1 RED `tests/schema-artifact.test.ts`: `users.authRule === "verified = true"`; template `{APP_URL}/verify?token={TOKEN}`.
- [x] 1.2 GREEN those fields in `pocketbase/v1.collections.json`.
- [x] 1.3 `openspec/config.yaml`: server 0.40.1 vs SDK `pocketbase ^0.28.0`. Sequence register→verify→login on `openspec/changes/account-email-verification/design.md` (not N/A). `openspec/changes/account-email-verification/ui-design.md`: w-8 SVG in w-16 tile. (config+tile+diagram done)
- [x] 1.4 RED/GREEN `scripts/pb-init.mjs`: GET `authRule`; PATCH+GET if wrong; exit 1 if still wrong. Skip SMTP if `PB_SMTP_PASSWORD` unset; fail-closed if partial; always PATCH password from env (`smtp.resend.com`, `resend`, 465, tls, PLAIN). Sender/origin per design. Never log secrets.
- [x] 1.5 `PB_SMTP_PASSWORD` + optional `PB_META_APP_URL` on `pocketbase-init` only in `compose.yaml` and `.env.example` (never `app`).
- [x] 1.6 REFACTOR 1.4–1.5; `pnpm test:run tests/schema-artifact.test.ts`.

## Phase 2: Auth server (PR 2)

- [x] 2.1 RED `tests/auth-session.test.ts`: no register cookie/`authWithPassword`; `requestVerification`; login 400 unknown/unverified same error; resend `{ok:true}` after valid email; guard clears unverified; `/verify` strips token; missing token fails; never log token.
- [x] 2.2 GREEN `app/actions/auth.ts` no register auth/cookie, `requestVerification`, `resendVerification` (Zod else `{ok:true}`); `lib/auth.ts` fail-closed `verified !== true`; `app/verify/page.tsx` RSC consume token, never log, `redirect("/verify?status=ok|fail")` (do not catch `redirect`); bare path fail; already-verified ok.
- [x] 2.3 REFACTOR 2.2; `pnpm test:run tests/auth-session.test.ts`.

## Phase 3: UI, E2E, docs (PR 3)

- [ ] 3.1 RED: `registered=1` info callout; resend ack; keep existing `router.push`+`router.refresh`; register success `/login?registered=1`.
- [ ] 3.2 GREEN `app/login/page.tsx` pass `registered`; `components/auth/login-form.tsx` callout+resend ≥44px (keep dashboard router pair); `components/auth/register-form.tsx` `/login?registered=1` (keep refresh); `components/ui/alert.tsx` `role="alert"` `aria-live="polite"`. Copy from `openspec/changes/account-email-verification/ui-design.md` (read-only).
- [ ] 3.3 RED/GREEN `e2e/pb-admin.ts` `markUserVerified(email)`: superuser lookup + PATCH `/api/collections/users/{id}` `{verified:true}`. `e2e/smoke.spec.ts`: register → login callout, no cookie; unverified denied; mark verified → dashboard. No SMTP.
- [ ] 3.4 REFACTOR 3.2–3.3; `pnpm test:run`; `pnpm test:e2e e2e/smoke.spec.ts`.
- [ ] 3.5 `README.md` + `docs/CODEBASE-GUIDE.md`: verified-only + SMTP env; no bump/tag. Operator-only user-env test-email `{template:"verification"}`; not default suite.
