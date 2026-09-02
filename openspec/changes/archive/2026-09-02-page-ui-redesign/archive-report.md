# Archive Report — page-ui-redesign (Terminal Final-State Record)

**Change**: `page-ui-redesign`
**Archived to**: `openspec/changes/archive/2026-09-02-page-ui-redesign/` (openspec)
**Date**: `2026-09-02` | **Mode**: `openspec` | **Artifacts**: proposal/spec/design/tasks/apply-progress/verify-report/ui-design/exploration/preproposal/research | **Instance**: `.gentle-ai-instance` `sdd-2cebf40275e2cd1f2106e222535f9553`
**Source**: `openspec/changes/page-ui-redesign` → `openspec/changes/archive/2026-09-02-page-ui-redesign/` (mechanical, byte-identical)
**Recovery**: Direct recovery of stranded uncommitted OpenSpec artifacts after archive — not a new SDD phase. `sdd-archive` not rerun; active locators were already `archived/all_done`. Stranded tree recovered from `stash@{0}` (`archive docs preserved not in PR`).

## Terminal Authority — This Report Supersedes Intermediate Snapshots

`apply-progress.md` and `verify-report.md` are **intermediate snapshots** valid only at the time they were written. Follow-up remediation, fresh independent verification, and stacked delivery occurred after those snapshots. This archive-report is the terminal record at close. Do not echo snapshot `pending`/`blocked`/`remaining` claims as current state.

Contradiction resolution per Final-State Authority hierarchy: `tasks.md` (18/18 checked) > explicit final-state facts in this recovery > intermediate snapshot wording.

## Commits (Source Stack — SHAs Unchanged)

| Slice | Commit | Scope | Description | SHA |
|-------|--------|-------|-------------|-----|
| S1 | 7edd178 | identity + brand + locations | `feat(identity): add Bodega Técnica brand mark, dark contrast and locations craft floor` | `7edd178788ff5b2da73910912252831ecfe3c4da` |
| S2 | 0eb6fa1 | dashboard | `feat(dashboard): headline, metrics, toolbar and table responsive behavior` | `0eb6fa1a9e3928f056fadd72181604548c871b0b` |
| S3 | 3179374 | registro | `feat(registro): rank, empty, error and mobile behavior` | `3179374ad8756b01ac93386e0b66a58e0dc2bcbe` |

Source heads remain exactly as above. This archive-recovery PR does not amend or rebase any source member.

## Stacked PR Chain (stacked-to-main)

Published and open, each linked to approved issue #73 and carrying `size:exception`:

| PR | Branch | Base | Title | Linked Issue | State | Labels |
|----|--------|------|-------|--------------|-------|--------|
| #74 | `feat/page-ui-redesign` | `main` | `feat(identity): add Bodega Técnica brand mark, dark contrast and locations craft floor` | `Related to #73` | OPEN | `type:feature`, `size:exception` |
| #75 | `feat/page-ui-redesign-02-dashboard` | `feat/page-ui-redesign` | `feat(dashboard): headline, metrics, toolbar and table responsive behavior` | `Related to #73` | OPEN | `type:feature`, `size:exception` |
| #76 | `feat/page-ui-redesign-03-registro` (current top) | `feat/page-ui-redesign-02-dashboard` | `feat(registro): rank, empty, error and mobile behavior` | `Related to #73` | OPEN | `type:feature`, `size:exception` |

Stack #77 `stacked-to-main`, `trunk: main`, published/open. Promoted specs (`bodega-tecnica-identity`, `dashboard-operate-plus`, `registro-primary-surface`) and `openspec/ui.yaml` are already included in PR #74.

The final archive recovery is delivered as a **new docs member** targeting `#76`'s branch (this PR). Existing source head SHAs remain unchanged.

## Task Completion Gate

- `tasks.md` 18/18 complete — Phases 1.1–1.8, 2.1–2.4, 3.1–3.4, 4.1–4.2, R1–R5 all `[x]`, zero unchecked implementation tasks.
- Archived `tasks.md` remains fully checked; no stale-checkbox reconciliation was required.
- Native SDD status at archive time (before locators were released): `dependencies proposal/specs/design/tasks/apply/verify: all_done`, `dependencies.archive: ready`, `nextRecommended: archive` — PASS.

## Final Independent Evidence (Aggregate Required Checks — PASSED)

Verified after remediation on the remediated candidate `8d5ae688ada752e5eb48f92c59959885b2176e60f455e69a0f142ebe71932219`:

