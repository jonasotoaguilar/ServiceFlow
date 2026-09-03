# Exploration: service-ui-corrections

## Current State

ServiceFlow is a Next.js 16 (App Router) + React 19 + Tailwind 4 + PocketBase operational tool. Authenticated shell is `app/(app)/layout.tsx` (`min-h-dvh`, `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`, `Navbar` at `h-16` + 1px border). Three pages share the shell: **Services** (`/dashboard` via `ServicesDashboard` + `ServicesTable` + `ServicesModal` + `ServicesDetailsModal`), **Registry** (`/service-events` via `ServiceEventsManager`), and **Locations** (`/locations` via `LocationsManager`). Visual direction is decided: **Taller Claro Operacional** is incumbent-only; **Bodega Técnica / ServiceFlow** is the future authority (`DESIGN.md` alphas, `openspec/specs/bodega-tecnica-identity/spec.md`, `PRODUCT.md` platform=web). Brand mark exists as shelf-grid SVG (`assets/brand/bodega-tecnica-mark.svg` ↔ `components/brand/bodega-tecnica-mark.tsx` inline SVG, `Navbar` → `BodegaTecnicaMark`). Recent deltas `dashboard-operate-plus`, `registro-filter-visibility`, `bodega-tecnica-identity` are archived specs whose contracts must be preserved. `ARCHITECTURE.md` (140 lines) is intentionally deleted on this branch (`git status` shows `D ARCHITECTURE.md` unstaged, `git diff --stat HEAD` confirms 1 file, 140 deletions); prior history shows it was superseded by `PRODUCT.md`/`DESIGN.md` + PocketBase spec artifact.

**Behavioral invariants already enforced:**
- Tenant isolation: every list binds `userId = {:uid}` via `serviceListBinding`/`locationListBinding`/`serviceEventListBinding` + `applyBinding(pb, binding)`; PocketBase API rules enforce `userId=@request.auth.id`; invalid `POCKETBASE_URL` fail-closed.
- Service lifecycle: `pending → ready → completed` (immutable) / `cancelled` fills `cancellationDate`; status/location/date mutations are forbidden via generic `PUT /api/services` (`LIFECYCLE_PROTECTED` 400, `IMMUTABLE_STATUS` 409); dedicated `PATCH /api/services/[id]/status` and `/transfer` with `Idempotency-Key` + `canTransition`/`transitionDates` own those mutations. `updateService` in `lib/storage.ts:253` throws on `completed` and omits lifecycle fields from payload.
- Search contract: `serviceListBinding` implements `(clientName ~ {:search} || invoiceNumber ~ {:search} || rut ~ {:search})`; RUT validation is strict via `lib/rut.ts` (`normalizeRut` strips `[.\-\s]` + uppercases K, `isValidRut` módulo-11); persistence via `lib/schemas.ts:28-37` transforms then refines.
- Validation: Zod at every edge (`ServiceSchema`, `LocationCreateSchema`, login/register, `PocketBaseEnvSchema`); server `POST/PUT /api/services` validate before writes.
- UI loading: Boneyard exact-layout skeletons (`boneyard.config.json` breakpoints `[375,768,1280]`, `src/bones/`), `Skeleton` wrapper for initial empty load, `aria-busy` overlay for populated refetch (verified in `ServicesDashboard:586` and `ServiceEventsManager:386`).

## Affected Areas

