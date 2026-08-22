# Exploration: migrate-appwrite-to-pocketbase

**Change**: `migrate-appwrite-to-pocketbase`
**Date**: 2026-08-14
**Explorer**: sdd-explore (auto)
**Worktree**: `/home/jona/projects/serviceflow-worktrees/migrate-appwrite-to-pocketbase`
**Base**: `origin/main` SHA `3679f597361500b58dda3b7a57c978bafd179636` (clean, verified via superseded.md)
**Config**: `openspec/config.yaml` exists — stack Next.js 16 App Router / React 19 / TS 5.9 strict / Tailwind 4 / node-appwrite 14 / pnpm 11 / Vitest 4
**Mode**: execution_mode `auto`, artifact_store `openspec`, delivery_strategy `auto-chain`, review_budget 400 lines
**Prior change**: `remediate-audit-findings` superseded/cancelled at 16/26 (superseded.md), NOT archived; 6 PRs + issue #11 closed without merge. Directive: never copy its Appwrite migration code; re-evaluate only backend-neutral hygiene/governance as candidates.

## Official Sources Grounded

Per task pre-research, PocketBase approach is grounded in:
- https://pocketbase.io/docs/authentication
- https://pocketbase.io/docs/collections
- https://pocketbase.io/docs/api-rules-and-filters
- https://pocketbase.io/docs/go-migrations
- https://pocketbase.io/docs/going-to-production
- https://pocketbase.io/faq

Appwrite SSR baseline:
- https://appwrite.io/docs/products/auth/server-side-rendering

Any PocketBase claim not directly traceable to those pages or to code inspected in this repo is marked **(inference)**.

Memory statement that a PocketBase project "may already exist in service flow developer" treated as **unverified**; only config key presence/names inspected, never secret values (verified: no `POCKETBASE`/`PB_` keys found in repo grep).

---

## Current State (Verified)

Single-tenant personal app ("small personal project" — product direction confirmed). No client-side Appwrite SDK (`appwrite@22` present in package.json as legacy, unused in app code — verified grep). All Appwrite access is server-side via `node-appwrite@14` admin SDK (`lib/appwrite.ts`) + server actions / route handler.

**App entry**: `app/page.tsx` → redirect `/dashboard`. `app/dashboard/page.tsx` (RSC) calls `getAuthUser()` + `getServices()` server-side for initial payload. `app/login`, `app/register` static forms. `app/locations`, `app/locationLogs` similar RSC wrappers with `getAuthUser` gate.

**Deployment**: `next.config.mjs` `output: "standalone"`; multi-stage `Dockerfile` (node:22-alpine deps → builder `pnpm run build` → runner copies `.next/standalone` + `.next/static`, USER nextjs:1001). CI: `.github/workflows/deploy.yml` — push main/tags `v*.*.*` → ghcr.io build+push `latest` only (metadata-action + build-push-action).

**Docs gaps**: No `PRD.md`/`ARCHITECTURE.md`/`DESIGN.md` at repo root (only `design/DESIGN.md` legacy mockups); no `SECURITY.md`, `CODEOWNERS`, `CONTRIBUTING.md`, issue/PR templates.

**Repo hygiene verified dirty/clean**: `proxy.ts` (Next 16 `proxy` → `/api/proxy/*` rewrite to `NEXT_PUBLIC_APPWRITE_ENDPOINT`), `check_or.ts` (`console.log(typeof Query.or)`), `lint_output.txt`, `design/` binary mockups exist — candidates for deletion (neutral). `pnpm-lock.yaml` tracked alongside `package-lock.json` (npm) — neutral governance item. `lib/appwrite.ts:35` still has `console.log("[Appwrite Debug] Session set on client")` + commented warn.

---

## Auth / Session Flow (Verified)

