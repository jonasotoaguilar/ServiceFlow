# Design: Account Email Verification

## Technical Approach

PocketBase v0.40.1 `users.authRule = "verified = true"` is the token gate. The app never writes `pb_auth` until that gate succeeds. Register creates the record and calls `requestVerification` only. `/verify` consumes `{TOKEN}` in an RSC and redirects clean. `getAuthUser` rejects `verified !== true`. SMTP/meta belong to `scripts/pb-init.mjs`. Spec: `specs/account-email-verification/spec.md`. ADR: `docs/adr/0001-verified-only-authrule.md`. UI: `ui-design.md`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Token gate | `authRule` vs app-only vs custom tokens | App-only is bypassable | `authRule: "verified = true"` + app guard |
| Settings owner | `pb-init` vs Next vs new job | App must not hold admin/SMTP secrets | Extend `scripts/pb-init.mjs` |
| Callback | RSC redirect vs client confirm vs `route.ts` | Token must leave the URL and logs | `app/verify/page.tsx` RSC |
| Register nav | `?registered=1` vs cookie flash | Extra cookie unnecessary | Keep `router.push`/`refresh`; `/login?registered=1` |
| SMTP apply | skip-if-absent vs always-fail | Default tests have no SMTP | Skip if password unset; fail-closed if partial |
| Import | JSON-only vs JSON + live GET/PATCH | Merge unsupported | Artifact + live assert; PATCH then re-GET if dropped |

## Data Flow

```
Register → users.create → requestVerification → {success:true} → /login?registered=1 (no cookie)
Login    → authWithPassword → authRule → token|400 → cookie only on token
Resend   → requestVerification → {ok:true} after valid email (all addresses identical)
Mail     → {APP_URL}/verify?token={TOKEN}
Verify   → confirmVerification(token) → 302 /verify?status=ok|fail (no token)
Guard    → authRefresh → verified===true else clear + null
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `pocketbase/v1.collections.json` | Modify | `authRule: "verified = true"`; template `{APP_URL}/verify?token={TOKEN}` |
| `scripts/pb-init.mjs` | Modify | Live-assert `authRule`; optional SMTP/meta PATCH |
| `compose.yaml` | Modify | SMTP/meta env on `pocketbase-init` only, never `app` |
| `.env.example` | Modify | `PB_SMTP_PASSWORD`; optional `PB_META_APP_URL` |
| `app/actions/auth.ts` | Modify | No register session; add `resendVerification` |
| `lib/auth.ts` | Modify | Fail closed when `verified !== true` |
| `app/verify/page.tsx` | Create | RSC consume + clean redirect |
| `app/login/page.tsx` | Modify | Await `searchParams`; pass `registered` |
| `components/auth/login-form.tsx` | Modify | Callout + resend; keep router pair |
| `components/auth/register-form.tsx` | Modify | Push `/login?registered=1`; keep router pair |
| `components/ui/alert.tsx` | Modify | `role="alert"` `aria-live="polite"` |
| `e2e/pb-admin.ts` | Modify | Superuser `markUserVerified(email)` |
| `e2e/smoke.spec.ts` | Modify | Register → login; verify then dashboard |
| `tests/auth-session.test.ts` | Modify | No register cookie; unverified login/guard; resend |
| `tests/schema-artifact.test.ts` | Modify | Assert `authRule` |
| `README.md`, `docs/CODEBASE-GUIDE.md` | Modify | Verified-only auth + SMTP env; no version bump |

## Interfaces / Contracts

```ts
login → { success: true } | { error: "Credenciales inválidas" | "Error al iniciar sesión" | string }
register → { success: true } | { error: string }  // never authWithPassword / saveAuthCookie
resendVerification → { ok: true } | { error: string }  // Zod only; else always ok
```

`pb-init` constants: host `smtp.resend.com`, user `resend`, port `465`, `tls: true`, `PLAIN`. Env-only `PB_SMTP_PASSWORD`. Meta: `ServiceFlow <no-reply@serviceflow.jonasotoaguilar.space>`; default app URL `https://serviceflow.jonasotoaguilar.space`. Skip settings if password unset; fail-closed on empty/partial. Retry network only, not 4xx. PATCH idempotent. After import `GET` users; if `authRule` wrong, `PATCH` + `GET`; exit 1 if still wrong. Never log secrets.

`/verify`: await `searchParams`; on `token`, `confirmVerification` in try/catch (do not catch `redirect`); never log token; `redirect("/verify?status=ok|fail")`. Bare `/verify` = fail. Already-verified token = success (PB 204).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | No register cookie; login 400 identical; resend `{ok:true}`; guard; token stripped; no secret logs; artifact `authRule` | Vitest mocks; `pnpm test:run` (no SMTP) |
| Integration | Router pair preserved; callout from `registered=1` | Testing Library |
| E2E | Register → login callout; `markUserVerified`; login → dashboard | Playwright + superuser PATCH |
| Staging | One `POST /api/settings/test/email` `{template:"verification"}` | Operator-only; user env; not default suite |

Password is the only enabled method.

## Threat Matrix

Next `/verify` is an app route, not a shell/VCS/process boundary. `pb-init` uses `fetch`.

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A: no executable-file classification | — | none |
| Git repository selection | N/A: no git cwd/path selection | — | none |
| Commit state | N/A: no commit automation | — | none |
| Push state | N/A: no push automation | — | none |
| PR commands | N/A: no PR automation | — | none |

## Migration / Rollout

No migration or grandfathering. Setting `authRule` rotates the users token secret; local re-login expected. No flag, version bump, tag, or publication.

## Open Questions

None.