- `components/services/ServicesDashboard.tsx:57` — multi-select status filter (`statusFilter: ServiceStatus[]`, `toggleStatusInFilter`, `getSelectedLabel`, query `statusFilter.join(",")` → `GET /api/services?status=`) must become single-select; toolbar layout, filter binding, and query semantics live here; call path `DashboardPage → ServiceDashboard → ServiceTable/ServiceModal/ServiceDetailsModal/ConfirmationDialog/Dialog`.
- `lib/pocketbase-filter.ts:23` — `serviceListBinding` + `ALLOWED_STATUSES`; search normalization seam; currently `rut ~ {:search}` without normalized input; status array handling must remain compatible with single value.
- `lib/rut.ts:13` — `normalizeRut`/`isValidRut` single source of truth; search must reuse `normalizeRut` for lookup while persistence keeps `isValidRut` strict (no weakening).
- `lib/schemas.ts:18` — `ServiceSchema` RUT field (`transform(normalizeRut).pipe(refine(isValidRut))`); edit protection set (`GenericEditSchema` omits `status, locationId, deliveryDate, readyDate, cancellationDate`); must extend to `clientName, invoiceNumber, sku`.
- `app/api/services/route.ts:9,39,125` — `GET` (status parsing via `split(",")`), `POST` (force `status:"pending"`), `PUT` (protects lifecycle fields → 400, preserves status/locationId from `current`, checks `completed|canceled` → 409); must add `clientName/invoiceNumber/sku` to protected→400 set and merge path.
- `lib/storage.ts:21,253` — `getServices` (delegates to `serviceListBinding`), `updateService` (payload intentionally omits lifecycle, currently still ships `invoiceNumber, clientName, sku`); must omit immutable identity fields.
- `components/services/ServicesModal.tsx:14,85` — `serviceSchema` (local duplicate of `ServiceSchema` with phone regex, required RUT string check only), `calculateStatusDates`, `performSubmit` (strips `status, locationId, readyDate, deliveryDate, cancellationDate` for edits); must add immutable UI treatment: when `ServiceToEdit` present, `clientName, invoiceNumber, sku` rendered read-only or hidden, not submitted; mutable fields remain `contact, failureDescription, email, repairCost, notes`.
- `components/services/ServicesTable.tsx:50` — 8-column table (`Boleta 12ch, Producto 20ch, Cliente 18ch, Sede, Ingreso 12ch, Días, Estado, Acciones` 5x `IconButton`); container is `hidden md:block custom-scrollbar` inside `ServicesDashboard:586` `overflow-hidden` parent → no visible horizontal scroll; rightmost action group can clip below ~1280–1366; mobile fallback `md:hidden space-y-3 p-4` card list exists. Call path `ServiceDashboard → ServiceTable → IconButton`.
- `components/services/ServicesDetailsModal.tsx:16,57` — receipt `handlePrint` opens `window.open("", "_blank")` and writes 58mm thermal HTML (`Comprobante de Servicio #invoice`, client/rut/contact/product/sku/dates/location/failure/notes/costSection); copy currently safe but thin on custody semantics, disclaimer, and legally-precise language; no SII/boleta fiscal claim yet.
- `app/(app)/service-events/serviceEventsManager.tsx:71` — Registry page: headline `Registro` `text-2xl` + mono count, filter strip `border-y bg-surface/50 px-4 py-3`, always-visible per `registro-filter-visibility` spec; empty-state `PageEmptyState` `actionLabel="Nuevo servicio"` with `handleEmptyAction` that only `clearFilters()` for both `filtered` and `true-empty` (no navigation).
- `app/(app)/locations/locationsManager.tsx:39` — Locations page: `header` is `text-xl font-bold` (diverges from Services/Registry `text-2xl font-semibold tracking-tight`), `headerGap` uses `space-y-2` vs consistent band, `py-4` toolbar vs `py-3` elsewhere, stat card separate; rhythm inconsistent at 1920x1080 where `max-w-7xl` leaves ~320px gutters each side.
- `app/(app)/layout.tsx:8` — shell `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`; governs all three pages; large-screen underuse is shell-level, not per-page.
- `components/brand/bodega-tecnica-mark.tsx:13` + `assets/brand/bodega-tecnica-mark.svg:1` — shelf-frame 32×32 `viewBox 0 0 32`, outer `rect 8 8 16 16 rx1`, dividers at `16`, filled `8 8 8 8`; rendered `h-8 w-8 bg-primary text-on-primary`; wordmark `Bodega Técnica` + `ServiceFlow` muted, hidden at 390px.
- `components/layout/Navbar.tsx:18` — consumes `BodegaTecnicaMark`, sticky `h-16` `border-b`.
- `lib/utils.ts:8` — `formatRut`/`formatChileanPhone` used for display masking; search normalization should reuse `lib/rut.ts` not this formatter.
- `tests/unit/rut.test.ts`, `tests/unit/service-data-integrity.test.ts`, `tests/unit/lifecycle.test.ts`, `tests/unit/service-events.test.ts`, `tests/pocketbase-filter.test.ts`, `tests/services-lifecycle.test.ts` — RUT, filter binding, lifecycle, integrity coverage; must gain mutation-immutability and search-normalization cases.
- `e2e/smoke.spec.ts`, `e2e/pb-admin.ts`, `openspec/ui.yaml:2` — runtime access `project-e2e-self-register` probe `/dashboard`, command `pnpm dev` (PB 127.0.0.1:8090 + Next 3000). Rendering verification depends on this harness.
- `DESIGN.md` / `PRODUCT.md` / `PRD.md` — visual authority, product truth, PocketBase contract; `ARCHITECTURE.md` deletion to preserve.

