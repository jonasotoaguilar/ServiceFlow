# Exploration: page-ui-redesign

**Status**: 2026-09-01 — authenticated read-only audit, no implementation
**Branch**: `feat/page-ui-redesign` (worktree `/home/jona/projects/serviceflow-worktrees/feat-page-ui-redesign`)
**Mode**: OpenSpec (`artifactStore: openspec`), `delivery_strategy: auto-chain` cached
**Method**: CodeGraph first (`.codegraph/codegraph.db` present, indexed), then read-only source inspection of `PRODUCT.md` / `DESIGN.md` / `ARCHITECTURE.md` / `PRD.md`, App Router pages under `app/(app)/`, shared `components/`, `lib/`, `styles/globals.css`, plus prior verified artifact `openspec/changes/audit-ui-ux-remediation/exploration.md` and `verify-report.md` treated as historical evidence only. No application code was mutated. No credentials persisted.

---

## 1. Current State

### 1.1 Authority that still governs

- **Product truth** (`PRODUCT.md`): PocketBase-only service lifecycle (`pending → ready → completed` or `cancelled`) with `location_logs`/`service_events` audit, tenant isolation `userId = @request.auth.id`, request-scoped `new PocketBase(getPocketBaseUrl())`, `pb_auth` httpOnly/lax/secure-in-prod. Users are Shop Manager/Owner (scan/audit) and Technician (repetitive intake at workshop desk, desktop-first). Workshop-bright, compact, operational — tool not marketing site. No brand voice/logo beyond what `DESIGN.md` codifies.
- **Design truth** (`DESIGN.md: Taller Claro Operacional` version alpha): **Operate mode, variance 3 / motion 2 / density 6**. Zinc neutrals (`#fafafa` background, `#ffffff` surface, `#18181b` foreground, `#e4e4e7` hairline, `#d4d4d8` strong), single desaturated ink `#2F5B8A` (`#3a6fa3` hover, `#eff6ff` tint), semantic status pairs amber/blue/emerald/red each with `bg + fg + border` plus icon+label (never color-only). Typography Fira Sans (300/400/500/600/700 via `--font-fira-sans`) + Fira Code companion, fixed 13–14px operate scale (labels at `0.8125rem` medium, never `10px tracking-widest`). Layout `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`, cards `p-4 gap-4 rounded-sm (8px)` to `md (10px)`, dialogs only at `lg (12px)`, badges `full`, hairline borders, minimal tinted shadow `0 1px 2px + 0 4px 12px` or flat, motion `150–200ms transform/opacity` only, `prefers-reduced-motion` disables shimmer.
- **Contract since remediation**: App shell now owned by `app/(app)/layout.tsx` (`min-h-dvh` + `Navbar` + `main max-w-7xl px-4 sm:px-6 lg:px-8 py-8`), Boneyard exact-layout skeletons (`<Skeleton name="dashboard-stats|dashboard-table" loading={isLoading && items.length===0}>` + `aria-busy` overlay for populated refetch), `service_events` unified `created|location_changed|status_changed` log, RUT modulo-11 dual boundary, `entregada` presentation mapping, status/transfer dedicated dialogs.

### 1.2 What the current implementation actually renders

Verified via CodeGraph + file reads (desktop `1280x800` / mobile `390x844` contract from `DESIGN.md`):

**Shell** — `app/(app)/layout.tsx:23-25` correctly single-owns Navbar at viewport top (`header border-b border-border bg-surface sticky top-0 z-40`, inner `h-16` = 64 + 1px border = 65px total). Shell regression that previously displaced dashboard `top=32` is fixed. `app/layout.tsx:20-29` now allows zoom (`maximumScale:5 userScalable:true`) and imports `bones/registry` once. `styles/globals.css` defines `@theme` primitives → semantic → component via CSS vars, honors `prefers-reduced-motion: reduce` (boneyard bones → `animation:none`, all transitions `0.01ms`) and `color-scheme light dark`.

**Dashboard** — `components/services/ServicesDashboard.tsx:340-431` stat row `grid grid-cols-1 md:grid-cols-5 gap-6 mb-8`, each card `p-6 border-l-4 rounded-sm` + `bg-surface border`. Metrics `text-2xl font-mono` vs label `text-xs font-bold uppercase tracking-widest` + icon 3px. Four cards share `pending` semantics (Pendientes / Por Vencer / Críticos all read `stats.pending` with different badge tints), fourth aggregates `ready+completed` as Entregadas. Active filter state is `border-{status-border} bg-{status-bg}/30`. Toolbar `bg-surface border rounded-lg p-4 mb-8 flex gap-3 flex-wrap` holds search `min-w-[230px]` + sort `p-2.5` + two `min-w-[200px]` dropdowns (`Todas las Sedes` / `Todos los estados`) + `Nuevo servicio` primary button. Table lives in `bg-surface border rounded-xl overflow-hidden` with `aria-busy` + `bg-surface/60` overlay for populated refetch, `ServiceTable` inside.