`lib/appwrite.ts`:
- `createAdminClient()` — `Client().setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(NEXT_PUBLIC_APPWRITE_PROJECT).setKey(APPWRITE_API_KEY)` → `{ account: Account, databases: Databases }`
- `createSessionClient()` — client without key, `cookies().get(SESSION_COOKIE)` ("session"), `client.setSession(secret)`, throws `No session` if missing.
- Legacy `databases` singleton (admin client with fallback `|| ""`) still exported — used widely.
- `DB_ID = "Service-system-db"`, `COLLECTIONS = { Services: "Services", LOCATIONS: "locations", LOCATION_LOGS: "location-logs" }`

`lib/auth.ts`: `getAuthUser()` → `createSessionClient().account.get()` → `{id,email,name}` or null (silences `No session`).

`app/actions/auth.ts` (`"use server"`):
- `login(FormData)` / `register(FormData)` use `createPublicClient()` which **incorrectly sets API key** (`setKey(APPWRITE_API_KEY)`) then `account.createEmailPasswordSession` / `account.create(ID.unique(),...)` — admin-key misuse but functional because server. Sets cookie `httpOnly:true, sameSite:lax, secure: prod, expires: session.expire`. `logout()` deletes cookie + `redirect("/login")`.

PocketBase equivalent (inference → docs/authentication): `PocketBase authWithPassword(email,password)` returns `record` + `token`; token stored as `pb_auth` cookie (httpOnly). Server via `new PocketBase(PB_URL)` + `authStore` from cookie header, or admin client with `admins.authWithPassword`. No `setKey` equivalent; need separate env `POCKETBASE_URL` (+ admin creds for privileged ops). Cookie name must rotate (`pb_auth` or `pb_session`).

**Invariant to preserve**: app-level tenant isolation via `userId` filter is NOT DB-level ACL today; migration must keep it until PocketBase API rules take over.

---

## Data Model & Collections (Verified)

From `scripts/setup-appwrite.ts` + `lib/types.ts` + `lib/storage.ts`:

**Services** (ex-`Services`): 18 attributes — `userId` (255,req), `invoiceNumber`(255), `clientName`(255,req), `rut`(50), `contact`(255), `email`(255), `product`(255,req), `failureDescription`(5000), `sku`(255), `locationId`(255,req), `entryDate`(datetime req), `deliveryDate`/`readyDate`/`cancellationDate`(datetime), `status`(50, default pending), `repairCost`(int 0..999M default 0), `notes`(5000). Indexes: `userId` key, `status` key, `locationId` key, `clientName` fulltext, `invoiceNumber` key, `rut` key. Type: `ServiceStatus = pending|ready|completed|cancelled`, `Service` interface maps `$id→id`, joins location name + logs.

**locations**: `name` 255 req, `userId` 255 req, `isActive` bool default true, `createdAt`/`updatedAt` datetime, ad-hoc `address` in actions (not in setup schema — drift). Indexes: `userId` key, `name` key.

**location-logs** (ex `Location Logs`): `userId` 255 req (denormalized but setup task 3 creates it), `ServiceId` 255 req, `fromLocationId` 255 req, `toLocationId` 255 req, `changedAt` datetime req. Indexes: `userId` key, `ServiceId` key, `fromLocationId` key, `toLocationId` key.

**PocketBase mapping** (per docs/collections + api-rules-and-filters, inference flagged):
- Collections are typed; PocketBase uses SQLite; single DB file. IDs are PocketBase `id` (15-char) not Appwrite `$id` — migration must preserve or remap.
- Relations: `locationId` → `relation` to `locations`; `ServiceId` → relation to `services`. PocketBase expands with `expand=locationId`.
- Appwrite `Query.or([search(...)])` + fulltext on `clientName` becomes PocketBase `filter` string: `clientName ~ {:search} || invoiceNumber ~ {:search} || rut ~ {:search}` — but requires filter string building, not typed Query.
- Indexes: PocketBase manual via migration Go `collection.Indexes` or Admin UI; fulltext not native — `~` is `LIKE` with SQLite `LIKE` semantics (inference: need to decide if trigram or plain LIKE sufficient for small personal dataset).
- `isActive` boolean → PocketBase `bool`.

---

## Queries / Search / Pagination (Verified)

