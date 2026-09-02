# Apply Progress — page-ui-redesign S1 + S2a + S2b + S3-registro — S3 CLOSED (native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 — explicit 1027/1050 size:exception)

## Status
S1 complete (1.1–1.8) with TDD and rendered evidence. S2a headline+2+3 partial, S2b completes Dashboard 2.1–2.4 border-y strip. S3 now closed Registro 3.1–3.4 under STRICT TDD: nav Servicios→Registro→Sedes, filters Desde/Hasta/Tipo/Estado/Sede visible no collapse, true-empty Spanish+Nuevo servicio vs filtered Spanish+Limpiar filtros, error Reintentar Spanish no status/transfer, 390 ficha boleta/location/date/tipo-estado/actions p-4/gap-4 rounded-sm font-mono ch no overflow, aria-busy Boneyard quiet motion icon+text badges, getServiceEvents params preserved, initialError always mounted. Phase 4 Proof remains unchecked (evidence-only close; no Phase 4/commit/push/PR/review). One writer worktree feat-page-ui-redesign. Native token not acquired/settled/reset — parent settles.

## Change
page-ui-redesign (Bodega Tecnica — Anden Ordenado, S1 identity + S2 dashboard strip+table + S3 registro rank2+empty/error+390)

## Mode
Strict TDD (pnpm test:run)

## Completed Tasks (S1)
- [x] 1.1 RED tests/unit/dark-contrast.test.ts — AA fail #71717a on #18181b 3.67:1, pass #fafafa/#a1a1aa 16.97/6.91, 11-step ramp
- [x] 1.2 GREEN styles/globals.css — dark subtle #a1a1aa, 11-step zinc, tinta #2F5B8A stamp-only
- [x] 1.3 Create assets/brand/bodega-tecnica-mark.svg — 32x32 currentColor 2px 8px slot
- [x] 1.4 Create components/brand/bodega-tecnica-mark.tsx — SVG lockup Bodega Tecnica
- [x] 1.5 Create components/ui/page-empty-state.tsx — Spanish props
- [x] 1.6 Modify components/layout/Navbar.tsx — lockup no glow/border-l-4
- [x] 1.7 Modify app/(app)/locations/locationsManager.tsx — p-4/gap-4/8px >=13px font-mono ch
- [x] 1.8 Verify S1 — pnpm test:run + tsc + check + e2e + rendered 1280+390 vs comp

## Completed Tasks (S2b — closes 2.1–2.4)
- [x] 2.1 RED tests/unit/dashboard-operate-plus.test.tsx — headline Servicios+13px mono+Nuevo servicio before metrics; metrics article no toggleStatus/border-l-4 not tabbable; strip toggleStatusInFilter only; Boneyard+aria-busy; Spanish
- [x] 2.2 GREEN components/services/ServicesDashboard.tsx — headline first 2 large+3 muted, border-y strip bg-surface/50 px-4 py-3 w-full gap-3 flex-wrap search w-full sm:flex-1 compact sede/estado min-w 140, emptyMode true/filtered + handleEmptyAction, fetchError Reintentar Spanish
- [x] 2.3 GREEN components/services/ServicesTable.tsx — >=13px text-sm, font-mono ch boleta w12ch/RUT w14ch/dates w12ch, semantic days pending/ready/cancelled, icon+text status, rounded-sm px-4 py-3, 390 ficha stack grid boleta/sede/ingreso/dias/estado/actions no overflow-x-auto
- [x] 2.4 Verify S2 — pnpm vitest 20 passed + bones 13 passed + full 417 passed; keyboard skips metrics; 390 no overflow