**Table** — `components/services/ServicesTable.tsx:124-278` desktop `hidden md:block overflow-x-auto custom-scrollbar` with 8-column table (`px-6 py-4` header `text-xs tracking-wider`), badges `icon 3 + text-xs tracking-wider uppercase`, days badge hard-coded `bg-red/amber/emerald-500/10` (not semantic), RUT `text-[10px] font-mono`, actions `IconButton h-11` with `Eye/RefreshCw/ArrowLeftRight/Pencil/Trash2`. Mobile fallback is fixed-height `md:hidden space-y-3` cards `rounded-xl p-3`.

**Registro & Locations** — `app/(app)/service-events/serviceEventsManager.tsx:118-140` header `text-3xl` with decorative `bg-linear-to-r from-primary` underline + `Total Registro` side card `border-l-4 border-primary shadow-sm p-5`. Filters `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4` (`FILTROS DE BÚSQUEDA` uppercase). Table `rounded-xl` 7 columns, pills `truncate max-w-[120px]`. Same divergence exists in `app/(app)/locations/locationsManager.tsx`. Both violate density/radius rules.

**Dialogs** — `components/ui/dialog.tsx:22-132` is now compliant: `role="dialog" aria-modal="true" aria-labelledby`, focus trap (first element + Tab cycle), `Esc` closes, `body overflow hidden`, focus returns, `max-h-[90dvh]` `rounded-[12px]`.

**Theme** — `components/theme-provider.tsx` + `styles/globals.css .dark` ships a full dark palette (`surface #27272a`, `pending-bg #422006` etc). `DESIGN.md` said light-only; dark is now a durable shipped surface with screenshots in verify-report.

Verification cross-check: `audit-ui-ux-remediation/verify-report.md` ended `fail` (6 FAILING scenarios: mobile table actions off-screen at `x≈966`, `PATCH /status` and `/transfer` 500 via `Batch requests are not allowed`, Registro row off-screen, ISO leak, English leftovers). Those fixes are partially shipped (mobile cards now exist, `calculateDays` and `formatEntryDate` wired, `IconButton` targets are 44px) but structural drift below remains.

---

## 2. Incumbent Diagnosis — Assessment A (unanchored) then B (deterministic), synthesized

### 2.1 Layout / hierarchy / spacing / density

**Squint test (rendered inference from source + spacing tokens):** blurring detail, no single primary element emerges on dashboard. Five equal `p-6` weight cards compete; toolbar below them is equally heavy (`p-4` card-like container); table below that is `rounded-xl` — three bands of similar mass. Registro header competes again: `text-3xl` headline vs `border-l-4` stat card of near-equal visual gravity. Reading path is top→cards→filters→table, but priority is flat — nothing leads.

**Grouping:** cards are grouped by `gap-6` alone, then rely on `border-l-4` as a crutch for status identity instead of proximity/type/badge hierarchy. Toolbar wraps via `flex-wrap gap-3` with no semantic grouping — search (global), location/status filters (scoping), sort (ordering), and create action sit as peers though they answer different questions.

**Rhythm:** one spacing value dominates: `p-6`, `gap-6`, `mb-8`, `py-4`. `DESIGN.md` mandates tight/generous contrast with `p-4 gap-4` as operational rhythm and `gap-6` only between section groups. Current is monotonous mid-weight with no deliberate tight intervals (e.g., label-meta gaps are still `4` but buried under card padding). Same for table: `px-6 py-4` everywhere vs spec `px-4 py-3`.

**Structure:** `max-w-7xl` constraint and `min-h-dvh` are correct, but radius/edge language splits: dashboard stats `rounded-sm` (correct) vs table wrapper `rounded-xl` vs Registro wrapper `rounded-xl` vs mobile cards `rounded-xl` vs dialog `rounded-[12px]` — four radii for containers at the same level. Elevation mixes `shadow-sm` and implicit flat borders inconsistently.

**Density:** spec density 6 = compact `p-4 gap-4` for repetitive workshop use. Actual default is `p-6 gap-6` — ~33% looser than intended. Combined with `text-xs tracking-widest` labels (10px effective) the surface feels both airy in container scale and cramped in type scale — the opposite of the intended 14px legible, tight-but-breathable stacks.

**Adaptation:** Navbar adapts correctly (`hidden md:flex` + hamburger `absolute top-16 left-0 right-0 shadow-2xl z-50`). Tables use progressive `hidden md:block overflow-x-auto` + `md:hidden` cards, which nominally addresses prior `horizontal overflow` fail. Remaining gaps: Registro filters `grid-cols-5` collapse to `cols-1` on mobile without re-ordering priority (Tipo/Estado/Sede remain equal), and the card fallback still truncates `max-w-[120px]` pills rather than reflowing full values. Verify-report mobile gaps are partially mitigated but reflow still hides origin/destination/date structure that desktop makes scannable.