## Approaches

### 1. Status filter: single-select (required)

1. **Inline single-select refactor** — Replace `statusFilter: ServiceStatus[]` with `statusFilter: ServiceStatus | ""` in `ServicesDashboard`, drop `toggleStatusInFilter`, replace with `setStatusFilter(status)` radio behavior, close dropdown after pick, persist selection with `?status=` single value. `GET /api/services:24` already `split(",")` so it accepts single; keep `serviceListBinding` array path but pass `[status]` when set. Update `getSelectedLabel` and `hasActiveFilters/emptyMode`. **Effort: Low**
   - Pros: Matches requirement exactly; simplifies accessibility (single `aria-selected`); trivial migration; no backend change; preserves `ALLOWED_STATUSES`.
   - Cons: Loses multi-select for power users who currently stack statuses.
   - Effort: Low

2. **Radix `Select` / `RadioGroup` component** — Swap custom dropdown for `components/ui/select.tsx` `Select` primitive with single value. **Effort: Medium**
   - Pros: Better keyboard/a11y out of box.
   - Cons: Touches shared `Select` primitive, more churn for same semantics; current custom dropdown already has outside-click close logic that would need re-wiring.

### 2. Services table overflow / 1920x1080 rhythm

1. **Scrollable table container fix (minimal)** — Make parent `ServicesDashboard:586` `overflow-x-auto custom-scrollbar` with `min-w-[980px]` table, keep  `max-w-7xl` shell but add `scrollbar-gutter` and sticky last column or `pr-4` so action buttons never clip; at `xl/2xl` let table use `w-full`. **Effort: Low**
   - Pros: Solves clipped actions without redesigning grid; respects existing `DESIGN.md` density (`px-4 py-3`).
   - Cons: Still leaves large-screen whitespace unless shell is also addressed.

2. **Shell-aware responsive widening** — Keep `overflow-x-auto` fix plus bump shell to `max-w-[1600px]` at `2xl` (`@media 1536+`) with `xl:px-8 2xl:px-12`, and promote Services layout to `xl:grid-cols-12` so metrics/toolbar/table use available width; normalize Locations headline to `text-2xl font-semibold tracking-tight` + shared `flex flex-wrap items-center justify-between gap-4 mb-6` band and `bg-surface/50 border-y px-4 py-3` toolbar rhythm. **Effort: Medium**
   - Pros: Coherent 1920x1080 use; fixes Locations inconsistency in one pass; no new brand tokens.
   - Cons: Slightly larger diff, must verify 375/768 not regressed and `DESIGN.md` `max-w-7xl` note becomes `max-w-7xl` baseline with documented 2xl extension.