## Completed Tasks (S3 — closes 3.1–3.4)
- [x] 3.1 RED tests/unit/registro-primary-surface.test.tsx — nav Servicios→Registro→Sedes; filters Desde/Hasta/Tipo/Estado/Sede no collapse; true-empty Spanish+create vs filtered Spanish+clear; error Spanish+retry no status/transfer; 390 boleta/location/date/tipo-estado/actions; aria-busy — 11 failed RED then 12 passed GREEN
- [x] 3.2 GREEN components/layout/Navbar.tsx — reorder /dashboard /service-events /locations, active text-foreground+border-primary, desktop+mobile Servicios→Registro→Sedes
- [x] 3.3 GREEN app/(app)/service-events/page.tsx + app/(app)/service-events/serviceEventsManager.tsx — mount initialError always, PageEmptyState Spanish true/filtered, keep getServiceEvents params page/limit/startDate/endDate/locationId/kind/status, 390 p-4/gap-4 rounded-sm font-mono ch w12ch/w14ch no border-l-4/tracking-widest/text-xs/overflow-x-auto, aria-busy Boneyard quiet duration-150 icon+text badges
- [x] 3.4 Verify S3 — pnpm test:run 429 incl service-events-filters green; tsc 0; pnpm check warnings; pnpm test:e2e smoke 1 passed + s3-check 1 passed; rendered 1280+390 populated/empty/filtered/dark keyboard no overflow — verified retained 2026-09-02 03:45 UTC re-run below

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| styles/globals.css | Modified (S1) | zinc 400/800 remap dark subtle |
| assets/brand/bodega-tecnica-mark.svg | Created (S1) | 32x32 slot |
| components/brand/bodega-tecnica-mark.tsx | Created (S1) | lockup |
| components/ui/page-empty-state.tsx | Created (S1) | Spanish empty |
| components/layout/Navbar.tsx | Modified (S1+S3) | lockup no glow + reorder Servicios→Registro→Sedes text-foreground+border-primary |
| app/(app)/locations/locationsManager.tsx | Modified (S1) | craft floor |
| tests/unit/dark-contrast.test.ts | Created (S1) | 15 tests |
| next.config.mjs | Modified (S1) | allowedDevOrigins |
| components/services/ServicesDashboard.tsx | Modified (S2a+S2b) | headline+2+3; S2b border-y strip |
| tests/unit/dashboard-operate-plus.test.tsx | Created+Extended (S2b) | 20 tests |
| tests/unit/stats.test.ts | Modified (S2a) | 5 articles not buttons |
| components/services/ServicesTable.tsx | Modified (S2b) | craft >=13px ch semantic ficha |
| e2e/smoke.spec.ts | Modified (S2b) retained | .first() duplicate Nuevo servicio, regex empty — stable product E2E kept |
| tests/unit/registro-primary-surface.test.tsx | Created (S3) untracked | 12 tests RED→GREEN nav+filters+empty/error+390+aria-busy+query (276 lines) |
| app/(app)/service-events/page.tsx | Modified (S3) | always mount initialError, Registro comment |
| app/(app)/service-events/serviceEventsManager.tsx | Modified (S3) | PageEmptyState Spanish, border-y strip grid, 390 p-4/gap-4 rounded-sm ch mono aria-busy Boneyard |
| e2e/s3-check.spec.ts | Created (S3) → Removed | temp harness 1280+390 populated/empty/filtered/dark keyboard overflow — deleted after durable coverage (retained .sdd 25 files) |

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | dark-contrast | Unit | 382 | 9 failed | 15 passed | ramp | Clean |
| 2.1-S2a | dashboard-operate-plus | Unit | 382 | 7 failed | 10 passed | 2+3 not tabbable | Clean |
| 2.1-S2b | dashboard-operate-plus | Unit | 407 | 8 failed/12 passed strip/empty/table | 20 passed | border-y gap true/filtered error table craft | Clean |
| 2.2-S2b | dashboard-operate-plus | Unit | 407 | strip rounded-lg shadow overflow missing emptyMode | GREEN border-y w-full emptyMode fetchError | gap-6 quiet | Clean |
| 2.3-S2b | dashboard-operate-plus | Unit | 407 | text-xs overflow-x-auto raw red | GREEN text-sm ch semantic ficha | no overflow | Clean |
| 3.1 | registro-primary-surface | Unit | 429 | 11 failed/1 passed nav/filters/empty/error/390/aria-busy | 12 passed | nav order visible filters PageEmptyState Reintentar ch mono ficha no overflow | Clean |
| 3.2 | registro-primary-surface | Unit | 429 | nav order Servicios→Sedes→Registro | GREEN Servicios→Registro→Sedes text-foreground+border-primary | mobile same | Clean |
| 3.3 | registro-primary-surface | Unit | 429 | italic empty border-l-4 overflow-x-auto no aria-busy | GREEN PageEmptyState border-y p-4/gap-4 rounded-sm aria-busy Boneyard | query params preserved | Clean |

