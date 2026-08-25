# Tasks: migrate-appwrite-to-pocketbase

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2400–3600 across 16 implementation PRs + 2 planning nodes (~80–300 each after WU6 split; WU9 <30; WU10 mostly deletions; planning nodes <150). Provider budgets count additions + deletions of all files including pnpm-lock.yaml, tasks.md, and apply-progress.md. |
| 400-line budget risk | High (old WU6 rejected 864; split 6a–6d with headroom) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1a → PR 1b → planning (02-auth-split-plan) → PR 2a → PR 2b → PR 2c → PR 3 → PR 4 → PR 5 → planning (06-locations-write) → PR 6a → PR 6b → PR 6c → PR 6d → PR 7 → PR 8 → PR 9 → PR 10 (acceptance-gated) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High (old WU6 rejected 864; split 6a–6d)
```

No `size:exception`. If a child PR exceeds 400 provider lines (`additions + deletions` of all files including `pnpm-lock.yaml`, `tasks.md`, and `apply-progress.md`), split that WU further before opening the PR. `01b` owns the `pocketbase` dependency, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`. Do not merge WUs to “save” PRs. Planning-only `feat/migrate-appwrite-to-pocketbase-02-auth-split-plan` is a chain node before `…-02a-auth-core` but not an implementation task and not a size exception. Planning-only `feat/migrate-appwrite-to-pocketbase-06-locations-write` is a chain node before `…-06a-location-schemas` after maintainer reset of rejected monolithic WU6 (864 lines); not an implementation task and not a size exception. Old WU6 is split into 6a/6b/6c/6d with headroom, not 392-at-the-edge.

## Feature-branch chain (plan only — create no PRs in this phase)

Tracker (draft / no-merge into `main`): `feat/migrate-appwrite-to-pocketbase`  
This worktree is the sole allowed edit root and the intended tracker/integration branch.

```text
main
 └── feat/migrate-appwrite-to-pocketbase                         ← tracker PR (draft, do not merge)
      └── feat/migrate-appwrite-to-pocketbase-01a-env-schema     ← PR 1a base: tracker
           └── feat/migrate-appwrite-to-pocketbase-01b-filter-client ← PR 1b base: 01a
                └── feat/migrate-appwrite-to-pocketbase-02-auth-split-plan ← planning base: 01b (docs-only, no implementation task)
                     └── feat/migrate-appwrite-to-pocketbase-02a-auth-core ← PR 2a base: planning
                          └── feat/migrate-appwrite-to-pocketbase-02b-auth-actions ← PR 2b base: 02a
                               └── feat/migrate-appwrite-to-pocketbase-02c-janitor-notice ← PR 2c base: 02b
                                    └── …-03-locations-read                         ← PR 3 base: 02c
                                         └── …-04-services-read                     ← PR 4 base: 03
                                              └── …-05-services-write               ← PR 8 base: 04
                                                   └── …-06-locations-write         ← planning base: 05 (docs-only, no implementation task)
                                                        └── …-06a-location-schemas  ← PR 9 base: planning
                                                             └── …-06b-location-crud ← PR 10 base: 06a
                                                                  └── …-06c-movement-log ← PR 11 base: 06b
                                                                       └── …-06d-history-read ← PR 12 base: 06c
                                                                            └── …-07-docs-env           ← PR 13 base: 06d
                                                                                 └── …-08-prd-arch      ← PR 14 base: 07
                                                                                      └── …-09-hygiene  ← PR 15 base: 08
                                                                                           └── …-10-appwrite-removal  ← PR 16 base: 09; open only after acceptance
```