`lib/storage.ts:getServices(params)`: `page/limit → offset`, `Query.limit/offset`, `orderAsc/Desc(entryDate)`, `equal(userId)`, `equal(status[])`, `equal(locationId)`, `or([search(clientName), search(invoiceNumber), search(rut)])` (fulltext). Then N+1 mitigated via batched fetches: `listDocuments(location-logs, equal(ServiceId, ids), limit 1000)`, collect locationIds, `listDocuments(locations, equal($id, locationIds), limit 100)`, map via `locMap`.

`app/actions/logs.ts:getLocationLogs`: `orderDesc(changedAt), limit/offset, equal(userId), or(fromLocationId,toLocationId), >= startDate, <= endDate`, then expand `Services`+`locations`.

`app/actions/locations.ts:getLocations`: `equal(userId), orderDesc(createdAt), optional equal(isActive)`, then per-location enrichment with 3 parallel `listDocuments` with `limit 1` to get `.total` counts (active/completed/logs) — N parallel queries.

**Pagination invariants**: page 1-based, limit defaults 20, `total` from Appwrite required for page count. PocketBase returns `page, perPage, totalItems, totalPages, items` — shape differs; frontends (`ServicesDashboard`) expect `{data,total,page,limit}`. Adapter must preserve contract or migrate callers.

**Search risk**: PocketBase filter strings are injection surface if search interpolated raw. Must param via `{:param}` binding (docs/api-rules-and-filters) — never string concat.

---

## Actions / API Boundaries (Verified)

- Server actions: `auth.ts` (login/register/logout), `locations.ts` (get/create/update/toggleActive/delete with duplicate name guard via `normalizeString`, history guard), `logs.ts` (filtered history). All validate via `getAuthUser()` gate; location mutations check `userId` ownership (`doc.userId !== user.id`).
- REST route: `app/api/services/route.ts` — `GET` (paginated search with `getAuthUser`), `POST`/`PUT` (validate `ServiceSchema.safeParse`, handle `cancelled→cancellationDate` auto-fill, call storage), `DELETE ?id=`.
- `ServiceSchema` zod: invoiceNumber required, clientName ≥2, contact ≥6, product ≥2, locationId required, status enum, email optional.

**Seam**: `lib/storage.ts` is the Appwrite-coupled BFF boundary — every DB call flows through `databases` + `DB_ID`/`COLLECTIONS`/`Query`/`ID`. Replacement target is a `lib/pocketbase.ts` (or `lib/db.ts` adapter) exposing same typed signatures initially. `lib/appwrite.ts` itself is seam #1, `lib/storage.ts` seam #2, `app/actions/*` only import seam #1 indirectly via `getAuthUser` + storage.

**Validation boundary**: zod at route/action entry, `normalizeString` for duplicate detection — preserve.

---

## Appwrite Coupling Inventory (Files)

Tightly coupled (must migrate):
- `lib/appwrite.ts` — endpoint/project/key, SESSION_COOKIE, admin/session clients, DB_ID, COLLECTIONS (sole source of truth)
- `lib/storage.ts` — all `databases.*` CRUD + Query mapping
- `lib/auth.ts` — session → Account.get
- `app/actions/auth.ts` — `Client/Account/ID` directly (duplicates client creation, sets key on auth)
- `app/actions/locations.ts`, `app/actions/logs.ts`, `app/api/services/route.ts`, `app/dashboard/page.tsx`, `app/locations/page.tsx`, `app/locationLogs/page.tsx` — via storage/auth imports
- `scripts/setup-appwrite.ts` — canonical schema; world-writable `Role.any()` still at HEAD (never fixed to `[]` on main)
- `.env.example` / README env docs — key names only inspected (no values), `NEXT_PUBLIC_APPWRITE_*` + `APPWRITE_API_KEY`
- `next.config.mjs` — none related
- `proxy.ts` — dead unauthenticated rewrite to Appwrite endpoint (should be deleted regardless)

Loosely coupled: `components/*`, `lib/schemas.ts`, `lib/types.ts`, `lib/utils.ts` — agnostic, reusable.