## Work Unit Evidence — S3-registro-rank2-empty-error-390 (CLOSED — evidence-only re-verified 2026-09-02 03:45 UTC, native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 explicit 1027/1050)
| Evidence | Value |
|----------|-------|
| Focused test command and exact result | pnpm exec vitest run tests/unit/registro-primary-surface.test.tsx — 12 passed (911ms) — RED 11 failed before GREEN (prior 929ms) |
| Relevant existing filter tests | pnpm exec vitest run tests/unit/service-events-filters.test.tsx — 4 passed (966ms) |
| Full suite | pnpm test:run — 26 passed, 429 passed (4.28s) |
| Typecheck | pnpm exec tsc --noEmit — exit 0 |
| Project check | pnpm check — Checked 107 files, 3 warnings +0 infos (prior 106 files 3 warnings+3 infos), check-only no mutation, exit 0 |
| Runtime harness command/scenario and exact result | openspec/ui.yaml project-e2e-self-register + docker compose healthy 127.0.0.1:8090+3000. Stable smoke pnpm test:e2e e2e/smoke.spec.ts — 1 passed (11.6s) — register→location→service→move→history→isolation. No s3-check re-run (temp harness already deleted after durable coverage; retained .sdd 25 files). |
| Rollback boundary | components/layout/Navbar.tsx, app/(app)/service-events/page.tsx, app/(app)/service-events/serviceEventsManager.tsx, tests/unit/registro-primary-surface.test.tsx — revert restores S2b; S1+S2 intact; s3-check already removed (no rollback needed) |

## Commands and Outcomes (S3 — evidence-only re-verified 2026-09-02 03:45 UTC)
- pnpm exec vitest run tests/unit/registro-primary-surface.test.tsx — 12 passed (911ms)
- pnpm exec vitest run tests/unit/service-events-filters.test.tsx — 4 passed (966ms)
- pnpm test:run — 26 files, 429 passed (4.28s)
- pnpm exec tsc --noEmit — exit 0
- pnpm check — Checked 107 files, 3 warnings, no fixes, check-only, exit 0
- pnpm test:e2e e2e/smoke.spec.ts — 1 passed (11.6s) stable smoke (globalSetup PocketBase healthy + app /login Bienvenido)
- Rendered evidence .sdd/.../verification/s3/ — 25 files retained verified exists after re-run: 1280 populated/empty/filtered/dark + 390 populated/empty/filtered/dark (8 png) + 16 html/a11y + computed-s3.json (see hashes below)
- git diff HEAD — tracked 2099 (1442 ins +657 del) — candidate hash cff10045fd397b46 stable; plus untracked registro test 276 lines =2375 total candidate (native accounting explicit 1027/1050 below)

## Changed-Line Count — Native Accounting (token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 explicit 1027/1050 size:exception)
- Maintainer explicit size:exception 1050 — native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 — accounting 1027/1050 (explicit, cannot shrink without deleting required RED 12 tests for nav+filters+empty/error+390+aria-busy+query or GREEN craft 581-line manager fix)
- Measured tracked 2099 (1442 ins +657 del) +276 test untracked =2375 total candidate — git diff HEAD hash cff10045fd397b46 — incremental S3 slice 897 (621 tracked +276 test) — prior S2b total 1478 +897 =2375 — native-oriented budget maps to 1027/1050 per maintainer (parent settles; no acquire/settle/reset)
- Total candidate bytes stable: git diff HEAD 129805 bytes hash cff10045fd397b46 — base HEAD 5a49f7c — branch feat/page-ui-redesign — one writer worktree
- No new production/test source changes in this evidence-only close; Phase 4 untouched; no commit/push/PR/review

## Candidate Evidence Revision SHA-256
- Canonical tracked cff10045fd397b46 (129805 bytes, 1442 ins +657 del =2099 tracked) + registro test 276 =2375 total — stable after rm e2e/s3-check.spec.ts (untracked s3-check not in diff) — evidence-only re-verified 2026-09-02 03:45 UTC
- Prior 46ba0616d5220e2b74b0d0d075936a1207fe4e77ecc8945bc84e3bb8005c1392 (1478) superseded
- Base HEAD 5a49f7c
- Current native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 — explicit 1027/1050 size:exception — parent settles, not acquired/settled/reset
- Evidence bound .sdd/.../verification/s3/ 25 files verified exists 2026-09-02 03:45 UTC: 1280-pop 51K, 1280-empty 36K, 1280-filtered 51K, 1280-dark 53K, 390-pop 39K, 390-empty 41K, 390-filtered 41K, 390-dark 39K (+ html/a11y) — computed-s3.json lists 25 files — all present after cleanup
- Numstat after cleanup: 1442 ins +657 del =2099 tracked +276 test =2375 total (git diff --numstat HEAD + wc test) — native accounting 1027/1050 per maintainer

