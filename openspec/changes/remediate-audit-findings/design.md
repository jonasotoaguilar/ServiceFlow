# Design: Remediate Audit Findings (F1–F8)

## Technical Approach

Formalize the drafted worktree hardening into chained PRs S1→S6. The app runs `node-appwrite@14` admin-SDK-only on `serviceflow-db`. The one code gap: the migration script parses `--apply` but lacks a fail-closed identity check and `--yes` (PM-2, PM-3 unmet). Design adds both guards plus RED tests; the rest is already in the worktree.

## Architecture Decisions

| Decision                | Options                                                                         | Tradeoff                                                                                | Choice                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Dev-only guard location | (a) inline in migrate script; (b) shared `scripts/lib/dev-guard.ts`             | (b) reusable but speculative; (a) smallest, exported for tests                          | (a) `assertDevTarget` exported from migrate script                         |
| Guard mechanism         | (a) endpoint allowlist + project allowlist; (b) `APPWRITE_ENV=development` flag | (a) fail-closed, no credential embed; (b) spoofable single string                       | (a) loopback-hostname allowlist + `APPWRITE_DEV_PROJECT_IDS`               |
| Apply gate              | (a) `--apply` only; (b) `--apply` + `--yes`                                     | (a) violates PM-3; (b) two independent flags, abort if apply w/o yes                    | (b) `parseArgs()` → `{dryRun, confirmed}`                                  |
| `:apply` alias          | (a) keep `appwrite:migrate-permissions:apply`; (b) remove alias                 | (a) bakes in `--apply` without `--yes`, invites unsafe apply; (b) forces explicit flags | (b) remove alias; direct `pnpm appwrite:migrate-permissions --apply --yes` |
| SECURITY.md location    | (a) root; (b) `.github/`                                                        | spec (PC-1) says root; GitHub honors both                                               | (a) root; remove `.github/` copy                                           |

## Data Flow

```
pnpm appwrite:migrate-permissions [--apply --yes]   # no :apply alias
  parseArgs ──► assertDevTarget(endpoint, projectId) ──► confirm gate
                 │ fail-closed: throws → exit 1, no mutation      │ !dryRun && !confirmed → exit 1
                 ▼
  Client(admin SDK .setKey) ──► databases.get("serviceflow-db") ──► buildMigrationPlan per collection
                                                                    │
                          dry-run: print plan only    apply: updateCollection(id, name, [], docSec, enabled)
```

## Interfaces / Contracts

```ts
// scripts/migrate-appwrite-permissions.ts (exported for tests)
type ParseResult = { dryRun: boolean; confirmed: boolean };
function parseArgs(argv?: string[]): ParseResult; // --apply⇒dryRun=false; --yes⇒confirmed=true; unknown⇒throw
function assertDevTarget(endpoint?: string, projectId?: string): void; // throws unless loopback endpoint AND project ∈ APPWRITE_DEV_PROJECT_IDS
const DEV_ENDPOINT_ALLOWLIST = ["localhost", "127.0.0.1", "::1"];
```

## Requirement → File Map

| Finding | Requirements | Files                                                                                                                               |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| F1      | PM-1..4      | `scripts/migrate-appwrite-permissions.ts` (guard+`--yes`), `tests/permissions.test.ts` (RED)                                        |
| F2      | SA-4         | `proxy.ts` — delete (unauthenticated `/api/proxy/*` rewrite)                                                                        |
| F3      | SA-3         | `lib/appwrite.ts`, `scripts/setup-appwrite.ts` (already `serviceflow-db`)                                                           |
| F4      | CI-6         | `package.json`+`pnpm-lock.yaml`; new `pnpm-workspace.yaml`; `package-lock.json` — `git rm --cached` to stop tracking                |
| F5      | CI-7         | `check_or.ts` — delete (pending); `lint_output.txt`, `design/` — commit existing worktree deletions                                 |
| F6      | SA-5         | `lib/appwrite.ts` — remove `[Appwrite Debug]` L37 + commented warn L31–32                                                           |
| F7      | PC-1..3      | root `PRD.md` `ARCHITECTURE.md` `DESIGN.md` `SECURITY.md` (dev-only guard documented, no stale proxy); remove `.github/SECURITY.md` |
| F8      | CI-1..5      | `.github/workflows/{ci,pr-check}.yml`, `dependabot.yml`, `CODEOWNERS`, `.husky/pre-commit`                                          |
| —       | SA-1, SA-2   | already satisfied: admin-SDK-only pattern (`lib/appwrite.ts`), `[]` perms in `setup-appwrite.ts`; verify only                       |

Verified absent: `Service-system-db`, `appwrite@22`, `Role.any()`.

## Testing Strategy (strict-TDD, `pnpm test:run`)

| Layer           | What                 | Approach                                                                                                                                     |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (new RED)  | guard + confirmation | `assertDevTarget` throws on prod endpoint / missing identity / mismatched project; `parseArgs` returns `confirmed=false` for `--apply` alone |
| Unit (existing) | migration behavior   | dry-run never calls `updateCollection`; apply passes `[]`; partial-failure reporting                                                         |
| Integration     | none automated       | no live Appwrite in CI; S4 = manual dev-only run, evidence captured in verify                                                                |
| E2E             | N/A                  | no E2E layer; no coverage provider                                                                                                           |

RED-first: guard/confirm tests before implementation (`assertDevTarget` undefined; `parseArgs` has no `confirmed`).

## Threat Matrix

Triggered by `argv`/`env` parsing and the husky pre-commit lint hook.

| Boundary                 | Applicability                                                                     | Safe/failure behavior + RED test                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation-like paths | N/A — no executable docs; scripts are explicit `scripts/*.ts`                     | —                                                                                                                                                                                                                          |
| Git repository selection | N/A — no `git -C`; CI uses `actions/checkout`                                     | —                                                                                                                                                                                                                          |
| Commit state             | **Applicable** — `.husky/pre-commit` runs `pnpm exec lint-staged` on staged files | Safe: lint-clean staged files commit (exit 0). Failure: staged lint error blocks commit (non-zero exit). RED tests = CI-5 scenarios "Clean commit passes" + "Lint error blocks commit". Propagates unchanged into tasks.md |
| Push state               | N/A — no push automation; CI reacts to GitHub events                              | —                                                                                                                                                                                                                          |
| PR commands              | N/A — typed `github.rest` API, no shell composition                               | —                                                                                                                                                                                                                          |

## Migration / Rollout

- Permission strip is reversible: printed snapshot (`previousPermissions`, `documentSecurity`) enables manual restore; fix-forward least-privilege preferred; `--restore` out of scope.
- DB rename: old `Service-system-db` left intact; S4 re-provisions dev via `pnpm appwrite:setup`.
- Per-slice `git revert`; each chained PR independently deployable; production untouched.

## Open Questions

None — SECURITY.md root placement and `:apply` alias removal resolved above.
