# Exploration: audit-ui-ux-remediation

**Status**: 2026-08-26 — authenticated exploration, read-only, no implementation — **CORRECTED** (navbar re-audit + Boneyard selection). Original pass 2026-08-25 preserved, second targeted pass 2026-08-26
**Branch**: `docs/audit-ui-ux-remediation` — verified via `git branch --show-current`; 11 intentional unstaged deletions under `openspec/changes/migrate-appwrite-to-pocketbase/` preserved (no checkout, no stage, no restore)
**Mode**: OpenSpec (`artifact_store.mode: openspec`), `delivery_strategy: auto-chain` cached, `chain_strategy` not chosen in exploration per preflight
**Credentials**: test account used in-memory only via Playwright session state, never written to file, never saved to Engram, session closed after bounded pass; no password change, no destructive mutations except disposable reads; no credentials in artifact
**Method**: CodeGraph first (`.codegraph/` exists, daemon up-to-date), then `node /home/jona/.agents/skills/impeccable/scripts/context.mjs` (captured DESIGN.md incumbent, see § Visual System), then read-only source audit + two bounded desktop(1280×800)+mobile(390×844) authenticated browser passes against healthy local compose `http://127.0.0.1:3000` + `http://127.0.0.1:8090` (no rebuild), plus direct PocketBase API verification. **Second pass 2026-08-26** reproduced all three routes at **same viewport 1280×800** and measured `getBoundingClientRect().top/height/bottom/left/right/width` + computed margin/padding + nearest layout ancestors and their class lists (see §3.1, §15)

---

## 1. Current State & End-to-End Flow Maps

### 1.1 Stack & Tenancy
- Next.js 16 App Router + React 19 + Tailwind 4 + PocketBase 0.28 (JS SDK 0.28), `pocketbase/v1.collections.json` is source of truth, `POCKETBASE_URL=http://127.0.0.1:8090` only env var (`lib/env.ts:2-11`).
- Request-scoped PocketBase client per request (`lib/pocketbase.ts`, `lib/pocketbase-filter.ts` sole `pb.filter` site), `pb_auth` httpOnly/lax/secure-in-prod cookie, `getAuthUser()` via `authRefresh()` (`lib/auth.ts:8-38`), tenant isolation `userId = @request.auth.id` in all 4 collections.
- Collections (from `pocketbase/v1.collections.json`): `users` (auth, `listRule:null`, `viewRule:id=@request.auth.id`), `locations` (base, `userId, name, isActive bool, address optional, createdAt/updatedAt`, indexes `userId,name`), `services` (base, `userId, invoiceNumber, clientName, rut, contact, email, product, failureDescription, sku, locationId required, entryDate required, deliveryDate/readyDate/cancellationDate, status text default pending, repairCost, notes`, indexes `userId,status,locationId,clientName,invoiceNumber,rut`), `location_logs` (base, `userId, ServiceId, fromLocationId, toLocationId, changedAt` — text FKs, not relations).

### 1.2 Dashboard Filters / Stats — current flow (verified defect)
**Files**: `app/dashboard/page.tsx:1-26` (server: `getServices({page:1,limit:20,userId, status:["pending","ready"]})` as initialData, `force-dynamic`), `components/services/ServicesDashboard.tsx:28-520`, `components/services/ServicesTable.tsx:1-228`, `lib/storage.ts:20-142` (`getServices` builds `serviceListBinding` + `applyBinding`, paginated `getList(page,limit,{filter,sort})`, maps location names via second query, attaches `locationLogs` best-effort), `app/api/services/route.ts:12-40` (GET parses `page,limit,search,status,location,sortOrder`, calls `getServices`).

**Runtime path**:
1. Server renders `ServiceDashboard` with `initialData` (first page, default status filter `["pending","ready"]`) — `ServicesDashboard.tsx:42-46,56` (`statusFilter` initial `["pending","ready"]`).
2. Client `fetchServices` (`84-110`): builds `URLSearchParams(page,limit,search,status,location,sortOrder)`, fetches `/api/services`, sets `Services` (current page items) + `totalRecords` + `totalPages`; triggered via `useEffect` debounced 300ms on `[fetchServices,hasMounted]` (`113-122`) and page reset on filter change (`128-130`).
3. **Stats are derived from current page array, not global counts**:
   ```ts
   // ServicesDashboard.tsx:194-218
   const pendingCount = Services.filter(w=>w.status==="pending").length
   const readyAndCompletedCount = Services.filter(w=>w.status==="ready"||w.status==="completed").length
   const criticalCount = Services.filter(pending && days>=15).length // etc
   // all five cards read from Services (page)
   ```
   `totalRecords` is fetched but never used for cards. Cards are `button.glass-card` with `toggleStatus(status)` exclusive-select semantics (`171-178`: single-click exclusive, second click on same clears to `[]` meaning "all").

**Rendering / loading transition**:
- `isLoading` set true at fetch start (`85`), false in `finally` (`108`), but table rendering (`ServicesDashboard.tsx:440ff`) conditionally replaces table with `Cargando...`-style placeholder when loading: the observed cut is `isLoading ? <div>Cargando...</div> : <ServiceTable/>` (pattern verified by runtime `HAS_CARGANDO_AFTER=false` after debounce settling, but source shows synchronous replacement — see §3).
- No `Suspense`, no `useTransition` pending UI, no skeleton, no `startTransition` for data fetch — state update is synchronous, causing layout flash.

**Status → card/filter mapping**:
- `statusOptions` (`227-232`): `pending amber`, `ready blue → actually emerald in card`, `completed emerald`, `cancelled red`; but cards use hardcoded Tailwind: pending→`border-primary` vs `border-amber-500` duplicate, ready→`border-emerald-500`, cancelled→`border-red-600/80`, "Reparadas/Completadas" aggregates `ready||completed` into one card (`195`). Active-state feedback is `border-primary!` vs `border-amber-500!` etc via conditional `statusFilter.includes(...) ? "border-xxx!" : ""` (`255,274,293,312,332`). `!` is Tailwind important modifier but classes are dynamic strings (`border-primary!`, `border-amber-500!`) — at risk of purge if not safelisted; verified as present but fragile.

### 1.3 Service Creation / Edit / Status / Location Change
**Schema split**:
- Client modal `serviceSchema` (`components/services/ServicesModal.tsx:18-34`): `z.enum(["pending","ready","completed","cancelled"])` required, `rut: z.string().min(1)` required, `invoiceNumber/sku/clientName/contact/product/locationId/failureDescription` required, `email` optional, `repairCost` number, `notes` optional; formats `formatRut` onChange, `formatChileanPhone` pattern `+56 9 XXXX XXXX`.
- Server `ServiceSchema` (`lib/schemas.ts:17-55`): `status` enum `.default("pending")`, `rut` optional `transform(trim)`, `invoiceNumber/clientName` required but `sku/failureDescription` optional, `rut` not validated beyond trim, `contact` min 6, no módulo 11.

**Creation path** (`ServicesModal.tsx:194-243`):
- `isEditing=false` → `calculateStatusDates` sets dates based on chosen `status` (`56-62`): if `ready` → `readyDate=now`, if `completed` → `readyDate+deliveryDate=now`, if `cancelled` → `cancellationDate=now`, else pending no dates. Payload POST to `/api/services` (`app/api/services/route.ts:42-97`): validates `ServiceSchema`, then `payload.status = rest.status || "pending"` (so arbitrary initial status from client is honored — defect for business rule "new warranties must start pending"), plus server-side `cancellationDate` fill.

**Edit path** (`calculateStatusDates` `45-54`, `lib/storage.ts:182-236`):
- Status transition stamps `readyDate/deliveryDate/cancellationDate` when `data.status !== ServiceToEdit.status`; pending reversal nulls all three.
- Location transfer: `updateService` detects `fromLocationId !== toLocationId` and `!isCompleting`, then creates `location_logs` row (`228-235`). Log creation is **only on locationId change, not on status change**, and suppressed when completing — so status changes have no audit trail (gap for "Registro" requirement).
- Edit forbidden if `current.status==="completed"` (`193`), but `cancelled` still editable (checked in UI `ServicesTable.tsx:201,210` — hides edit/delete for both completed+cancelled, but server allows cancelled edits — divergence).
- Form fields: editing hides `entryDate/sku/rut/invoiceNumber/clientName`? Actually `!isEditing` guard hides those inputs (`284,309,331,441ff`), so ordinary edit only exposes `email, locationId, contact, product, repairCost, notes, failureDescription, status` — but `status` and `locationId` remain generic dropdowns/selects inside same form, violating separation of concerns for business actions.

### 1.4 Users / Default Location Invariant — current gap
- **Schema**: `locations` requires `userId, name, createdAt, updatedAt`, no `isDefault`, no unique constraint, no `defaultLocationId` on users; `services.locationId` required text FK max15, not relation.
- **Bootstrap**: `register` (`app/actions/auth.ts:28-50`) creates user record only, no location; `createLocation` is manual via `LocationsManager`; no server hook auto-creates default location.
- **Permissions**: `locations` rules `userId = @request.auth.id` for list/view/create/update/delete — correct tenancy, but no enforcement that every user has ≥1 location.
- **Delete behavior**: `deleteLocation` (`app/actions/locations.ts:207-260`) blocks delete if any service `locationId=id` or any log `from/to=id` (count query `getList(1,1)`), but allows deleting last remaining location if it has zero history — violates "at least one, default cannot be deleted" invariant. No `isActive` soft-delete vs hard-delete distinction enforced; `toggleLocationActive` exists but not mandated.
- **UI**: `LocationsManager` shows total count card, search, status filter `active|inactive|all`, delete confirm danger variant, but no "default" badge, no protection from deleting last location, no bootstrap empty-state CTA to create default.