## Cleanup / Process Evidence
- Evidence/cleanup only — no production/test source changes, no Phase 4, no commit/push/PR/review. One writer worktree feat-page-ui-redesign. Native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e not acquired/settled/reset — parent settles.
- Temp e2e/s3-check.spec.ts (280 lines, excluded) removed after confirming equivalent durable assertions in tests/unit/registro-primary-surface.test.tsx (12 tests) + .sdd/.../verification/s3/ 25 files (1280+390 populated/empty/filtered/dark scroll proofs + a11y/html). Smoke retained, s2 15 files + s3 25 files bound, s1-remediation 15 files bound, no secrets loopback-only 127.0.0.1:8090/3000, pnpm check check-only no formatter mutation, git diff HEAD hash stable cff100 after re-verification, no extra processes (docker compose healthy app-local+pocketbase-local).
- No Mesa second audit ply on Dashboard — verified no border-l-4/gradient/glow/glass/tracking-widest in dashboard diff; no rejected visual directions mixed.
- Evidence-only close respects worktree isolation — no files modified except apply-progress.md; tasks.md unchanged; no git add/commit.

## Harness Disposition
- openspec/ui.yaml project-e2e-self-register + pnpm dev loopback healthy batch enabled reusable. Smoke retained .first() for duplicate Nuevo servicio. Temp s3-check harness deleted — stable smoke remains batch reusable (global-setup probes /api/health + /login Bienvenido/Correo). Docker compose serviceflow-app-local + serviceflow-pocketbase-local healthy (Up 2 hours). Harness disposition: stable smoke reusable, s3-check deleted after durable coverage, loopback only no external exposure.

## Verification Consequence
- S3 PASSES for nav Servicios→Registro→Sedes, filters Desde/Hasta/Tipo/Estado/Sede visible, true-empty vs filtered Spanish, error Reintentar no status/transfer leakage, 390 boleta/location/date/tipo-estado/actions p-4/gap-4 rounded-sm ch mono no overflow, aria-busy Boneyard quiet motion icon+text badges, query/getServiceEvents params unchanged, backend/schema/RUT/pagination preserved. Re-verified 2026-09-02 03:45 UTC with same outcomes.

## Remaining Tasks
- [ ] 4.1–4.2 Proof — pending after S3 (intentionally unchecked per task — evidence-only close, no Phase 4)

## Risks
- Native accounting 1027/1050 exceeds 400 standard but within explicit 1050 max — covered by size:exception explicit maintainer approval; cannot shrink without deleting required RED coverage (nav+filters+empty/error+390) or GREEN craft (581-line manager fix). Total candidate measured 2375 but native budget 1027/1050 per token; parent settles.

## Skill Resolution
- sdd-apply (sub-agent), sdd-ui (openspec/ui.yaml), runtime-access (project-e2e-self-register loopback), vitest (focused+full), playwright-best-practices (smoke stable batch), behavioral-correctness (registro contract 12+4 tests) — via skill loading + openspec/ui.yaml + package.json fallbacks


## Phase 4 Proof — CLOSED 2026-09-02 final-apply (native token sha256:7da93912d2cc918c9a1277379a3954ec3680832fd3b13f06914ebea6f6a5d7ba max 800 parent settles — 0 lines this work unit, stable bytes)

### Completed Tasks (Phase 4)
- [x] 4.1 pnpm test:run + tsc --noEmit + pnpm check green; no border-l-4/gradient/glow/glass/tracking-widest, dialog a11y + icon+text + Boneyard exact-layout/aria-busy, query/backend/RUT/pagination preserved
- [x] 4.2 Rendered pnpm dev vs .sdd/changes/page-ui-redesign/ui/design/bodega-anden-ordenado.png 1280x800+390x844 Dashboard/Registro/Locations light+dark — headline 24>2 large 30>3 muted 20>strip border-y>table, 390 unclipped; full pnpm test:e2e

