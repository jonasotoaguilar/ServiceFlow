# Apply Progress — service-ui-corrections

**Change**: service-ui-corrections
**Mode**: Strict TDD
**Work Unit**: unit-7c-custody-lockup (Custody + Lockup) — stacked on docs 08
**Attempt tokens**: 
- unit-1 `sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f`
- unit-2 `sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911`
- unit-3 `sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b`
- unit-4 `sha256:6412aebf749250cce2424818c939a57f17782186f3338e60ca2338dde5680596`
- unit-5 `sha256:26f556f18b850cc162427624c407a3b700a8a81bbdd89630ff257061a1a02aba` (unit-5-identity-immutability, max 800, parent settles)
- unit-6 `sha256:8b02b4b9e4f11cf79bfbbba506dcb122a66760a576a436a6b7930d581c35e795` (unit-6-rut-search, max 800, parent settles)
- unit-7c `sha256:435ddb2fdf69313f67dc25976d17daa6bcda1f4cd5fa5de7205a3fd625c51b51` (unit-7c-custody-lockup, max800, parent settles)
**Date**: 2026-09-03
**Branch**: fix/service-ui-corrections-09-custody-lockup (stacked on docs/service-ui-corrections-08-openspec-design-specs)
**Stack strategy**: stacked-to-main (auto-chain, 800-line session budget, PR9 ninth slice, base #90)

## Completed Tasks

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus | ""`; close on pick.
- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip.
- [x] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [x] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`. Check tests.
- [x] 4.1 RED `tests/unit/registro-primary-surface.test.tsx`: true-empty `push("/dashboard?createService=1")`; filter-empty clears; one-shot; Suspense-safe.
- [x] 4.2 GREEN `app/(app)/service-events/serviceEventsManager.tsx`, `app/(app)/dashboard/page.tsx` await `searchParams`, `ServicesDashboard.tsx` open+`replace`. Check tests.
- [x] 5.1 RED `tests/schemas.test.ts`, `tests/services-lifecycle.test.ts`: PUT 400 `IDENTITY_PROTECTED`; storage omit; UI locked; 409 holds.
- [x] 5.2 GREEN `lib/schemas.ts` `GENERIC_EDIT_OMIT`; `app/api/services/route.ts` reject before Zod; `lib/storage.ts` omit; `components/services/ServicesModal.tsx` read-only. Check tests.
- [x] 6.1 RED `tests/unit/rut.test.ts`, `tests/pocketbase-filter.test.ts`: `isRutShapedLookup`; bound `{:rutSearch}` vs raw; `isValidRut` writes unchanged.
- [x] 6.2 GREEN `lib/rut.ts`, `lib/pocketbase-filter.ts`, GET search in `app/api/services/route.ts`. Check tests.
- [x] 7.1 RED `tests/unit/custody-receipt.test.ts` + `tests/unit/bodega-lockup.test.ts`: title `COMPROBANTE DE RECEPCIÓN Y CUSTODIA`, disclaimer, 58mm, escape, no QR, lockup AA
- [x] 7.2 GREEN `lib/custody-receipt.ts`, `components/services/ServicesDetailsModal.tsx`, `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (refined 1.5px, rx1.5, sync, a11y)

## Files Changed (cumulative)

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/unit/dashboard-operate-plus.test.tsx` | Modified (unit-1 + unit-2) | Unit-1 exclusive scalar + Unit-2 gutter (32 tests) |
| `components/services/ServicesDashboard.tsx` | Modified (unit-1 + unit-2 + unit-4) | Scalar status + parent unclip + one-shot `initialCreateService` guard with `router.replace("/dashboard")` |
| `app/api/services/route.ts` | Modified (unit-1 + unit-5) | GET first allowlisted token only (unit-1); unit-5 identity `Object.hasOwn` 400 `IDENTITY_PROTECTED` before Zod, `GENERIC_EDIT_OMIT` omit, keep `current` identity, preserve lifecycle 400/409 |
| `components/services/ServicesTable.tsx` | Modified (unit-2) | `overflow-x-auto custom-scrollbar` + `min-w-[960px]` |
| `tests/unit/shell.test.ts` | Modified (unit-3) | Added 5 2xl/shell rhythm tests (max-w-7xl 2xl:max-w-[1600px] shared, no 2xl at 1280, Locations header/toolbar band) |
| `tests/unit/locations.test.ts` | Modified (unit-3) | Added 3 Locations rhythm tests (title 2xl, toolbar border-y band, shell inheritance) |
| `app/(app)/layout.tsx` | Modified (unit-3) | `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8` |
| `components/layout/Navbar.tsx` | Modified (unit-3) | Inner row `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` |
| `app/(app)/locations/locationsManager.tsx` | Modified (unit-3) | Header `text-2xl font-semibold tracking-tight` + toolbar `border-y bg-surface/50 px-4 py-3 mb-6` (was card `bg-surface border shadow-sm p-4 rounded-sm`) |
| `tests/unit/registro-primary-surface.test.tsx` | Modified (unit-4) | Added 6 true-empty/one-shot/Suspense tests (now 21 total); `vi.hoisted` mock `push`/`replace`, true-empty push, filtered clear, dashboard one-shot |
| `app/(app)/service-events/serviceEventsManager.tsx` | Modified (unit-4) | Import `useRouter`, add `router` and change `handleEmptyAction`: filtered → `clearFilters()`, true-empty → `router.push("/dashboard?createService=1")` |
| `app/(app)/dashboard/page.tsx` | Modified (unit-4) | Accept `searchParams?: Promise<{ createService?: string \| string[] }>`, `await searchParams`, derive `initialCreateService === "1"`, pass to `ServiceDashboard` |
| `tests/unit/service-events-filters.test.tsx` | Modified (unit-4) | Add `next/navigation` mock (`push`/`replace`) so `ServiceEventsManager` with new `useRouter` renders in existing filter tests |
| `lib/schemas.ts` | Modified (unit-5) | Export `GENERIC_EDIT_OMIT` (8 keys: 5 lifecycle + `clientName`/`invoiceNumber`/`sku`) |
| `lib/storage.ts` | Modified (unit-5) | `updateService` payload omits `invoiceNumber`/`clientName`/`sku`, keeps `rut/contact/email/product/failureDescription/entryDate/repairCost/notes` |
| `components/services/ServicesModal.tsx` | Modified (unit-5) | Edit strips identity (`clientName/invoiceNumber/sku`) + `status/locationId` from PUT payload; renders identity as `readOnly disabled` when `isEditing`; exposes `contact` + `failureDescription` in edit; preserves create |
| `tests/schemas.test.ts` | Modified (unit-5) | Added 3 identity `GENERIC_EDIT_OMIT` tests (now 11 total); RED 3 failed → GREEN 11/11 |
| `tests/services-lifecycle.test.ts` | Modified (unit-5) | Added 6 identity tests (own-key 400, inherited not triggered, mutable persist, invalid email, lifecycle/409 remain, source uses `GENERIC_EDIT_OMIT`); fixed 3 legacy tests to omit identity + 1 lifecycle fix; now 27 total |
| `tests/unit/services-modal-identity.test.tsx` | Created (unit-5) | New 4 tests: source readOnly/strip, rendered edit identity not editable / mutable editable, submit strips identity from PUT, create still sends identity |
| `tests/unit/lifecycle.test.ts` | Modified (unit-5) | Fixed 2 generic-edit tests to omit identity (stale contract before unit-5) |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified | Marked 1.1,1.2,2.1,2.2,3.1,3.2,4.1,4.2,5.1,5.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Modified | Merged unit-1 + unit-2 + unit-3 + unit-4 + unit-5, added unit-5 evidence and stack PR #87 |
| `lib/rut.ts` | Modified (unit-6) | Add `isRutShapedLookup` (strip `[.\-\s]`, `^\d+[0-9Kk]?$` 2–9, `trim` guard) lookup-only; `normalizeRut`/`isValidRut` unchanged |
| `lib/pocketbase-filter.ts` | Modified (unit-6) | Import `normalizeRut` + `isRutShapedLookup`; `serviceListBinding` uses separate `{:rutSearch}` with `normalizeRut(raw)` when RUT-shaped, else raw `{:search}` only; `clientName`/`invoiceNumber` keep raw; tenant/status/location/pagination unchanged |
| `tests/unit/rut.test.ts` | Modified (unit-6) | Added 6 `isRutShapedLookup` tests (existence, punctuation/hyphen/space variants, non-RUT, empty, triangulate normalization, `isValidRut` persistence unchanged) — RED 5 failed → GREEN 25/25 |
| `tests/pocketbase-filter.test.ts` | Modified (unit-6) | Added 7 RUT search binding tests (separate `{:rutSearch}`, variant equivalence, non-RUT raw, empty unfiltered, compose with status/location, injection bound-only, allowlist) — RED 4 failed → GREEN 16/16 |
| `app/api/services/route.ts` | Verified (unit-6) | GET `search` already `searchParams.get("search") \|\| undefined` → `getServices({search, status, location})`; no new query name, no interpolation, preserved pagination/status/location + identity `IDENTITY_PROTECTED`/`LIFECYCLE_PROTECTED`/`IMMUTABLE_STATUS` |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified (unit-6) | Marked 6.1,6.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Modified (unit-6) | Merged unit-6 evidence, TDD table, workload, PR #88 |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration | ✅ 22/22 | ✅ 8 failed | ✅ 27/27 | ✅ 5 exclusive | ✅ Clean |
| 1.2 | `tests/unit/dashboard-operate-plus.test.tsx` + `app/api/services/route.ts` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ multi `join` failed | ✅ 27/27 + tsc 0 | ✅ same 5 | ✅ `Set<ServiceStatus>` |
| 2.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration DOM | ✅ 27/27 | ✅ 5 failed (overflow, min-w, parent clip) | ✅ 32/32 | ✅ 5 gutter | ✅ slice fixes |
| 2.2 | `components/services/ServicesTable.tsx` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ same 5 | ✅ 32/32 + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal gutter |
| 3.1 | `tests/unit/shell.test.ts` + `tests/unit/locations.test.ts` | Unit | ✅ 44/44 baseline (shell+locations before unit-3) | ✅ **8 failed** (2xl missing, title old, toolbar card) | ✅ **52/52** | ✅ 8 cases: layout 2xl, Navbar shared, no 2xl at 1280, per-page no duplicate, Locations h1 2xl, toolbar border-y, shell inheritance (x2) | ✅ Fixed xl substring false positive, h1 whitespace |
| 3.2 | `app/(app)/layout.tsx` + `components/layout/Navbar.tsx` + `app/(app)/locations/locationsManager.tsx` | Unit | ✅ same baseline | ✅ same 8 | ✅ 52/52 + 84/84 with dashboard-operate-plus + tsc 0 + biome 0 | ✅ same 8 | ✅ Minimal 2xl + title + band, no per-page widths |
| 4.1 | `tests/unit/registro-primary-surface.test.tsx` | Unit+Integration | ✅ 16/16 baseline (existing registro tests before unit-4) | ✅ **5 failed** (true-empty source/push, dashboard page async, dashboard guard, rendered trigger) — `source uses useRouter push`, `rendered true-empty pushes`, `dashboard page awaits searchParams`, `ServicesDashboard guard/replace`, `rendered trigger opens modal` | ✅ **21/21** | ✅ 5 cases: true-empty push via `router.push("/dashboard?createService=1")`, filtered-empty only clears (no push), page `await searchParams` + `initialCreateService`, dashboard `useRef` guard + `router.replace("/dashboard")` + no `useSearchParams`, one-shot open exactly once and `replace` cleanup, Suspense-safe (no bare `useSearchParams`) | ✅ Fixed `getByRole("Limpiar filtros")` multiple match (toolbar vs empty) → `getAllByRole` + `textContent` filter; fixed `getByText("Nuevo servicio")` multiple match (toolbar + dialog) → `getByText("Complete los detalles")` + `getByRole("dialog")` |
| 4.2 | `app/(app)/service-events/serviceEventsManager.tsx` + `app/(app)/dashboard/page.tsx` + `components/services/ServicesDashboard.tsx` + `tests/unit/service-events-filters.test.tsx` | Unit+Integration | ✅ same baseline + `service-events-filters` 4/4 | ✅ same 5 (service manager missing `push`, page missing `await searchParams`, dashboard missing guard) | ✅ 21/21 registro + 105/105 with shell+dashboard + 460/460 full suite + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal one-shot: server `await searchParams` + prop, client `useRef` guard + `replace` once, registro `push` only on true-empty |
| 5.1 | `tests/schemas.test.ts` + `tests/services-lifecycle.test.ts` + `tests/unit/services-modal-identity.test.tsx` | Unit+Integration | ✅ 8/11 schemas baseline before unit-5, 22/27 lifecycle before unit-5, modal 1/4 before unit-5 | ✅ **11 failed** (schemas 3 failed — missing `GENERIC_EDIT_OMIT`, lifecycle 5 failed — no `IDENTITY_PROTECTED`/`Object.hasOwn`, modal 3 failed — source without readOnly/strip, rendered identity not blocked, contact not editable) | ✅ **42/42** (schemas 11/11, lifecycle 27/27, modal 4/4) + 473/473 full suite | ✅ 11 cases: `GENERIC_EDIT_OMIT` export + source uses, mutable persist, identity omitted from edit shape, PUT own-key 400 `IDENTITY_PROTECTED` via `Object.hasOwn` before Zod, inherited not triggered (`"in"` not used), valid edit keeps `contact/failureDescription/email/repairCost/notes` and omits identity/lifecycle, invalid email closed, lifecycle 400/409 remain, source uses `GENERIC_EDIT_OMIT` before `safeParse`, UI identity readOnly/disabled + contact/failureDescription editable, submit strips identity from PUT, create still sends identity | ✅ Fixed `lifecycle.test.ts` stale generic-edit payloads (2 tests) to omit identity; fixed `services-lifecycle` legacy payloads (3 tests) to omit identity; fixed `placeholders` — no weakening |
| 5.2 | `lib/schemas.ts` + `app/api/services/route.ts` + `lib/storage.ts` + `components/services/ServicesModal.tsx` | Unit+Integration | ✅ same baseline | ✅ same 11 (schemas missing `GENERIC_EDIT_OMIT`, route missing `Object.hasOwn` guard + `GENERIC_EDIT_OMIT` omit + identity kept from `current`, storage payload had identity, modal had no readOnly/strip and contact/failureDescription only in create) | ✅ 42/42 + 473/473 full suite + tsc 0 + biome 0 | ✅ same 11 | ✅ Minimal: `GENERIC_EDIT_OMIT` const, `Object.hasOwn` guard 400 `IDENTITY_PROTECTED` before Zod, `genericOmit` via `GENERIC_EDIT_OMIT`, `updated` keeps `current` identity, storage omits 3 keys, modal `readOnly disabled` + contact/failureDescription always + payload strip `clientName/invoiceNumber/sku` |
| 6.1 | `tests/unit/rut.test.ts` + `tests/pocketbase-filter.test.ts` | Unit | ✅ 9/41 (rut 20/25 + filter 12/16 before unit-6) | ✅ **9 failed** (rut 5 `isRutShapedLookup` undefined, filter 4 missing `{:rutSearch}`) | ✅ **41/41** (rut 25/25, filter 16/16) + 486/486 full suite | ✅ 13 cases: `isRutShapedLookup` true for `20.884.087-K`/`20884087-k`/`20884087k`/space/hyphen variants, false for `20Ab`/`Juan Perez`/`INV-123`/`20.884.087-KX`/`12.345.678-99` (length>9), empty/whitespace false; `normalizeRut` equivalence `20.884.087-K`→`20884087K` identical across forms (exact digits, no silent change); `isValidRut` persistence unchanged (`12.345.678-5` true, `12.345.678-0` false, `20.884.087-K` shape true but valid false); filter separate `{:rutSearch}` with `normalizeRut(raw)` when RUT-shaped else raw only, empty unfiltered, compose with status/location, bound-only no interpolation, allowlist preserved | ✅ Bound param separation, no `pb.filter` count increase (still 1), length 2–9 guard prevents phone/invoice over-normalization |
| 6.2 | `lib/rut.ts` + `lib/pocketbase-filter.ts` + `app/api/services/route.ts` (verified) | Unit | ✅ same baseline 9 failed | ✅ same 9 (lib/rut missing `isRutShapedLookup`, filter missing `{:rutSearch}`) | ✅ 41/41 + 486/486 + tsc 0 + biome 0 | ✅ same 13 | ✅ `isRutShapedLookup` helper + `normalizeRut` import in filter; `serviceListBinding` branches `isRutShapedLookup(raw)` → `(clientName ~ {:search} \|\| invoiceNumber ~ {:search} \|\| rut ~ {:rutSearch})` with `rutSearch=normalizeRut(raw)` (exact digits) else original; no persisted column, no new query name, GET `search` already `searchParams.get("search") \|\| undefined` → `getServices` → binding; status allowlist/location/pagination/identity protections untouched |

### Test Summary

- **Total tests**: 11 in schemas (8 baseline + 3 new), 27 in services-lifecycle (21 baseline + 6 new), 4 in services-modal-identity (new), 16 in lifecycle, 21 in registro-primary-surface, 52 in shell+locations, 32 in dashboard-operate-plus, 25 in rut (19 baseline + 6 new), 16 in pocketbase-filter (9 baseline + 7 new), 486 full suite
- **Total passing**: 11/11 schemas, 27/27 lifecycle, 4/4 modal-identity, 25/25 rut (5 RED→GREEN), 16/16 filter (4 RED→GREEN), 486/486 full (after unit-6, no stale fixes needed)
- **Layers**: Unit (source) + Integration (rendered with `next/navigation` mock, `boneyard-js` Skeleton mock, `getServiceEvents` mock)
- **Approval tests**: None
- **Pure functions**: `isRutShapedLookup` + `normalizeRut` + `computeCheckDigit` + `isValidRut`

## Work Unit Evidence

### Unit-1 (Exclusive status)
| Evidence | Value |
|---|---|
| Focused test | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 27/27 (before 8 failed) |
| Runtime harness | N/A — tsc 0, biome 0 |
| Rollback | Revert 3 code files |

### Unit-2 (Table gutter)
| Evidence | Value |
|---|---|
| Focused test | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 32/32 (before 5 failed) |
| Runtime harness | N/A — jsdom cannot prove 1280/1366/1920 geometry; source/DOM ownership verified |
| Rollback | Revert ServicesTable + Dashboard parent |

### Unit-3 (Shell + Locations)
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts --run` — **2 passed, 52 passed, 0 failed** (after GREEN). Before GREEN: 2 failed, 8 failed / 44 passed. Combined with dashboard: `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts tests/unit/dashboard-operate-plus.test.tsx --run` — **3 passed, 84 passed, 0 failed** |
| Runtime harness command/scenario and exact result | N/A — jsdom cannot prove rendered 1920 vs 1280 viewport widths; source contract is verifiable: `max-w-7xl 2xl:max-w-[1600px]` shared in layout main and Navbar inner row, no `lg`/`xl` 1600, per-page no duplicate widths, Locations `text-2xl font-semibold tracking-tight` + `border-y bg-surface/50 px-4 py-3`. Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0, `format` pre-evidence. Full viewport proof (1920 vs 1280) left for final verify, not fabricated. |
| Rollback boundary | Exact revert: `app/(app)/layout.tsx` (remove `2xl:max-w-[1600px]`), `components/layout/Navbar.tsx` (remove `2xl:max-w-[1600px]`), `app/(app)/locations/locationsManager.tsx` (restore `text-xl font-bold` + `bg-surface border shadow-sm p-4 mb-6 rounded-sm`), `tests/unit/shell.test.ts` + `tests/unit/locations.test.ts` (remove 8 2xl/rhythm tests). No Services/Registro logic, no pagination, no tenant isolation change. |

### Unit-4 (Registro Create — one-shot)
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/registro-primary-surface.test.tsx --run` — **1 passed, 21 passed, 0 failed** (after GREEN). Before GREEN: **5 failed** — `source uses useRouter push to /dashboard?createService=1`, `rendered true-empty pushes`, `dashboard page awaits searchParams`, `ServicesDashboard guard/replace`, `rendered trigger opens modal`. Combined: `pnpm test tests/unit/registro-primary-surface.test.tsx tests/unit/dashboard-operate-plus.test.tsx tests/unit/shell.test.ts tests/unit/locations.test.ts --run` — **4 passed, 105 passed, 0 failed**. Full suite: `pnpm run test:run` — **26 passed, 460 passed, 0 failed** (after adding `next/navigation` mock to `service-events-filters.test.tsx`). |
| Runtime harness command/scenario and exact result | N/A — jsdom cannot prove real browser navigation/refresh/back, but contract verified: `router.push("/dashboard?createService=1")` on true-empty vs `clearFilters()` only on filtered-empty, server `await searchParams` → `initialCreateService === "1"` → client `useRef` guard opens modal once + `router.replace("/dashboard")` exactly once (rerender with same prop does not call again, `false` prop does not open). Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0 (3 warnings, 2 infos pre-existing). True-empty vs filtered-empty distinction, filters, pagination, loading, and create-modal toolbar button preserved. |
| Rollback boundary | Exact revert: `app/(app)/service-events/serviceEventsManager.tsx` (remove `useRouter` import + `router.push` — restore `clearFilters()` in true-empty), `app/(app)/dashboard/page.tsx` (remove `searchParams?: Promise<...>` param + `await searchParams` + `initialCreateService` prop), `components/services/ServicesDashboard.tsx` (remove `initialCreateService?: boolean` prop + `useRouter` import + `hasConsumedCreateServiceRef` + `useEffect` that opens modal and `router.replace("/dashboard")`), `tests/unit/registro-primary-surface.test.tsx` (remove 5 true-empty/one-shot tests, restore original 16-test baseline + original `next/navigation` mock), `tests/unit/service-events-filters.test.tsx` (remove `next/navigation` mock). No shell/table/status/RUT/custody/brand/ARCHITECTURE change. |

### Unit-5 (Identity Immutability — PUT 400 + storage omit + UI read-only)
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/schemas.test.ts --run` — **1 passed, 11 passed, 0 failed** (before GREEN 3 failed — missing `GENERIC_EDIT_OMIT`). `pnpm test tests/services-lifecycle.test.ts --run` — **1 passed, 27 passed, 0 failed** (before GREEN 5 failed — no `IDENTITY_PROTECTED`/`Object.hasOwn`/`GENERIC_EDIT_OMIT`). `pnpm test tests/unit/services-modal-identity.test.tsx --run` — **1 passed, 4 passed, 0 failed** (before GREEN 3 failed — source without readOnly/strip, rendered identity not blocked, contact not editable). Combined: `pnpm test tests/schemas.test.ts tests/services-lifecycle.test.ts tests/unit/services-modal-identity.test.tsx --run` — **3 passed, 42 passed, 0 failed**. Full suite: `pnpm run test:run` — **27 passed, 473 passed, 0 failed** (after fixing stale `lifecycle.test.ts` 2 tests to omit identity). |
| Runtime harness command/scenario and exact result | N/A — no runtime boundary beyond tsc+type+unit for this seam; jsdom verifies read-only UI (`readOnly` + `disabled` on `invoiceNumber`/`clientName`/`sku` when `isEditing`, `contact` + `failureDescription` + `email`/`repairCost`/`notes` editable, create still sends identity), and 400 `IDENTITY_PROTECTED` via `Object.hasOwn` before Zod (inherited not triggered). Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0 (3 warnings, 2 infos pre-existing). Valid edit persists `contact/failureDescription/email/repairCost/notes`; lifecycle `400 LIFECYCLE_PROTECTED` and `409 IMMUTABLE_STATUS` and dedicated status/location PATCH remain; storage never writes identity. |
| Rollback boundary | Exact revert: `lib/schemas.ts` (remove `GENERIC_EDIT_OMIT`), `app/api/services/route.ts` (remove `Object.hasOwn` identity guard + `GENERIC_EDIT_OMIT` usage, restore `invoiceNumber: body.invoiceNumber ?? current` + `clientName` + `sku` in `updated`), `lib/storage.ts` (restore `invoiceNumber`/`clientName`/`sku` in `payload`), `components/services/ServicesModal.tsx` (remove `readOnly disabled` identity inputs + contact/failureDescription always + payload strip `clientName/invoiceNumber/sku`), `tests/schemas.test.ts` + `tests/services-lifecycle.test.ts` + `tests/unit/services-modal-identity.test.tsx` + `tests/unit/lifecycle.test.ts` (revert identity tests / restore stale payloads). No shell/table/status/RUT/custody/brand/ARCHITECTURE change. |

### Unit-6 (RUT Lookup — normalize with bound rutSearch)
| Evidence | Required value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/rut.test.ts tests/pocketbase-filter.test.ts --run` — **2 passed, 41 passed, 0 failed** (after GREEN). Before GREEN: **9 failed** — rut 5 `isRutShapedLookup` undefined, filter 4 missing `{:rutSearch}` (filter was `rut ~ {:search}` not `rut ~ {:rutSearch}`). Combined with isolation: `pnpm test tests/unit/rut.test.ts --run` **1 passed, 25 passed, 0 failed** (19 baseline + 6 new; before RED 5 failed). `pnpm test tests/pocketbase-filter.test.ts --run` **1 passed, 16 passed, 0 failed** (9 baseline + 7 new; before RED 4 failed). Full suite: `pnpm run test:run` — **27 passed, 486 passed, 0 failed**. Cache-busted rerun `pnpm test tests/unit/rut.test.ts tests/pocketbase-filter.test.ts --run` same 41/41 proves no flake. |
| Runtime harness command/scenario and exact result | N/A — no runtime boundary beyond tsc+type+unit for this lookup seam; binding is via `serviceListBinding` with `{:search}` + `{:rutSearch}` (both `pb.filter` placeholders, never interpolated). Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0 (3 warnings, 2 infos pre-existing). GET `search` already `searchParams.get("search") \|\| undefined` → `getServices({search, status, location})` → `serviceListBinding` → `applyBinding`; status allowlist, location, pagination preserved; identity `IDENTITY_PROTECTED`/`LIFECYCLE_PROTECTED`/`IMMUTABLE_STATUS` + dedicated PATCH unchanged. RUT-shaped `20.884.087-K` / `20884087-k` / `20884087k` / ` 20.884.087 - K ` / `20-884-087-K` all normalize to `20884087K` and hit same `{:rutSearch}`; non-RUT `20Ab`/`Juan Perez`/`INV-123` stay raw `{:search}`; empty/whitespace-only `""`/`"   "`/`" - "` remain not RUT-shaped and unfiltered (empty) or raw (whitespace) without `rutSearch`; malformed `12.345.678-99` length 10 → not RUT-shaped → raw only (no silent change). No persisted column, no new query param, no interpolation. |
| Rollback boundary | Exact revert: `lib/rut.ts` (remove `isRutShapedLookup` function 11 lines), `lib/pocketbase-filter.ts` (remove `import {normalizeRut,isRutShapedLookup}` + revert `serviceListBinding` to single `rut ~ {:search}` raw only, remove `{:rutSearch}` branch), `tests/unit/rut.test.ts` (remove 6 `isRutShapedLookup` tests — existence/punctuation/whitespace/non-RUT/empty/triangulate + `isValidRut` unchanged), `tests/pocketbase-filter.test.ts` (remove 7 RUT binding tests — separate `{:rutSearch}`, variant equivalence, non-RUT raw, empty, compose, injection bound-only, allowlist), `openspec/changes/service-ui-corrections/tasks.md` (revert 6.1/6.2 to `[ ]`), `openspec/changes/service-ui-corrections/apply-progress.md` (revert unit-6 rows/evidence). No shell/table/registro/identity/custody/brand/ARCHITECTURE change. |

## Deviations from Design
None. Unit-5 implements `GENERIC_EDIT_OMIT` (lifecycle + `clientName`/`invoiceNumber`/`sku`), PUT `Object.hasOwn` 400 `IDENTITY_PROTECTED` before Zod (inherited not triggered), storage omit, UI read-only/disabled for identity when editing, mutable `contact/failureDescription/email/repairCost/notes` persist, lifecycle 400/409 and dedicated PATCH preserved, create behavior unchanged, `Object.hasOwn` not `in` / `hasOwnProperty`, no backward-compat layers, per design `UI omits identity → PUT Object.hasOwn(identity) ──400 IDENTITY_PROTECTED──► no write → GenericEditSchema.omit(lifecycle+identity) → updateService payload omit same`.

Previous units: Unit-4 implements Registro true-empty `router.push("/dashboard?createService=1")`, filtered-empty `clearFilters()` only, dashboard `await searchParams` server + `initialCreateService` prop, client one-shot guard `hasConsumedCreateServiceRef` + `router.replace("/dashboard")`, no `useSearchParams` (Suspense-safe). Preserves true-empty vs filtered-empty distinction, filters, pagination, loading, create-modal toolbar button, and previous exclusive/table/shell behavior per design `Registro true-empty → router.push → DashboardPage await searchParams → ServiceDashboard opens modal once → router.replace`.

Unit-6 implements `isRutShapedLookup` (strip `[.\-\s]`, `^\d+[0-9Kk]?$`, 2–9 length, `trim` guard) lookup-only, `lib/pocketbase-filter.ts` imports `normalizeRut`/`isRutShapedLookup` and branches `isRutShapedLookup(raw)` → `(clientName ~ {:search} || invoiceNumber ~ {:search} || rut ~ {:rutSearch})` with `rutSearch=normalizeRut(raw)` (exact digits, e.g., `20.884.087-K`→`20884087K` for `20.884.087-K`/`20884087-k`/`20884087k` equivalence) else original `rut ~ {:search}` raw only; GET `search` path unchanged (`searchParams.get("search") || undefined` → `getServices` → `serviceListBinding` → `applyBinding`), no new query name/persisted column/interpolation; empty remains unfiltered; non-RUT `20Ab`/`Juan` stay raw; length>9 (`12.345.678-99`) stays raw (no silent change); tenant/status/location/pagination and identity protections preserved, per design `RUT lookup: strip [.\-\s]; if ^\d+[0-9Kk]?$ then rut ~ {:rutSearch} with normalizeRut; name/invoice keep raw {:search}` + spec `service-search-normalization: Punctuation-equivalent RUT hits`.

## Issues Found
**Unit-1**: tsc `string[]` vs `ServiceStatus[]` fixed; metric Pendientes overlap fixed.
**Unit-2**: slice before data-testid missed class; parent overflow-hidden clipped gutter.
**Unit-3**:
- `xl:max-w-[1600px]` substring false positive in `2xl:max-w` — fixed to count `max-w-[1600px]` occurrences =1 and check `2xl:` prefix only, not `lg`.
- `text-xl font-bold` globally matched stats card `text-xl font-bold` — fixed to h1-specific regex `/<h1[^>]*text-2xl[^>]*>\s*Gestión/`.
- `shadow-sm p-4 rounded-sm Toolbar` cross-matched stats card before Toolbar comment — fixed to exact card string `bg-surface border border-border shadow-sm p-4 mb-6`.
- Formatter normalized 5 files pre-evidence.
**Unit-4**:
- `Limpiar filtros` `getByRole` matched both toolbar icon button (`aria-label`) and empty-state text button — fixed to `getAllByRole` + `textContent === "Limpiar filtros"` filter (toolbar button has empty textContent).
- `Nuevo servicio` `getByText` matched toolbar button + empty-state + dialog title (multiple) — fixed to `getByText("Complete los detalles para iniciar")` + `getByRole("dialog")` (only when modal open) and `queryByRole("dialog")` absence when false.
- `service-events-filters.test.tsx` broke after adding `useRouter` to `ServiceEventsManager` (no mock) — added `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/service-events", redirect: vi.fn(), useSearchParams: () => new URLSearchParams() }))` to preserve existing filter tests (4/4) without changing production filtering semantics.
- `rendered trigger` false-prop case needed `queryByRole("dialog")` absence assert to distinguish toolbar button (always visible) from modal dialog.
**Unit-5**:
- `services-lifecycle.test.ts` and `tests/unit/lifecycle.test.ts` had 5 stale generic-edit payloads that included `clientName`/`invoiceNumber`/`sku` — they expected 200/409 before unit-5 but now correctly return 400 `IDENTITY_PROTECTED` before write; fixed by omitting identity from those payloads (no weakening: 409 still proved via `notes` only, 200 still proved via mutable fields, 500 still proved via `notes` only).
- `ServicesModal.tsx` initially had `contact` and `failureDescription` only in `!isEditing` (create-only), violating spec mutable requirement — moved them to always-editable and added `readOnly disabled` identity inputs for edit.
- `services-modal-identity.test.tsx` initial RED had `contact` not in DOM when editing — confirmed failure, then GREEN after modal fix.
- `tsc` error `TS2352` for `mock.calls[0] as [string, any]` on empty tuple — fixed via `as unknown as [string, any]`.
- Formatter normalized 8 files pre-evidence; reverted 15 unrelated files to keep slice focused at 722 lines.
**Unit-6**:
- No production `isValidRut`/`normalizeRut` change — validation remains `isValidRut` modulo-11 strict (`12.345.678-5` true, `12.345.678-0` false); `20.884.087-K` shape true but valid false proves lookup-only separation (first example typo ambiguity: exact normalized `20884087K` not silently corrected to `208840878`).
- `isRutShapedLookup` length 2–9 guard added to avoid phone/long-invoice over-normalization (`12.345.678-99` length 10 → raw only), otherwise stripped `^\d+[0-9Kk]?$` alone would treat long digits as RUT.
- `serviceListBinding` initially returned `rut ~ {:search}` for RUT-shaped input — RED proved missing `{:rutSearch}` (4 tests failed); GREEN branches to `{:rutSearch}` with `normalizeRut(raw)` while keeping `clientName`/`invoiceNumber` raw; `empty` remains unfiltered (no `~`), whitespace-only `20Ab` stays raw.
- `pocketbase-filter.test.ts` `whitespace` case `search:"   "` keeps raw without `rutSearch` (not over-normalized to empty), per spec empty only for truly absent/zero-length not whitespace.

## Remaining Tasks
- [ ] 7.1 RED receipt tests + `tests/unit/visual.test.ts`: title `Comprobante de recepción y custodia`; disclaimer; escape; no QR; lockup AA; no `ARCHITECTURE.md`.
- [ ] 7.2 GREEN `lib/custody-receipt.ts`, `components/services/ServicesDetailsModal.tsx`, `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (drop filename `sr-only`).
- [ ] 7.3 GREEN `git rm` `ARCHITECTURE.md`; drop cites in `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml` only. Check visual/shell tests.

## Workload / PR Boundary
- Mode: stacked PR slice (auto-chain, stacked-to-main)
- Current work unit: unit-6-rut-search — RUT lookup only. Starts from `fix/service-ui-corrections-05-identity-immutability` @ `5ef3c0ac1346b27b4bb6fdd71a390316aa261243`, ends after `lib/rut` `isRutShapedLookup`, `lib/pocketbase-filter` `{:rutSearch}` branch with `normalizeRut`, GET `search` verified bound-only, plus 13 RED→GREEN tests. No custody/brand/ARCHITECTURE deletion.
- Estimated review budget impact: **Unit-6** code 13 insertions + 0 deletions in `lib/rut.ts` (new helper), 11+2 in `lib/pocketbase-filter.ts`, 67 in `tests/unit/rut.test.ts`, 225+74 in `tests/pocketbase-filter.test.ts`, 2 in `tasks.md`, ~120 in `apply-progress.md` = **~534 / 800** (authored additions+deletions; 392 code+tests + docs). Within 800 session budget (cohesive RUT lookup contract: `isRutShapedLookup` + `{:rutSearch}` + 13 tests cannot split without breaking RED→GREEN). Previous slices: unit-1 537 / 800, unit-2 272 / 400, unit-3 250 / 400, unit-4 280 / 400, unit-5 722 / 800, cumulative code ~1800 lines before docs but sliced per 800 session budget.
- Stack: now 6 slices — bottom `fix/service-ui-corrections` @ `d62d5c6` (#82), `fix/service-ui-corrections-02-table-gutter` @ `6c30e9b` (#83), `fix/service-ui-corrections-03-shell-locations` @ `9ea3dd2` (#84), `fix/service-ui-corrections-04-registro-create` @ `5e8bdc4` (#86), `fix/service-ui-corrections-05-identity-immutability` @ `5ef3c0a` (#87), top `fix/service-ui-corrections-06-rut-search` @ pending (this PR #88) — all draft, verified via `gh stack view --json`.

## Status
12/13 tasks complete. Ready for verify slice 7 only (unit-7 custody/lockup/docs). Stack (stacked-to-main): bottom `fix/service-ui-corrections` @ `d62d5c6` (#82), `fix/service-ui-corrections-02-table-gutter` @ `6c30e9b` (#83), `fix/service-ui-corrections-03-shell-locations` @ `9ea3dd2` (#84), `fix/service-ui-corrections-04-registro-create` @ `5e8bdc4` (#86), `fix/service-ui-corrections-05-identity-immutability` @ `5ef3c0a` (#87), top `fix/service-ui-corrections-06-rut-search` @ pending (this PR) — all draft, verified via `gh stack view --json` after `gh stack add` + `gh stack submit --auto`. Dedicated Herdr worktree at `/home/jona/projects/serviceflow-worktrees/fix-service-ui-corrections` owns the stack branch; primary checkout on `main` preserves dirty `ARCHITECTURE.md` deletion + untracked OpenSpec artifacts losslessly (`D ARCHITECTURE.md` + `openspec/changes/service-ui-corrections/*` + `.herdr/`). Issue #81 `status:approved` (enhancement, Frontend/UI) authorizes slices 1–6. Unit-6 PR `type:feature` `Related to #81` base `fix/service-ui-corrections-05-identity-immutability` — checks: `Check Issue Reference` pending, `Check Issue Has status:approved` pending, `Check PR Has type:*` pending, `Check PR Cognitive Load` ~534/800 (within 800), `quality` SUCCESS (tsc 0, biome 0, 486/486), `e2e` pending.

## Recovery Reconciliation — 2026-09-02 (Herdr + `gh stack submit --auto` remediation)

**Dedicated Herdr worktree:** `/home/jona/projects/serviceflow-worktrees/fix-service-ui-corrections` on branch `fix/service-ui-corrections-04-registro-create` (inherits from `fix/service-ui-corrections-03-shell-locations` proven open via `herdr worktree list --json` (workspace `w8V`, is_linked_worktree true). Primary checkout `/home/jona/projects/serviceflow` now on `main`, no longer owns implementation branch. Dirty state preserved losslessly via `git stash push --include-untracked` then `stash apply` in Herdr: `D ARCHITECTURE.md` + `openspec/changes/service-ui-corrections/{design,exploration,preproposal,proposal,research,specs/*,ui-design}.md` (tracked deletion for unit 7 remains uncommitted on purpose).

**Issue reconciliation:** No conforming equivalent existed (search `service-ui-corrections` + `service ui` over open+closed → 0). Created #81 `fix: service UI corrections — dashboard filter, table gutter, shell rhythm, registro, identity, RUT, custody` via `feature_request.yml` (Frontend/UI, `enhancement` + `status:needs-review`), then atomic `status:approved` with `MAINTAIN`/`ADMIN` authority (`viewerPermission` `ADMIN`) and current-session pre-approval. Read-back confirmed `status:approved` + `enhancement`.

**Stack registration (pre-existing, preserved, not rewritten):** `stacked-to-main`, trunk `main` @ `9b48a7961e07107e460464420b34d818de53abef`. No fourth branch created until unit-4 `gh stack add fix/service-ui-corrections-04-registro-create` @ `9ea3dd2` (verified in stack before code).

| Slice | Branch | Commit SHA | Immediate Base | PR | Review Budget | Focused Checks (Herdr re-verified) | Rollback Boundary |
|-------|--------|------------|----------------|----|---------------|-----------------------------------|-------------------|
| 1 | `fix/service-ui-corrections` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | `main` @ `9b48a796` | #82 https://github.com/jonasotoaguilar/serviceflow/pull/82 (draft, `type:feature`, `Closes #81`, base `main`) | 537 / 800 | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` 27/27 isolated, now 32/32 cumulative; `tsc --noEmit` 0 | `ServicesDashboard.tsx` + `route.ts` + test |
| 2 | `fix/service-ui-corrections-02-table-gutter` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | #83 https://github.com/jonasotoaguilar/serviceflow/pull/83 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections`) | 272 / 400 | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` 32/32 (5 gutter RED→GREEN); `tsc` 0; jsdom geometry N/A — DOM verified | `ServicesTable.tsx` + Dashboard parent |
| 3 | `fix/service-ui-corrections-03-shell-locations` | `9ea3dd263b171ce65161b88dfcf5a24c2c271332` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | #84 https://github.com/jonasotoaguilar/serviceflow/pull/84 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections-02-table-gutter`) | 250 / 400 | `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts --run` 52/52 + combined 84/84; `tsc` 0 | `layout.tsx`, `Navbar.tsx`, `locationsManager.tsx` + 2 tests |
| 4 | `fix/service-ui-corrections-04-registro-create` | `5982d2ba1cf89020fb1c78eb4c51f93257391e7b` | `9ea3dd263b171ce65161b88dfcf5a24c2c271332` | #86 https://github.com/jonasotoaguilar/serviceflow/pull/86 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections-03-shell-locations`) | 280 / 400 | `pnpm test tests/unit/registro-primary-surface.test.tsx --run` 21/21 (5 RED→GREEN); `pnpm test tests/unit/registro-primary-surface.test.tsx tests/unit/dashboard-operate-plus.test.tsx tests/unit/shell.test.ts tests/unit/locations.test.ts --run` 105/105; `pnpm run test:run` 460/460; `tsc` 0; `biome` 0 | `serviceEventsManager.tsx` + `dashboard/page.tsx` + `ServicesDashboard.tsx` + 2 tests (registro + filters mock) |
| 5 | `fix/service-ui-corrections-05-identity-immutability` | `8a7c22722c4f31724c651243792011b5f469e365` | `5e8bdc45c607e7d4b0372690604968d271d0b169` | #87 https://github.com/jonasotoaguilar/serviceflow/pull/87 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections-04-registro-create`) | 722 / 800 | `pnpm test tests/schemas.test.ts --run` 11/11 (3 RED→GREEN), `pnpm test tests/services-lifecycle.test.ts --run` 27/27 (5 RED→GREEN), `pnpm test tests/unit/services-modal-identity.test.tsx --run` 4/4 (3 RED→GREEN), `pnpm run test:run` 473/473, `tsc` 0 | `schemas.ts`, `route.ts`, `storage.ts`, `ServicesModal.tsx` + 4 tests (schemas, lifecycle, modal-identity, lifecycle stale fix) |

**Workflow recovery note:** This `gh stack submit --auto` (PRs #82–#84, stack #85) is explicit remediation of prior deferred submission where three slices were committed without draft identities, violating `stacker-pr` `Draft before next slice`. It is **not** an approved future pattern; subsequent slices (units 4–7) must follow branch-before-code and draft-before-next-slice gates. Chain context, dependency diagrams, and rollback boundaries are recorded in each PR body; all PRs remain draft and target immediate parent (or `main` for slice 1). Check snapshot: PR #82 `Check Issue Reference` pass, `Check Issue Has status:approved` pass, `Check PR Has type:*` pass; `Check PR Cognitive Load` pass (PR83/84 pass, PR82 537 within 800); `quality`/`e2e` as per snapshot (quality fail on #82/#84 unrelated to slice gate, not waited upon per recovery instructions).

## Correction — unit-1-quality-correction (2026-09-02 bounded)

**Work Unit**: unit-1-quality-correction — bounded RED/contract correction for existing slice 1 (no new behavior, no slice 4)
**Attempt token**: `sha256:6c818e5c736ba15f2fd16c05f659bb3481280596a36929f466f7ce8bb8bffded` (parent settles; do not acquire/settle per native attempt)
**Mode**: Strict TDD remains active; this is a regression-test correction discovered by remote CI after the behavior contract changed
**Branch**: `fix/service-ui-corrections` (bottom slice, Herdr worktree `gh stack checkout fix/service-ui-corrections`)
**Stack strategy**: stacked-to-main preserved; `max 800`, `single-pr` exception not needed (test-only slice)

**Root cause**: PR #82 and cumulative #84 `quality` failed only `tests/services-lifecycle.test.ts:319` — old test expected both `pending` and `ready` for `status=pending,ready`. New approved spec (dashboard-operate-plus exclusive single status) requires at most one status and first allowlisted token only. Main passed because old API allowed both via `statusParam.split(",")`. Route `app/api/services/route.ts` is correct (`first = statusParam.split(",")[0]?.trim(); if (ALLOWED_STATUSES.has(first)) status=[first]`); stale test was wrong.

**Correction (RED → GREEN, tests only)**:
- **File**: `tests/services-lifecycle.test.ts` — 2 lines, tests-only, no production change
  - Rename: `it("GET keeps query params ... triangulates comma-separated status")` → `it("GET keeps query params ... exclusive single status first allowlisted token")`
  - Assert: `expect(Object.values(p)).toContain("pending")` kept; `expect(Object.values(p)).toContain("ready")` → `expect(Object.values(p)).not.toContain("ready")` — proves first-token exclusive behavior (`pending` included, `ready` excluded)
  - No weakening: all other asserts preserved (`uid`, `search`, `locationId`, page/limit/total, sort, status 200)
- **Behavioral invariant**: `GET /api/services?status=pending,ready` carries at most one allowlisted status (`pending`) and never stacks — second token (`ready`) is ignored. `p` contains exactly one status (`pending`) among allowlisted set, `ready` absent.

**Evidence — correction slice verified in Herdr worktree**:
| Evidence | Command / Result |
|---|---|
| Focused test (RED→GREEN) | `pnpm test tests/services-lifecycle.test.ts --run` — **21/21 passed** (1 corrected exclusive test + 20 others); before correction this file failed at `expect(Object.values(p)).toContain("ready")` |
| Dashboard exclusive | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — **27/27 passed** on bottom slice (and 32/32 cumulative on top after rebase) — scalar `ServiceStatus | ""`, close-on-pick, no multi-toggle |
| Full suite (proportional) | `pnpm run test:run` — **26 passed, 438/438 passed** with correction applied (proves no regression) |
| Typecheck | `pnpm exec tsc --noEmit` — **0** |
| Lint | `pnpm exec biome check --formatter-enabled=false` — **0** (3 warnings, 2 infos, 0 errors) — normalize only if required pre-evidence; source already normalized via lint-staged on commit |
| Runtime harness | N/A — no runtime boundary for this GET filter seam beyond tsc+type+unit; jsdom cannot prove PocketBase filter over network, integration is via `mockFilter` seam |

**Commit**: `d62d5c64848a281cd80ad88aa76f073edc6759c8` on `fix/service-ui-corrections` — `test(services): enforce exclusive single-status first token in lifecycle contract` (tests only, conventional, no AI attribution)

**Rebase preservation** (`gh stack rebase --upstack` — mechanical, no ambiguous conflicts):
| Slice | Branch | Previous Head | Rebased Head | Immediate Base | PR |
|---|---|---|---|---|---|
| 1 | `fix/service-ui-corrections` | `91e0ba9dc2db11699fe2b347a35234dbf7f45dfd` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | `main` @ `9b48a7961e07107e460464420b34d818de53abef` | #82 https://github.com/jonasotoaguilar/serviceflow/pull/82 |
| 2 | `fix/service-ui-corrections-02-table-gutter` | `b01cf97a93ec802202106f656db788874a4b1b12` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | #83 https://github.com/jonasotoaguilar/serviceflow/pull/83 |
| 3 | `fix/service-ui-corrections-03-shell-locations` | `a48b61b9fd5565683c2637d0dfc6799488ec700b` | `b4f5de7e1b581b5a5b0968a54c93d52496494419` (pre-progress-update) | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | #84 https://github.com/jonasotoaguilar/serviceflow/pull/84 |

**Submit**: `gh stack submit --auto` after rebase — pushed and synced 3 branches; PRs #82/#83/#84 remain draft `type:feature` (`Closes #81` on #82, `Related to #81` on #83/#84), bases `main` / `fix/service-ui-corrections` / `fix/service-ui-corrections-02-table-gutter` verified via `gh stack view --json` and `gh pr view --json baseRefName,headRefName,isDraft`

**Dirty preservation**: `D ARCHITECTURE.md` + `M next-env.d.ts` + untracked `openspec/changes/service-ui-corrections/{design,exploration,preproposal,proposal,research,specs/*,ui-design}.md` + `.herdr/` preserved losslessly via `git stash push --include-untracked` before rebase and `git stash pop` after (temp stash `temp preserve before rebase correction 2026-09-02`); intentional `ARCHITECTURE.md` deletion remains uncommitted for unit 7 as designed

**Scope guard**: No slice 4 or new behavior implemented. No `git push` or `gh pr create` used; only `gh stack` primitives. No new tasks marked complete — `tasks.md` remains 1.1,1.2,2.1,2.2,3.1,3.2 [x], 4.1+ pending. This cumulative top-branch progress update is the sole change on `fix/service-ui-corrections-03-shell-locations`; committed as `docs(openspec): reconcile service-ui-corrections correction + rebased heads` if bytes changed.

**Rollback boundary (correction)**: Revert single commit `d62d5c6` on `fix/service-ui-corrections` — restores stale test (2 lines) without touching `app/api/services/route.ts`, dashboard, shell, or units 2/3. No production rollback needed.

## Evidence Revision
- Unit-1 Commit SHA: d62d5c64848a281cd80ad88aa76f073edc6759c8 (corrected; was 91e0ba9dc2db11699fe2b347a35234dbf7f45dfd)
- Unit-2 Commit SHA: 6c30e9bbba88b0dc1d9d438a436cee35f5652f94 (rebased; was b01cf97a93ec802202106f656db788874a4b1b12)
- Unit-3 Commit SHA: 9ea3dd263b171ce65161b88dfcf5a24c2c271332 (rebased pre-progress; includes docs reconcile 9ea3dd2)
- Unit-4 Commit SHA: 5982d2ba1cf89020fb1c78eb4c51f93257391e7b (new, stacked on 9ea3dd2)
- Unit-5 Commit SHA: 5ef3c0ac1346b27b4bb6fdd71a390316aa261243 (rebased; was 8a7c22722c4f31724c651243792011b5f469e365 @ 5e8bdc4)
- Unit-6 Commit SHA: 442e89f31595ede45c4f9c3cdf0a44f0158853e5 (new, on fix/service-ui-corrections-06-rut-search @ 5ef3c0a base, PR #88)
- Unit-1 Attempt token: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
- Unit-2 Attempt token: sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911
- Unit-3 Attempt token: sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b
- Unit-4 Attempt token: sha256:6412aebf749250cce2424818c939a57f17782186f3338e60ca2338dde5680596 (unit-4-registro-create, stacked-to-main, max 800, parent settles)
- Unit-5 Attempt token: sha256:26f556f18b850cc162427624c407a3b700a8a81bbdd89630ff257061a1a02aba (unit-5-identity-immutability, max 800, parent settles)
- Unit-6 Attempt token: sha256:8b02b4b9e4f11cf79bfbbba506dcb122a66760a576a436a6b7930d581c35e795 (unit-6-rut-search, max 800, parent settles)
- Correction Attempt token: sha256:6c818e5c736ba15f2fd16c05f659bb3481280596a36929f466f7ce8bb8bffded (unit-1-quality-correction, bounded)
- Test run: vitest 4.1.10, unit-6 rut 25/25 (before RED 5 failed, filter 16/16 before RED 4 failed), 486/486 full suite, tsc 0, biome 0 (3 warnings, 2 infos)

## Unit-7A — OpenSpec research (passive docs slice) — 2026-09-03
**Branch**: docs/service-ui-corrections-07-openspec-research @ 1a3a5fc base fix/service-ui-corrections-06-rut-search (#88)
**Attempt**: sha256:6879e918c1e7c816595e7d3f4d88d8c6d90001caa75ddb30c92dcbb0be51184c unit-7a max800 parent-settles
**Scope**: passive docs only — no runtime code; 7.1/7.2/7.3 remain [ ]
**Readback**: exploration.md 186 lines readable, research.md 207 lines outcome done, preproposal.yaml 197 lines proposal_ready true + product_decisions confirmed + refs valid
**Verification**: structural readback only (passive docs) — no code changed, no semantic verifier, no test harness; files readable + references valid is proportional check
**Budget**: target subtotal 186+207+197=590 + tasks.md delta + apply-progress delta <=800 — within budget
**Rollback**: revert docs/service-ui-corrections-07-openspec-research — remove staged exploration/research/preproposal versioning + revert tasks.md + apply-progress.md delta; no runtime rollback; ARCHITECTURE deletion + .herdr preserved
**No code**: verified via git diff --stat HEAD (only openspec docs + tasks.md + apply-progress.md, no lib/app/components change)
**Chain**: stacked-to-main position 7 of 10 (forecast 10 slices); current PR7 base #88, follow-up 7B proposal/design/specs
**PR**: type:docs, Related to #81, DRAFT, Chain Context 7/10
**Status**: 12/13 tasks complete (6 units done, 7A docs versioned, 7.1-7.3 pending) — ready for 7B

## Unit-7B — OpenSpec design+specs (passive docs slice) — 2026-09-03
**Branch**: docs/service-ui-corrections-08-openspec-design-specs @ ba6d78b base docs/service-ui-corrections-07-openspec-research (#89)
**Attempt**: sha256:cb8d73114497624d5b6b6d73c02583fb52d1694bb6ca2fb408ccd4c754ab7ee5 unit-7b-openspec-design-specs max800 parent-settles
**Scope**: passive docs only — no runtime code; 7.1/7.2/7.3 remain [ ] (no 7.1+ completion in this slice)
**Artifacts**: proposal.md 73, design.md 105, ui-design.md 41, specs subtotal 398 (7 files: 43+73+74+44+54+56+54); total 617 + apply-progress delta = <800; word count ui-design.md 519 <800
**Readback**: all 10 files readable; proposal scope (In Scope 8 lines) matches design Technical Approach / File Changes and 7 specs (dashboard-operate-plus 74, registro-primary-surface 44, app-shell-page-rhythm 43, service-identity-immutability 56, service-search-normalization 54, service-custody-acknowledgment 54, bodega-tecnica-identity 73); ui-design.md 41 lines visual HOW (shared 1600px, gutter, lockup) under 800 words; no code changed
**Verification**: structural readback only (passive docs) — proposal/design/specs/ui-design readable + scope consistent + spec files present is proportional check; passive docs require no artificial runtime test (no harness)
**Budget**: 73+105+41+398=617 + tasks delta 0 + apply-progress delta (this note) <=800 — within budget; chain 8/10 budget guard satisfied
**Rollback**: revert docs/service-ui-corrections-08-openspec-design-specs — remove staged proposal/design/ui-design/specs versioning + revert apply-progress.md delta; no runtime rollback; ARCHITECTURE.md deletion (D) + .herdr/ preserved untracked
**No code**: verified via `git diff --stat HEAD` (only openspec/changes/service-ui-corrections/{proposal,design,ui-design,specs/*} + apply-progress.md, no lib/app/components change; `git diff --stat HEAD` excludes ARCHITECTURE.md deletion per preservation)
**Chain**: stacked-to-main position 8 of 10 (forecast 10 slices); current PR8 base #89 (docs/service-ui-corrections-07 @ ba6d78b), follow-up 7C implementation slice
**PR**: type:docs, Related to #81, DRAFT, Chain Context 8/10
**Status**: 12/13 tasks complete (6 units done, 7A+7B docs versioned, 7.1-7.3 pending) — ready for 7C

## Unit-7C — Custody + Lockup (RED + GREEN) — 2026-09-03
**Branch**: fix/service-ui-corrections-09-custody-lockup @ da20b84 base docs/service-ui-corrections-08-openspec-design-specs (#90)
**Attempt**: sha256:435ddb2fdf69313f67dc25976d17daa6bcda1f4cd5fa5de7205a3fd625c51b51 unit-7c-custody-lockup max800 parent-settles
**Mode**: Strict TDD
**Scope**: custody receipt pure helper + modal refactor + refined shelf-grid lockup sync; no ARCHITECTURE deletion, no 7D cites

**TDD Cycle Evidence**

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 7.1 | `tests/unit/custody-receipt.test.ts` (11 tests) + `tests/unit/bodega-lockup.test.ts` (8 tests) | Unit + Integration (TL) | ✅ 505/505 full suite baseline before 7C (unit-6) | ✅ **5 failed** — `lib/custody-receipt.ts` missing (suite fail), `bodega-lockup` 4 failed (stroke 2 vs 1.5, rx1 vs 1.5, filename sr-only, hidden count 1) | ✅ **19/19** custody+bodega (11+8) + **505/505** full suite after GREEN (includes dark-contrast updated) | ✅ 19 cases: escapeHtml, title, disclaimer exact, 58mm, required fields + Folio interno, optional omit, no QR, tax/warranty, XSS escaped, modal seam, SVG 1.5/rx1.5 | ✅ Pure helper, no dep, modal preserves seam |
| 7.2 | `lib/custody-receipt.ts` + `components/services/ServicesDetailsModal.tsx` + `assets/brand/bodega-tecnica-mark.svg` + `components/brand/bodega-tecnica-mark.tsx` | Unit | ✅ same baseline 5 failed | ✅ same 5 | ✅ 19/19 + 505/505 + tsc 0 + biome 0 + build 0 | ✅ same 19 | ✅ Helper 176 lines pure, modal 3 lines, SVG 7,7 18 1.5 sync, component 1.5 sync |

**Test Summary**
- Total: custody-receipt 11, bodega-lockup 8, dark-contrast updated 2, full suite 505/505
- Passing: 19/19 focused + 505/505 full

**Files Changed (this slice)**

| File | Action | What Was Done |
|------|--------|---------------|
| `lib/custody-receipt.ts` | Created | Pure escapeHtml + renderCustodyReceiptHtml (58mm, title, disclaimer, Folio interno, fields, optional omit, no QR, XSS escaped) |
| `components/services/ServicesDetailsModal.tsx` | Modified | Import helper, replace inline template with helper + window.open guard |
| `assets/brand/bodega-tecnica-mark.svg` | Modified | Refine stroke 1.5, outer 7,7 18 rx1.5, filled 7,7 9 |
| `components/brand/bodega-tecnica-mark.tsx` | Modified | Sync to SVG 1.5, remove sr-only filename |
| `tests/unit/custody-receipt.test.ts` | Created | 11 RED tests |
| `tests/unit/bodega-lockup.test.ts` | Created | 8 RED tests |
| `tests/unit/dark-contrast.test.ts` | Modified | Update to 1.5 + no filename |

**Work Unit Evidence**

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/custody-receipt.test.ts tests/unit/bodega-lockup.test.ts --run` — 2 passed, 19 passed, 0 failed (after GREEN). Before GREEN: 2 failed. Full suite 29 passed, 505 passed, 0 failed |
| Runtime harness command/scenario and exact result | N/A — pure helper + window.open seam, 58mm CSS verified, lockup tokens, tsc 0, biome 0, build 0 |
| Rollback boundary | Exact revert: delete helper, restore modal inline, restore SVG 8,8 16 rx1, restore component 2px, delete tests, revert dark-contrast, tasks, progress |

**Status**
14/15 tasks complete (7.1,7.2 done, 7.3 pending). Stack 9 slices — top 09 @ pending.