3. **Full layout overhaul (grid rebuild)** — Rewrite metrics to equal tiles, new page grid, new breakpoints. **Effort: High** — rejected: violates `Keep scope clean`, over-engineers for a toolbar/cards rhythm already decided.

### 3. Registry empty-state navigation

1. **Route + query trigger** — `handleEmptyAction` when `true-empty`: `router.push("/dashboard?createService=1")`; `ServicesDashboard` reads `searchParams.get("createService")` and `setIsModalOpen(true)` once on mount, then clears param with `router.replace`. Filtered mode keeps `clearFilters`. **Effort: Low**
   - Pros: No global state; deep-linkable; testable with URL assertion.
   - Cons: Requires `useSearchParams` + `Suspense` boundary per `next-best-practices`.

2. **Shared event bus / context** — Global store or event. **Effort: Medium** — heavier, no benefit over URL trigger; introduces seam where none needed.

### 4. Edit immutability: client, boleta (invoiceNumber), SKU

1. **Server + UI double-enforce** — `app/api/services/route.ts:125` extends `Object.hasOwn` guard and `GenericEditSchema.omit({... , clientName:true, invoiceNumber:true, sku:true})`; `updateService` payload omits those fields; `ServicesModal` when `isEditing` renders those three as read-only display (no `register`), strips them from `performSubmit` payload. `entryDate` stays submitted (date correction allowed) but not lifecycle dates. **Effort: Low**
   - Pros: Correct seam (untrusted edge + authoritative storage); matches "dangerous and semantically invalid" rationale; prevents silent mutation via curl.
   - Cons: Slight form layout change for edit mode (two fewer inputs).

2. **DB-level rule only** — Rely on PocketBase field permissions. **Effort: Low** — insufficient alone; bypassable via direct API without rule; not chosen.

### 5. Receipt / custody acknowledgment

1. **Content + template hardening (no legal claims)** — Improve `ServicesDetailsModal:57` template copy to label clearly as *Comprobante de recepción / custodia* — not `boleta`, not `factura`, not tax document; add disclaimer footer ("Este documento acredita recepción del equipo para servicio, no es documento tributario SII"), include required fields already present plus explicit `RUT / Tel / Email / Sede / Fecha ingreso / Producto / Falla` summary and QR placeholder seam; keep 58mm thermal but also A4 fallback seam. **Effort: Low** current phase; deeper legal wording deferred to `sdd-research`.
   - Pros: Immediate product value, no unsupported legal assertion.
   - Cons: Final statutory phrasing must wait for research.

2. **Defer all copy to research phase** — Ship no change now. **Effort: None** — leaves current thin copy which omits custody disclaimer; worse than (1).

### 6. Logo / brand

1. **Evolve existing Bodega Técnica mark (chosen direction refinement)** — Derive new logo from current `assets/brand/bodega-tecnica-mark.svg` shelf-grid concept (outer frame + 2×2 bays, one filled) with refined geometry: optical 1.5px stroke at 32, 6% corner radius tuning, wordmark tracking fix, optional complementary wordmark lockup; export new `bodega-tecnica-lockup.svg` + `favicon` + `opengraph` variants, update `BodegaTecnicaMark` to load asset or refined inline, keep `DESIGN.md` tokens unchanged. **Effort: Medium**
   - Pros: Aligned with established identity (`bodega-tecnica-identity` spec says Bodega Técnica is future authority; Taller Claro stays incumbent-only); minimal palette/type drift.
   - Cons: Requires design token audit.

2. **New unrelated identity** — Invent unrelated mark/palette. **Effort: High** — would reopen decided visual strategy without evidence; contradicts `PRODUCT.md` brand commitment and `DESIGN.md` banned list.

### 7. RUT search normalization