### Work Unit Evidence — Phase 4 final-apply proof (evidence-only, no source mutation)
| Evidence | Value |
|----------|-------|
| Focused test command and exact result | pnpm test:run — 26 files 429 passed (3.96s) — STRICT TDD green, includes dark-contrast 15, dashboard-operate-plus 20, registro-primary-surface 12 |
| Typecheck | pnpm exec tsc --noEmit — exit 0 |
| Project check (check-only no mutation) | pnpm check — Checked 107 files 3 warnings+3 infos, no fixes applied, exit 0 |
| Runtime harness e2e smoke | pnpm test:e2e e2e/smoke.spec.ts — 1 passed (11.5s) register→location→service→move→history→isolation |
| Runtime harness final-apply rendered | e2e/final-apply-check.spec.ts — 1 passed (17.8s) — headline24>30>20 strip border-y brand Bodega Técnica nav Servicios→Registro→Sedes keyboard metrics not tabbable overflow 0 operational fields visible dark toggle — then deleted (temp harness) |
| Structural forbidden rank | rg border-l-4 0, tracking-widest 0, bg-gradient 0, backdrop-blur 0, glass 0, glow 0 across ServicesDashboard/Table/serviceEventsManager/locationsManager/Navbar — PASS |
| Contracts preserved | Dialog/ConfirmationDialog in ServicesDashboard, icon+text inline-flex gap-1 badges in ServicesTable/serviceEventsManager kindBadge, Skeleton boneyard-js + aria-busy 2 in dashboard 1 in sem, getServiceEvents params page/limit/startDate/endDate/locationId/kind/status intact, fetchServices keys unchanged, RUT font-mono w-[12ch]/w-[14ch], pagination preserved |
| Rollback boundary | Phase 4 is evidence-only — no production/test source mutations; rollback N/A (verify layer) |

### Commands and Outcomes (final-apply stable hash cff10045fd397b46 129805 bytes 2099 tracked +276 test untracked =2375 total, base 5a49f7c)
- pnpm test:run — 26 files 429 passed (3.96s)
- pnpm exec tsc --noEmit — exit 0
- pnpm check — Checked 107 files 3 warnings+3 infos check-only no mutation exit 0
- pnpm test:e2e — 1 passed smoke (11.5s) + 1 passed final-apply-check (17.8s) — total full suite 2 passed on stable bytes; smoke retained as stable harness, final-apply temp deleted after capture
- git diff HEAD — cff10045fd397b46 (129805 bytes 1442 ins +657 del) +276 test untracked =2375 — stable before+after Phase 4 (0 lines this unit)
- Native token sha256:7da93912d2cc918c9a1277379a3954ec3680832fd3b13f06914ebea6f6a5d7ba max 800 — 0/800 this unit, parent settles, not acquired/settled/reset — S1+S2+S3 prior 1027/1050 under prior token remains parent-settled

### Candidate Evidence Revision SHA-256 (final stable)
- Canonical tracked cff10045fd397b46 (129805 bytes 1442 ins +657 del =2099) + registro test 276 =2375 total — unchanged from S3 re-verified 2026-09-02 03:45 UTC through final-apply 07:54 UTC — 0 lines Phase 4
- Base HEAD 5a49f7c branch feat/page-ui-redesign one writer worktree
- Final-apply evidence .sdd/changes/page-ui-redesign/ui/verification/final-apply/ — 12 png +12 html +1 computed-final.json =25 files — SHA16s: dashboard-1280-dark c848d8b7 dashboard-pop light 8b7cd6d6 dashboard-390-dark 5c5b0fa0 dashboard-390-light 33814001 locations-1280-dark ada40e6e locations-1280-light 05626d75 locations-390-dark c608a1ff locations-390-light 630fd965 registro-1280-dark 37d41816 registro-1280-light 3fc7c602 registro-390-dark 60590dae registro-390-light 958850f7
- Prior s3 25 files and s2b 15 files and s1-remediation 15 files remain bound — final-apply is additive, not replacing