**Extremes:** long `product — clientName` truncates `max-w-[150px]` correctly; but invoice `#` in mobile cards loses the `S/N` fallback; empty states switch from `py-16` illustration to single-line mobile `italic` — inconsistent tone.

### 2.2 Typography

**Authority:** Fira Sans + Fira Code via `next/font/google` correctly installed with variables `--font-fira-sans/code`, fallbacks documented. No Inter. Good.

**Hierarchy:** breaks at label level. `DESIGN.md` `label` is `0.8125rem (13px) weight 500 tracking 0.01em` for badges/headers/meta. Implementation uses `text-xs (12px, often 10px on small) uppercase tracking-widest` for metric labels ( `Pendientes`, `Por Vencer`, `Críticos`, `Entregadas` ), table headers (`text-xs tracking-wider`), Registro filter headings (`FILTROS DE BÚSQUEDA` with no `label` token), and status pills (`uppercase tracking-wider`). Type role density collapses: same `text-xs` serves header, metric label, filter heading, and badge — hierarchy must rely on weight/color alone.

**Scale consistency:** metric numbers are `text-2xl font-mono` (24px) — oversized vs spec `h3` max `1.25rem` / `display 1.875rem` guidance, and inconsistent across cards (same size for all five). Dialog title `text-xl` matches `h3` (20px) correctly. But `text-[10px]` for RUT on table and `text-[10px]` for Registro actor is below the 13px label floor and reads as decoration.

**Reading:** body remains `text-sm` (14px) via `font-sans`, mono data correctly `font-mono` for invoice/RUT/currency/dates via `formatEntryDate`. Measure is constrained by `max-w-7xl` so prose stays ~65-120ch, but cards set `truncate max-w-[120px]` which fights mono comparability for dates.

**Stress/localization:** `Ü`/`Ñ`/accents handled via Fira's latn subset; fallback `system-ui` documented. No `clamp()` for marketing display (correct per Operate). Missing-weight fallback has no declared strategy but weights installed cover 300-700/400-600.

### 2.3 Color / theming

**Tokens:** primitive → semantic layer exists in both `DESIGN.md` YAML and `styles/globals.css @theme` (zinc-50/100/200/300/500/600/900, slate-blue-700/600/50, status pairs). Semantic `background/surface/surface-muted/foreground/border/pending-bg` correctly map. No raw hex in components — correct.

**Strategy:** Restrained single-ink accent correctly rare. But application drifts:

- Stat cards use `border-l-4` as the only status encoding at card level; badges inside do carry `icon+text` but card left border mixes hygiene with hierarchy — it turns status into decoration. `pending` appears three times with different `fg` tints (`pending-bg` for Pendientes/Por Vencer vs `cancelled-bg` for Críticos though still `pending` semantics) — hue semantics blur.
- Days badge `getDaysBadgeColor` hard-codes `bg-red-500/10 text-red-500 border-red-500/20` etc — outside token system, high chroma at low lightness, not the desaturated status pairs.
- Registro origin → destination pills use `bg-surface-muted` for origin vs `bg-completed-bg` for destination regardless of actual status — color becomes positional, not semantic.
- Dark mode now ships with non-verified pairs: e.g., `pending-bg #422006 / fg #fcd34d` (verify-reported) has not passed contrast proof; verify screenshots are `dark-normal` but no axe contrast audit is cited for dark.

**Contrast & non-color cues:** light mode badges `bg + fg + border + icon` satisfy `~6.3–7.1:1` per spec. Table header `surface-muted #f4f4f5` on `foreground-muted #52525b` needs computed check (likely passes for 12px bold but unproven in artifact). No reliance on color-only — badges have icon+text — good.

### 2.4 Interaction, affordance, states, motion

**Affordance:** stats are `button ... cursor-pointer` whose only signal is border tint change on `statusFilter.includes(status)`. Cards look like metrics but behave as filters — a product ambiguity. Toolbar dropdowns use same `rounded-sm border` as table wrapper, so filter vs container language blurs. Primary `Nuevo servicio` is `bg-primary hover:bg-primary-hover active:scale-95` correctly flat; secondary toggles are `border border-border hover:bg-surface-muted`.

**Feedback:** filter transition preserves context correctly: `Skeleton` for initial empty + `aria-busy` + `bg-surface/60` overlay for populated refetch, stable height. That fixes prior `Cargando...` cut — compliant with motion 2.

**Recovery/continuity:** status and transfer dialogs keep separate `actionError` inline `text-red-500` + keep data on failure — partial error handling. Pagination recalculates `Math.max(1, ceil(total/20))` correctly.

**Motion:** `globals.css` intent is `150–200ms transform/opacity` and disabled on `prefers-reduced-motion`; actual cards use `transition-all` (animates border/shadow/background too) — too broad. Navbar hamburger uses `animate-in slide-in-from-top-5 duration-200` — outside allowed `transform/opacity` narrow set and duration at boundary. Boneyard shimmer correctly disabled under `reduce`.

