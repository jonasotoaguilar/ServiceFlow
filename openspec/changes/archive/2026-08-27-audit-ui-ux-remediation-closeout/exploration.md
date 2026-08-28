# Exploration: audit-ui-ux-remediation-closeout

## Current State

**Predecessor frozen as blocked, not failed open.** `audit-ui-ux-remediation` records 21/21 tasks `[x]` and `apply` all_done, but archive is intentionally blocked because verification evidence is incomplete. The maintainer explicitly authorized starting this successor from staged candidate tree `38640512f6119e4edde346158797be61dd62fff6` (gate evidence: 256 additions + 129 deletions = 385 focused changed lines, 148/148 focused tests passed, `tsc --noEmit` passed). The native attempt token `sha256:8e2c0ab0c41ed635faf5caa1cb54e910415d9d52707121f1a2d999e85e25d890` is deadlocked with stale intended-untracked paths — it is context only, not authority to mutate.

Staged index verification shows the full remediation payload against `38a49d3` (main): 97 files, ~12k insertions / ~6k deletions, including `app/(app)/layout.tsx` shared shell, `service_events` rename, Boneyard skeletons, RUT modulo-11, location invariants, and dedicated `status`/`transfer` routes. Runtime verification (`verify-report.md` rev `sha256:410502b...`, verdict `fail`, 40/51 scenarios) confirms build+typecheck+332 tests pass but 6 scenarios fail against live PocketBase 0.40.1: mobile table actions off-screen at 390px (`ServicesTable` `overflow-x-auto` x=966), Registro row truncated (`810 vs 341`), and dedicated `PATCH /api/services/[id]/status|transfer` returning `500` due to `403 Batch requests are not allowed` on `createBatch()`.

**Workflows present:** `.github/workflows/ci.yml` (quality + e2e) and `.github/workflows/release.yml` exist in both HEAD and candidate tree `38640512f6119e4edde346158797be61dd62fff6` (verified via `git ls-tree HEAD -- .github/workflows/` and `git ls-tree 38640512f... -- .github/workflows/`). `.github/workflows/pr-check.yml` alone is absent. Canonical asset `assets/workflows/pr-check.yml` in `ci-cd-and-automation` SKILL caps at `limit = 400`. The successor's explicitly requested scope is to install that canonical workflow extending the existing toolchain (not inventing a second pipeline), configured to `800` changed lines, without weakening other gates.

**Toolchain:** `pnpm 11`, Next 16 App Router + React 19 + Tailwind 4 + PocketBase 0.28, `pnpm test:run` (vitest), `playwright-cli 0.1.18`, `boneyard-js 1.9.0` already pinned.

---

## 1. Successor Relationship and Frozen Predecessor Invariant

**Representation (without mutating predecessor):**

- Create `openspec/changes/audit-ui-ux-remediation-closeout/` as the only new change folder. Do not edit, move, or rewrite any file under `openspec/changes/audit-ui-ux-remediation/` (proposal, specs, design, tasks, verify-report, exploration, apply-progress). Do not settle, reset, or finish the deadlocked attempt `sha256:8e2c0a...`, and do not reset the staged candidate index that still points to `38640512f...`.
- Declare the relationship in successor planning artifacts — `proposal.md` frontmatter/header, `specs/*`, `design.md`, and `tasks.md` as appropriate: `supersedes: audit-ui-ux-remediation` and `baseline_candidate_tree: 38640512f6119e4edde346158797be61dd62fff6`. Include an explicit "Predecessor Frozen" section stating: predecessor remains `blocked`, intentional, no archive, no edits. The SDD artifact contract for this change recognizes proposal, specs, design, tasks, apply-progress, and verify-report; no orchestrator-owned DAG state file exists and none is created or relied upon.
- Keep predecessor `apply-progress.md` and `verify-report.md` as audit trail of the failed verification (blockers 3, 6 failing scenarios, mobile overflow, batch 403). Successor references them by hash, not by copying or rewriting.

**Why this satisfies immutability:** any diff of `openspec/changes/audit-ui-ux-remediation` after successor creation must be empty (`git diff -- openspec/changes/audit-ui-ux-remediation` == 0). The successor's identity is separate; supersession is declarative, not destructive. The linkage is represented in successor proposal/spec/design/tasks, not in an invented state file.

---