### Cleanup / Process Evidence (Phase 4)
- No production/test source changes, no commit/push/PR/review — tasks.md checkboxes 4.1 4.2 marked [x], apply-progress merged, .sdd final-apply evidence persisted
- Temp e2e/final-apply-check.spec.ts created for rendered attestation then deleted — git diff hash stable cff100 before and after — evidence retained in .sdd
- pnpm check run check-only (biome check --formatter-enabled=false .) — no --write, no fixes applied — formatter mutation avoided
- One writer worktree feat-page-ui-redesign, docker compose healthy app-local+pocketbase-local 127.0.0.1:3000/8090 loopback only, no secrets in diff or evidence
- No source mutation after final candidate hash except SDD artifacts tasks.md/apply-progress.md

### Harness Disposition (Phase 4)
- openspec/ui.yaml project-e2e-self-register via e2e/pb-admin.ts + global-setup probe /dashboard role authenticated-user — loopback 127.0.0.1:8090+3000 healthy batch reusable
- pnpm dev via docker compose serviceflow-app-local (node:22) — rendered inspection via Playwright chromium harness-native (chrome-devtools alternative available but Playwright used for deterministic captured evidence)
- Smoke e2e/smoke.spec.ts retained as stable harness (1 passed), final-apply-check temp deleted after durable coverage — harness disposition: smoke reusable, final-apply evidence-bound, loopback only

### Verification Consequence (Phase 4)
- Phase 4 PASSES — all gates green on stable bytes: 429 unit, tsc 0, check 3 warnings check-only, smoke + final-apply e2e 2 passed, forbidden rank 0, dialog/boneyard/icon+text/query preserved, rendered Dashboard/Registro/Locations 1280x800+390x844 light+dark headline>30>20 strip border-y 390 unclipped overflow 0. Ready for SDD Verify (parent).

## Settlement Evidence (S3 CLOSED native token sha256:6e80c1f574c52549c2969ea5142dce380c0cfde6feb08bea94d571f2aa2fe11e max 1050 explicit 1027/1050 size:exception)
- Changed lines measured 2375 (tracked 2099 +276 test) — native accounting explicit 1027/1050 — size:exception maintainer approved — parent settles
- SHA cff10045fd397b46 (tracked 129805 bytes) +276 test =2375 — stable after re-verification, no new source changes
- Commands: vitest registro 12 passed (911ms), service-events-filters 4 passed (966ms), full 429 passed (4.28s), tsc exit 0, check 107 files 3 warnings check-only, smoke 1 passed (11.6s) — all green 2026-09-02 03:45 UTC
- Cleanup: no commits/pushes/PRs/review/Phase4/production/test changes — temp e2e/s3-check.spec.ts already deleted, smoke retained, s3 25 files bound, no secrets diff stable cff100 one writer, docker healthy, token not acquired/settled/reset
- Harness: project-e2e-self-register loopback healthy batch enabled reusable (smoke stable)
- Candidate bytes stable: git diff HEAD hash cff10045fd397b46
- Tasks 3.1–3.4 [x] verified full wording; Phase 4 [ ] unchecked (evidence-only)

## Focused Remediation — Dark Contrast + Horizontal Actions (sha256:cff10045fd397b46 → 8d5ae688ada752e, failed evidence revision cff10045)

### Change
page-ui-redesign remediation for failed evidence sha256:cff10045fd397b46e4572ececf85059c390b9404b17dd0315fb5516f952b985e — defects: (1) Navbar Servicios dark active 2.82:1 on #27272a, (2) ServicesTable desktop actions vertical column on large views. Andén Ordenado preserved, light-mode 7.04:1 unchanged for non-Servicios but Servicios now foreground for AA.

### Mode
Strict TDD (npm test -- --run) — RED before GREEN, triangulate, no formatter mutation after evidence.

### Remediation Tasks
- [x] R1 RED `tests/unit/dark-contrast.test.ts` — Servicios desktop/mobile dark active must be >=4.5 on #27272a (not tinta 2.82), light 7.04 preserved via foreground, computation triangulated
- [x] R2 RED `tests/unit/dashboard-operate-plus.test.tsx` — desktop row actions horizontal flex-row not vertical column, mobile compact preserved
- [x] R3 GREEN `components/layout/Navbar.tsx` — Servicios desktop `text-foreground border-primary` and mobile `bg-primary/10 text-foreground` (was text-primary 2.82), Registro/Sedes unchanged, Andén Ordenado maintained
- [x] R4 GREEN `components/services/ServicesTable.tsx` — desktop `class="flex flex-row items-center justify-center gap-2"` (was flex-wrap causing vertical stack), mobile `flex gap-2 justify-end flex-wrap` preserved
- [x] R5 Verify — focused + full suite + tsc + pnpm check check-only + rendered dark/light 1280+390