1. **Normalize at binding edge** — In `serviceListBinding:23` and/or `GET /api/services:19` normalize `search` via `normalizeRut(search)` when input looks like RUT (digits + optional `k/K` with punctuation), then OR-bind both raw and normalized forms: clientName ~ raw, rut ~ normalized/raw. Persisted `rut` stays stored as normalized via `ServiceSchema` `transform(normalizeRut)` but validation remains `isValidRut` (strict). Client-side `searchTerm` debounced 300ms already. **Effort: Low**
   - Pros: `20.884.087-K`, `20884087-k`, `20884087k` resolve; punctuation-insensitive; no validation weakening.
   - Cons: Must not over-normalize names (lowercase trigram for names stays separate path).

2. **Store dual column (display + normalized)** — Add `rutNormalized` field to PocketBase schema. **Effort: High** — requires schema migration, dual writes, not needed when `~` LIKE on single normalized field suffices; defers to future if LIKE performance degrades.

### 8. ARCHITECTURE.md deletion

- **Preserve deletion in change** — Stage `git rm ARCHITECTURE.md` (already `D` unstaged) as part of this change's delta; do not restore. Update `PRD.md`/`PRODUCT.md` references if any remain; add `openspec/changes/service-ui-corrections` note citing obsolescence. **Effort: Trivial**

## Recommendation

Deliver as a **coherent small-batch UI corrections change**, not 9 disjoint PRs, with backend seams kept minimal:

- **Status filter:** Approach 1 (inline single-select refactor).
- **Table overflow:** Approach 2 (scrollable container fix + shell-aware 2xl widening + Locations rhythm normalization). Keeps `DESIGN.md` compact density (`p-4 gap-4`, `px-4 py-3`) and 8px radii.
- **Registry empty-state:** Approach 1 (route `?createService=1` trigger).
- **Edit immutability:** Approach 1 (server double-enforce + UI read-only).
- **Receipt:** Approach 1 (copy hardening with disclaimer + template seam, legal phrasing deferred).
- **Logo:** Approach 1 (evolve shelf-grid mark, not a new direction).
- **RUT search:** Approach 1 (normalize at binding edge, validation untouched).
- **ARCHITECTURE.md:** Preserve deletion.

No blocking new visual direction is required. Evidence: `DESIGN.md` is `alpha` `Taller Claro Operacional` but `openspec/specs/bodega-tecnica-identity` already declares Bodega Técnica as future authority and `PRODUCT.md` brands ServiceFlow as operational tool; the prior `audit-ui-ux-remediation` and `dashboard-operate-plus` deltas already verified the operate system. Reopening palette/type would be speculative without a failing heuristic.

## Risks

- **RUT over-normalization masking names:** Naively applying `normalizeRut` to every search would turn `" 20Ab "` into a RUT-like token and pollute `clientName ~` matching. Mitigation: branch normalization — only when input after stripping `[.\-\s]` is `^\d+[0-9Kk]?$` — else bind raw only.
- **Edit immutability drift between Zod duplications:** `lib/schemas.ts` and `components/services/ServicesModal.tsx:14` both define `serviceSchema/ServiceSchema` independently; changing only one leaves a bypass. Mitigation: single-source `ServiceSchema` or verify both omits in same task.
- **Table scroll vs large-screen whitespace tradeoff:** Fixing overflow without widening shell still wastes 1920x1080; widening shell without scroll fix still clips actions at 1280. Both are required together; verify at 1280x800, 1366x768, 1920x1080, 390x844, 375x667.
- **Registry navigation test flakiness:** `ServiceEventsManager:160` handler historically asserts `clearFilters` only; changing to `router.push` needs mocked `next/navigation` in `tests/unit/service-events*.test.tsx` else legacy tests fail. Pin new behavior behind `emptyMode` branch.
- **Receipt legal exposure if wording overreaches:** Calling the document `boleta` or implying SII validity creates tax-document confusion (risk flagged in prompt). Mitigation: explicit non-tax disclaimer and no SII/e-invoice language until `sdd-research` provides sourced wording.
- **Logo scope creep:** New logo could drift into palette/type changes that conflict with `DESIGN.md` banned list (neon, gradient, glass). Gate with `openspec/ui.yaml` contract and `DESIGN.md` verification checklist.
- **ARCHITECTURE.md deletion silently restored by rebase:** If change is not staged, a rebase or `git checkout main -- ARCHITECTURE.md` could resurrect it. Ensure `git rm` is staged in the change's delta.
- **PocketBase LIKE without index on normalized RUT:** If `rut` is queried with `~` on high cardinality, full scan risk. Low now (limit 20, per-user), but document seam for future trigram/index.