## 2. Binding All Later Verification/Remediation to the Exact Starting Candidate Tree

**Baseline identity:**

- Record `38640512f6119e4edde346158797be61dd62fff6` as the successor's immutable starting baseline in `exploration.md` (this file) and in successor `proposal.md`, `specs/*`, `design.md`, and `tasks.md` as appropriate. That tree already contains the staged index from branch `docs/audit-ui-ux-remediation`; verify with `git ls-tree 38640512f...` and `git diff-index --cached --numstat HEAD`. Current `git write-tree` already equals `38640512f6119e4edde346158797be61dd62fff6`.
- Do not `git reset` or `git restore --staged` before verification. The fresh independent SDD verification must run against the current working tree/index which already equals that candidate tree. Any later isolated-worktree strategy requires an ordinary repository-policy commit/branch decision outside this planning phase; do not fabricate one and do not attempt to create an isolated worktree directly from a tree object or any hidden/synthetic commit. This planning phase proposes no worktree creation.
- Native attempt authority is acquired only immediately before a runtime-bearing `sdd-apply`, `sdd-verify`, or remediation actor launch. Planning phases (`sdd-propose` including proposal/specs/design/tasks generation) do not acquire runtime attempt authority. References to a successor attempt token in this exploration are therefore aspirational intent for later runtime phases, not an acquisition in propose.

**Preserving predecessor index:**

- The predecessor's staged candidate/index is preserved by leaving the current index untouched and by treating `38640512f...` as the preserved baseline tree. The tree object remains reachable via hash. No `git commit --amend` on predecessor's staged content.
- Verification plan (see §3) runs `pnpm test:run`, `tsc --noEmit`, `pnpm build`, and `verify-ui` (playwright-cli) against that baseline first, before any remediation, so evidence is anchored to the exact candidate. Only newly proven failures trigger edits, each under successor attempt authority acquired immediately before the runtime-bearing phase that applies them, with a new receipt tree hash for audit.

**CodeGraph note:** CodeGraph index lags writes ~1s; after any edit, rely on watcher auto-sync. For the baseline verification, trust the candidate tree bytes already indexed; do not re-init `.codegraph`.

---

## 3. Smallest Closeout Scope

**Goal:** close the audit with the minimum diff that makes verification pass and installs the requested guard, then allow archive. No re-architecture.

### A. Canonical `pr-check.yml` installation at 800 lines

- **Decision gate (ci-cd-and-automation SKILL):** Missing `pr-check.yml` → copy `assets/workflows/pr-check.yml` verbatim, then extend. Do not generate a new `ci.yml`; `ci.yml` already exists and is extended-only. Do not invent a second pipeline.
- **Required extension:** change `const limit = 400;` to `const limit = 800;` and keep all other gates (`check-issue-reference`, `check-issue-approved`, `check-type-label`, concurrency, `contents: read`, pin `actions/github-script@v9`). This preserves the project toolchain while enforcing the explicitly requested 800-line review limit.
- **File:** `.github/workflows/pr-check.yml` (new). Do not weaken `ci.yml` or `release.yml`. Do not auto-deploy.
- **Review budget placement:** The 800-line budget is this session/change's explicit override and belongs in successor planning artifacts (`proposal.md`, `specs/*`, `design.md`, `tasks.md`) and the requested `.github/workflows/pr-check.yml` `limit` value. Do not update global `openspec/config.yaml` for a per-session budget unless separately authorized.
- **Estimated diff:** + ~193 lines (verbatim asset) with 1-line limit change; well within 800.

### B. Fresh independent SDD verification (no remediation yet)

- Run under successor native attempt authority acquired only immediately before the runtime-bearing `sdd-verify` actor launch (not during `sdd-propose`):
  - `pnpm test:run` (expect 332/332 today) + `pnpm exec tsc --noEmit` + `pnpm run build` + `pnpm check` (Biome).
  - `sdd-verify` with `verify-report.md` validator `gentle-ai sdd-verify-validate` counting authoritative requirements/scenarios from `specs/*`.
  - `verify-ui` as support layer inside `sdd-verify` (never standalone, never acquiring attempt): `playwright-cli` against authenticated state (`/login` → `/dashboard` → `/locations` → `/registro`), matrix `routes × themes × desktop(1280×800)/mobile(390×844) × states(normal,empty,validation,dialog,error,menu)`. Screenshots via `screenshot --filename`, inspected, plus `console`/`requests`/`eval`. Auth via parent-provided state only; temp private `0700/0600`, deleted unless parent retains. SEO/metrics `not_applicable` for authenticated routes.