**Dialogs/accessibility:** compliant per `components/ui/dialog.tsx` (trap, Esc, return focus). Hit targets `h-11 w-11` on `IconButton` good. Zoom allowed good. Remaining: table header `tracking-widest` at 10px effective hurts legibility under `200%` zoom; `border-l-4` on cards is not keyboard-focusable signal.

### 2.5 Loading / error / empty / defensive

**Loading:** initial `Skeleton name="dashboard-stats|dashboard-table" loading={isLoading && items.length===0}` + filter refetch `aria-busy` overlay is the durable Boneyard pattern — correctly exact-layout, not manual placeholder. Verify-report noted bones invisible on delayed empty; current config `color: var(--color-skeleton-base)` is correct token binding.

**Empty:** Dashboard table shows `No se encontraron registros` with `py-16` illustration Desktop but mobile uses bare `italic` short copy — tone mismatch. Locations and Registro have similar but Registro desktop uses `italic` + `colSpan 7` row (no guidance CTA). `DESIGN.md` requires empty = icon + one-line explanation + primary action (e.g., `Nuevo servicio` / `Crear sede`) — missing on Registro.

**Error:** inline `actionError` string plus mixed English inside success path: `ServicesDashboard.tsx:721 "Cambiar estado status"` and `735 "Transferir servicio # transfer sede"` / `759 "Transferir sede transfer"` — copy leak verified via codegraph. Network fallback `verificación` missing: `fetchServices` logs to console without user surface besides `actionError` only inside dialogs.

**Defensive:** filters bind via `applyBinding` safe; RUT forced `min(1)` plus `formatRut` mask + `rut` schema modulo-11 (now shared `lib/rut.ts`) — complete.

### 2.6 Visual polish / craft floor

What a designer sees on first glance that makes it feel unconvincing despite correct tokens:

- **Over-signaled status:** heavy `border-l-4` on 5 stat cards + `border-l-4` on Registro total card + interior icon pills + badge pills — status is marked three times at different scales with no clear owner.
- **Type cheapening:** `tracking-widest uppercase` at `10–12px` is the same treatment whether it is a metric label, a table header, or a section eyebrow (`FILTROS DE BÚSQUEDA`). Repeated across every surface it reads as admin-template, not workshop-precision.
- **Radius inconsistency:** `rounded-sm` (8px) everywhere would feel precise; mixing `rounded-xl` (16px-ish) on tables/mobile cards while `8px` on cards fights the lock (`sm 8 / md 10 / lg 12` only).
- **Decorative extras that contradict Operate:** Registro headline underline gradient `from-primary to-transparent`, `shadow-sm` on filter panels, `shadow-2xl` on mobile menu — small flourishes that undermine the stated `quietly precise`Workshop bright restraint.
- **Copy leaks:** `actual pending`, `status/transfer` English inside Spanish UI — instantly breaks trust even if pixel-perfect.

These are taste-adjacent but diagnose as **inconsistency + heavy decoration + microtype** more than palette choice.

### 2.7 Synthesis — what each lens caught alone

- **A alone** flagged hierarchy flatness and taste-of-cheap-type that detector cannot measure.
- **B alone** flagged mechanical `border-l-4` token misuse, `text-[10px]` under 13px floor, `bg-/border-` raw Tailwind outside system, mixed radii, English copy leak — all invisible to judgment.
- **Overlap** confirms 2.1–2.6 above; no false positives, but detector would not catch `tracking-widest` as ban without explicit rule — judgment is required.

---

## 3. Why It Feels Unconvincing — visual taste vs product/interaction defects

### Product / interaction defects (would feel wrong in any skin)

1. **Metric-vs-control ambiguity:** five stat cards look like KPIs but are the primary filter controls. `toggleStatus` exclusive + `toggleStatusInFilter` multi-select coexist with two different active visuals — user cannot form a mental model of "what am I filtering?".
2. **Copy not Spanish-constant:** `Cambiar estado status`, `transfer sede` labels expose English internals.
3. **Mobile progressive disclosure incomplete:** Registro `max-w-[120px] truncate` still hides lineage; prior `overflow-x-auto` fail is only papered by cards, not resolved by structuring data so actions are in viewport without scroll.
4. **Empty without guidance:** Registro and filtered dashboard empty show text only, not the mandated CTA to create/recover.
5. **Feedback breadth:** `transition-all` on cards risks layout-adjacent properties, contradicts motion contract.

### Visual taste causes (fixable without changing business rules)