## Research Questions for Mandatory `sdd-research` Phase

- Chilean SII: What must a non-tax custody/intake acknowledgment contain and what must it explicitly disclaim to avoid being construed as `boleta`/`factura`/electronic tax document? (cite SII circular, not AI paraphrase)
- Industry: What fields do Chilean técnico/taller receipts universally include for collection (RUT, phone, IMEI/SKU, failure description, conditions, disclaimer, firma)?
- Legal language: Minimal Spanish disclaimer that survives collection disputes without creating tax-document liability.
- Thermal vs A4: 58mm vs 80mm vs A4 seam — keep 58mm thermal as default and add A4 print media query or separate route?
- QR/code seam: Should the receipt include a tracking code/URL for status lookup, and does that create a new public endpoint contract?

## Implementation Seams

- `lib/pocketbase-filter.ts:23-44` — normalize + bind; `app/api/services/route.ts:19-44` — parse `search`/`status`; `lib/rut.ts:13` — reuse.
- `components/services/ServicesDashboard.tsx:57-340` — status state, label, query, toolbar; `components/ui/select.tsx` if chosen.
- `components/services/ServicesTable.tsx:50,140-283` — table wrapper, column mins, scroll, sticky actions.
- `app/(app)/layout.tsx:22` — shell max-width/gutters at 2xl.
- `app/(app)/locations/locationsManager.tsx:236-260` — headline/button/toolbar rhythm to match dashboard.
- `app/(app)/service-events/serviceEventsManager.tsx:160-182` — `handleEmptyAction` → `router.push("/dashboard?createService=1")`.
- `components/services/ServicesModal.tsx:14-260` — schema duplication, `performSubmit` strip, read-only edit fields for `clientName/invoiceNumber/sku`.
- `lib/schemas.ts:18` + `lib/storage.ts:253` — omit immutables, payload shape.
- `components/services/ServicesDetailsModal.tsx:57-191` — print template, disclaimer, custody copy.
- `components/brand/bodega-tecnica-mark.tsx:13` + `assets/brand/*` — evolved mark asset.
- `app/api/services/[id]/status` and `/transfer` — unchanged but verified immutability boundary.

## Behavioral Invariants (to preserve and extend)

- Tenant isolation, `pb_auth` httpOnly/lax/secure fail-closed, `userId=@request.auth.id`, ordered writes (update→log, delete logs→service), Zod at edges.
- Search remains LIKE `~` with bound `{:search}` only, never interpolated; `status` allowlisted; `locationId` bound.
- Status immutability via generic edit (400 `LIFECYCLE_PROTECTED`), `completed/cancelled` → 409 `IMMUTABLE_STATUS`; new invariant adds `clientName, invoiceNumber, sku` to generic-edit protected set.
- RUT persistence stays normalized + modulo-11 validated; search adds punctuation/hyphen/space/case-insensitive matching without weakening validation.
- Registry `Registro` filter panel stays always-visible (no outer collapse), heading is not a button, all controls keyboard-reachable, clear resets filters+page1.
- Dashboard headline before metrics, metrics non-interactive facts, toolbar separate from metrics, 390px priority fields (`boleta, sede, ingreso, días, estado, actions`) stay in viewport.
- Loading: Boneyard bones for empty first paint, `aria-busy` overlay for populated refetch, no spinner-only replacement.
- Receipt invariant: document is custody acknowledgement for collection, not a tax receipt/invoice/boleta; must carry disclaimer until legal research lands.