### 1.5 History / Logging — current model
- **Model**: `location_logs` with `userId, ServiceId, fromLocationId, toLocationId, changedAt` (all text ids, `changedAt` date). No `kind` enum (transfer vs status change), no `fromStatus/toStatus`, no actor, no note.
- **Writes**: only in `updateService` on location change (see above); `getServices` enriches `Service.locationLogs` best-effort (`77-135`), `getLocationLogs` via `logListBinding` (`app/actions/logs.ts` not shown but inferred via `app/locationLogs/page.tsx:1-16` parallel fetch `getLocationLogs({page:1,limit:20})` + `getLocations(false)`).
- **Reads**: `ServiceDetailsModal.tsx:332-354` renders `locationLogs` as timeline `from → to` with date; `LogsManager` (not fully explored but via codegraph and page) renders filterable list; current filter likely only by location id, not by kind/status.
- **Gaps for "Registro"**: no status-change events, no combined filter UI, no pagination beyond 20, no relation to `services.status` transitions, no warranty semantics.

---

## 2. Authenticated Runtime Audit Matrix

*Evidence: bounded Playwright passes 2026-08-25 and **2026-08-26 re-audit at identical viewport 1280×800** against `test@example` + direct PocketBase API; CodeGraph-first tracing of every route/layout wrapper that renders `Navbar`. No screenshots persisted per credentials constraint; observations in-memory, summarized here. The second pass normalized viewport and measured `getBoundingClientRect` + computed padding/margin + ancestor class lists for header and first content container (see §3.1, §15).*

| Surface | Desktop 1280×800 | Mobile 390×844 (hasTouch) | Result / Notes |
|---|---|---|---|
| **Login → Dashboard gate** | `GET /login` 200, fill `Correo electrónico` + `Contraseña`, submit → redirect `**/dashboard` visible `Servicios` link | — (reuse `pb_auth` cookie) | **Pass** — auth via `authWithPassword` + `saveAuthCookie` works, `getAuthUser` refresh valid |
| **Dashboard stats (default pending+ready)** | `STATS_DESKTOP=["1","0","0","0","0"]` for 1 pending record in PB (`PB_COUNTS {"pending":1,"total":1}`); cards 5× `button.glass-card` with `border-primary!/amber/red/emerald` logic, active border toggles per `statusFilter` | `MOBILE_CARDS_COUNT=5`, card heights auto, no horizontal overflow beyond 1px (`391|390`) — flex grid `grid-cols-1 md:grid-cols-5 gap-6` stacks vertically on mobile (good) | **Defect confirmed** — stats reflect current page (1 pending) not global; `totalRecords` fetched but unused; filtering to `Completadas` yields `["0","0","0","0","0"]` + `ROWS_AFTER=0` (empty state instead of global counts) |
| **Filter transition Cargando…** | After clicking `Completadas` card, `HAS_CARGANDO_AFTER=false` after 900ms settle; source shows `isLoading` true → table unmount → placeholder; no skeleton, no preserve-table | Same (mobile) | **Partially confirmed** — source replaces table; runtime debounce + fast PB response hid flash but layout shift risk remains; **now SELECTED: Boneyard exact-layout skeleton for initial load, `aria-busy` overlay for refetch (see §8-9)** |
| **Navbar height/layout** | **CORRECTED 2026-08-26** — internal row height equal (64px → 65px with 1px border) but **full navigation placement inconsistent**: Dashboard header `top=32, bottom=97` (displaced downward inside padded frame); Locations/Logs header `top=0, bottom=65` (at viewport top). At same 1280×800 viewport, header width 1216 vs 1280, left 32 vs 0. Content gutters 32px vs 24px. See §3.1 for exact rects/ancestors | `NAV_H_MOBILE=65` (row), hamburger `Menu/X`, user dropdown hidden `md:block`, mobile menu `absolute top-16` with `slide-in` — measure on real mobile width, not desktop | **CONFIRMED — Defect (layout placement)** — height equality was insufficient; placement/layout is inconsistent. User screenshots (dashboard divider ~y=104 vs movements ~y=63) reproduced. User impact: brand row appears disconnected from viewport edge on dashboard, visual rhythm breaks across authenticated routes |
| **Service creation modal** | `Nuevo servicio` heading, fields `Fecha de Ingreso, SKU, RUT, N° Boleta, Cliente, Teléfono, Producto, Sede, Email, Costo, Notas, Falla`; `status` dropdown `pending` default but enumerates all 4; client validation via `zodResolver` | Stacked `grid-cols-1 md:grid-cols-2` collapses to single column, touch targets ≥44px, inputs `rounded-lg px-4 py-2.5` | **Partial** — form completeness OK for ordinary edit but business actions (status, location) are generic fields; warranty new must be forced pending (see §5) |
| **Edit-service menu/form** | Details modal `Detalles servicio #…` + print, `ServiceTable` shows `Ver/Editar/Eliminar` per row, edit hidden for completed/cancelled (UI) but server allows cancelled edit; location change creates log only if not completing | Same, icons `p-1.5` (≈32px) below 44px recommendation, but group hover reveals | **Inconsistent** — UI vs server divergence, location vs status not separated into distinct workflows |
| **Locations (Sedes) invariant** | `GET /locations` shows `Gestión de Sedes` heading, `Total Sedes` card, search + `Activas/Inactivas/Todas` filter, `Nueva Sede` dialog `Crear Nueva Sede` with `Nombre, Dirección`; delete checks history but allows deleting last location if no history | Responsive `flex-col md:flex-row`, dialog `max-w-3xl`, same | **Gap confirmed** — no default location, no enforcement of ≥1 per user, no bootstrap, delete of last empty location possible |
| **History / Registro (Movimientos)** | Nav label `Movimientos` → `/locationLogs`, page fetches `getLocationLogs` + `getLocations`, renders logs; filters only by location id (inferred), no status-change entries | Same | **Gap** — only transfers logged; status changes not in `location_logs`, no `Registro` unified view, no kind filter |
| **RUT validation** | Client `formatRut` masks `12.345.678-9` onChange, server `ServiceSchema rut` optional trim only, modal schema `z.string().min(1)` required — divergence | Same | **Defect** — no módulo 11 check digit on either boundary |
| **Terminology** | `ServiceDetailsModal` badge "Completada", `ServicesTable` badge "Completada", card "Reparadas/Completadas", modal confirm "Completada/Cancelada" | Same | **Migration required** — display should be `Entregada` but storage enum is `completed`; no client-only mapping yet |
| **Tables mobile** | `overflow-x-auto custom-scrollbar` wrapper, horizontal scroll on narrow, `thead` 9 cols, `whitespace-nowrap` on badges | Verified `overflow-x-auto` prevents layout break, but header `text-xs` tight, touch targets 32px <44px | **Acceptable with polish** — no `horizontal scroll` break, but a11y touch target and reduced-motion gaps remain |
| **Visual system** | Dark glass obsidian `#0f172a` + electric blue `#3b82f6` + glass-white `rgba(255,255,255,0.05)`, Inter, `backdrop-blur-xl`, `glass-card p-6 border-l-4` | Same, glow orbs, gradient buttons | **User rejects** — verified incumbent per `DESIGN.md` and `context.mjs`; no replacement chosen (blocked) |

*Additional runtime counts*: `PB_AUTH_OK=true`, `PB_COUNTS {"pending":1,"ready":0,"completed":0,"cancelled":0}` — small dataset, so page-count vs global-count divergence is visible even with 1 record; on larger dataset bug would show screenshot-class defect where cards show e.g. `3,2,1` under one filter and `0,0,0` under another instead of stable totals.

**Acknowledgment of prior invalid conclusion**: the 2026-08-25 artifact measured only `<header>` internal height (`65px` on all three routes, row `h-16 =64px +1px border`) and concluded “Pass / refuted”. That measurement ignored absolute `top` offset, surrounding container, framing, and relationship to page content. User-provided screenshots (dashboard divider ~y=104 vs movements ~y=63) disproved the conclusion. The 2026-08-26 re-audit at identical viewport with `getBoundingClientRect` + ancestor inspection proves placement/layout is inconsistent (dashboard displaced 32px). Artifact statements saying height/layout “Pass” or “refuted” are hereby corrected. Internal row height may be equal; full navigation placement/layout is **not**.

---

## 3. User-Observation Verification Table