| Child | WU | Branch | Base | Starts at | Ends with | Provider budget | Rollback |
|-------|----|--------|------|-----------|-----------|-----------------|----------|
| PR 1 | 1a | `…-01a-env-schema` | tracker | Appwrite still compiled; no UI wiring | `lib/env.ts` + `pocketbase/v1.collections.json` + env/artifact tests | ~140 | revert PR 1a files |
| PR 2 | 1b | `…-01b-filter-client` | `…-01a` | Env + schema done | `lib/pocketbase.ts` + `lib/pocketbase-filter.ts` + filter/client tests + `pocketbase` dep/lockfile/workspace | ~271 | revert PR 1b files (owns pocketbase dep) |
| — | — | `feat/migrate-appwrite-to-pocketbase-02-auth-split-plan` | `…-01b` | 01b done, old WU2 forecast 574–737 | Planning docs: corrected WU2 forecast and pre-split into 2a/2b/2c | <100 (docs-only, not an implementation WU) | revert planning docs |
| PR 3 | 2a | `…-02a-auth-core` | planning `…-02-auth-split-plan` | 01b done, planning applied | `lib/pocketbase.ts` cookie helpers + `getAuthUser` + RED/GREEN/TRIANGULATE tests | <=300 | revert PR 3 files; Appwrite files remain |
| PR 4 | 2b | `…-02b-auth-actions` | `…-02a` | Cookie helpers + getAuthUser done | `app/actions/auth.ts` login/register/logout + error mapping/Zod ordering + tests | <=380 | revert PR 4 files |
| PR 5 | 2c | `…-02c-janitor-notice` | `…-02b` | Auth actions done | Root `proxy.ts` janitor + login/register empty-start banner + verification | <=250 | revert PR 5 files |
| PR 6 | 3 | `…-03-locations-read` | `…-02c` | Auth works | Empty tenant locations list | 150–220 | revert `getLocations` rewrite |
| PR 7 | 4 | `…-04-services-read` | `…-03` | Locations read done | GET envelope + LIKE search | 220–320 | revert `getServices` / GET route |
| PR 8 | 5 | `…-05-services-write` | `…-04` | List works | Service CRUD, no UUID | 250–350 | revert write path |
| — | — | `feat/migrate-appwrite-to-pocketbase-06-locations-write` | `…-05` | WU5 done, old WU6 failed at 864 | Planning docs: split WU6 into 6a/6b/6c/6d | <150 (docs-only, not an implementation WU) | revert planning docs |
| PR 9 | 6a | `…-06a-location-schemas` | planning `…-06-locations-write` | Planning applied | `lib/schemas.ts` LocationCreate/Update + compact schema tests | 80–160 | revert `lib/schemas.ts` + schema tests |
| PR 10 | 6b | `…-06b-location-crud` | `…-06a` | Schemas done | Location create/update/toggle/delete + guards | 180–280 | revert `app/actions/locations.ts` writes |
| PR 11 | 6c | `…-06c-movement-log` | `…-06b` | Location CRUD done | Movement-log create in `updateService` only | 80–160 | revert `lib/storage.ts` movement create |
| PR 12 | 6d | `…-06d-history-read` | `…-06c` | Movement create done | `getLocationLogs` envelope/sort/filter | 160–280 | revert `app/actions/logs.ts` |
| PR 13 | 7 | `…-07-docs-env` | `…-06d` | Product path done | `.env.example` / README / guide | 200–350 | revert those docs |
| PR 14 | 8 | `…-08-prd-arch` | `…-07` | Setup docs done | `PRD.md` + `ARCHITECTURE.md` | 250–380 | revert those two files |
| PR 15 | 9 | `…-09-hygiene` | `…-08` | Contracts done | `check_or.ts` + `lint_output.txt` gone | <30 | restore the two files |
| PR 16 | 10 | `…-10-appwrite-removal` | `…-09` | **Acceptance recorded** | Appwrite code/deps/janitor gone | deletions | last Appwrite-backed image + untouched cloud project |

**Tracker integration:** child PR 1 targets the tracker. Later children target the immediate parent branch (including planning → 02a → 02b → 02c and planning `…-06-locations-write` → 06a → 06b → 06c → 06d). After a child is reviewed, integrate it into the tracker by merging that child into its base (or fast-forwarding the tracker through the stack). Keep the tracker draft until PR 16 is integrated. Open PR 16 only after the parent acceptance gate. Merge the tracker to `main` only after PR 16 (or after PR 15 if acceptance is deferred; then PR 16 is a follow-up on `main` still using this chain). Apply creates branches/PRs; this file does not. Planning PRs `…-02-auth-split-plan` and `…-06-locations-write` are intermediate docs-only chain nodes, not implementation WUs.

**Out of every child PR:** CI workflows, Husky, lint-staged, Dependabot, `CODEOWNERS`, root `SECURITY.md`, `DESIGN.md` / `design/DESIGN.md`, PocketBase hosting/Dokploy compose, admin secret names, data/user import.

**Secrets:** never request, print, or commit PocketBase/Appwrite secret values. Record only presence and target identity (`POCKETBASE_URL` host, e.g. local `http://127.0.0.1:8090` vs “Dokploy PocketBase”).

**Empty start:** no import, dual-write, password migration, or id-mapping tasks.

**TDD:** `strict_tdd: true`. Runner `pnpm test:run` (Vitest). Production PocketBase and Appwrite are never contacted from tests. Mock `createPocketBaseClient` or `vi.mock("pocketbase")`. Sequence every behavior as RED → GREEN → TRIANGULATE → REFACTOR.

**Quality gates:** each code PR runs its focused Vitest file(s) then `pnpm test:run`. Typecheck `pnpm exec tsc --noEmit` and lint `pnpm run lint` on PRs 1a, 1b, 2a–2c, 3–5, 6a–6d and 16. `pnpm run build` at PR 6 (first slice, WU3), PR 12 (product complete, WU6d), and PR 16.

---

## 1. WU1a / PR 1 — Env + schema artifact (before auth, no pocketbase dep)

