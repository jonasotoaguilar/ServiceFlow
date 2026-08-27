# Design: Audit UI/UX Remediation

## Technical Approach

Next.js 16 + PocketBase 0.28 + Zod/RHF. `(app)` layout owns chrome/auth. Stats leave the page array. Writes split create/edit/status/transfer. Registro extends `location_logs`. DESIGN.md tokens. Boneyard apply-only. Hard-rename `/locationLogs` → `/service-events` (no product URL contract).

## Architecture Decisions

| Decision | Options / tradeoff | Choice |
|---|---|---|
| Shell | Per-page Navbar caused 32px offset | **`app/(app)/layout.tsx`**: `min-h-dvh` → Navbar → `main.max-w-7xl px-4 sm:px-6 lg:px-8 py-8`. Layout `getAuthUser` + `redirect("/login")` + `ensureDefaultLocation`. Pages drop Navbar/extra frames. Auth pages stay outside. |
| Rename | Redirect is speculative compat | **Hard move** to `app/(app)/service-events`. Update Navbar/e2e. |
| Stats | Page array wrong; PB view heavier | **`getServiceStats(userId)`** + `GET /api/services/stats`. No table-control params. Four `getList(1,1).totalItems` + pending dates for upcoming (10–14) / critical (≥15) via `lib/service-days.ts`. Client `stats` ≠ table. Refetch on mount/mutation only. |
| Cards | Dual togglers vs “the” filter | Exclusive `toggleStatus`. Empty = all rows, no card active. Static `STATUS_CARD`/`STATUS_BADGE`. Keep five meanings; `completed` → `Entregada`. |
| Loading | Unmount cut vs preserve | Empty: `<Skeleton name="dashboard-stats\|table" loading={load&&empty}>`. Refetch: keep table, `aria-busy`, overlay. |
| Boneyard | Official API only; no install now | **Apply:** `pnpm view boneyard-js` then `pnpm add` + lock pin. Review scripts before `allowBuilds`. 14-day cooldown may block. **Verified** (README, `/0xgf/boneyard`): `Skeleton` from `boneyard-js/react`; documented props/config/CLI only. **Use** `out:"./bones"` `[375,768,1280]` `#e4e4e7`/`#f4f4f5` `shimmer` `select:"container"`; import `../bones/registry` once; generate with official **`fixture`**. `--cdp` if needed; never commit `--cookie`/`pb_auth`. Reduced motion: `animate="solid"` + CSS. **UNVERIFIED (not required):** `registerBones`, registry ext, built-in reduced-motion. |
| Tokens | Blend vs replace | Replace `@theme`. Delete glass/glow/blur. Drop `html.dark`. Mobile table + card fallback in same files. |
| Dialog | New Radix vs local | Harden `dialog.tsx`: `role="dialog"` `aria-modal` trap Esc restore `90dvh`. Zoom on. Targets `h-11`. |
| Lifecycle | One PUT conflates | POST ignores `status`, stores `pending`, no transition dates; owned active `locationId` (default preselected). PUT 400 if body has `status`/`locationId`. `PATCH .../[id]/status` and `.../transfer`. Server ISO now. pending→ready\|cancelled; ready→completed\|cancelled\|pending; terminal none. Success writes Registro; fail writes nothing. Else 403. |
| Default | User FK vs flag | **`locations.isDefault`**. Partial unique `(userId) WHERE isDefault = TRUE` — **verify PB 0.28 SQL at apply**. `ensureDefaultLocation` on register/login/layout: no-op / promote oldest active / create `Sede Principal`. Unique hit → re-read. `setDefault` unset-then-set. Reject delete/deactivate of default or last-active. Index + retry. |
| Registro | New collection vs extend | Extend `location_logs`: `kind` `transfer\|status` default `transfer`; optional `fromStatus,toStatus,actorId`; relax location-id required. Actor `actorId\|\|userId`. Indexes `(userId,changedAt)`, `kind`. Writes only from dedicated actions. Import `deleteMissing:false`. |
| RUT | Pretty vs clean | `lib/rut.ts` normalize + módulo-11; store clean. Shared Zod. Historic invalid readable; write must pass. |

## Data Flow

```
GET /api/services/stats ──userId──► cards     GET /api/services?page──► table
POST create ──ignore status──► pending ── no event
PUT  edit   ──reject status/location── no event
PATCH status|transfer ──ok──► location_logs | fail──► no event
register/login/layout ──► ensureDefaultLocation
```

## File Changes

Create `app/(app)/layout.tsx`. Move/trim pages to `app/(app)/{dashboard,locations,registro}/`. Delete `app/{dashboard,locations,locationLogs}/**`. Add `app/api/services/stats/route.ts` and `[id]/{status,transfer}/route.ts`. Modify `app/api/services/route.ts`, `lib/storage.ts`, `lib/{rut,status,service-days,schemas,types,pocketbase-filter}.ts`, `app/actions/{auth,locations,logs}.ts`, `pocketbase/v1.collections.json`, `globals.css`, `app/layout.tsx`, `Navbar.tsx`, `dialog.tsx`, `services/*`, `locationsManager.tsx`. Apply-only: `boneyard.config.json`, `bones/**`, lockfile.

## Interfaces / Contracts

```ts
{ pending:number; ready:number; completed:number; cancelled:number; upcoming:number; critical:number }
// { error: string } 401 / 400 / 403 / 409 after default retry / 500
```

## Testing Strategy

Unit (Vitest RED): RUT, days, machine, ensure, bindings, labels, stats ignore filters. Integration: Dialog a11y, stats vs table, Skeleton mock. E2E: stable cards; bones/`aria-busy`; reduced-motion; header top 0 / bottom 65 at 1280+390; pending create; RUT; Entregada; Registro; no `/locationLogs`.

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A — no executable-doc classification | — | — |
| Git repository selection | N/A — no git path automation | — | — |
| Commit state | N/A — no commit automation | — | — |
| Push state | N/A | — | — |
| PR commands | N/A — sdd-tasks/apply own chain | — | — |

## Migration / Rollout

Additive import only. No `completed`/RUT backfill. Old logs `kind=transfer`. Revert PRs; remove `boneyard-js` if added. Fix-forward columns.

## Open Questions

- [ ] PB 0.28 partial-unique bool SQL — apply
- [ ] `boneyard-js` version/lifecycle/age — apply
- [ ] Registry filename — commit CLI output

Task/PR cuts stay with sdd-tasks (`auto-chain`, 400 lines, `chain_strategy` unset). Order: tokens+a11y → shell+rename → stats → Boneyard → RUT → locations → create/edit → status/transfer → Registro.