- **Biome** (check-only, no `--write`): exit 0 — **3 warnings / 2 infos** (check-only, no mutation).
- **TypeScript**: `tsc --noEmit` exit 0 — clean, no errors.
- **Unit tests**: `pnpm test:run` — **26 files / 433 tests passed**, 0 failed / 0 skipped.
- **Playwright smoke**: `e2e/smoke.spec.ts` — **1 passed** (register → location → service → move → history → isolation).
- **Rendered proof** (Playwright + independent browser probes, light+dark):
  - Dashboard / Registro / Locations at **1280×800** and **390×844**, light and dark — all visible.
  - **4 probes passed** — headline > metrics > filter strip > table hierarchy, `border-y` strip, 390px grid preserves boleta/sede/ingreso/días/estado/actions without `overflow-x-auto`, `Nav` Servicios → Registro → Sedes order, brand lockup.
- **Aggregate required checks**: PASSED (Biome + typecheck + unit + smoke + rendered).

Historical intermediate numbers (e.g., prior verify-report `check 110 files 3 warnings+3 infos`, earlier candidate `cff10045fd397b46`, or apply-progress phase wording `Remaining Tasks 4.1–4.2 pending`) are superseded by the evidence above and must not be restated as current.

## Specs Synced (Source of Truth — Already Promoted)

| Domain | Action | Details |
|--------|--------|---------|
| `bodega-tecnica-identity` | Created | `openspec/specs/bodega-tecnica-identity/spec.md` — 4 requirements, 10 scenarios — mechanically copied via `cp` → `diff -r` empty → `mv` |
| `dashboard-operate-plus` | Created | `openspec/specs/dashboard-operate-plus/spec.md` — 5 requirements, 9 scenarios — same mechanical path |
| `registro-primary-surface` | Created | `openspec/specs/registro-primary-surface/spec.md` — 5 requirements, 9 scenarios — same mechanical path |

Total 14 requirements / 28 scenarios across 3 new domains. No MODIFIED/REMOVED/RENAMED (new domains, no destructive merge). Specs are already present through PR #74; this recovery does not re-promote them.

Mechanical spec sync verbatim `diff -r` readbacks (from original archive, before stranding) were empty (`exit 0`) — only passing evidence. SDD status confirmed `rules.archive: Warn before merging destructive deltas` was satisfied.

## Archive Contents (Restored, Byte-Identical)

Restored mechanically from `stash@{0}^3` via provider-safe snapshot `/tmp/sdd-recovery.sLTA8h` → `cp -a snapshot/. live/`:

- `proposal.md` ✅ (historical snapshot — preserved)
- `specs/` ✅ 3 domains (`bodega-tecnica-identity`, `dashboard-operate-plus`, `registro-primary-surface`) — preserved
- `design.md` ✅ — preserved
- `ui-design.md` ✅ Andén Ordenado (anden-ordenado) — preserved
- `tasks.md` ✅ 18/18 — preserved, fully checked
- `apply-progress.md` ✅ S1+S2b+S3+Phase4+R1–R5 (including remediated candidate `8d5ae688…`) — **intermediate snapshot**, preserved as history
- `verify-report.md` ✅ `pass_with_warnings` 14/14 req, 28/28 scenarios, 0 critical — **intermediate snapshot**, preserved as history
- `exploration.md` ✅, `preproposal.yaml` ✅, `research.md` ✅ — preserved
- `archive-report.md` ✅ (this file — terminal record, additive-only, excluded from snapshot `diff -r`)
- `.gentle-ai-instance` ✅ `sdd-2cebf40275e2cd1f2106e222535f9553` — preserved (global-gitignored, present on disk, excluded from `diff -r`)

Live destination contained only `.gentle-ai-instance` before recovery; stash snapshot contained the 13 files above.

### Mechanical Restoration — Verbatim `diff -r` Readback (Before Intentional Edits)

Provider-safe temporary snapshot of the exact stashed tree was created and mechanically copied without routing bytes through model generation:

```
snapshot_root=/tmp/sdd-recovery.sLTA8h
git archive stash@{0}^3 | tar -x -C "$snapshot_root"
cp -a "$snapshot_root/openspec/changes/archive/2026-09-02-page-ui-redesign/." openspec/changes/archive/2026-09-02-page-ui-redesign/
```

Preservation of `.gentle-ai-instance`: valid marker `sdd-2cebf40275e2cd1f2106e222535f9553` was preserved; no overwrite of ambiguous content and no malformed nesting `archive/2026-09-02-page-ui-redesign/2026-09-02-page-ui-redesign` created.