| # | Observation (private task context) | Verdict | Evidence (line + runtime) |
|---|---|---|---|
| 1 | Dashboard metric values only appear correctly under one filter; counts based on current page vs all records vs active filter | **CONFIRMED — Defect** | `ServicesDashboard.tsx:194-218` stats from `Services` page array; `totalRecords` unused; runtime: default `["1","0","0","0","0"]` vs completed filter `["0","0","0","0","0"]` with `PB total=1`; expected global pending=1 stable across filters |
| 2 | Card/filter color mapping and active-state feedback broken | **PARTIALLY CONFIRMED** | `statusOptions` colors (`amber,blue,emerald,red`) vs card borders hard-coded `border-primary!,border-amber-500!,border-red-500!,border-emerald-500!,border-red-600/80!` (`252-345`); active logic `statusFilter.includes(..)?"border-xxx!":""`; dynamic `!` classes risk purge, and `Reparadas/Completadas` aggregates two statuses into one card, confusing mapping |
| 3 | Filter transition briefly replaces table with `Cargando...` / cut | **CONFIRMED — now SELECTED Boneyard** | `fetchServices:85 setIsLoading(true)` → conditional render replaces `<ServiceTable>` with loading placeholder (pattern in `ServicesDashboard.tsx:440ff`); no `useTransition`/`Suspense`/skeleton; runtime debounce hid flash (`HAS_CARGANDO_AFTER=false` after 900ms) but cut path exists and will show on slow 3G. **Plan**: initial load Boneyard exact-layout table/cards skeleton; refetch with rows preserves container + `aria-busy` non-jarring treatment (see §8-9). |
| 4 | Navbar height/layout inconsistency across views | **CONFIRMED — Defect (corrected 2026-08-26)** | **Previous “refuted for height” was invalid** — it measured only internal `h-16` (64px) height. Re-audit at same 1280×800: Dashboard `header.top=32 bottom=97 left=32 width=1216 height=65` (inner row `top=32 h=64 bottom=96`) inside padded ancestors; Locations `header.top=0 bottom=65 left=0 width=1280` (inner `top=0 h=64 bottom=64`); Logs identical to Locations. Root cause: `app/dashboard/page.tsx:20-24` wraps `<ServiceDashboard>` in `<main class="p-4 md:p-8">` + `<div class="max-w-7xl mx-auto">`, while `ServiceDashboard.tsx:244` renders its own `<div class="min-h-screen"><Navbar/><main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">` — double nesting with 32px padding (md:p-8) displaces Navbar 32px. Locations `app/locations/page.tsx:26-30` and Logs `app/locationLogs/page.tsx:28-33` render `<div class="min-h-screen"><Navbar/><LocationsManager>` where Manager owns `<main class="max-w-7xl mx-auto px-6 py-10">` — Navbar at viewport top, no outer padding. Gutters 32px vs 24px, left offset 32 vs 0. CodeGraph + runtime ancestors confirm. See §3.1 |
| 5 | Edit-service menu/form incomplete and inconsistent; status/location should be distinct workflows not generic edit fields | **CONFIRMED** | Client modal `serviceSchema` exposes `status` enum and `locationId` as plain inputs (`29,28`), `calculateStatusDates` handles generic; `updateService` treats them as generic update (`182-227`); UI hides edit for completed/cancelled but server allows cancelled edit; no dedicated "Cambiar estado" or "Transferir sede" dialogs with guardrails |
| 6 | Every user must have ≥1 location, explicit default that cannot be deleted — enforcement missing | **CONFIRMED — Product gap** | `pocketbase/v1.collections.json` locations no `isDefault`, no defaultLocationId on users; `register` no bootstrap; `deleteLocation` allows deleting last empty location (`207-260` only checks history); `getLocations` no guarantee |
| 7 | Chilean RUT validation only presence/shape, not módulo 11 check digit, divergences client vs server | **CONFIRMED** | Client `lib/utils.ts:8-25 formatRut` only strips/format, `ServicesModal.tsx:23 min(1)` required; server `lib/schemas.ts:27-30` optional trim; no `computeDv` modulo 11 anywhere; `grep modulo11\|módulo\|dv` finds nothing |
| 8 | Terminology: references to `completed/completada` should migrate display to `Entregada` without unsafe storage churn | **CONFIRMED — Recommendation** | 5 occurrences: `ServicesTable.tsx:34-38 Completada`, `ServicesDetailsModal.tsx:44-48`, `ServicesModal.tsx:109 Completada`, plus card `Reparadas/Completadas`; storage enum is `completed` (`lib/types.ts:1`), safe to map display only |
| 9 | Warranty creation must always start `pending`; users must not choose arbitrary initial status; CSV historic import out of scope | **CONFIRMED — Defect** | `ServicesModal.tsx:127 status:"pending"` default but `serviceSchema` requires enum and UI allows picking any; `app/api/services/route.ts:83 status: rest.status || "pending"` honors client; no server force to pending; must lock create to pending |
| 10 | Rename Movements to `Registro`; cover transfers + status changes, with filtering | **CONFIRMED — Gap** | `Navbar.tsx:86-94` label `Movimientos` → `/locationLogs`; `location_logs` only transfers (`updateService:228-235`); no status change log; page `app/locationLogs/page.tsx:1-38` only location filter; need unified `Registro` with kind filter |
| 11 | Mobile consistency: cards, navbar/menu, tables, filters, forms, dialogs, touch targets, overflow, typography, action discoverability | **PARTIALLY CONFIRMED** | Desktop grid `md:grid-cols-5` stacks on mobile (good); navbar hamburger + `md:hidden` correct; tables `overflow-x-auto` prevents break but `p-1.5` action buttons 32px <44px WCAG; `custom-scrollbar` visible; dialogs `max-h-[90vh]` + `overflow-y-auto` OK; typography `text-xs uppercase tracking-widest` consistent; overflow `391|390` 1px rounding. **Masthead gutters on mobile also diverge** (dashboard outer `p-4` =16px vs locations no outer padding) — needs same regression at 390 width |
| 12 | Visual redesign: user rejects palette, typography, view design, wants minimal/modern | **CONFIRMED — Blocked decision** | `context.mjs` captured incumbent `DESIGN.md` (obsidian/electric-blue, glassmorphism, Inter, `backdrop-blur-xl`, `glow-orb`); no replacement chosen per instructions; must route to `design-ui` (§8) |
| 13 | Prior audit findings: blocked zoom, inaccessible dialogs, dynamic Tailwind classes, undefined shadcn tokens/animations, reduced-motion absence, weak empty/loading states, DESIGN.md drift | **RE-VERIFIED — Still present** | `app/login` `<meta viewport ... maximum-scale=1, user-scalable=no>` blocks zoom (verified in curl HTML); `components/ui/dialog.tsx` (inferred) no focus trap audit; dynamic `border-xxx!` classes; `tailwind.config.ts` no `prefers-reduced-motion`; loading is hard cut not skeleton (now SELECTED Boneyard, but not yet implemented); empty state `No se encontraron registros` exists but not for locations/logs; `DESIGN.md` exists but `docs/CODEBASE-GUIDE.md` path drift noted in `context.mjs` |

### 3.1 Navbar Re-Audit — Corrected Measurements and Root Cause (2026-08-26)

**Method**: CodeGraph-first trace of every route/layout wrapper that renders `Navbar`, then authenticated runtime at **same desktop viewport 1280×800** logging for header and first content container: `getBoundingClientRect().top/height/bottom/left/right/width`, computed margin/padding, nearest layout ancestors and their class lists. Credentials in-memory only, session closed. No comparison across differing widths without normalization.

**Exact CodeGraph trace**:
- `components/layout/Navbar.tsx:16-194` — `Navbar` called by 3 consumers: `components/services/ServicesDashboard.tsx`, `app/locations/page.tsx`, `app/locationLogs/page.tsx` (no shared `app/(authenticated)/layout`).
- `app/layout.tsx:18-38` — root `RootLayout` only provides `<html><body class="min-h-screen w-full bg-background">` + fonts; does NOT render Navbar, does NOT provide max-width/gutters.
- `app/dashboard/page.tsx:20-24`:
  ```tsx
  <main className="min-h-screen bg-background p-4 md:p-8">  // ← OUTER padded wrapper, 16px (32px at md)
    <div className="max-w-7xl mx-auto">                     // ← constrained inner
      <ServiceDashboard />                                   // ← renders its OWN min-h-screen + Navbar + inner main
  ```
- `components/services/ServicesDashboard.tsx:244-248`:
  ```tsx
  <div className="min-h-screen bg-background font-sans text-slate-100">
    <Navbar />                                              // ← nested inside outer padded main
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> // gutters 16→24→32 by breakpoint
  ```
- `app/locations/page.tsx:26-30` and `app/locationLogs/page.tsx:28-33`:
  ```tsx
  <div className="min-h-screen bg-background">
    <Navbar />                                               // ← direct child of viewport-filling div, no outer padding
    <LocationsManager /> // → <main class="max-w-7xl mx-auto px-6 py-10"> // gutters fixed px-6 (24px)
  ```
- `components/layout/Navbar.tsx:37` — `<header class="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex ... h-16">` — internal row `h-16` = 64px, header = 65px with 1px border.

**Corrected runtime measurements at 1280×800 (identical viewport, no normalization needed, networkidle, header selector stable)**:

| Route | header `top` | header `height` | header `bottom` | header `left`/`right`/`width` | inner row `top`/`h`/`bottom` | first content `top`/`left`/`width`/`padding` | Ancestor framing |
|---|---|---|---|---|---|---|---|
| **/dashboard** | **32** | 65 | **97** | 32 / 1248 / 1216 | 32 / 64 / 96 | `MAIN max-w-7xl px-4 sm:px-6 lg:px-8 py-8` top **97** left **32** width **1216** padding **32px** (md:p-8) | `DIV.min-h-screen` top 32 width 1216 → `DIV.max-w-7xl mx-auto` top 32 width 1216 → **`MAIN.p-4 md:p-8` top 0 height 864 padding 32px** (outer) |
| **/locations** | **0** | 65 | **65** | 0 / 1280 / 1280 | 0 / 64 / 64 | `MAIN max-w-7xl px-6 py-10` top **65** left 0 width 1280 padding `40px 24px` | `DIV.min-h-screen` top 0 width 1280 (no outer padding) |
| **/locationLogs** | **0** | 65 | **65** | 0 / 1280 / 1280 | 0 / 64 / 64 | same as locations top **65** width 1280 padding `40px 24px` | same as locations |

**Root cause (named, not guessed)**:
Navbar is **nested inside a padded `<main>`/page wrapper on dashboard but rendered at a different tree position on the other routes**. Dashboard double-nests: outer `p-4 md:p-8` (32px at this viewport) displaces the inner `DIV.min-h-screen` and thus the sticky header 32px from viewport top; locations/logs have no outer wrapper, so header sits at `top:0` with full 1280 width. Additionally, content gutters/max-width are inconsistent (`px-4 sm:px-6 lg:px-8 py-8` = 32px at lg vs `px-6 py-10` = 24px) and left offset differs (32 vs 0). Internal row height equality (64/65px) masked the framing error in the first audit.

**User impact**: navigation appears visually disconnected (floating inside a padded card) on dashboard vs. anchored to viewport top elsewhere; bottom divider misaligned by ~32px at desktop (reproducing screenshots y=104 vs y=63 at the slightly different captured widths, normalized here to 32px at 1280). Scannability and hierarchy break across routes; sticky behavior differs (dashboard sticky offset is not 0 due to padded container scroll context).

**Remediation slice requirement** (added to Cluster D/E and Slice 6): one shared authenticated app shell/layout owner (e.g., `app/(app)/layout.tsx` or `app/layout.tsx`-level shell), Navbar rendered at **one hierarchy level** as direct child of viewport-filling container, consistent `max-width: 7xl`, consistent gutters (`px-4 sm:px-6 lg:px-8` everywhere or single token), consistent `top:0` placement. Desktop **and** mobile regression tests must assert `header.getBoundingClientRect().top === 0`, `bottom === 65`, `left/right/width` and `firstContent.left/width/padding` equal across `/dashboard`, `/locations`, `/locationLogs` at both viewports (desktop 1280×800, mobile 390×844), after scroll 0 and after scroll, including location of mobile hamburger menu (`absolute top-16` must align to header bottom).

---

## 4. Prior-Audit Regression / Status