1. **One-label-type syndrome:** `text-xs tracking-widest uppercase` used as the sole hierarchy tool across headers, metrics, badges, eyebrows — makes hierarchy illegible even though contrast passes.
2. **Heavy left-border era:** `border-l-4` everywhere is the 2024 admin-template signal the prior `glass-card border-l-4` replaced but survived.
3. **Radius forgetfulness:** mixing `sm` and `xl` for containers at same elevation destroys lock and reads as undecided craft.
4. **Gradient underline:** Registro decorative line competes with primary nav `border-b-2` active — two underline languages.

### What is already convincing (preserve)

- Shared shell geometry, zoom allowed, dialog a11y, Boneyard exact-layout + `aria-busy` preservation, Fira system, zinc/ink restraint at token level, `IconButton 44px` targets, `prefers-reduced-motion` collapse — these are durable wins from remediation.

---

## 4. Affected Areas

- `app/(app)/layout.tsx` — shell owner, correct; only place to adjust `max-w-7xl` provenance or `py-8` rhythm if density changes.
- `app/(app)/dashboard/page.tsx` — thin server wrapper with `getServices({page:1 limit:20 status:["pending","ready"]})` initialData; determines first paint.
- `components/services/ServicesDashboard.tsx` — **primary redesign surface**: stats grid, toolbar, skeleton wiring, status/transfer dialogs, toggle semantics, label typography, `border-l-4`, English leak `721/735/759`. Coupling: depends on `getLocations`, `/api/services/stats`, `lib/rut`, `STATUS_*` tokens.
- `components/services/ServicesTable.tsx` — 8-col table `px-6 py-4 tracking-wider`, hard-coded days badge colors, RUT `10px`, mobile `md:hidden` cards `rounded-xl`.
- `app/(app)/service-events/page.tsx` + `app/(app)/service-events/serviceEventsManager.tsx` — Registro header/gradient, filter `grid gap-4 rounded-lg`, table 7-col `rounded-xl`, mobile event cards, truncation logic.
- `app/(app)/locations/page.tsx` + `app/(app)/locations/locationsManager.tsx` — same filter/table pattern, delete/history guards, default location invariant.
- `components/layout/Navbar.tsx` — `h-16` sticky, `border-b`, `rounded-xl` branding, `z-40`, mobile `top-16` drawer, theme toggle `h-11`.
- `components/theme-provider.tsx` + `styles/globals.css` — `@theme` tokens, `.dark` overrides, reduced-motion, `focus:ring` affordance, `custom-scrollbar`.
- `components/ui/dialog.tsx` + `components/ui/icon-button.tsx` + `components/ui/confirmationDialog.tsx` + `components/ui/button.tsx` — hit targets, dialog contract, variant mapping.
- `components/services/ServicesModal.tsx` + `lib/types.ts` + `lib/schemas.ts` + `lib/rut.ts` — RUT boundary, status excluded from generic edit (correct), date stamping invariants.
- `app/actions/service-events.ts` + `app/actions/locations.ts` + `app/api/services/route.ts` — pagination envelope `{data,total,page,limit}`, `serviceEventListBinding`, enrichment N+1.
- `DESIGN.md` / `PRODUCT.md` / `ARCHITECTURE.md` — read-only authorities; edits need explicit rebrand decision before mutation.
- Verified but stale: `pocketbase/v1.collections.json` — collections/rules unchanged; no new brand assets in repo.

---

## 5. Approaches — 2–3 materially distinct redesign directions (non-authoritative, candidate evidence)

> All three preserve: tenant isolation, ordered writes, one PocketBase backend, request-scoped client, RUT boundary, Boneyard exact-layout, dialog a11y, zoom, density intent as Operate. They differ in how they earn hierarchy and where the ink accent lives. No direction is chosen — user selects in proposal.

### Direction 1 — **Taller Corrected (Strict Operate, Minimal Delta)**

**Intent:** keep `Taller Claro Operacional` verbatim and fix drift so the current design finally matches its own contract. Workshop-bright stays light-default; dark is corrected but de-emphasized.

**Moves:**

- Normalize every container to `p-4 gap-4 rounded-sm (8px)` (cards/toolbar/table wrapper) and `rounded-lg (12px)` only for dialogs. Remove every `border-l-4`; status lives only in badges `icon+text` + `inline` active `border-border-strong` or `ring-1` in border token, never heavy left border or `shadow-sm` on filters.
- Replace every `text-xs tracking-widest uppercase` with the `label` token `text-[0.8125rem] font-medium tracking-[0.01em]` (13px). Keep `tracking-widest` only for `caption` footnotes. Metric numbers: `h3 1.25rem/600` (20px) not `2xl mono 24px`; labels become scannable.
- Days badge migrates from raw `red/amber/emerald-500/10` to semantic status tints (or neutral `surface-muted` with mono `112d` + semantic border when urgent). Invoice `#` stays `mono-data`, RUT at `mono-sm 12px` not `10px`, `bg-primary/10` kept but with semantic text.
- Remove Registro gradient underline and filter `rounded-lg/shadow-sm`; unify gutters to single `gap-4` rhythm from `py-6` header to `py-8` main so squint test shows headline → filter group → table as three deliberate masses, not three equal cards.
- Keep 5-card metrics but clarify semantics: merge visual variants so `pending` family is one control tone (e.g., all three pending-adjacent cards share `pending-bg` icon + pending border variant) and avoid `cancelled-bg` on a pending-derived card.
- Fix copy leaks (`Cambiar estado`, `Transferir sede`, remove `status/transfer` English) and add Registro empty CTA `Crear servicio` / `Limpiar filtros` with icon.