Verified absent on clean base: `scripts/migrate-appwrite-permissions.ts`, `scripts/dev-target-guard.ts`, `tests/permissions.test.ts`, `tests/dev-target-guard.test.ts` — they existed only in dirty `remediate-audit-findings` worktree and are NOT on current HEAD (correct per "never copy Appwrite migration code").

---

## PocketBase Instance / Env Expectations (Verified key presence)

Grep result: no `POCKETBASE`/`PB_` env keys found in repo (verified). Inference baseline per docs/going-to-production + faq:
- Required: `POCKETBASE_URL` (e.g., `http://127.0.0.1:8090` or hosted URL), authenticated SDK via cookie `pb_auth`. For server privileged ops: `POCKETBASE_ADMIN_EMAIL` + `POCKETBASE_ADMIN_PASSWORD` or admin token env — but task says inspect only key presence/names, never values.
- Dev vs prod: PocketBase is single Go binary; local is `pocketbase serve`, prod is same binary behind reverse proxy + TLS. No `PROJECT_ID` equivalent; collections live inside single `pb_data/data.db` file. Backup = file + `pb_data/storage`.
- Auth: email/password via `users` collection (PocketBase built-in `users` or custom `users`). Passwords are bcrypt-hashed inside PB; Appwrite hashes are not portable (see user/password migration section).

Unverified memory claim about existing PB project in "service flow developer" — **not verified** in this inspection; proposal MUST include discovery step to confirm or create project/instance and document URL without leaking secrets.

---

## Distinct Migration Dimensions (Required Explicit Separation)

### 1) Code migration (client + server seams)
Replace `node-appwrite` SDK usage with `pocketbase` JS SDK (`pocketbase` npm). Seams: `lib/appwrite.ts` → `lib/pocketbase.ts` (factory `createPbClient` reading `POCKETBASE_URL` + cookie), `lib/auth.ts` → pb `authStore`, `lib/storage.ts` → pb collection calls (`pb.collection('services').getList(page, perPage, {filter, sort})`). Preserve public signatures where possible to limit UI churn. Risk: PocketBase `getList` params differ (page/perPage, filter string, sort `-entryDate`). Need adapter mapping Appwrite Query → filter/sort strings, with injection safety.

### 2) Schema / rules (collections + API rules + indexes)
Per docs/collections + docs/api-rules-and-filters + docs/go-migrations: define 3 collections (`users` auth, `locations`, `services`, `location_logs`) via Go migration file(s) (`pb_migrations/*.go`) using `m.FindCollectionByNameOrId` + field definitions. API rules: `listRule/viewRule/createRule/updateRule/deleteRule` must enforce `userId = @request.auth.id` (or relation owner). Current Appwrite uses app-level `userId` filter — PocketBase can enforce at DB-level via rules (defense in depth). Decision: keep app-level filter + add rule for safety. Indexes: recreate Appwrite indexes via `collection.Indexes` in migration (key indexes + filter optimization). Fulltext → `LIKE` fallback acceptable for small dataset; document limitation.

### 3) Existing data transfer
Appwrite `Service-system-db` → PocketBase `pb_data/data.db`. Current prod data volume unknown (personal project → assumed small, inference). Options: offline export via `listDocuments` pagination → JSON → `pb.collection().create` bulk; or direct SQLite insert via migration. Need to decide one-shot backfill vs dual-write (dual-write not warranted for personal project, per product direction). Data includes `Services` with dates as ISO strings → PB `date` fields expect ISO; mapping is 1:1. Relation remap: PocketBase `id` must either preserve Appwrite `$id` (if pb allows custom id on create) or remap + update foreign keys (`locationId`, `ServiceId`). Verify: PocketBase allows custom `id` if 15-char alphanumeric? (inference: requires check docs/collections; may need to generate new ids and maintain mapping table).