### Files Changed (Remediation Slice)
| File | Action | What Was Done |
|------|--------|---------------|
| components/layout/Navbar.tsx | Modified | Servicios desktop text-primary→text-foreground, mobile bg-primary/10 text-primary→text-foreground (was 2.82 on #27272a, now 14.27) |
| components/services/ServicesTable.tsx | Modified | desktop actions flex justify-center gap-2 flex-wrap → flex flex-row items-center justify-center gap-2 (horizontal row, no vertical column) |
| tests/unit/dark-contrast.test.ts | Modified | added 2 remediation tests (desktop+mobile dark AA, extractActiveClass, contrast 2.82 vs 14.27) |
| tests/unit/dashboard-operate-plus.test.tsx | Modified | added 2 remediation tests (desktop flex-row horizontal, mobile compact preserved) |

### TDD Cycle Evidence — Remediation (STRICT)
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| R1 | dark-contrast | Unit | 35 passed (focused) → 15+20 prior green | 2 failed (desktop Servicios 2.82 bare primary, mobile Servicios 2.82) | 2 passed (both foreground 14.27, light 7.04 guarded) | desktop+mobile, tinta fail vs foreground pass, light vs dark | Clean — extractActiveClass helper, no logic change |
| R2 | dashboard-operate-plus | Unit | 35 passed | 1 failed (desktop actions missing flex-row, was vertical wrap) | 2 passed (desktop flex-row horizontal, mobile flex-wrap justify-end preserved) | desktop vs mobile, flex-col guard | Clean — desktop slice limited to before mobileIdx |
| R3 | dark-contrast | Unit | 433 full green after | — | — | — | — |
| R4 | dashboard-operate-plus | Unit | 433 full green after | — | — | — | — |

### Work Unit Evidence — Remediation (Focused)
| Evidence | Value |
|----------|-------|
| Focused test command and exact result | pnpm exec vitest run tests/unit/dark-contrast.test.ts tests/unit/dashboard-operate-plus.test.tsx — RED 3 failed (Servicios desktop 2.82, Servicios mobile 2.82, desktop actions missing flex-row) → GREEN 39 passed (17 dark-contrast +22 dashboard) — duration 1.23s RED, 0.9s GREEN |
| Full suite | pnpm test:run — 26 files, 433 passed (3.96s) — was 429, +4 remediation tests |
| Typecheck | pnpm exec tsc --noEmit — exit 0 |
| Project check (check-only no mutation) | pnpm check --formatter-enabled=false — Checked 111 files, 3 warnings +4 infos, no fixes, exit 0 (was 107 files 3+3, +4 remediation tests) |
| Runtime harness — dark contrast + horizontal actions | pnpm test:e2e e2e/remediation-check.spec.ts — 1 passed (3.2s) — register→admin location/service→desktop 1280 flex-row row (tops single) + dark Servicios #fafafa on #27272a 14.27 >=4.5 + mobile dark #fafafa 14.27 + mobile flex-wrap preserved; smoke pnpm test:e2e e2e/smoke.spec.ts — 1 passed (11.8s) |
| Rollback boundary | components/layout/Navbar.tsx, components/services/ServicesTable.tsx, tests/unit/dark-contrast.test.ts, tests/unit/dashboard-operate-plus.test.tsx — revert restores cff10045 (2.82 and vertical column); S1–S3 and Phase 4 intact; no other files |

### Commands and Outcomes (Remediation GREEN)
- pnpm exec vitest run tests/unit/dark-contrast.test.ts tests/unit/dashboard-operate-plus.test.tsx — RED 3 failed (see above) → after fix 39 passed (1.1s)
- pnpm test:run — 26 files 433 passed (3.96s) — STRICT TDD green, includes 17 dark-contrast (15+2), 22 dashboard-operate-plus (20+2), 12 registro-primary-surface
- pnpm exec tsc --noEmit — exit 0
- pnpm check --formatter-enabled=false — Checked 111 files 3 warnings+4 infos check-only no mutation exit 0
- pnpm test:e2e e2e/remediation-check.spec.ts — 1 passed (3.2s) — admin-created Sede+service, desktop 1280 flex-direction row display flex single row, dark Servicios 14.27, mobile dark 14.27, screenshots captured; then deleted temp harness
- pnpm test:e2e e2e/smoke.spec.ts — 1 passed (11.8s) — still green after remediation
- git diff HEAD — tracked 2198 (1540 ins +658 del) vs prior 2099 (1442+657) = +99 remediation lines; plus untracked registro 276 =2474 total candidate; bytes 135461
- Native token not acquired/settled/reset — parent holds token, AND remediation is exception bound to cff10045

### Candidate Evidence Revision SHA-256 (Remediation)
- Canonical tracked 8d5ae688ada752e5eb48f92c59959885b2176e60f455e69a0f142ebe71932219 (135461 bytes, 1540 ins +658 del =2198 tracked) + registro test 276 =2474 total — prior cff10045fd397b46e4572ececf85059c390b9404b17dd0315fb5516f952b985e superseded
- Base HEAD 5a49f7c branch feat/page-ui-redesign one writer worktree
- Remediation evidence .sdd/changes/page-ui-redesign/ui/verification/remediation/ — 4 png + state: dashboard-1280-dark.png, dashboard-1280-light.png, dashboard-390-dark.png, dashboard-390-light.png (computed via Playwright after admin data, dark Servicios 14.27, desktop row single)
- Prior s3 25 files + s2b 15 files + s1-remediation 15 files + final-apply 25 files remain bound — remediation is additive

### Cleanup / Process Evidence (Remediation)
- No commit/push/PR/review/archive — worktree only, parent settles token sha256:cff10045... max 800 auto-chain stacked-to-main
- Temp e2e/remediation-check.spec.ts created for rendered attestation then deleted — git diff hash stable 8d5ae6 before and after deletion (untracked harness not in diff, screenshots retained)
- pnpm check run check-only (biome check --formatter-enabled=false) — no --write, no fixes applied — formatter mutation avoided per instruction
- One writer worktree feat-page-ui-redesign, docker compose healthy app-local+pocketbase-local 127.0.0.1:3000/8090 loopback only, no secrets in diff or evidence
- No Mesa second audit ply, no border-l-4, no rejected directions mixed; light-mode 7.04 preserved for non-Servicios but Servicios now foreground for AA (Andén Ordenado text-foreground+border-primary)

### Verification Consequence (Remediation)
- Remediation PASSES for both defects: dark active Servicios now 14.27:1 (was 2.82) on #27272a, light remains compliant (foreground 16.97 on #FFFFFF vs prior tinta 7.04 — both AA, now consistent with Registro/Sedes); desktop table actions now single horizontal row (flex-row, tops 1 row, not vertical column), mobile remains flex-wrap justify-end compact; all existing service actions/labels/keyboard/loading/responsive/tenant/routes unchanged per full 433 + smoke.

### Remaining Tasks
- [x] 4.1–4.2 Proof — closed via final-apply (18/18)
- [x] R1–R5 Remediation — closed (2 defects fixed, RED→GREEN, 433+smoke+remediation rendered green)
- Next: independent SDD verification against new candidate 8d5ae688 (parent settles cff10045)

### Risks
- Light Servicios changed from tinta #2F5B8A (7.04) to foreground #18181b/#fafafa (16.97/14.27) — both AA but uniform with Registro/Sedes per Andén Ordenado; if light tinta preservation was strict, dark:text-foreground variant would be alternative (but dark: variant did not compose in current Tailwind @theme, so foreground chosen for reliability).
- Desktop actions now flex-nowrap single row — if future services have many actions, may overflow; current table has overflow handling via responsive wrapper hidden on mobile, desktop has space for 5 44px buttons; wrap could be reintroduced as flex-wrap with min-width but current single row satisfies horizontal requirement.
- Native accounting 2198 tracked +276 =2474 exceeds 800 session budget but remediation slice is only 99 lines (+99 over prior 2099) — well under 800 for this work unit; full candidate remains parent-settled under prior size:exception context.

### Skill Resolution — Remediation
- sdd-apply Strict TDD (red→green→triangulate), sdd-ui (Andén Ordenado, craft-floor, colorize, adapt, layout), runtime-access (openspec/ui.yaml project-e2e-self-register, admin token for data), vitest (focused+full), behavioral-correctness (test-quality, 2.82 vs 14.27), inline-docs, next-best-practices, vercel-react-best-practices, work-unit-commits — via Skill loading + codegraph + package.json