- **Pros:** smallest delta, honors already-shipped DESIGN.md, preserves familiar repeatability (operators' mental model), lowest risk, review-budget friendly (~120–200 lines changed text + CSS), no new illustration assets, no dark re-spec.
- **Cons:** retains dense Operate voice; may still not feel "different enough" if Jona wants a warmer or more editorial identity; does not solve metric-vs-control ambiguity fundamentally (cards remain filters).
- **Effort:** Low–Medium.
- **When correct:** if the unconvincing feel is diagnosed as craft inconsistency, not world rejection.

### Direction 2 — **Bodega Técnica (Operate+, Hierarchy Reform)**

**Intent:** elevate Operate with a clear **reading path** and warmer editorial restraint without leaving workshop-bright. Still zinc/ink, still no gradients/glass, but asymmetry and editorial spacing earn hierarchy.

**Moves:**

- Reframe dashboard IA: headline band (left: `Servicios` `h2` + count `data/total` mono subtitle; right: `Nuevo servicio` primary) leads; second rank is a **2+3 metric cluster** — two large metric cards (`Pendientes` + `Entregadas`) at `p-6` as primary facts, three smaller `upcoming/critical/cancelled` as muted `card-muted` with `p-4`. Hierarchy via scale/canvas, not `border-l-4`.
- Toolbar becomes a **toolbar**, not a filter card: search (with `Search` leading icon) + sort as an inline segment occupy row 1; status/location dropdowns become compact `h-10` pills with icon+label, not `min-w-[200px]` cards. `gap-3` kept between controls, `gap-6` only between section groups.
- Table: implement true **progressive disclosure** — priority columns (`Boleta`, `Producto/Cliente`, `Estado`, `Acciones`) remain; `Sede` collapses to a badge under product on `<1024`, `Ingreso/Días` collapse to mobile `12px mono` row, so `overflow-x-auto` never hides `Acciones` at `390px` per verify fail. Registro similarly shows `Tipo → Boleta → Producto → Destino → Fecha` as card lines with untruncated location names (wrap not `truncate`).
- Typography: introduce explicit `display 1.875rem` for Registro headline, remove gradient underline, use `foreground` + `foreground-muted` contrast (no `tracking-widest`). Labels remain `13px medium` but metric labels use `caption` for unit (`días`) beside `h3` numbers.
- Color: tint neutrals with `1–2%` ink wash instead of heavy `bg-surface-muted` for toolbar; keep ink accent rare but let it own the sort active + pagination `bg-primary`.
- Dark mode: re-tune `.dark` with verified AAA pairs (re-derive `pending/ready/completed/cancelled` dark from primitives via OKLCH, not ad-hoc hex), document `darkColor` for Boneyard.

- **Pros:** fixes flat squint test decisively, addresses metric-vs-control ambiguity by separating facts from filters, resolves mobile action off-screen by structural reflow, feels materially different without new palette.
- **Cons:** more structure changed than direction 1 (toolbar re-layout, 5-card reshaped, table column priority decision), moderately higher review budget (~250–350 lines), needs product confirmation on which 2 metrics are primary.
- **Effort:** Medium.
- **When correct:** if Jona wants the shop to feel more owned and hierarchy-urgent while staying workshop-bright.

### Direction 3 — **Registro Primero (Log-centric, Dense Data Tool)**

**Intent:** lean into the tool's most distinctive value — traceability — and make **Registro the product hero**, dashboard lighter. For high-frequency technicians, this reduces repeated scanning cost.

**Moves:**

- Dashboard shrinks to single **queue view**: one search + status chips (compact horizontal `ChipGroup` with `aria-pressed`, icon+label, `h-8`, no dropdowns), then table/cards. Stats become a thin summary strip `flex gap-2 text-[13px]` above table (inline counts, not cards-as-buttons) — scannability over dashboard decor. Create action is a persistent `+ Nuevo` `h-11` anchored bottom-right on mobile (thumb zone) not inline with filters.
- Registro promoted: timeline spine with `kind` segments (`Creación` / `Cambio estado` / `Cambio sede`) as tabs that filter, each event as a **log row** with `from → to` + `mono timestamp` + `actor truncated` + note on second line. On desktop, keep table but make `Origen/Destino` untruncated with `min-w 140` and time split `date + HH:mm` stacked; on mobile, full card shows all fields vertically (no `max-w truncate`).
- Ink dosage deliberately higher on Registro spine/active tab only; dashboard stays almost neutral — visual dosage tells user "where proof lives."
- Same density `p-4 gap-4` + `rounded-sm` but tables use `px-4 py-3` everywhere, `table-header` token for `bg-surface-muted` header, badges unchanged semantic.

- **Pros:** maximally honest about product positioning (full cycle with branch traceability vs generic ticket tool), lowers repetitive-task cognitive load, smallest decorative surface, directly addresses prior Registro gaps.
- **Cons:** most opinionated; changes navigation emphasis (Registro more prominent) and the mental model for managers who expect KPI-forward dashboard; may feel "more tool, less dashboard" — not every stakeholder likes log-centrism.
- **Effort:** Medium–High (IA shift + component reshaping, though still within 800-line budget if stacked).
- **When correct:** if the unconvincing feel comes from "looks like every CRUD admin" not from polish, and Jona values differentiation via audit trail.

---

### Recommendation (non-binding)

**Recommend Direction 1 as the safe proposal default, with Direction 2 held as the explicit alternative if Jona wants visible hierarchy reform without rebranding.** Rationale: verification and DESIGN.md already committed to light workshop-bright compact operation; fixing craft drift alone resolves ~70% of "unconvincing" causes (type, radius, heavy borders, decorative line, English leaks) at lowest risk and within review budget. Direction 2 earns more hierarchy without new palette and can be offered as a toggle in the proposal's alternative section. Direction 3 is kept as a product-positioning alternative only if the team wants to dogfood Registro as hero — it is logically clean but higher-stakes for a single 800-line change.

**Not recommended as default:** a full palette/type rebrand (e.g., replacing zinc/ink with a warmer paper or cooler slate, or swapping Fira for a grotesk/serif) — it would contradict durable `DESIGN.md` identity and the archived `audit-ui-ux-remediation` decision without a confirmed new brand commitment. If desired, that must be framed as a separate material decision with new `DESIGN.md` dials.

---

## 6. Material Product Decisions that MUST be confirmed before proposal

These are blocking `design-ui` admissions — the proposal must not silently pick them.

1. **Visual world confirmation:** keep `Taller Claro Operacional` (zinc/ink, Fira, density 6) or explicitly replace authority? Replacement requires new palette/type/motion dials and a `DESIGN.md` delta before any component work.
2. **Dark mode stance:** `DESIGN.md` said light-only; `globals.css .dark` now ships and screenshots exist. Preserve dark with verified AAA pairs or revert to light-only with `prefers-color-scheme` ignored?
3. **Stats semantics:** 5 cards global per spec vs merged strip (Direction 3)? Which counts are global truths (`pending`, `ready`, `completed`, `cancelled`, `upcoming`, `critical`) and should cards remain controls vs pure metrics with separate filter chips?
4. **Card interaction model:** keep `toggleStatus` exclusive + `toggleStatusInFilter` multi-select, or unify to one behavior (recommend exclusive card-as-filter with `Todos` default to keep operator predictability)?
5. **Table priority on narrow:** which columns must stay in viewport at `390px` without scroll to satisfy the verify fail (`Boleta`, `Producto/Cliente`, `Estado`, `Acciones` vs keeping `Sede/Ingreso/Días`)?
6. **Registro emphasis:** keep Registro as third nav peer or promote as primary after Dashboard? Determines whether Direction 3 applies.
7. **Typography floor:** enforce `13px` label floor everywhere (fix `10px` RUT/actor) or allow compact `10px` meta in tables only with explicit a11y sign-off?
8. **Density lock:** confirm `p-4 gap-4 rounded-sm` as default instrument vs looser `p-6 gap-6` feel — Jona's "convincing" may actually want slightly more generous density (6→5) despite spec.
9. **Empty/loading voice:** add CTA in Registro empty (`Crear servicio` / `Limpiar filtros`) and keep Spanish-constant error strings (`No se pudo cambiar el estado.` / `No se pudo transferir la sede.` without English suffix)?
10. **Brand neutralizations:** confirm no new brand assets (logo beyond current svg sync icon, marketing copy, testimonials, pricing) are desired — prevents fabrication.

---

## 7. Is external/source-backed `sdd-research` warranted?

**Warranted — narrowly, not as authority, only to avoid default-palette convergence when choosing shimmer/measure or re-deriving dark.**

`sdd-research` is NOT needed to replace `DESIGN.md` authority; it is useful only for craft floors that are not product decisions.

**Narrow lanes (run only if Jona confirms keep Taller Claro):**

- **Lane A — Operational density proof (source-backed):** source-backed examples of dense operational tools that use `p-4 gap-4` + 8px radius + hairline borders without feeling cheap, to justify rhythm tightening. Query: `operational dashboard density scale 4-unit compact table rhythm`.
- **Lane B — Ink desaturated palette verification (no direction replacement):** verify zinc/ink dark-mode WCAG AAA derivations via OKLCH lightness/chroma rules, replacing ad-hoc dark hex in `.dark`. Query: `OKLCH dark mode lightness chroma reduced near black white`.
- **Lane C — Boneyard reduced-motion compliance:** verify current Boneyard `shimmer → static` under `prefers-reduced-motion` and `aria-busy` overlay pattern matches `a11y` best practice, to keep artifact evidence source-backed. Query: `boneyard exact-layout skeleton aria-busy prefers-reduced-motion`.

**Do not run research for:** replacing brand colors, choosing Inter or serif, glassmorphism, glow/blur/gradients — all banned per `DESIGN.md` and not product-confirmed.

If user instead elects a palette rebrand, then a single extra lane `palette seed` via `scripts/palette.mjs` would be warranted — but not now, per instruction to prefer approved design investigations.

---

## 8. Risks & Scope Discipline

- **Repeating audit-ui-ux-remediation churn:** verify-report showed live `PATCH /status|/transfer` 500 via `createBatch` (PocketBase 0.40.1 denial). Any page redesign must not widen API surface before that batch path is sequenced/rolled back — keep writes ordered or retarget. Risk: new cards/filters that call the same batch path re-introduce `verify-report` blockers.
- **Density regression:** tightening to `p-4 gap-4` across all surfaces improves rhythm but risks feeling "too tight" on Registro timeline — mitigate with staged `gap-6` between section groups only.
- **Dark mode unverified contrast:** shipping `.dark` without AAA proof risks a11y regression on the second theme; verify with computed `4.5:1 / 3:1` checks, not eyesight.
- **Mobile card divergence:** separate `md:hidden` cards duplicate table semantics; they can drift from desktop badges/actions — keep single source (`Service` + `STATUS_BADGE`) and test via verify-ui 390/1280 screenshot matrix.
- **Copy regression:** English leaks reappear via template literals during refactor — gate with `grep -R "status|transfer"` Spanish-constant check in verify.
- **Review budget (800 lines):** even Direction 2 stays under budget if stacked: Slice 1 craft floor (radius/type/motion/copy) → Slice 2 dashboard stats/toolbar → Slice 3 table/Registro progressive disclosure → Slice 4 dark token verify. Avoid single 600-line PR that mixes shell+type+color.

---

## 9. Ready for Proposal

**Yes — with the blocking decisions above answered.** Exploration is complete as read-only; no `proposal.md` / `spec` / `design` / `tasks` were created, per contract.

Orchestrator should present Directions 1 and 2 to Jona, confirm decisions 1–10 (at minimum 1–5), then launch `sdd-new` with the selected direction locked. If dark mode verification is confirmed, run the three narrow `sdd-research` lanes in parallel before `sdd-design`; otherwise run `sdd-propose` next directly.

**Next recommended:** `sdd-new` (which will create `proposal.md`) with the chosen direction anchored; `sdd-research` only if lanes A–C are accepted, capped at 3 queries and treating `DESIGN.md` as non-replaceable authority.

---

## Appendix — Evidence Index (read-only)

- `PRODUCT.md:1-93` — users, purpose, `location_logs` audit, zinc/ink restraint.
- `DESIGN.md:1-476` — Taller Claro primitives/semantics, `Fira Sans/Code`, `variance 3 / motion 2 / density 6`, `p-4 gap-4`, `8/10/12/full` radii, hairline, motion 150–200ms, reduced-motion, shell regression contract.
- `app/(app)/layout.tsx:1-28` — single shell owner.
- `styles/globals.css:1-182` — `@theme` zinc/ink tokens, `.dark` overrides, reduced-motion bone disable.
- `components/layout/Navbar.tsx:1-216` — `h-16` sticky `z-40`, `rounded-xl` branding, `top-16` mobile drawer, `h-11` theme toggle.
- `components/services/ServicesDashboard.tsx:1-767` — stats `p-6 border-l-4 tracking-widest`, toolbar `p-4 flex-wrap`, skeleton + `aria-busy`, dialogs line 721/735/759 English leak, `STATUS_CARD/BADGE` semantic but days badge not.
- `components/services/ServicesTable.tsx:1-280` — `px-6 py-4 tracking-wider`, `10px` RUT, `rounded-xl` mobile cards.
- `app/(app)/service-events/serviceEventsManager.tsx:1-548` — `text-3xl` gradient underline, `border-l-4` stat, `rounded-xl` wrappers.
- `components/ui/dialog.tsx:1-132` — compliant a11y contract.
- `openspec/changes/audit-ui-ux-remediation/exploration.md` — prior defect clusters A–D preserved.
- `openspec/changes/audit-ui-ux-remediation/verify-report.md:1-499` — verdict `fail` 6 FAILING (mobile actions `x≈966`, `PATCH 500 batch`, Registro off-screen, ISO, English leftovers).