### 4) User / password migration
**Critical incompatibility**: Appwrite password hashes cannot be imported into PocketBase (different hash format, PocketBase expects plaintext on create to bcrypt). Therefore: cannot seamlessly migrate passwords. Product decision required. Options per docs/authentication: (a) force password reset for all users (send reset flow), (b) keep Appwrite auth temporarily for login and transparently create PB user on first login (needs dual auth during cutover), (c) bulk invite with temporary password + email. For personal project with few users → (a) is smallest slice (single user admin reset). Must document.

### 5) Backup / rollback
Appwrite: old `Service-system-db` data kept until cutover verified; export JSON + retain Appwrite project. PocketBase: backup is copying `pb_data/data.db` + `pb_data/storage` (per docs/going-to-production). Rollback plan: keep Appwrite env vars and code behind feature branch; `git revert` per slice; restore `pb_data` from snapshot. Need go/no-go gate.

### 6) Local / production deployment
- **Local**: run PocketBase binary (`./pocketbase serve --http 127.0.0.1:8090`) + Next.js `pnpm dev` with `POCKETBASE_URL=http://127.0.0.1:8090`. Provide `docker-compose` addition (pb service) — decide if PB runs in Docker or host.
- **Production**: PocketBase single binary behind Caddy/Nginx with TLS + `pb_data` volume persistence; `Dockerfile` stays for Next.js, PB is separate deployment unit (not bundled into Next image). Env wiring via deployment secrets (`POCKETBASE_URL`, admin creds). docs/going-to-production recommends reverse proxy + `--origins` allowlist + persistent volume.

### 7) Cleanup of Appwrite
Delete after cutover confirmed: `lib/appwrite.ts`, `scripts/setup-appwrite.ts`, `proxy.ts` (already candidate), `node-appwrite` + `appwrite` deps, `NEXT_PUBLIC_APPWRITE_*`/`APPWRITE_API_KEY` env keys, README env docs, `Dockerfile` comments if any. Do not delete until branch has green tests + data verified. Keep `pocketbase` dep only.

---

## Reusable Neutral Commits from Closed PRs (Candidates Only — Not Copied)

Per `remediate-audit-findings` tasks + apply-progress.md, 16 tasks done across S1–S3 core + guard/runner/CLI. Appwrite-specific work is abandoned. Backend-neutral hygiene/governance **candidates for re-evaluation** (no code copied here):

- **S1 hygiene (1.1–1.4)**: delete `proxy.ts` (dead unauth rewrite), `check_or.ts`, `lint_output.txt`, legacy `design/` mockups; drop `console.log("[Appwrite Debug]")` in `lib/appwrite.ts`; .gitignore patch. — Neutral, directly reusable as PocketBase change's first cleanup slice.
- **S2 naming/pnpm (2.1–2.3 partially neutral)**: `pnpm-workspace.yaml` + `pnpm-lock.yaml` governance + `git rm package-lock.json` + `.gitignore` `package-lock.json` ignore + dropping `appwrite@22` legacy dep + `packageManager: pnpm@11.1.1` + `engines.node >=22`. — Neutral, reusable. DB rename `Service-system-db→serviceflow-db` is **not reusable** (Appwrite-specific); PocketBase has no DB_ID.
- **S5 contracts (5.1–5.3 unchecked) & S6 CI governance (6.1–6.4 unchecked)**: `SECURITY.md`, `PRD.md`/`ARCHITECTURE.md`/`DESIGN.md` skeletons, `.github/workflows/ci.yml` + `pr-check.yml` (400-line budget), `dependabot.yml`, `CODEOWNERS`, `.husky/pre-commit` + `lint-staged`, PR/issue templates. — Neutral, candidates but must be rebased onto PocketBase reality (remove Appwrite dev-only sections).
- **NO reuse**: `scripts/migrate-appwrite-permissions.ts`, `scripts/dev-target-guard.ts`, `tests/permissions.test.ts`, `tests/dev-target-guard.test.ts`, `scripts/setup-appwrite.ts` `[]` perms hunk — all Appwrite migration code, explicitly forbidden to copy.

---

## Concrete Migration Seams (Smallest Cut Points)