**Depends on:** nothing. **Specs:** `pocketbase-schema`, `pocketbase-access` (URL only). **Do not** rewrite `lib/auth.ts`, `app/actions/*`, UI, or delete Appwrite. Provider budgets count all files including `pnpm-lock.yaml`, `tasks.md`, and `apply-progress.md`; this PR does not own the `pocketbase` dependency.

### 1.1 Env URL — RED → GREEN → TRIANGULATE

- [x] RED: add `tests/env-pocketbase.test.ts` asserting `getPocketBaseUrl` from `lib/env.ts` throws when `POCKETBASE_URL` is missing/empty/non-absolute/`ftp:`; valid `http://127.0.0.1:8090` returns; process env is not read for any `POCKETBASE_ADMIN_*`, `NEXT_PUBLIC_APPWRITE_*`, or `APPWRITE_API_KEY`. `pnpm exec vitest run tests/env-pocketbase.test.ts` fails (module missing). <!-- sdd-owner: implementation -->
- [x] GREEN: add `lib/env.ts` with Zod `PocketBaseEnvSchema` and `getPocketBaseUrl()`. Fail closed; no default host. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: cover `https://` absolute URL success and whitespace-only failure. REFACTOR only if tests stay green. <!-- sdd-owner: implementation -->

### 1.2 Schema artifact — RED → GREEN → TRIANGULATE

- [x] RED: add `tests/schema-artifact.test.ts` that parses `pocketbase/v1.collections.json` and requires collections `users`, `services`, `locations`, `location_logs`; `locations.address` optional; `location_logs.userId` required; tenant rule string `userId = @request.auth.id` on all CRUD for the three business collections; `users` create public (`""`) and list/delete locked (`null`); no seed/business rows. Focused test fails (file missing). <!-- sdd-owner: implementation -->
- [x] GREEN: add hand-authored `pocketbase/v1.collections.json` matching design schema tables (text FKs, not relation fields; indexes listed in design). Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: assert required service/location/log field names and that the artifact creates no records. REFACTOR JSON only while tests stay green. <!-- sdd-owner: implementation -->

---

## 2. WU1b / PR 2 — Filter + request client (before auth, owns pocketbase dep)

**Depends on:** WU1a merged to its base (`…-01a-env-schema`). **Specs:** `pocketbase-access` (per-request client + filter). **Do not** rewrite `lib/auth.ts`, `app/actions/*`, UI, or delete Appwrite. This PR owns the `pocketbase` dependency, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`; provider budgets count all files.

### 2.1 Filter builder — RED → GREEN → TRIANGULATE

- [x] RED: add `tests/pocketbase-filter.test.ts` for `serviceListBinding`, `locationListBinding`, `logListBinding` in `lib/pocketbase-filter.ts`. Search containing `||` / quotes must not change the template; raw string lives in params; status tokens allowlisted to `pending|ready|completed|cancelled`; `applyBinding` is the only `pb.filter` call site. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: implement `lib/pocketbase-filter.ts` with compile-time constant templates and `{:uid}`, `{:search}`, `{:stN}`, `{:locationId}`, `{:lid}` params. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: compose search + status + location; only-active location binding; log from/to `locationId` and date bounds. REFACTOR duplication without interpolating search. <!-- sdd-owner: implementation -->

### 2.2 Request client — RED → GREEN → TRIANGULATE

- [x] RED: add `tests/pocketbase-client.test.ts` for `createPocketBaseClient` in `lib/pocketbase.ts`: new instance per call; `await cookies()` (never sync); hydrates only `pb_auth` via `authStore.save(token, record)` after JSON parse; malformed/`session`-only → unauthenticated and no throw; constructor uses `getPocketBaseUrl()`. Mock cookies + PocketBase ctor. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: `pnpm add pocketbase` and implement `createPocketBaseClient()`. No module-scope client. No `loadFromCookie` on the full Cookie header. No admin login. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: both cookies present → identity from `pb_auth` only; missing URL still fails closed without treating the caller as authenticated. REFACTOR helpers without a singleton. <!-- sdd-owner: implementation -->

### 2.3 WU1 verification

- [x] Run `pnpm exec vitest run tests/env-pocketbase.test.ts tests/schema-artifact.test.ts tests/pocketbase-filter.test.ts tests/pocketbase-client.test.ts tests/schemas.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Appwrite path still compiles. Runtime harness: N/A (no UI wiring). <!-- sdd-owner: implementation -->

---

## 3. WU2a / PR 3 — Auth core: cookie helpers + getAuthUser

**Depends on:** WU1b merged to its base and planning `feat/migrate-appwrite-to-pocketbase-02-auth-split-plan` applied (planning docs-only). **Specs:** `auth-session`, `pocketbase-access` (cookie flags, ignore/clear `session`). **Do not** rewrite storage or data pages yet. Old WU2 forecast 574–737 split pre-emptively; this slice guarantees headroom at <=300 provider lines.

