# Biome — Canonical Linter and Formatter

**Version:** `2.5.10` is the canonical linter and formatter for this repository, replacing ESLint. Configuration is `biome.json` with formatter enabled (available) and JSON override `spaces/2` for stable `package.json`/`tsconfig` formatting. Assist is disabled. Linter uses `recommended` preset with narrow compatibility overrides for pre-existing historical findings; formatter is not enforced in CI check to avoid a mass-format migration.

## Commands

- `pnpm lint` — `biome lint .` — linter only, no formatter check against historical source.
- `pnpm format` — `biome format --write .` — formatter write only.
- `pnpm check` — `biome check --formatter-enabled=false .` — check/CI mode with formatter explicitly disabled; enforces linter without requiring mass-format.
- `pnpm check:fix` — `biome lint --write .` — safe linter writes only, no `--unsafe`, no formatter/assist.

All commands use Biome `2.5.10` (`biome lint`/`format`/`check`/`ci` flags `--formatter-enabled`, `--linter-enabled` are supported).

## Hooks and CI

- **Husky 9.1.7** + **lint-staged 17.3.0** (exact, pinned, satisfies 14-day `minimumReleaseAge`). `package.json` `prepare: husky` is safe in no-`.git` contexts (`.git` missing → `husky` prints `.git can't be found` and exits `0`, Docker build not failed). No global git config.
- **Hook:** `.husky/pre-commit` (executable) runs `pnpm exec lint-staged`.
- **lint-staged** (in `package.json`): `**/*.{js,jsx,ts,tsx,json,jsonc,css}` → `biome check --write --no-errors-on-unmatched` — official Biome recipe, no `--unsafe`, skips unmatched.
- **CI** (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile` → `pnpm run check` (honest, formatter-disabled) → `tsc --noEmit` → `tests` → `build`. Least permissions `contents: read`.

## React Compiler Warning Gap

**Uncovered rule:** `react-hooks/incompatible-library` / React Compiler warning is **not implemented in Biome**. The gap was previously reported under ESLint via `eslint-config-next` for:
- `react-hook-form` `watch()` usage
- TanStack `useReactTable` usage

**Mitigation:** TypeScript, existing tests, and `next build` surface compiler-related warnings, plus manual review of compiler output. This **does not recreate equivalent static lint coverage** for `incompatible-library`; a targeted complementary checker should be added when Biome or another tool provides that rule.