1. **lib/appwrite.ts → lib/pocketbase.ts** (factory + cookie helpers) — single import replacement point for all auth/storage.
2. **lib/auth.ts:getAuthUser** → pb `pb.authStore.isValid` + `pb.collection('users').authRefresh()` or `pb.admins.authWithPassword` for server; cookie read via `next/headers` `cookies()`.
3. **lib/storage.ts** all methods — replace `databases.*` + `Query` builder with pb collection calls; keep exported `getServices/saveService/updateService/deleteService/getLocations/getLocationLogs` signatures initially (strangler pattern) to avoid UI churn.
4. **app/actions/auth.ts** login/register — replace `Account` with `pb.collection('users').authWithPassword/create`.
5. **scripts/setup-appwrite.ts → pb_migrations/xxx_init.go** — schema definition moves from imperative TS script to versioned Go migrations (per docs/go-migrations).
6. **Env wiring**: `lib/pocketbase.ts` reads `POCKETBASE_URL` (and admin creds server-only) — central place to validate via zod at `lib/env.ts` boundary.

---

## Invariants to Preserve

- **I1 Tenant isolation**: every read/write filtered by `userId = currentUser.id`; never rely solely on client claim. PocketBase API rules should duplicate this (defense in depth).
- **I2 Auth gate**: unauthenticated → `null`/redirect `/login`; `getAuthUser` used in every RSC + action + API route.
- **I3 Cookie security**: `httpOnly, secure (prod), sameSite:lax, path:/, expires=session.expire` — PocketBase cookie must keep same flags (even though PB default is not httpOnly on client SDK, server cookie must be).
- **I4 Validation**: `ServiceSchema`, `loginSchema`, `registerSchema` at boundary before DB; keep zod.
- **I5 Pagination contract**: `{data,total,page,limit}` shape expected by `ServicesDashboard` + `LogsManager`; adapter must either preserve or migrate callers in same slice (no half-migration).
- **I6 Search UX**: search across `clientName`/`invoiceNumber`/`rut` + multi-status + locationId + sortOrder; must remain single-query with pagination.
- **I7 Location lifecycle**: duplicate guard (`normalizeString`), `isActive` toggle, `hasHistory` guard on delete (Services total + logs total), address optional drift — keep.
- **I8 LocationLogs denormalization**: `userId` stored on log for direct filtering; PocketBase schema must keep it (setup drift fixed in later worktree, not on base).

---

## Risks & Mitigations

- **R1 Password hash non-portability** — Likelihood high; Mitigation product decision force-reset (small user base) documented in proposal.
- **R2 Filter injection** — High if search string interpolated; Mitigation use PocketBase filter param binding `{:search}`.
- **R3 ID remapping** — Appwrite `$id` vs PB 15-char `id`; naive bulk create loses relations. Mitigation decide: allow PB to generate ids + build mapping table for relations, or set custom ids if PB permits (must spike).
- **R4 Rule misconfiguration** — Open rules (`@request.auth.id != ""` only) leak tenant data. Mitigation default deny, rule `userId = @request.auth.id` on all collections, verify via integration test with two users.
- **R5 Data loss on one-shot import** — No dual-write; Mitigation backup export JSON + keep Appwrite project until cutover verified; dry-run import on local PB before prod.
- **R6 Binary deployment drift** — Next.js `standalone` vs PB binary are separate; Mitigation document local `docker-compose.pb.yml` + prod volume/reverse proxy steps per docs/going-to-production.
- **R7 Offline appwrite SDK remnants** — `node-appwrite` stays in deps → bundle bloat/confusion. Mitigation cleanup phase gated on green tests.

---

## Product Decisions Requiring Jona Confirmation (Do Not Assume)