### 3.1 Cookie helpers + getAuthUser — RED → GREEN → TRIANGULATE (server-validated)

- [x] RED: add `tests/auth-session.test.ts` cases: `getAuthUser` server-validates via `authRefresh` (or equivalent) after hydrating `pb_auth`; forged `pb_auth` with future `exp`/tampered victim `id`/invalid signature → `null` (route `401`), missing/malformed/`session`-only → `null`, `authRefresh` failure/unreachable → `null` fail-closed with no Appwrite admin query; valid refresh uses refreshed record. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: implement `saveAuthCookie`, `clearAuthCookie`, `clearLegacySessionCookie` on `lib/pocketbase.ts` (`await cookies()`, `httpOnly`, `sameSite=lax`, `path=/`, `secure` iff `NODE_ENV === "production"`, `expires` from JWT `exp` when parseable). Rewrite `getAuthUser` to hydrate then `await pb.authRefresh()` before returning identity; on success return refreshed record, on forged/invalid/unreachable fail closed; never log cookie values; never query Appwrite. Focused cases pass. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: forged future-exp/tampered record → `null` via `authRefresh` `401`; unreachable/transport → `null` fail-closed; expired/invalid store still `null`; shared cookie name constants. REFACTOR while green; no cache. <!-- sdd-owner: implementation -->

---

## 4. WU2b / PR 4 — Auth actions: login / register / logout

**Depends on:** WU2a (`…-02a-auth-core`). **Specs:** `auth-session`, `pocketbase-access` (cookie flags). **Do not** rewrite storage or data pages yet. Provider budget <=380.

### 4.1 Login / register / logout — RED → GREEN → TRIANGULATE

- [x] RED: extend `tests/auth-session.test.ts` so `login` / `register` / `logout` in `app/actions/auth.ts` call `loginSchema` / `registerSchema` from `lib/schemas.ts` **before** any PocketBase mock; invalid input does not call `authWithPassword` / `collection("users").create`; bad credentials → `Credenciales inválidas` for unknown email and wrong password; duplicate register → `No se pudo crear la cuenta. El correo puede estar en uso.`; transport → generic `Error al iniciar sesión` / `Error al registrarse` with no PB text; success writes `pb_auth` and deletes `session`; register uses `passwordConfirm: password` then `authWithPassword`; logout deletes `pb_auth` + `session` and `redirect("/login")`. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite `app/actions/auth.ts` (delete `createPublicClient` / `node-appwrite`). Result shape stays `{ success: true } | { error: string }`. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: Appwrite-only credentials with no PB user → same invalid-credentials result; Zod failures distinguishable from credential failures. REFACTOR error mapper. <!-- sdd-owner: implementation -->

---

## 5. WU2c / PR 5 — Janitor, empty-start notice, verification

**Depends on:** WU2b (`…-02b-auth-actions`). **Specs:** `auth-session`, `pocketbase-access` (cookie flags, ignore/clear `session`). **Do not** rewrite storage or data pages yet. Provider budget <=250.

### 5.1 Root cookie janitor — RED → GREEN

- [x] RED: add janitor cases in `tests/auth-session.test.ts` for root `proxy.ts` (`export function proxy`, never `app/proxy.ts`): if request has `session`, expire it (`Max-Age=0`, `path=/`) and `NextResponse.next()`; MUST NOT rewrite/proxy to Appwrite, read `pb_auth`, authenticate, or forward arbitrary paths. Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and image extensions. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: replace Appwrite rewrite in root `proxy.ts` with the session-only janitor + design matcher. Login/register/logout still delete `session` as defense in depth. Focused test passes. <!-- sdd-owner: implementation -->

### 5.2 Empty-start notice

- [x] RED: extend `tests/auth-session.test.ts` (or a focused page test) so `/login` and `/register` render exactly: `Este entorno PocketBase comienza vacío. Los tickets y sedes anteriores de Appwrite no aparecerán.` and expose no import/reset/restore control. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: add the static Spanish banner on `app/login/page.tsx` and `app/register/page.tsx` only. TRIANGULATE: notice is communication, not a wizard. <!-- sdd-owner: implementation -->

### 5.3 WU2c verification

- [x] Run `pnpm exec vitest run tests/auth-session.test.ts tests/env-pocketbase.test.ts tests/pocketbase-client.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Runtime: if local PB at `http://127.0.0.1:8090` already has the artifact applied out of band, register → notice → login → logout; otherwise record N/A (operator apply is a parent task). Do not flip production `POCKETBASE_URL`. <!-- sdd-owner: implementation -->

---

## 6. WU3 / PR 6 — Locations read only (first product slice)