### C. Authenticated visual matrix (changed surfaces only)

- **Changed routes/components per predecessor diff:** `/login`, `/dashboard`, `/locations`, `/registro`, `Navbar`, `ServicesDashboard`, `ServicesTable`, `ServicesModal`, `ServicesDetailsModal`, `LocationsManager`, `ServiceEventsManager`, `Dialog`, `IconButton`, `ThemeProvider`, tokens.
- **Matrix to re-prove:** header `top==0 bottom==65` at 1280 and 390 for all three authenticated routes, gutter/max-w equality, 44px targets, opaque `bg-surface` (no glass/blur), dialog Esc/focus, reduced-motion static, card tokens, Boneyard `aria-busy` preservation, and the 4 failing findings: `ui-001` mobile actions off-screen, `ui-004` Registro overflow, `ui-005` ISO timestamps, `ui-006` English copy leftovers.

### D. Conditional remediation — only proven failures, under successor authority

- **Trigger:** only if the fresh verification reproduces a finding as `remediation_required`. Do not pre-emptively refactor.
- **Authority:** any remediation edits are performed only after native attempt authority has been acquired immediately before the runtime-bearing `sdd-apply` or remediation actor launch. No attempt authority is acquired during planning.
- **Proven candidates from predecessor evidence (to be re-proven, not assumed):**
  1. `PocketBase batch 403` → `PATCH .../status|transfer` 500. Fix: drop `createBatch()` (unsupported in PB 0.40.1) in favor of sequential writes with rollback, re-test live. Affects `app/api/services/[id]/status/route.ts` + `transfer/route.ts` (previously 62%/69% coverage, batch paths uncovered).
  2. Mobile `ServicesTable` progressive disclosure → actions at x≈966. Fix: `ServicesTable.tsx` responsive pattern (card fallback or fixed-action column) already deferred to `ops`? Implement minimal disclosure for 390px.
  3. `Registro` mobile overflow similarly.
  4. ISO timestamp rendering (`format-date.ts`) → UTC Spanish date.
  5. Copy/STAE remnants (`status`/`transfer` English internals, `S. Completados`, etc.) — only if user-visible.
- **Out of conditional scope:** any other audit remediation already passing stays untouched.

**Total closeout estimate:** verification-only phase ≈ 193 lines (pr-check) + 0 code; if batch + mobile fixes are re-proven, additional ≈ 150–350 lines across 4–5 files, still <800. No new pipeline invented.

---

## 4. Risks, Constraints, Non-Goals, Rollback, Research

### Risks

- **Predecessor mutation risk (High, avoidable):** editing `openspec/changes/audit-ui-ux-remediation/*` or resetting its staged index would break the audit trail and deadlock recovery. Mitigation: freeze check in CI (`git diff -- openspec/changes/audit-ui-ux-remediation` must be empty), review checklist.
- **Candidate identity loss (High):** resetting or re-indexing without anchoring `38640512f...` would decouple verification from gate-approved evidence. Mitigation: record tree hash in proposal/spec/design/tasks, verify with `git cat-file -p` before propose; current `git write-tree` already equals the baseline.
- **Gate weakening (Medium):** installing `pr-check.yml` at 400 (default asset) instead of 800 would silently enforce the wrong budget, or copying `release.yml` incorrectly. Mitigation: explicit 800 edit in `.github/workflows/pr-check.yml`, keep other jobs (`check-issue-reference`, `check-type-label`) intact, least-privilege `contents: read`.
- **Scope creep (Medium):** ripping predecessor features or re-applying all 21 tasks would exceed 800 and defeat "closeout-only". Mitigation: conditional remediation rule — fix only what fresh verification proves.
- **Live-only failures (Medium):** batch 403 and compose.dev `:_next/static` 403 are environment-specific; unit mocks pass while live fails. Mitigation: live PocketBase against `pocketbase:0.40.1` with `compose.yaml` healthcheck, run `next start -p 3001` as in prior verify.
- **Visual regressions re-introduced (Low):** token or shell changes affecting `top==0` at 1280/390. Mitigation: verify-ui asserts `getBoundingClientRect().top` plus gutter/width.