- **D1** Use single PocketBase instance (personal project) vs per-env isolation? Assume local `127.0.0.1:8090` + single prod PB — confirm host/URL.
- **D2** Password cutover: force reset vs transparent dual-auth? Recommend force reset given small user base — confirm acceptable downtime/communication.
- **D3** Data volume: keep history (`location-logs`) and all Services? Assume full import — confirm.
- **D4** `address` on locations: setup script omits it but actions use it — include in PB schema? Recommend add `address` text optional.
- **D5** Search semantics: Appwrite fulltext vs PB `~` LIKE; OK for small data? Recommend LIKE, document limitation.
- **D6** Hosting: run PB alongside Next.js on same host/Docker vs managed PB? Recommend co-hosted Go binary with volume.

---

## Smallest End-to-End First Slice (Verified Minimal)

**Slice 0: Auth + 1 collection read (users + locations list) on local PB, behind env flag.**

Goal: prove PocketBase auth + session + tenant隔离 + deployment wiring with zero risk to prod data.

Steps (no Appwrite code deleted yet):
1. Install `pocketbase` npm (JS SDK) as dev dependency; add `POCKETBASE_URL` env key name (placeholder, no value committed).
2. Create `pb_migrations/1700000000_init.go` for `users` (auth), `locations` (schema from `setup-appwrite.ts` + `address`), minimal rules `userId = @request.auth.id`.
3. Local `docker-compose.pb.yml` or binary instruction to run PB locally.
4. `lib/pocketbase.ts` factory + `lib/auth.ts` alternate `getAuthUserPb()` behind helper flag; keep existing `getAuthUser` as fallback for comparison.
5. `app/actions/locations.ts:getLocations` alternate branch calling `pb.collection('locations').getList` with filter `userId = {:uid}` + tenant check.
6. One Vitest integration test (mocked PB server via `vi.mock` or `pocketbase-mock`) asserting tenant filter + auth guard; existing tests stay green.
7. Verification: `pnpm dev` with local PB → login/register → locations list loads; Appwrite prod untouched; no secret committed.

Why smallest: touches every seam (SDK, auth, collection, filter, deployment) but only one collection, no data import, no password migration, no rule complexity, no cleanup. Review budget ≈ 200–300 lines (single migration file + `lib/pocketbase.ts` + one action alternate + compose/doc).

**If Slice 0 green → next slices in order**: Services CRUD + search/pagination, LocationLogs with history, PB API rules hardening (per-rule tests), data backfill script (JSON export/import), password reset flow, local/prod deployment docs, final Appwrite cleanup (`lib/appwrite.ts` + deps + env keys).

---

## Exploration Completeness

- Auth/session flow: verified via `lib/appwrite.ts` + `lib/auth.ts` + `app/actions/auth.ts` — complete.
- Data model/collections: verified via `scripts/setup-appwrite.ts` + `lib/types.ts`/`lib/schemas.ts` — complete; PocketBase mapping inferred where docs not locally verified.
- Queries/search/pagination: verified via `lib/storage.ts` + `app/actions/logs.ts` + `app/actions/locations.ts` — complete.
- Actions/API boundaries: verified via `app/actions/*` + `app/api/services/route.ts` — complete.
- Deployment: verified via `Dockerfile` + `next.config.mjs` + `.github/workflows/deploy.yml` — complete; PocketBase production per docs/going-to-production (inference on Caddy/Nginx details).
- Tests: Vitest `jsdom` + `tests/setup.ts` + `tests/schemas.test.ts` (2 tests, not 17 — discrepancy: earlier change's dirty worktree had 17 but clean base has 2; inference: clean base regressed). No coverage provider, no E2E.
- Docs: `README.md` describes Appwrite; no PRD/ARCHITECTURE/DESIGN — gap verified.
- Appwrite coupling: inventory complete (see coupling section).
- Data/password migration implications: distinguished dimensions 3+4 — complete.
- PocketBase instance/env expectations: key names absent verified; unverified memory claim flagged.
- Reusable neutral commits: candidates listed, Appwrite code excluded — complete.

**Ready for Proposal**: Yes. Proposal should formalize D1–D6 decisions, Slice 0 as first deliverable, rule hardening strategy, password reset product choice, and backup/rollback gates. No proposal code changes needed beyond this exploration artifact.