**Depends on:** WU2c (`…-02c-janitor-notice`). **Specs:** `locations-history` (tenant list + only-active), `auth-session` (page gate). **Do not** add location mutations or logs.

### 6.1 getLocations — RED → GREEN → TRIANGULATE

- [x] RED: add list/tenant cases to `tests/locations-history.test.ts` for `getLocations` in `app/actions/locations.ts`: unauthenticated → `{ error: "No autenticado" }` and no PB write/list; bound `userId = {:uid}`; peer rows excluded unless the filter is wrong; `onlyActive=true` omits inactive; map PocketBase `id` (not `$id`). Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite **only** `getLocations` onto `createPocketBaseClient` + `locationListBinding` / `applyBinding`. Keep `app/locations/page.tsx` `getAuthUser` → `redirect("/login")` gate. Leave create/update/toggle/delete on Appwrite until WU6 if needed to compile; prefer extracting read without widening writes. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: `getLocations(false)` includes inactive; empty list is a success with `data: []`. REFACTOR mapping helper. <!-- sdd-owner: implementation -->

### 6.2 WU3 verification

- [x] Run `pnpm exec vitest run tests/locations-history.test.ts tests/auth-session.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build`. Runtime: notice → login → empty locations (local PB only if already applied). <!-- sdd-owner: implementation -->

---

## 7. WU4 / PR 7 — Services read + GET `/api/services`

**Depends on:** WU3. **Specs:** `services-lifecycle` (envelope, LIKE, tenant list), `auth-session` (401). **Do not** change POST/PUT/DELETE yet.

### 7.1 getServices adapter — RED → GREEN → TRIANGULATE

- [x] RED: add `tests/services-lifecycle.test.ts` list cases for `getServices` in `lib/storage.ts`: default `page=1` `limit=20`; `{ data, total, page, limit }`; empty match `{ data: [], total: 0, page, limit }`; sort `entryDate` / `-entryDate`; bound search on `clientName` / `invoiceNumber` / `rut`; template invariant under metacharacters; status allowlist + `locationId`; two-user isolation via bound `uid`. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite `getServices` to `getList` + `serviceListBinding` / `applyBinding`. Map known fields (`id`, not `$id`). Batched location name join with bound `id = {:id0} || ...`; skip fetch when id set empty. Keep export name. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: page 2 of 25; search + status + location compose. REFACTOR picker `mapToService` off Appwrite `$id`. <!-- sdd-owner: implementation -->

### 7.2 GET route

- [x] RED: unauthenticated `GET` `/api/services` in `app/api/services/route.ts` returns `401 { error: "Unauthorized" }` (no details leak). Focused test fails if not already covered. <!-- sdd-owner: implementation -->
- [x] GREEN: keep GET query params (`page`, `limit`, `search`, `status`, `location`, `sortOrder`) and pass `userId: user.id` from `getAuthUser` only. TRIANGULATE comma-separated status. <!-- sdd-owner: implementation -->

### 7.3 WU4 verification

- [x] Run `pnpm exec vitest run tests/services-lifecycle.test.ts tests/pocketbase-filter.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Runtime harness: N/A unless local PB already applied (empty list envelope). <!-- sdd-owner: implementation -->

---

## 8. WU5 / PR 8 — Service writes (create / update / delete)

**Depends on:** WU4. **Specs:** `services-lifecycle` (Zod boundary, native ids, status/dates, API errors). **Do not** implement movement-log create (WU6) except delete-logs-first order so service delete cannot orphan logs.

### 8.1 saveService signature + POST — RED → GREEN → TRIANGULATE

- [x] RED: extend `tests/services-lifecycle.test.ts`: `saveService(service: Omit<Service, "id">): Promise<Service>` in `lib/storage.ts` omits `id`; PocketBase assigns id; `userId` from `getAuthUser().id` not client; default `status=pending` and `entryDate=now` after Zod; `cancelled` without `cancellationDate` sets now; POST uses `ServiceSchema.safeParse` and on failure `400 { error: "Validation failed" }` with no write; unauthenticated POST `401 { error: "Unauthorized" }`. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: change `saveService`, delete `generateId` / `crypto.randomUUID()` from `app/api/services/route.ts`, return `201` with the created record. Collection optionality must not relax HTTP Zod. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: invalid `status` / missing `clientName` → 400 and no PB `create`. REFACTOR date defaults into one helper. <!-- sdd-owner: implementation -->

### 8.2 update + delete — RED → GREEN → TRIANGULATE

- [x] RED: stored `completed` is immutable (no PB `update`); ownership failure when stored `userId` ≠ current user; PUT/DELETE without id → `400`; unauthenticated → `401 { error: "Unauthorized" }`; unexpected errors generic (no PB text); delete matching `location_logs` by `ServiceId` **first**, abort if any log delete fails, then delete service. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite `updateService` / `deleteService` and PUT/DELETE in `app/api/services/route.ts`. Do not write movement logs yet. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: peer cannot update/delete; completed owner update fails without mutation. REFACTOR ownership helper. <!-- sdd-owner: implementation -->

### 8.3 WU5 verification

- [x] Run `pnpm exec vitest run tests/services-lifecycle.test.ts tests/schemas.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Confirm `tests/schemas.test.ts` still green. <!-- sdd-owner: implementation -->