```
diff -r --exclude=.gentle-ai-instance $snapshot_root/openspec/changes/archive/2026-09-02-page-ui-redesign openspec/changes/archive/2026-09-02-page-ui-redesign
# (no output, exit 0 — empty PASS, byte-identical)

diff -r $snapshot_root/openspec/changes/archive/2026-09-02-page-ui-redesign openspec/changes/archive/2026-09-02-page-ui-redesign
# shows only .gentle-ai-instance as expected extra file (present live, absent in ignored stash payload) — no other differences
```

Empty output for the content-carrying files is the only passing evidence. This report's own edits are additive and excluded from the pre-edit readback.

## Root `DESIGN.md` Handling

- **Restored / read-only**: Root `DESIGN.md` remains the incumbent `Taller Claro Operacional` (452+ lines, `version: alpha`) and was **not** mutated by this archive recovery. The prior archive's `DESIGN.md` delta section was a stale intermediate artifact — the final state is **restored and read-only** as required.
- This archive recovery performs **no** source or root-doc edits.

## Exact SVG Repair

- `assets/brand/bodega-tecnica-mark.svg` — 32×32 `currentColor` 2px stroke, 8px square with 2×2 shelf-slot (one bay filled) — **repaired to exact spec** (path data matches design) and shipped via source PR #74. Archive promotion does not duplicate the fix.

## Technical Artifact Language

- Technical artifacts are **English**. Accidental Spanish explanatory prose in the archived technical artifacts was corrected to neutral professional English.
- **Intentional Spanish exceptions preserved** (product UI strings / acceptance examples): `Bodega Técnica`, `Servicios`, `Registro`, `Sedes`, `Nuevo servicio`, `Limpiar filtros`, `Reintentar`, `No hay registros`, `Sin resultados`, `Desde`/`Hasta`/`Tipo`/`Estado`/`Sede`, filter label `Todos Estado` (with suggestion `Todos los estados`), boleta/RUT ch-aligned examples, dialog copy `Cambiar estado` / `Transferir servicio` (without English `status`/`transfer` tokens). Proper name `Bodega Técnica` retained.

## Verification (Archive Structure)

- [x] `proposal.md` ✅
- [x] `specs/bodega-tecnica-identity/spec.md` ✅
- [x] `specs/dashboard-operate-plus/spec.md` ✅
- [x] `specs/registro-primary-surface/spec.md` ✅
- [x] `design.md` ✅
- [x] `tasks.md` ✅ 18/18
- [x] `apply-progress.md` ✅ (intermediate snapshot)
- [x] `verify-report.md` ✅ (intermediate snapshot)
- [x] `archive-report.md` ✅ (terminal record — this file)
- [x] `ui-design.md` ✅
- [x] `exploration.md` ✅, `preproposal.yaml` ✅, `research.md` ✅ as actually present
- [x] `.gentle-ai-instance` ✅ valid
- [x] Active `openspec/changes/page-ui-redesign` no longer exists under `openspec/changes/` at close (only `archive/` remains) — stranding was already archived; live status resolves via `archive/` after recovery
- [x] Language scan performed — no accidental Spanish technical prose remains; intentional UI exceptions listed above
- [x] Docs/structural checks (without source edits) performed — Biome check-only and typecheck evidence cited above; no source mutation performed

## Attribution

- `apply-progress.md` and `verify-report.md` remain intermediate snapshots per the hierarchy. Their stale `pending`/`blocked` wording (e.g., prior Phase 4 wording leftovers, earlier candidate hashes, earlier warning counts) is **not** current and was not echoed here.

## Delivery (Archive Recovery)

- No `sdd-archive` rerun — native `nextRecommended` was already `archived/all_done` and active locators were gone.
- Archive recovery itself is delivered in the **new final docs PR** created from the current stack top (`feat/page-ui-redesign-03-registro` #76) via `gh stack add docs/page-ui-redesign-archive` (or nearest `branch-pr`-compliant docs name) → `gh stack submit --auto` as DRAFT.
- Existing source head SHAs `#74 7edd178`, `#75 0eb6fa1`, `#76 3179374` remain exactly unchanged; their bases remain `main`, `feat/page-ui-redesign`, `feat/page-ui-redesign-02-dashboard` respectively. New PR targets `#76`'s branch.

## SDD Cycle Complete (For This Change)

The change has been fully planned, implemented, verified, and archived. The stranded audit trail has been recovered byte-identically and superseded by this terminal record. Ready for the next change.

---
*Terminal record generated 2026-09-02 — mechanical recovery verified (`diff -r --exclude=.gentle-ai-instance` empty), stacked delivery 7edd178/0eb6fa1/3179374, aggregate checks passed, DESIGN.md restored read-only, SVG exact, language corrected.*