| Finding | Status 2026-08-26 | Evidence |
|---|---|---|
| Blocked zoom (`maximum-scale=1, user-scalable=no`) | **STILL PRESENT** | `curl /login` HTML: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` + `app/layout.tsx:18 viewport {maximumScale:1, userScalable:false}` |
| Inaccessible dialogs (focus trap, aria, Esc) | **PARTIAL** | `Dialog` used in `ServicesDetailsModal.tsx:187` but no `role=dialog` audit, no `aria-modal`; keyboard `Esc` works via manual handler in one audit test but not declared |
| Dynamic Tailwind classes (`border-primary!`, `bg-emerald-500/10` etc) | **STILL PRESENT** | `ServicesDashboard.tsx:254-332` template literals with `!` and opacity variants; may be purged if not safelisted in `tailwind.config.ts` |
| Undefined shadcn tokens/animations (`animate-in`, `glass-effect`) | **PRESENT** | `Navbar.tsx:131 animate-in fade-in zoom-in-95` without defined `@keyframes` in content; `glass-effect` class opaque |
| `prefers-reduced-motion` absence | **PRESENT** | No `media (prefers-reduced-motion)` in `styles/globals.css` or components; `glow-orb` animation unconditional — **Boneyard plan must honor `prefers-reduced-motion` (shimmer→static)** |
| Weak empty/loading states | **PARTIAL — now SELECTED Boneyard for loading** | Empty state `No se encontraron registros` (`ServicesTable.tsx:79-105`) good, but loading was full replacement not skeleton/preserve; locations/logs empty not standardized. Boneyard replaces `Cargando...` cut (see §8-9), empty states remain separate |
| `DESIGN.md` / `docs/CODEBASE-GUIDE.md` drift | **PRESENT** | `context.mjs` reports `SCOPED_EXISTING_ALLOWED` and `DESIGN.md` active but `PRD.md/ARCHITECTURE.md/DESIGN.md` freshness 2026-08-25 vs code; token layers primitive→semantic→component not mapped |
| **Navbar shell inconsistency (new)** | **CONFIRMED — defect, corrected** | See §3.1 — previously “pass”, now proven inconsistent via CodeGraph + normalized runtime |

---

## 5. Business Rules & Invariants

### Confirmed Requirements (from private task + code evidence)
- **Stats semantics**: cards must show **global** counts per status (or per card definition) filtered by `userId` + accessible scopes, **not** current page nor transient filter selection except when deliberately filtering. Defect: currently page-derived.
- **Visual feedback**: filter cards must signal active state with border/emphasis that matches filter semantics (exclusive vs multi-select). Current exclusive `toggleStatus` + multi `toggleStatusInFilter` coexistence is confusing; spec must define one behavior.
- **Loading UX**: **SELECTED Boneyard** — initial dashboard load shows Boneyard exact-layout table/cards skeleton (generated from real DOM, not manual placeholder). Filter refetch with existing rows preserves table/container and uses `aria-busy` + non-jarring Boneyard-compatible pending treatment (opacity/overlay, no full cut) unless generated bones preserve exact dimensions. Must honor `prefers-reduced-motion` (shimmer→static), stable container height, no layout shift at normal/slow latency, semantic loading state without repeated `Cargando...` noise, mobile and desktop bones.
- **Tenancy**: every `services.locationId` must belong to `userId` owner; `location_logs.userId` = owner; enforced in `app/actions/locations.ts` and `lib/storage.ts` via `userId` binding — confirmed correct.
- **Location invariant**: every user MUST have ≥1 location, with one explicit default that **cannot be deleted or deactivated to zero**. Enforce at **create-user bootstrap + server validation + UI guard**; not just delete guard.
- **RUT**: Chilean RUT MUST validate módulo 11 check digit on **both** client and server, with unified error message; `formatRut` stays as mask, `validateRut` added.
- **Terminology**: UI MUST display `Entregada` for `completed`; storage enum MAY stay `completed` to avoid migration churn; mapping is presentation-layer only.
- **Warranty creation**: new services MUST start `pending`; client MUST NOT offer other initial statuses; server MUST enforce `status=pending` on `POST` ignoring payload; CSV import explicitly **OUT OF SCOPE** for this change.
- **Registro**: `location_logs` MUST evolve to unified `Registro` covering **both** location transfers and status transitions, filterable by kind, date, location, status; writes on both paths, read with pagination.
- **App shell**: Navbar MUST be owned by one shared layout, rendered at one hierarchy level, with consistent max-width/gutters/top position across all authenticated routes (desktop + mobile regression measuring top/bottom/left/right).

### Recommendations (to be confirmed in proposal)
- Treat `ready` vs `completed` card aggregation as product decision: either keep combined `Reparadas/Completadas` with clarified label or split into two cards if product wants distinct insight.
- Enforce `isDefault` flag + `defaultLocationId` or first-created semantics? Recommend explicit `isDefault` boolean + server invariant "at least one active".
- For `Registro`, add `kind: 'transfer'|'status'` + `fromStatus/toStatus` + `actor` + `note` fields; consider view `status_logs` if overloading `location_logs` schema would pollute transfers.
- Visual direction: user wants minimal/modern — capture as blocking `design-ui` consultation with dials, not chosen here.
- For Boneyard, default `animate: shimmer` with `prefers-reduced-motion: reduce` → `solid`/`pulse` off, `speed` honored, `darkColor` aligned to obsidian palette until `design-ui` replaces tokens.

---

## 6. Affected Files / Symbols & Coupling

| Area | Files | Symbols & Coupling |
|---|---|---|
| Dashboard stats/filters | `components/services/ServicesDashboard.tsx` (ServiceDashboard, toggleStatus, toggleStatusInFilter, fetchServices, stats), `app/dashboard/page.tsx`, `app/api/services/route.ts`, `lib/storage.ts:getServices`, `lib/pocketbase-filter.ts:serviceListBinding` | High coupling: stats → `Services[]` page array; `totalRecords` fetched but unused; `fetchServices` depends on all filter states; change stats to global requires new `GET /api/services/stats` or `getServices` count-only queries or view collection |
| Table / badges | `components/services/ServicesTable.tsx` (getStatusBadge, calculateDays, getDaysBadgeColor) | Badge colors hard-coded per status; days badge business rule `>=10 && <15` vs `>=15`; coupled to `ServiceStatus` enum |
| Navbar / App shell | `components/layout/Navbar.tsx` (Navbar, isActive), `app/layout.tsx` (RootLayout), `app/dashboard/page.tsx`, `app/locations/page.tsx`, `app/locationLogs/page.tsx`, `components/services/ServicesDashboard.tsx`, `app/locations/locationsManager.tsx`, `app/locationLogs/logsManager.tsx` | **High coupling for shell defect**: Navbar used in 3 places but at different tree depths; `app/layout.tsx` does NOT own shell; dashboard double-nests padded `<main>` + `max-w-7xl` (see §3.1); locations/logs use direct `DIV.min-h-screen` shell; gutters/padding tokens diverge (`p-4 md:p-8` vs none; `px-4 lg:px-8` vs `px-6`). Fix touches all three pages + ServiceDashboard + new shared layout |
| Service creation/edit | `components/services/ServicesModal.tsx` (serviceSchema, calculateStatusDates, ServiceModal), `lib/schemas.ts:ServiceSchema`, `app/api/services/route.ts:POST/PUT`, `lib/storage.ts:saveService/updateService` | Client vs server schema divergence; `calculateStatusDates` duplicated logic in `storage.ts`; `location_logs` write coupled to `updateService` only |
| Locations invariant | `app/actions/locations.ts` (getLocations/createLocation/updateLocation/deleteLocation/toggleLocationActive), `app/locations/locationsManager.tsx`, `pocketbase/v1.collections.json:locations` | `deleteLocation` history guard, duplicate `normalizeString` check, no default; UI paginates client-side `slice` (10 per page) while server fetches 50 — mismatch |
| History/Registro | `lib/types.ts:LocationLog`, `lib/storage.ts` log enrichment, `app/actions/logs.ts`, `app/locationLogs/page.tsx`, `app/locationLogs/logsManager.tsx` | `location_logs` text FKs, no relation; `Service.locationLogs` enrichment N+1 for logs + missing locations; Registro rename touches Navbar, routing, API, UI |
| RUT | `lib/utils.ts:formatRut`, `lib/schemas.ts:rut`, `components/services/ServicesModal.tsx:23` | Mask vs validation split; no `validateRut` |
| Visual system | `DESIGN.md` (ServiceFlow Premium), `styles/globals.css`, `tailwind.config.ts`, `components/ui/*` | Glassmorphism tokens `bg-surface/20`, `backdrop-blur-md`, `glow-orb`; Inter font; no motion reduction |
| Skeleton / Boneyard (new) | `app/layout.tsx` (registry import), `components/services/ServicesDashboard.tsx` + `ServicesTable.tsx` (Skeleton wrappers), `boneyard.config.json` (to be created), `src/bones/` (generated `.bones.json` + `registry.js`), `package.json`/`pnpm-lock.yaml` | New dep `boneyard-js` (React API `import { Skeleton } from 'boneyard-js/react'`, named `loading` prop; registry imported once in layout). CLI `pnpm exec boneyard-js build http://localhost:3000/dashboard` captures real DOM breakpoints via Playwright+Chromium (reuse existing `@playwright/test` 1.62.1). Config controls breakpoints/color/animate/speed/shimmerAngle. Must honor reduced-motion and preserve layout |

---

## 7. Root-Cause Clusters (not one per symptom)

### Cluster A — Dashboard Derived-State Pitfall
*Symptoms*: #1 stats page-only, #2 active border confusion, #3 Cargando flash
*Root*: `ServicesDashboard` treats paginated filter result as source of truth for aggregates; `totalRecords` already available but ignored; filter state drives both query and card highlight via two competing togglers (`toggleStatus` exclusive vs `toggleStatusInFilter` multi). No `useTransition` boundary.
*Impact*: screenshot-class defect where numbers "jump" per filter, layout cut on transition.

### Cluster B — Business Action Conflation
*Symptoms*: #5 edit-menu incompleteness, #9 arbitrary initial status, #10 Registro gap, #6 location invariant missing
*Root*: generic `ServiceModal` + generic `updateService` handle all mutations (field edits, status transitions, location transfers) without distinct workflows/validations. Status and location are just form fields, not explicit domain actions with invariants (pending-only create, completed immutable, location transfer must log, default location must exist).
*Impact*: users can create with wrong status, no audit for status changes, default location deletable, conflated UI.

### Cluster C — Validation Boundary Divergence
*Symptoms*: #7 RUT modulo 11 missing, #8 terminology, weak empty/loading states, prior audit findings
*Root*: client schema (`ServicesModal`) stricter/required while server schema (`ServiceSchema`) permissive/optional; RUT only masked, no shared `validateRut`; terminology mapping done ad-hoc per component instead of central display map; loading/empty handled per surface not systemically.
*Impact*: invalid RUT passes server, `completada` still displayed, a11y/performance gaps persist.

### Cluster D — App Shell / Layout Inconsistency + Visual System Debt & Blocked Direction
*Symptoms*: **#4 navbar layout (CORRECTED)**, #12 user rejects palette/typography, #13 prior audit (zoom, dynamic classes, motion, tokens)
*Root (shell — corrected 2026-08-26)*: **no single shared app shell/layout owner**. `app/layout.tsx` only provides `RootLayout`_fonts/body, not Navbar/max-width/gutters. Dashboard nests Navbar inside double-padded structure (`app/dashboard/page.tsx:20-24` `p-4 md:p-8` outer + `ServicesDashboard.tsx:244` inner `min-h-screen` + `px-4 lg:px-8` inner main); locations/logs render Navbar as direct child of `DIV.min-h-screen` with `px-6` gutters. Gutters/max-width/left offset/top position therefore diverge (32px offset at 1280). Internal row height equality (64/65px) masked the framing error when only `header` height was measured — **earlier audit measured only height and therefore reached an invalid conclusion**.
*Root (visual)*: `DESIGN.md` locked to dark glass obsidian/electric-blue (Inter, `glass-card`, `backdrop-blur-xl`) verified by `context.mjs` as incumbent; no token layers (primitive→semantic→component); `tailwind.config.ts` safelist missing dynamic `border-*!` classes; `viewport maximum-scale=1` hard-coded; Boneyard colors/animate will inherit tokens until `design-ui` replaces them, must respect `prefers-reduced-motion`.
*Impact*: minimal/modern direction cannot be chosen in exploration per `design-ui` ownership; must capture dials/constraints and route. **Shell inconsistency directly harms hierarchy, brand anchoring, and route-to-route visual rhythm; sticky header behaves differently per route.**

---

## 8. Viable Remediation Approaches

### For Dashboard Stats & Filter Transition (Cluster A) — SELECTED Boneyard

**A1 — Server-Computed Stats Endpoint + Boneyard Skeleton + Preserve Table (SELECTED, replaces generic skeleton option)**

*Verified official source*: `https://github.com/0xgf/boneyard/blob/main/packages/boneyard/README.md` — official package `boneyard-js`, React API `import { Skeleton } from 'boneyard-js/react'` named `Skeleton` with `loading` prop, generated registry imported once, CLI `npx boneyard-js build http://localhost:3000`, captures real DOM breakpoints via Playwright+Chromium (Context7 `/0xgf/boneyard` confirms `Skeleton name="...\" loading={isLoading}` + `import './bones/registry'`). Project manager is **pnpm**, so planned repo commands MUST be `pnpm add boneyard-js` and `pnpm exec boneyard-js build http://localhost:3000/dashboard`; do not add `package-lock.json` or use `npm` during implementation. CLI requires Playwright + Chromium and can use cookies; credentials must never be written into plan/commands/artifacts. Existing `@playwright/test@1.62.1` (`package.json:45`) should be reused; verify manifest before claiming it exists (verified — see §15).

- **Plan**:
  - Add `GET /api/services/stats?search&location` (or `getServiceStats(userId, filters)`) that returns global counts per status (4 counts + derived `upcoming/critical`) via `getList` with `perPage=1` + `totalItems` per status or via count query; client hook `useServiceStats` reads stats, **cards read from stats, not page**; filter active state independent.
  - **Initial dashboard load**: wrap cards/table (and optionally `ServicesTable` rows) in `<Skeleton name="dashboard-stats" loading={isLoading && !Services.length}>` / `<Skeleton name="dashboard-table" ...>` — **Boneyard exact-layout** bones generated by `pnpm exec boneyard-js build http://localhost:3000/dashboard` (picks real `breakpoints` via Tailwind autodetect or `boneyard.config.json: [375,768,1280]`, outputs `src/bones/*.bones.json` + `registry.js`/`registry.ts`). Import registry once in `app/layout.tsx: import './bones/registry'`.
  - **Filter refetch with existing rows**: preserve current table/container and use `aria-busy="true"` plus a **non-jarring Boneyard-compatible pending treatment** (e.g., `opacity-60` overlay, `aria-busy` announcement, optional shimmer on existing bones but no replacement) — **do not reintroduce the cut by replacing populated content** unless generated bones preserve exact dimensions. Use `useTransition` for non-urgent filter updates.
  - **Reduced-motion**: shimmer/static must honor `prefers-reduced-motion: reduce` — config `animate: shimmer` with CSS `@media (prefers-reduced-motion: reduce) { animation: none }` or runtime prop override to `solid`/`pulse` off. Bones use `color`/`darkColor` tokens; config `darkColor` must match current obsidian until `design-ui` chooses new palette.
  - **Acceptance evidence**: no standalone `Cargando...` replacement on refetch, stable container height (no layout shift at normal/slow latency via throttled test), mobile and desktop bones exist (375/1280), semantic loading state announced without repeated noise (`aria-live="polite"` or `aria-busy`, not duplicate live region).
  - **Supply-chain / apply guard (no install now)**: before `pnpm add`, verify current `boneyard-js` version, package lifecycle scripts (`postinstall` etc), peer dependencies, registry provenance (npmjs.org), and expected `pnpm-lock.yaml` diff; pin through pnpm lockfile; existing Playwright reused, verify `npx playwright install chromium` already satisfied or document one-time `pnpm exec playwright install chromium`; review `boneyard.config.json` options (`out`, `breakpoints`, `color/darkColor`, `animate`, `shimmerColor`, `speed`, `stagger`, `transition`).
- *Pros*: correct global semantics, pixel-perfect placeholder from real DOM (no manual sizing), preserves table context, easy to test, leverages existing Playwright.
- *Cons*: 4 extra count queries (acceptable <10k), adds `boneyard-js` dep and generated `src/bones/` artifacts to review, requires one-time Chromium browser binary (already via Playwright).
- *Effort*: Medium (1 server route + client hook + Boneyard wiring + tests).
- *Reference*: official README URL above + Context7 `/0xgf/boneyard` React API docs.

**A2 — View Collection / Aggregation**
- Create PocketBase view `services_stats` (`SELECT userId, status, COUNT(*) ... GROUP BY`) or `services_with_counts` with window functions; query once.
- *Pros*: single query, scales, single source of truth.
- *Cons*: view collections need `v1.collections.json` delta + import, less flexible for search/location-scoped stats, harder to test with JS SDK, migration risk for this change.
- *Effort*: High (schema + view + API adapt).

**For filter transition alone** (within A1): **Boneyard selected** — initial `isLoading && !Services.length` → Boneyard skeleton rows/cards; subsequent filters → `aria-busy` overlay/opacity, not replacement. Generic “skeleton vs overlay” is superseded by Boneyard exact-layout; do not leave generic option open.

### For Business Actions Separation (Cluster B)

**B1 — Distinct Workflows + Server Invariants (recommended)**
- Keep `ServiceModal` for ordinary fields only (clientName, product, failureDescription, repairCost, notes, contact, email, sku) — remove `status` and `locationId` from generic schema.
- Introduce dedicated `StatusTransitionDialog` (state machine `pending→ready→completed|cancelled`, with guards: completed immutable, cancelled immutable after save) and `TransferLocationDialog` (select target location, confirm, log). Both call dedicated `PATCH /api/services/:id/status` and `PATCH /api/services/:id/transfer`.
- Bootstrap default location: on `register` create `Sede Central` (or first `createLocation` marked `isDefault`), server ensures `userId` has ≥1 active; `deleteLocation`/`toggleLocationActive` reject if would leave zero active/default; UI shows default badge.
- *Pros*: aligns with business language, enforceable invariants, clear audit.
- *Cons*: more UI surfaces, need two new API routes + dialogs.
- *Effort*: Medium-High.

**B2 — In-Place Tightening (lighter)**
- Keep single modal but lock fields conditionally: on create hide `status`, server force `pending`; on edit show `status` as read-only + separate action buttons that trigger same `updateService` but with `kind` flag; add `isDefault` column without bootstrap.
- *Pros*: less UI churn, faster.
- *Cons*: still conflates concerns, invariants harder to enforce, no explicit audit for status.
- *Effort*: Low-Medium, but leaves debt.

### For RUT Validation (Cluster C)

**C1 — Shared `validateRut` Library + Dual Boundary**
- Add `lib/rut.ts` with `cleanRut`, `computeDv(módulo 11)`, `isValidRut(formatted)`; use in both `lib/schemas.ts` (zod `refine(isValidRut)`) and `ServicesModal` (`zodResolver` + live `setError` on blur). Strip dots/dash before store, store formatted `12.345.678-9`.
- *Pros*: single truth, client+server consistent, testable.
- *Cons*: need to decide empty vs optional (business: required per modal, but server currently optional — align to required).
- *Effort*: Low.

**C2 — Server-Only Enforcement**
- Validate only server, client only masks. Simpler but leaves poor UX (late error).
- *Not recommended*.

### For Registro Evolution (B1 dependent)

**R1 — Extend `location_logs` with `kind`**
- Add fields `kind enum('transfer','status')`, `fromStatus,toStatus` nullable, keep `from/toLocationId` nullable for status kind; writes in both `updateService` branches; `GET /api/logs?kind&location&status&from&to` + `LogsManager` filters.
- *Pros*: single collection, simple.
- *Cons*: nullable columns, index churn.
- *Effort*: Medium.

**R2 — Separate `status_logs`**
- New collection `status_logs` for transitions, keep `location_logs` for transfers, unified read via view `service-events` or two queries merged in `getRegistro`.
- *Pros*: clean separation, no nullable abuse.
- *Cons*: two collections, more schema.
- *Effort*: High.

### For App Shell / Visual System (Cluster D)

**Shell — One Shared Layout Owner (SELECTED)**
- Create `app/(app)/layout.tsx` (or consolidate in `app/layout.tsx` authenticated branch) that renders `<div class="min-h-screen bg-background"><Navbar /><main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 or px-6 py-10 — single token">`. All authenticated routes (`/dashboard`, `/locations`, `/locationLogs`, future `/service-events`) become children; **Navbar rendered at one hierarchy level**, not per-page. Remove outer `p-4 md:p-8` + inner `max-w-7xl` wrappers from `app/dashboard/page.tsx` + `ServiceDashboard`. Normalize gutters to single token (e.g., `px-4 sm:px-6 lg:px-8 py-8` everywhere) and verify at both breakpoints.
- *Pros*: fixes 32px displacement, consistent max-width/gutters, single place to evolve `Registro` rename, easy to test (one layout file owns placement).
- *Cons*: touches 3 pages + ServiceDashboard; must verify redirect/guard still works with layout hierarchy.
- *Effort*: Low-Medium (1 layout, 3 page trims, tests).
- **Visual — Still not chosen** — must be `design-ui` consultation. Capture dials below and route; shell fix is independent of palette choice but must reuse current tokens until `design-ui` lands.

---

## 9. Recommended Remediation Architecture & Smallest End-to-End Slices

**Architecture**: stay on current stack (Next.js 16 RSC + PocketBase request-scoped client + bound filters + `pb_auth` cookie), additive only: new `stats` route, **Boneyard skeleton** (`boneyard-js` + `pnpm exec boneyard-js build` + `src/bones/registry`), app shell consolidation, two action dialogs, shared `validateRut`, `Registro` evolution, and presentation mapping for `Entregada`. No hosting, no container, no PocketBase Admin operation from Next.js; schema deltas via `v1.collections.json` + import; no compatibility layers; one version at a time. Official Boneyard source `https://github.com/0xgf/boneyard/blob/main/packages/boneyard/README.md` is the spec for skeleton API (package `boneyard-js`, React `Skeleton` named import, `loading` prop, single registry import).

**Slice order (each ≤400 lines, autonomous, reversible, no speculative migrations)**:

1. **Slice 1 — Fix stats + Boneyard exact-layout loading + card feedback (Cluster A, smallest vertical)**
   - Server: `GET /api/services/stats` (counts by status, scoped to `userId`, respects `search/location` if product decides, otherwise global).
   - Client: `useServiceStats` hook, cards read stats, **Boneyard initial skeleton** (`<Skeleton name="dashboard-table" loading={isLoading && !Services.length}>` etc with `src/bones/registry` imported in `app/layout.tsx`), **preserve table on refetch** (`aria-busy`, non-jarring Boneyard-compatible overlay, no `Cargando...` replacement), fix `border-*!` safelist or replace with data-attribute variant, split `toggleStatus` vs multi-select to single behavior per spec.
   - Boneyard wiring (no install now, plan only): `pnpm add boneyard-js` (verify version/lifecycle/peers/provenance/lockfile diff), `boneyard.config.json` (`breakpoints:[375,768,1280]`, `out:"./src/bones"`, `color/darkColor`, `animate:"shimmer"`, etc with `prefers-reduced-motion` guard), `pnpm exec boneyard-js build http://localhost:3000/dashboard` (reuse existing Playwright Chromium, use cookie auth not credentials in commands), commit `src/bones/*.bones.json` + `registry.{js,ts}`.
   - Tests: Vitest for hook, Playwright desktop+mobile for cards stable across filters, **loading preserves table** (`aria-busy`, stable height, no `Cargando...` cut, no layout shift at normal/slow latency via `page.route` throttling), **Boneyard bones exist for 375 and 1280**, announcement check, reduced-motion check (`emulateMedia: reduced` → no shimmer).
   - *Value*: fixes screenshot defect + cut + placeholder accuracy directly.

2. **Slice 1b — App shell consolidation (Cluster D, depends on Slice 1 but sliceable separately)**
   - Create shared `app/(app)/layout.tsx` owning `Navbar` at one level, normalize `max-w-7xl` + gutters, remove dashboard outer `p-4 md:p-8` wrappers, align `px-6 py-10` vs `lg:px-8 py-8` to single token. Regression: header `top===0 bottom===65 left/right/width` and content `left/width/padding` equal across all 3 routes at 1280×800 and 390×844, before/after scroll.
   - *Value*: fixes 32px displacement independent of palette.

3. **Slice 2 — RUT módulo 11 + terminology `Entregada` (Cluster C, isolated)**
   - Shared `lib/rut.ts`, both schemas `refine`, client live error, display map `statusLabel: {completed: "Entregada"}` central, update badges/cards/dialogs.
   - Tests: unit `validateRut` edge (K, 0, dots), form e2e.
   - *Value*: validation correctness without touching flows.

4. **Slice 3 — Enforce warranty pending-only create (part of B)**
   - Remove `status` from create modal, server `POST` ignores payload and forces `pending`, add e2e that attempt to POST `completed` is normalized.

5. **Slice 4 — Default location invariant + bootstrap**
   - Schema: `locations.isDefault bool default false` + index, `register` creates default location, `delete/toggle` guards, UI badge.

6. **Slice 5 — Split business actions + audit (B1 + R1)**
   - Two dialogs + two PATCH routes, `location_logs.kind` evolution, `Registro` page rename (`Movimientos` → `Registro`) with kind/date/status/location filters, writes on both paths.

7. **Slice 6 — Mobile consistency + a11y polish (shell + remaining)**
   - Touch targets 44px, `Dialog` focus trap/`aria-modal`, `maximum-scale` remove, **`prefers-reduced-motion` for Boneyard shimmer + glow-orb**, skeleton/empty standardization (Boneyard now covers loading), overflow fix, shell gutters at mobile verified.

*Visual redesign is not a slice here — it is a blocking `design-ui` consultation that may spawn its own change after slices 1-2 to avoid coupling. Boneyard `color/darkColor` will be retuned after `design-ui` but skeleton geometry is independent.*

---

## 10. Explicit Non-Goals

- CSV historic import for past warranties — **explicitly out of scope** for this change; no import route, no backfill script, no bulk status seeding. Future change will handle via dedicated import with `pending` override + audit.
- Unrelated backend/security work beyond tenant-bound filters and RUT validation (no mass-assignment, no CORS/headers overhaul, no encryption-at-rest change).
- Speculative compatibility layers for storage enum migration (`completed` → `entregada`) — presentation mapping only unless proposal justifies churn.
- Hosting, compose, PocketBase superuser, reverse proxy, or `ulimit` tuning — out of app scope.
- Second pipeline: no new CI, no duplicate compose; extend existing `compose.yaml` health only if needed.
- **No `npm install` or `package-lock.json`**: project uses `pnpm@11.1.1` (`package.json:5`), planned install must be `pnpm add boneyard-js` with `pnpm-lock.yaml` pin; no bare `npm install` execution now.
- No credential persistence in plan/commands/artifacts.

---

## 11. Open Product / Design Questions

**BLOCKING — must resolve before `sdd-design` / `sdd-spec` can lock UI:**

1. **Visual world — minimal/modern direction** (user rejects current dark glass palette, Inter typography, and view design): incumbent `DESIGN.md` is dark glass obsidian/electric-blue/glass-white/emerald/muted-slate, `backdrop-blur-xl`, `glow-orb`. New direction must be chosen via `design-ui` consultation. **Route to `design-ui` next**, do not invent. Concrete dials to decide (from `design-ui` `brief-and-dials`):
   - Density: compact vs airy (current `p-6 gap-6` airy)
   - Variance: low (minimal) vs high (expressive) — user says minimal
   - Motion: subtle vs pronounced — currently pronounced glows; need reduced-motion baseline (also for Boneyard shimmer)
   - Palette: keep dark or shift to light/minimal (user wants minimal, not defined) — determines Boneyard `color/darkColor/shimmerColor`
   - Type: Inter vs geometric/neo-grotesk vs system — need choice, scale, tracking
   - Radius/shadow: `rounded-xl` + glow vs sharp/flat minimal
   - Constraints: existing `shadcn`/`cva`/`Radix` tokens must be reused if possible; no new token layer without confirmation

2. **Stats definition**: should cards be global totals forever, or `search`/`location`-scoped when filters active? Recommend global for screenshot stability, but confirm.

3. **Filter behavior**: cards exclusive single-select (`toggleStatus` overwrites) or multi-select checkboxes (`toggleStatusInFilter`)? Current code has both. Recommend single + clear-all chip for simplicity.

4. **Default location naming**: auto-created name (`Sede Central` / `Principal`) and whether user can rename/delete default after second location exists.

5. **Registro semantics**: unify transfer + status in one collection (`location_logs.kind`) vs two collections with view; confirm filter set (by kind, by location, by status, by date range) and pagination (20 vs infinite).

6. **RUT requiredness**: client modal requires RUT, server optional — confirm business: is RUT mandatory for every warranty? Recommend required to match modal and Chilean ops.

7. **Warranty `pending` lock**: confirm that operators never need to create `ready` directly for imported or walk-in repairs; if they do, it will be via explicit transition after creation, not initial status.

8. **Boneyard config specifics** (non-blocking for proposal, but must be locked before apply): `breakpoints` (default Tailwind autodetect vs explicit `[375,768,1280]`), `out` path, `color/darkColor/shimmerColor` mapping to chosen palette, `animate` default, `stagger`/`transition` values, and whether `select:"container"` vs `"viewport"` is needed for app-shell width vs window width — decide in spec, verify with generated bones.

---

## 12. Risks

- **Stats counts cost**: 4× `totalItems` queries per load adds latency (~100ms each) on cold PB; mitigate with `Promise.all` parallelization and small personal dataset assumption (<500 records per user). View collection could be heavier to migrate.
- **Tailwind purge**: dynamic `border-xxx!` + opacity classes may vanish in production build if not safelisted; risk visual regression where active card border disappears — add explicit safelist or data-attribute variant.
- **Location invariant migration**: existing users with zero locations need backfill on next login; must be idempotent and not create duplicates (normalizeString check).
- **`Registro` schema change**: adding `kind/fromStatus/toStatus` as nullable to `location_logs` requires `v1.collections.json` import with `deleteMissing: false` and indexes; test import idempotency.
- **RUT strictness**: enabling módulo 11 may reject previously stored invalid RUTs; consider migration toast + allowlist for historic records if CSV import later, but for this change reject on new writes only.
- **Terminology mapping**: display `Entregada` while storage stays `completed` risks inconsistency if someone writes raw `completed` to logs or filters by `completed` string; centralize mapping in `lib/status.ts`.
- **Review budget**: slices 1+3+4 each near 400 lines; must keep per-PR diff ≤400 authored lines; use `auto-chain` with one slice per PR, target `main` via `gh-stack` if stacked.
- **App shell regression**: consolidating layout touches 3 pages + ServiceDashboard; must verify auth guard (`getAuthUser` → redirect) still works when `app/(app)/layout.tsx` introduces shared async layout; test unauth redirect still hits `/login`.
- **Boneyard supply-chain / apply guard**: `boneyard-js` must be verified before `pnpm add` — current npm version, lifecycle scripts (install hooks), peer deps, registry provenance (registry.npmjs.org), lockfile diff size, pin via `pnpm-lock.yaml`; generated `src/bones/*.bones.json` + `registry` are reviewed artifacts, not opaque blobs. Existing `@playwright/test@1.62.1` reused for CLI capture; confirm `npx playwright install chromium` not needed in CI if already cached, otherwise one-time install. Credentials must never enter `boneyard.config.json`, CLI `--cookie`, or docs. **No install now** — guard is for proposal/apply.

---

## 13. Test Strategy Implications

- **Strict TDD** per `openspec/config.yaml:strict_tdd:true` and `tdd:true`: write failing tests first for each slice.
- **Unit**: `formatRut`/`validateRut` (Vitest), `calculateDays` business, `serviceListBinding` filter builder, `statusLabel` map, `stats` hook, Boneyard `color` token mapping.
- **Integration (jsdom)**: `ServiceDashboard` with mocked `fetch` for `isPending` overlay, `ServiceModal` validation (RUT modulo 11 error appears on blur), `LocationsManager` default guard, `Skeleton` wrapper renders children when `loading=false` and bones when `loading=true` (mock `boneyard-js/react` or assert `aria-busy`).
- **E2E (Playwright, compose) — expanded for Boneyard + shell**:
  - (a) stats stable across filter clicks (`pending`→`completed`→`all` totals unchanged except rows)
  - (b) **Boneyard loading**: initial load shows exact-layout skeleton (no `Cargando...` replacement, stable container height, no layout shift at normal + throttled 3G `slowMo`/`route` delay), refetch with rows preserves table + `aria-busy` overlay (not full cut), mobile 375 + desktop 1280 bones, semantic loading (`aria-busy`/`aria-live` polite, not repeated noise), `prefers-reduced-motion: reduce` → shimmer off / static (via `emulateMedia`)
  - (c) create warranty cannot pick `ready/completed` (field absent, POST with `completed` forced to `pending`)
  - (d) location default exists on fresh user and cannot be deleted to zero
  - (e) transfer creates `Registro` entry and status change creates another, filter by kind works
  - (f) RUT invalid `12.345.678-0` rejected
  - (g) badge shows `Entregada` for `completed`
  - (h) **App shell regression**: at 1280×800 and 390×844, header `top===0 bottom===65 left/right/width` and `firstContent left/width/padding` equal across `/dashboard`, `/locations`, `/locationLogs` (before and after scroll), including mobile menu `top-16` alignment
- **A11y**: `axe-core` via Playwright `page.accessibility`, check `Dialog` focus trap, viewport `maximum-scale` absence, touch targets ≥44px, `prefers-reduced-motion` disables glow **and Boneyard shimmer**.
- **No invented scores**: no Lighthouse `performance` number fabricated; if needed, run `npx @playwright/test --reporter=html` + manual `detect.mjs --json` after visual change.

---

## 14. Ready for Proposal?

**Yes — for slices 1-5 with blocking visual consultation.**

- **Ready**: dashboard stats/Boneyard loading (A1 selected), app shell consolidation (regression with top/bottom/left/right), RUT + terminology (C1), pending-only create, default location, split actions + Registro — all have verified root causes, two viable approaches each, and smallest slices defined. Boneyard is **selected** (not generic skeleton) per official README `https://github.com/0xgf/boneyard/blob/main/packages/boneyard/README.md` + Context7 `/0xgf/boneyard`.
- **Not ready**: minimal/modern visual redesign — **blocked on `design-ui` decision**. Must run `design-ui` to confirm palette, type scale, spacing, radius, motion, and write/update `DESIGN.md` before `sdd-spec`/`sdd-design` lock UI tokens for slices 1 and 6. Boneyard `color/darkColor/shimmerColor` will be retuned after that decision, but geometry is independent. Do not proceed to full proposal that includes visual tokens until consultation completes; proposal for non-visual slices can proceed immediately.
- **Next recommended**: `sdd-propose` for `audit-ui-ux-remediation` (non-visual slices 1-7 as above) **in parallel with** `design-ui` consultation for visual world; then `sdd-spec`/`sdd-design` split per slice with `auto-chain` delivery. Do **not** set `chain_strategy` yet — `sdd-tasks` will forecast 400-line risk and recommend chaining. **Unresolved visual-world decision remains blocking for visual tokens.**

---

## 15. Evidence Paths & Line References (runtime + source)

- `components/services/ServicesDashboard.tsx:28-520` — full dashboard, especially `56 statusFilter ["pending","ready"]`, `84-110 fetchServices`, `194-218 stats from Services[]`, `227-232 statusOptions colors`, `252-345 glass-card buttons with dynamic border-*!`, `440ff isLoading ? Cargando`
- `app/dashboard/page.tsx:1-26` — server `getServices` with default `["pending","ready"]`; **outer `<main class="min-h-screen bg-background p-4 md:p-8">` + `<div class="max-w-7xl mx-auto">` wrapping ServiceDashboard (root cause for displacement)**
- `components/services/ServicesDashboard.tsx:240-250` — **inner `<div class="min-h-screen"><Navbar/><main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">` (double nesting)**
- `app/api/services/route.ts:12-162` — GET/POST/PUT/DELETE, `status` forced `rest.status || "pending"` defect, missing pending lock
- `lib/storage.ts:20-257` — `getServices` page + `totalItems`, `saveService`/`updateService` (193 completed immutable but not cancelled), `228 log only on location change`
- `lib/schemas.ts:17-86` — `ServiceSchema rut optional` vs modal required, `LocationCreate/UpdateSchema`
- `lib/utils.ts:8-25` — `formatRut` mask only, no validation
- `pocketbase/v1.collections.json:1` — 4 collections, no `isDefault`, no `kind`, no relation, indexes listed
- `app/actions/locations.ts:10-261` — `getLocations`, `create/update/delete/toggle`, `delete` history guard but allows last empty delete, `normalizeString` duplicate check
- `components/layout/Navbar.tsx:16-195` — `h-16` sticky `top-0`, `border-b border-white/5 backdrop-blur-md`, `active` border, mobile `absolute top-16`; header `h-16` =64px +1px border =65px
- `app/layout.tsx:1-38` — `RootLayout` fonts/body, **does NOT render Navbar**, `viewport` with `maximum-scale:1` (blocked zoom)
- `app/locations/page.tsx:20-32` — **` <div class="min-h-screen"><Navbar/><LocationsManager>` with `<main class="max-w-7xl mx-auto px-6 py-10">` (correct placement)**
- `app/locationLogs/page.tsx:20-34` — **same as locations**
- `app/locations/locationsManager.tsx:233` — ` <main class="max-w-7xl mx-auto px-6 py-10">` vs dashboard `px-4 lg:px-8 py-8`
- `components/services/ServicesTable.tsx:1-228` — badges `Completada`, days `>=15` critical, empty state, `w-full overflow-x-auto`
- `components/services/ServicesDetailsModal.tsx:1-358` — `Completada` badge, `locationLogs` timeline, print
- `components/services/ServicesModal.tsx:18-520` — `serviceSchema` required rut, `calculateStatusDates`, generic status/location fields, `formatRut` onChange
- `DESIGN.md:1-60` — incumbent dark glass, `context.mjs` output captured 2026-08-25 22:04 UTC (NO_PRODUCT_MD, EXISTING_VISUAL_SYSTEM, `designPath:"DESIGN.md"`)
- `package.json:5-6,45` — `packageManager:"pnpm@11.1.1"`, `@playwright/test@1.62.1` (reused for Boneyard CLI, verified)
- **Official Boneyard source (verified 2026-08-26)**: `https://github.com/0xgf/boneyard/blob/main/packages/boneyard/README.md` — package `boneyard-js`, React `import { Skeleton } from 'boneyard-js/react'`, named `Skeleton`, `loading` prop, generated `bones/registry` imported once, CLI `npx boneyard-js build http://localhost:3000` (planned pnpm equivalent `pnpm exec boneyard-js build http://localhost:3000/dashboard`); Context7 `/0xgf/boneyard` confirms same API + `registerBones` + breakpoint/config spec
- Runtime 2026-08-25 via `e2e/audit-bounded.spec.ts` (deleted after): `STATS_DESKTOP ["1","0","0","0","0"]`, `STATS_AFTER_COMPLETED ["0","0","0","0","0"]`, `ROWS_AFTER 0`, prior invalid `NAV_H 65` consistent (only height measured), `MOBILE_CARDS 5`, `MOBILE_OVERFLOW 391|390`, `PB_COUNTS {"pending":1,...}`, `LOGIN_OK` — captured in-memory, no screenshots persisted
- **Runtime 2026-08-26 re-audit via `e2e/tmp-nav-audit2.spec.ts` (deleted after, logged to `/tmp/opencode/nav-measure.json`) at 1280×800, same viewport**:
  - Dashboard: `header {top:32 height:65 bottom:97 left:32 right:1248 width:1216 innerRow top:32 h:64 bottom:96}` ancestors `DIV.min-h-screen top:32` → `DIV.max-w-7xl mx-auto top:32` → `MAIN.p-4 md:p-8 top:0 height:864 padding:32px`; firstContent `MAIN.max-w-7xl px-4 lg:px-8 py-8 top:97 left:32 width:1216 padding:32px`
  - Locations: `header {top:0 height:65 bottom:65 left:0 width:1280 innerRow top:0 h:64 bottom:64}` ancestor `DIV.min-h-screen top:0`; firstContent `MAIN.max-w-7xl px-6 py-10 top:65 width:1280 padding:40px 24px`
  - Logs: identical to Locations `header top:0 bottom:65` (div reused)
  - Viewport normalized: `window.innerWidth 1280` for all three; no cross-width comparison
- Git state: `git rev-parse --show-toplevel` `/home/jona/projects/serviceflow`, branch `docs/audit-ui-ux-remediation`, `git status --porcelain` shows only `D openspec/changes/migrate-appwrite-to-pocketbase/*` preserved. Verified `pnpm --version 11.1.1`, no install performed for correction pass

---

## 16. Appendix — Visual System Objective Problems (for `design-ui` input, not a choice)

- Dark obsidian (`#0f172a`) + electric blue (`#3b82f6`) + glass-white `rgba(255,255,255,0.05)` + emerald/muted-slate — high contrast but glassmorphism `backdrop-blur-xl` causes readability on bright backgrounds and performance cost (unbounded blur).
- Inter only, no type scale beyond `text-xs uppercase tracking-widest` vs `text-2xl font-bold` — hierarchy flat, labels 10-11px too small for mobile.
- Components: `glass-card p-6 border-l-4`, `rounded-xl` everywhere, no density variants; spacing `p-6 gap-6` airy but table `px-6 py-4` dense — inconsistency (also gutters diverge, see §3.1).
- Motion: `glow-orb` + `animate-in` without `prefers-reduced-motion` — accessibility violation (applies to Boneyard shimmer as well).
- Tokens: hard-coded `bg-slate-800/50`, `border-slate-700/50`, `text-primary` not via semantic layers; dynamic classes risk purge.
- Need dials: density, variance, motion, palette minimality, radius/shadow, type — to be decided in `design-ui`. Boneyard `color/darkColor/shimmerColor/speed` will map to chosen palette/motion after `design-ui`.