---

## 9. WU6a / PR 9 — Location Zod schemas

**Depends on:** WU5 and planning `feat/migrate-appwrite-to-pocketbase-06-locations-write` applied (docs-only). **Specs:** `locations-history` (address, name bounds). **Do not** rewrite location actions, storage movement, or history reads. Provider budget 80–160. Base: this planning node.

### Suggested Work Units (WU6 split)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 6a | Location Zod schemas only | PR 9 | `pnpm exec vitest run tests/schemas.test.ts` | N/A — schema-only, no UI/runtime path | `lib/schemas.ts`, compact `tests/schemas.test.ts` cases |
| 6b | Location CRUD + guards | PR 10 | `pnpm exec vitest run tests/locations-history.test.ts tests/schemas.test.ts` | N/A unless local PB already applied (create only) | `app/actions/locations.ts` writes + compact write tests |
| 6c | Movement-log create | PR 11 | `pnpm exec vitest run tests/locations-history.test.ts tests/services-lifecycle.test.ts` | N/A — mocked `updateService` path | `lib/storage.ts` movement create + compact movement tests |
| 6d | History read envelope | PR 12 | `pnpm exec vitest run tests/locations-history.test.ts` | `pnpm run build`; local PB only if applied: create → move → history | `app/actions/logs.ts` + compact history tests |

### 9.1 Location Zod schemas — RED → GREEN → TRIANGULATE

- [x] RED: extend `tests/schemas.test.ts` for `LocationCreateSchema` / `LocationUpdateSchema` in `lib/schemas.ts`: name required after trim; update name 3–100; address optional, trimmed, max 200, blank → omitted. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: add the schemas. Existing `ServiceSchema` cases stay green. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: whitespace-only address and oversized address. REFACTOR only while green. <!-- sdd-owner: implementation -->

### 9.2 WU6a verification

- [x] Run `pnpm exec vitest run tests/schemas.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Runtime harness: N/A (schema-only). <!-- sdd-owner: implementation -->

## 10. WU6b / PR 10 — Location CRUD + guards

**Depends on:** WU6a (`…-06a-location-schemas`). **Specs:** `locations-history` (normalize, active, delete guard, ownership). **Do not** implement movement-log create or `getLocationLogs`. Provider budget 180–280. Base: 06a.

### 10.1 Location writes — RED → GREEN → TRIANGULATE

- [x] RED: add compact write cases to `tests/locations-history.test.ts` for create/update/toggle/delete in `app/actions/locations.ts`: create `isActive=true`, server `userId`, optional address; `normalizeString` duplicate against **this user only**; update may keep own name; peer mutate fails; unauthenticated mutate writes nothing; delete blocked when any service `locationId` or log `fromLocationId`/`toLocationId` references it, same Spanish history-guard error; unused location deletes. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite remaining location actions onto PocketBase + Zod. Native ids (omit `id` on create). Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: accent-insensitive duplicate (`Ñuñoa`); same name allowed for another tenant; toggle does not delete history. REFACTOR duplicate check. <!-- sdd-owner: implementation -->

### 10.2 WU6b verification

- [x] Run `pnpm exec vitest run tests/locations-history.test.ts tests/schemas.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Runtime harness: N/A unless local PB already applied (location create only). <!-- sdd-owner: implementation -->

## 11. WU6c / PR 11 — Movement-log create on service update

**Depends on:** WU6b (`…-06b-location-crud`). **Specs:** `locations-history` (movement). **Do not** rewrite `getLocationLogs`. Provider budget 80–160. Base: 06b.

### 11.1 Movement logs — RED → GREEN → TRIANGULATE

- [x] RED: add compact movement cases in `tests/locations-history.test.ts` or `tests/services-lifecycle.test.ts`: `updateService` in `lib/storage.ts` creates `location_logs` with denormalized `userId`, `ServiceId`, `fromLocationId`, `toLocationId`, `changedAt=now` when `locationId` changes and the write is **not** the transition into `completed`; skip log when completing; no log when location unchanged. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: implement log create in the service update path only (ADR-6: update service, then create log; no invented rollback). Do not rewrite `getLocationLogs`. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: completing+location change skips log; unchanged location writes no log; non-complete location change writes one log. REFACTOR helper while green. <!-- sdd-owner: implementation -->

### 11.2 WU6c verification

- [x] Run `pnpm exec vitest run tests/locations-history.test.ts tests/services-lifecycle.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`. Runtime harness: N/A (mocked update path). <!-- sdd-owner: implementation -->

