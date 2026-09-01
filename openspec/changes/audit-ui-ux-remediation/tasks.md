# Tasks: Audit UI/UX Remediation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Est. lines | ~1700 |
| 400-line budget risk | High |
| Chained PRs | Yes |
| Split | PR1 Tokens→PR2 Shell→PR3 Stats→PR4 Surfaces/theme→PR5 Bones→PR6 RUT→PR7 Locations→PR8 Create/Edit→PR9 Registro |
| Delivery | auto-chain |
| Chain | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Test | Rollback |
|------|------|----|------|----------|
| 1 | Tokens+a11y | 1 | `tokens.test.ts` | globals, layout, dialog |
| 2 | Shell+rename | 2 | `shell.test.ts` | `(app)/layout`, Navbar |
| 3 | Stats | 3 | `stats.test.ts` | stats route, service-days |
| 4 | Surfaces+theme | 4 | `visual.test.ts` | tables, modal, login, icon-button |
| 5 | Boneyard | 5 | `bones.test.ts` | boneyard config, bones |
| 6 | RUT | 6 | `rut.test.ts` | lib/rut, schemas |
| 7 | Locations | 7 | `locations.test.ts` | locations actions, schema |
| 8 | Create/Edit | 8 | `lifecycle.test.ts` | services API, status |
| 9 | Registro | 9 | `service-events.test.ts` | status/transfer, registro UI |

## Phase 1: Foundation

- [x] 1.1 RED tokens.test.ts
- [x] 1.2 GREEN styles/globals.css tokens, no glass
- [x] 1.3 GREEN dialog a11y + viewport zoom

## Phase 2: Shell + Stats

- [x] 2.1 RED shell.test.ts
- [x] 2.2 GREEN (app)/layout + /service-events
- [x] 2.3 RED stats.test.ts
- [x] 2.4 GREEN getServiceStats + Entregada cards

## Phase 2b: Surfaces + theme

- [x] 2.5 RED visual.test.ts: no text-white/slate-800/glass/blur in table/modal/login; destructive token; UTC date; IconButton 44px
- [x] 2.6 GREEN opaque Dialog+ServicesModal; IconButton on dashboard/Sedes; strip leftover dark classes; next-themes system+toggle; .dark tokens

## Phase 3: Loading + RUT

- [x] 3.1 RED bones.test.ts
- [x] 3.2 GREEN pnpm add boneyard-js + registry
- [x] 3.3 RED rut.test.ts modulo-11
- [x] 3.4 GREEN lib/rut.ts + schemas

## Phase 4: Locations + Lifecycle

- [x] 4.1 RED locations.test.ts isDefault
- [x] 4.2 GREEN schema + ensureDefaultLocation
- [x] 4.3 RED lifecycle POST pending, no status on create
- [x] 4.4 GREEN API guards + ServicesModal Entregada, no create status picker

## Phase 5: Status + Registro

- [x] 5.1 RED service-events.test.ts status/transfer logs
- [x] 5.2 GREEN status + transfer routes
- [x] 5.3 GREEN Registro filters
- [x] 5.4 Verify pnpm test:run, tsc, check