### Constraints

- Must not modify tracked source or predecessor change during exploration (this phase is read-only; only `exploration.md` is created).
- Must extend existing toolchain (`ci.yml` + `release.yml` remain; `pr-check.yml` added as canonical). No second `ci.yml`, no speculative pipeline.
- Review budget 800 is hard limit for this session/change (explicit override) recorded in successor planning artifacts and `.github/workflows/pr-check.yml`; do not update global `openspec/config.yaml` unless separately authorized. Do not record an unrecognized `delivery_strategy`; resolve to `auto-chain` if high.
- No orchestrator-owned DAG state file exists for this change; do not create or rely on one — linkage lives in proposal/spec/design/tasks.
- Native attempt authority is acquired only immediately before runtime-bearing `sdd-apply`/`sdd-verify`/remediation; planning phases do not acquire it.
- Execution language: English artifacts; Spanish only for existing product UI copy.
- Authenticated verification requires parent-provided `pb_auth` state; never commit credentials/screenshots.

### Non-Goals (explicit)

- No rewrites of predecessor proposal/specs/design/tasks/verify-report.
- No new backend/security/hosting/infrastructure, no CSV import, no speculative compatibility layers.
- No new visual direction beyond Taller Claro already shipped; no `docs/adr` creation unless decision justifies it.
- No mutation or performance E2E beyond existing `pnpm test:e2e` smoke.
- No deletion of predecessor's deadlocked attempt token; it stays as historical context.

### Rollback Boundaries

- **pr-check installation:** rollback is `git rm .github/workflows/pr-check.yml`. No other workflow affected. No global `openspec/config.yaml` change to revert.
- **Verification-only:** no code to rollback; delete generated `verify-report.md` if verification was local-only and not yet admitted via `gentle-ai sdd-verify-validate`.
- **Conditional remediation:** each fix is a work-unit commit with independent rollback (status route, transfer route, ServicesTable, Registro, format-date). No shared migration; revert single commit does not affect pr-check guard.

### External Research Necessity

- **Preferred: no external research.** `pr-check.yml` is a repository-canonical asset, not an external contract; `PocketBase 0.28` batch behavior is already proven by the 500 evidence (`Batch requests are not allowed.`). The verify-ui contract is local (`playwright-cli 0.1.18`, `verify-ui` SKILL).
- **Exception:** if fresh verification cannot reproduce the batch 403 while mocks still pass, one bounded external check of PocketBase 0.40.1 batch capability is justified, but not before.

---

## Affected Areas

- `openspec/changes/audit-ui-ux-remediation-closeout/exploration.md` — this file (only file created in exploration)
- `openspec/changes/audit-ui-ux-remediation-closeout/proposal.md` — next phase, will carry `supersedes: audit-ui-ux-remediation` + `baseline_candidate_tree: 38640512f...`
- `openspec/changes/audit-ui-ux-remediation-closeout/specs/*`, `design.md`, `tasks.md` — will also record supersedes/baseline and scope the 800-line budget
- `.github/workflows/pr-check.yml` — canonical workflow, 800-line limit (propose/apply) — the per-session budget lives here
- `.github/workflows/ci.yml`, `.github/workflows/release.yml` — read-only, not modified (present in both HEAD and candidate tree; only pr-check is missing)
- Conditional only if re-proven: `app/api/services/[id]/status/route.ts`, `app/api/services/[id]/transfer/route.ts`, `components/services/ServicesTable.tsx`, `app/(app)/service-events/serviceEventsManager.tsx` or `ServicesTable` variant, `lib/format-date.ts`, copy residuals
- Verification surfaces: `e2e/smoke.spec.ts`, `playwright.config.ts`, `compose.yaml` / `compose.dev.yaml`, `tests/**`, `styles/globals.css`, `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`

---

## Approaches

### 1. Minimal Closeout — Canonical pr-check @800 + Fresh Verification + Conditional Remediation (Recommended)

Copy `ci-cd-and-automation/assets/workflows/pr-check.yml` verbatim, edit `limit` 400→800, preserve other gates, extend existing toolchain. Run independent `sdd-verify` + `verify-ui` against the preserved candidate tree `38640512f...` (current `git write-tree` already equals it); remediate only findings that reproduce. Successor declares `supersedes` and preserves predecessor frozen via proposal/spec/design/tasks. Native attempt authority acquired only immediately before runtime-bearing apply/verify/remediation.