## 12. WU6d / PR 12 — History read envelope

**Depends on:** WU6c (`…-06c-movement-log`). **Specs:** `locations-history` (history list). **Do not** widen location CRUD or movement create. Provider budget 160–280. Base: 06c. Product-complete build gate.

### 12.1 getLocationLogs — RED → GREEN → TRIANGULATE

- [x] RED: add compact history cases to `tests/locations-history.test.ts` for `getLocationLogs` in `app/actions/logs.ts`: requires auth, binds `userId`, `{ data, total, page, limit }`, sort `-changedAt`, optional from/to `locationId` and date bounds; peer logs excluded. Focused test fails. <!-- sdd-owner: implementation -->
- [x] GREEN: rewrite `getLocationLogs` via `logListBinding`. Keep `app/locationLogs/page.tsx` and `app/dashboard/page.tsx` auth redirects. Focused test passes. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: from-or-to filter; unauthenticated history returns error without `data`. REFACTOR log mapping. <!-- sdd-owner: implementation -->

### 12.2 WU6d verification

- [x] Run `pnpm exec vitest run tests/locations-history.test.ts tests/services-lifecycle.test.ts tests/schemas.test.ts`, then `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build`. Runtime (local PB only if applied): location create → service create/search → move → history → second user sees nothing. <!-- sdd-owner: implementation -->

## 13. WU7 / PR 13 — Docs / env contracts (before Appwrite deletion)

**Depends on:** WU6d. **Specs:** `project-contracts` (env, README, CODEBASE-GUIDE). **Do not** delete Appwrite code.

- [x] Set `.env.example` PocketBase runtime to only `POCKETBASE_URL=http://127.0.0.1:8090`. No secrets. No `POCKETBASE_ADMIN_*`. No `NEXT_PUBLIC_APPWRITE_*` or `APPWRITE_API_KEY` as active config. <!-- sdd-owner: implementation -->
- [x] Rewrite `README.md`: PocketBase is the live auth/data backend; local already-running instance at `127.0.0.1:8090`; explicit artifact apply; public self-registration; `pb_auth` httpOnly; tenant `userId` + schema rules; empty start; native 15-char ids; `{ data, total, page, limit }`; LIKE search; optional `address`. Remove Appwrite setup, `scripts/setup-appwrite.ts`, and API-key instructions. No container/Dokploy runbook. Appwrite only as historical rollback. <!-- sdd-owner: implementation -->
- [x] Add or rewrite `docs/CODEBASE-GUIDE.md` **only** (never a root `CODEBASE-GUIDE`): point at `lib/pocketbase.ts`, `lib/pocketbase-filter.ts`, `lib/env.ts`, `pocketbase/v1.collections.json`, `lib/auth.ts`, `lib/storage.ts`, `lib/schemas.ts`. MUST NOT present `lib/appwrite.ts` / `node-appwrite` as current instructions. MUST NOT document the old unauthenticated Appwrite rewrite as live. <!-- sdd-owner: implementation -->
- [x] Verify with ripgrep that in-scope docs contain no live Appwrite setup/API-key/`/api/proxy` rewrite claims. `pnpm test:run` still passes (docs-only). Runtime harness: N/A. <!-- sdd-owner: implementation -->

---

## 14. WU8 / PR 14 — PRD and ARCHITECTURE

**Depends on:** WU7. **Specs:** `project-contracts` (PRD + ARCHITECTURE). Keep this PR to those two files so it stays ≤400 lines.

- [x] Add/replace root `PRD.md` with PocketBase product behavior: tenant-scoped services/locations/history, public registration, temporary empty-start notice, no Appwrite import, LIKE search, optional address, pagination envelope. <!-- sdd-owner: implementation -->
- [x] Add/replace root `ARCHITECTURE.md`: only data/auth backend is PocketBase; Next.js uses `POCKETBASE_URL` + user session; request-scoped client; schema apply explicit/out of band; no hosting in this repo; no dual-write or `session` compatibility. <!-- sdd-owner: implementation -->
- [x] Grep both files: Appwrite mentions are historical/rollback only; no live proxy rewrite; governance files not edited. `pnpm test:run`. Runtime harness: N/A. <!-- sdd-owner: implementation -->

---

## 15. WU9 / PR 15 — Neutral hygiene (Appwrite still present)

**Depends on:** WU8. **Do not** delete `lib/appwrite.ts`, SDKs, setup script, or the janitor.

- [x] Delete `check_or.ts` and `lint_output.txt` only. Confirm `git diff --stat` is those paths. `pnpm test:run`. Runtime harness: N/A (deletion). <!-- sdd-owner: implementation -->

---

## 16. WU10 / PR 16 — Appwrite removal — two chained draft/no-merge slices before production gates (dev before production; WU10b carries final proof)