## Existing Tests and Gaps

- `tests/unit/rut.test.ts` — normalize/compute/validate; gap: no punctuation-variant search equivalence case.
- `tests/pocketbase-filter.test.ts` — `serviceListBinding` allows `status` array, `search` LIKE; gap: no RUT-normalized search branch, no single-status exclusive case.
- `tests/unit/service-data-integrity.test.ts`, `tests/unit/lifecycle.test.ts`, `tests/services-lifecycle.test.ts` — lifecycle dates, status transitions; gap: no immutable `clientName/invoiceNumber/sku` PUT 400 test.
- `tests/unit/service-events.test.ts` / `tests/unit/service-events-filters.test.tsx` — Registro binding/filters; gap: no `PageEmptyState` `true-empty → push("/dashboard?createService=1")` test.
- `e2e/smoke.spec.ts` — register→login→location→service→move→history; must cover new status single-select, table scroll reachable actions, and large-screen smoke.

## UI Runtime Access and Verification Viewports

- **Access:** `openspec/ui.yaml` `mechanism: project-e2e-self-register`, `setup: e2e/smoke.spec.ts#register via e2e/pb-admin.ts + e2e/global-setup.ts`, `probe: /dashboard`, `role: authenticated-user`, `command: pnpm dev` (PB `127.0.0.1:8090` + Next `127.0.0.1:3000`, loopback-only http). Verified bounded probe; also `/service-events` shares session.
- **Viewports:** 1920×1080 (primary large-screen target from prompt), 1440×900, 1280×800 (app shell baseline), 1024×768, 768×1024, 390×844 (iPhone 12 spec baseline per `dashboard-operate-plus`), 375×667; check header `top 0 bottom 65` and `main` gutters `px-4 sm:px-6 lg:px-8 py-8` equal across routes before/after scroll (see `DESIGN.md` App Shell & Navigation regression contract). Verify table: desktop scrolled actions reachable without off-screen drift; mobile cards retain priority fields.

## Material Product Decisions

- **Not in this change:** No data/user/password import, no session bridge, no dual-write/id-mapping, no migration wizard, no pricing/licensing, no SII e-invoice integration, no placeholder testimonials/benchmarks (per `PRD.md` Non-Goals and `PRODUCT.md` absences).
- **Deferred to mandatory `sdd-research`:** Chilean custody receipt legal phrasing and any SII disclaimer citations; no legal claims shipped before research.
- **ARCHITECTURE.md:** Keep deleted; `PRODUCT.md` + `DESIGN.md` + `pocketbase/v1.collections.json` are canonical.
- **Visual authority:** Andén Ordenado / Bodega Técnica (`bodega-tecnica-identity` spec) is sufficient; no blocking new visual direction choice. Logo work is refinement, not rebrand.

## Ready for Proposal

No — gated by mandatory Chilean receipt research (Research and Pre-Proposal Gate). Scope is 8 bounded corrections + 1 deletion preservation + 1 research-seeded improvement, all with identified seams and no blocking product or visual-direction decision. Proposal would be a single `service-ui-corrections` change with one delta per concern, grouped tasks, and archive that stages the `ARCHITECTURE.md` deletion, but it is blocked until research completes. Per gate, `sdd-research` is required immediately after `sdd-explore` and before `sdd-propose` whenever research is selected — Chilean receipt research was explicitly selected in the original request. Next is `sdd-research` for `service-ui-corrections` (Chilean SII custody receipt: custody vs boleta/factura distinction, required fields, disclaimer wording, thermal vs A4, QR seam — see Research Questions). Budget `review_budget_lines: 800` carries forward to research → proposal. Research notes must be published before proposal may start.