- Pros: smallest diff, respects 800 budget, no predecessor mutation, audit-compliant, toolchain-consistent, reversible, no speculative work, no invented state file.
- Cons: requires disciplined re-verification; batch fix may still need ~200 lines.
- Effort: Low (exploration/proposal) + Low (pr-check) + Medium if batch+mobile re-proven.

### 2. Full Re-Apply — Re-run Predecessor Tasks and Re-verify Everything

Re-execute the 21 tasks from scratch on a new candidate, re-generate bones, re-apply schema, then verify.

- Pros: guarantees green from clean slate.
- Cons: far exceeds 800 (predecessor is ~12k lines staged), violates "closeout-only", loses candidate tree identity, high reviewer load, high regression risk.
- Effort: High.
- Verdict: Rejected.

### 3. New Pipeline Invention — Custom pr-check with Additional Jobs

Invent a separate workflow or extend `ci.yml` with inline PR size checks instead of installing canonical `pr-check.yml`.

- Pros: none durable.
- Cons: violates `ci-cd-and-automation` Hard Rule "Extend the repo's existing pipeline. Never create a second pipeline", diverges from community contract, must be maintained, weakens gate comparability.
- Effort: Medium, with ongoing drift.
- Verdict: Rejected.

---

## Recommendation

**Adopt Approach 1.** Create the successor as a thin closeout wrapper: preserve candidate tree `38640512f...` as immutable baseline (current `git write-tree` already equals it; no synthetic commit or worktree-from-tree), freeze predecessor without edits, install canonical `pr-check.yml` at 800 (one-line extension of the asset; budget recorded in successor proposal/spec/design/tasks and workflow, not global config), perform fresh independent verification including authenticated `verify-ui` matrix under native attempt authority acquired only before runtime-bearing phases, and remediate only newly proven failures. This is the smallest change that satisfies the maintainer's explicitly authorized scope, stays within the 800-line review budget, and keeps the audit trail intact.

---

## Risks (summary)

- Predecessor mutation → audit trail loss
- Candidate identity loss → verification detached from gate evidence
- Gate weakening → wrong 400 limit or broken issue/type labels
- Scope creep → exceeding 800 with speculative refactors
- Live-only batch 403 → mocked tests green but `PATCH` 500
- Mobile disclosure → 390px actions still off-screen

---

## Ready for Proposal

**Yes.** Clear to proceed to `sdd-propose`. No blocker. Predecessor is correctly frozen, candidate tree is reachable, toolchain is standard, and closeout scope is minimal and well-bounded. `sdd-propose` is a planning phase and does not acquire runtime attempt authority.

**Research lifecycle:** Research should be offered as **unselected** (`research_unselected`). No concrete unresolved external contract requires `research.md` before proposal; the predecessor's exploration already covers domain findings. A bounded external check (PocketBase batch API) is only justified if fresh verification cannot reproduce the already-evidenced batch failure — make it opt-in in `proposal.md`, not a gate. Propose can therefore proceed directly to specs/design/tasks without waiting for research.

---

## Verification Plan (for next phases)

1. `git cat-file -p 38640512f...` + `git diff-index --cached` + `git write-tree` — confirm baseline still equals `38640512f6119e4edde346158797be61dd62fff6` and `git diff -- openspec/changes/audit-ui-ux-remediation` is empty
2. `pnpm test:run` + `tsc --noEmit` + `build` + `check` — baseline gates
3. `sdd-verify` (with attempt authority acquired immediately before launch) → `gentle-ai sdd-verify-validate` admission before any `verify-report.md` write
4. `verify-ui` one campaign, 25 cells, real screenshots, `console`/`requests`/`eval`, matrix as in predecessor (themes light/dark, desktop 1280×800, mobile 390×844, states normal/dialog/error/menu/empty/validation)
5. If any `remediation_required`, acquire attempt authority before `sdd-apply`, apply minimal fix commits, re-run focused suite, re-verify

## Rollback Summary

- `pr-check.yml` add → `git rm` single file
- Each conditional fix → revert its work-unit commit
- No predecessor rollback needed (it stays blocked, untouched)