**Depends on:** WU9 integrated. **Dev candidates (A):** WU10a and WU10b may start now as draft/no-merge PRs chained `…-09-hygiene` → WU10a → WU10b with no prod gate. **Final merge/deploy (B):** gated by production artifact/Dokploy/smoke/explicit acceptance (section 17 B). Prod gate MUST NOT block code edits or local/CI verification. **Do not** delete the Appwrite cloud project. WU10b retains final `rg` + local/CI proof.

- [ ] (A) Dev candidates — may start now (no prod gate): open draft/no-merge PRs WU10a (janitor/session/tests) and WU10b (Appwrite client/setup/deps/lock + final proof) chained from `…-09-hygiene`; acceptance (section 17 B) only gates final merge/deploy, not code edits or local/CI. <!-- sdd-owner: implementation -->
- [x] (A) WU10a — legacy session janitor + compatibility path (≤300): delete `proxy.ts`; remove `LEGACY_SESSION_COOKIE*` / `clearLegacySessionCookie` from `lib/pocketbase.ts`; remove calls/imports from `app/actions/auth.ts`; delete entire obsolete proxy janitor test block from `tests/auth-session.test.ts`; retain meaningful auth assertions that login/register/logout no longer clear legacy session while `PB_AUTH` behavior remains; zero `describe.skip`/`it.skip`, zero `expect(true)`, zero dummy proxy/`any`, zero file-existence scaffolding. <!-- sdd-owner: implementation -->
- [x] (A) WU10b — Appwrite client/setup/deps/lock (deferred, draft/no-merge after WU10a): remove `lib/appwrite.ts`, `scripts/setup-appwrite.ts`, `appwrite`/`node-appwrite` from `package.json` + `pnpm-lock.yaml` refresh; Appwrite client/setup/dependencies remain until this slice. <!-- sdd-owner: implementation -->
- [x] (A) Final grep/local-CI proof after WU10b (local/CI, no prod gate): `rg` `lib/`/`app/`/`components/`/`.env.example`/docs for `node-appwrite`/`NEXT_PUBLIC_APPWRITE`/`APPWRITE_API_KEY`/`SESSION_COOKIE`/live setup — only historical rollback notes remain; `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build` (mocked suite) — deterministic; (B) final merge/deploy only after section 17 B. <!-- sdd-owner: implementation -->

---

## 17. Parent / operator / lifecycle gates — (A) dev vs (B) production final gate

Group after implementation. Create no PRs and collect no secret values in the tasks phase. Bounded review stays opt-in. **(A) Dev:** WU10 dev candidate (draft/no-merge + local/CI) MAY proceed without (B). **(B) Production final gate:** local/production artifact + Dokploy/smoke/explicit acceptance — ONLY before final WU10 merge/deploy, NOT before WU10 code edits or local/CI.

- [ ] After each integrated child PR (1a, 1b, 2a, 2b, 2c, 3–5, 6a–6d, 7–10), start or reuse bounded review for that slice only. <!-- sdd-owner: parent -->
- [x] At apply start: create draft/no-merge tracker PR from `feat/migrate-appwrite-to-pocketbase` → `main`, then open child PRs in order. WU10 draft may open after WU9 without acceptance; final WU10 merge stays acceptance-gated. <!-- sdd-owner: parent -->
- [ ] (B) Operator (local, out of band — final gate only, not WU10 dev prerequisite): apply `pocketbase/v1.collections.json` via Admin UI import/transcription. Verify design checklist (four collections, optional `address`, required log `userId`, zero rows, tenant rules, public create, guest denied). Do not flip prod URL. Record “local artifact applied: yes/no”. <!-- sdd-owner: parent -->
- [ ] (B) Operator (production — final gate only): apply same artifact to existing Dokploy PocketBase, verify same checklist, record target identity only (no URL secret). `POCKETBASE_URL` flip is separate later step. <!-- sdd-owner: parent -->
- [ ] (B) Operator — final gate only: confirm prod env `POCKETBASE_URL` presence (set/not set) and absence of Appwrite/`POCKETBASE_ADMIN_*` names; never store URL/secret values. <!-- sdd-owner: parent -->
- [ ] (B) Operator smoke — final gate only (after deploy, not WU10 dev): register→notice→login→location→service→move→history→logout→second user isolation; on failure redeploy last Appwrite image. <!-- sdd-owner: parent -->
- [ ] (B) Acceptance gate — ONLY for final WU10 merge/deploy (WU10 dev+local/CI MAY proceed without it): record cutover accepted (yes/no) without secrets; deleting cloud project stays outside change. <!-- sdd-owner: parent -->
- [ ] Keep tracker draft until allowed terminal child is integrated; merge tracker only after chosen terminal slice (WU10 draft stays draft until (B) passes). <!-- sdd-owner: parent -->
