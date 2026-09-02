# Research: page-ui-redesign

```yaml
schema: gentle-ai.sdd-research/v1
revision: 2
change: page-ui-redesign
outcome: blocked
selected_questions:
  - id: Q1
    question: "Compact operational UI density and hierarchy patterns that remain legible and avoid generic admin-template aesthetics (p-4/gap-4/8px radius, non-template hierarchy)."
    status: unsupported
    reason: admission_denied
  - id: Q2
    question: "Dark-mode palette construction and WCAG contrast verification, including practical OKLCH constraints for a desaturated workshop/technical identity (Bodega Tecnica)."
    status: unsupported
    reason: admission_denied
  - id: Q3
    question: "Accessible exact-layout skeleton/loading patterns: aria-busy, reduced motion, shimmer fallback, and preserving populated context during refetch."
    status: unsupported
    reason: admission_denied
  - id: Q4
    question: "Bodega Tecnica identity seed necessitated by the confirmed rebrand: palette direction, type pairing constraints, logo/mark principles, iconography, and motion character — research must support decisions without fabricating a finished brand."
    status: unsupported
    reason: admission_denied
admission:
  requested:
    documentation:
      granted: false
      provider: none
      source_ids: []
    open_web:
      granted: false
      provider: none
      source_ids: []
  observed:
    documentation:
      granted: false
      provider: none
      source_ids: []
    open_web:
      granted: false
      provider: none
      source_ids: []
  capability_declaration: "gentle-ai.sdd-research-capability/v1"
  denial: "all_requested_classes_denied"
  partial_evidence: false
  inferred_capability: false
```

## 1. Retained Selected Intent (pre-source-access, canonical)

This research was explicitly selected for change `page-ui-redesign` (worktree `feat/page-ui-redesign`, artifactStore `openspec`, delivery `auto-chain`, review budget `800`).

This is a relaunch re-entry executed 2026-09-02 after user-requested relaunch of the mandatory SDD research phase. Prior blocked revision 1 state was read and preserved verbatim before any source access. Retained intent is unchanged.

**Incumbent read-only evidence (not mutated):**
- `PRODUCT.md` (PocketBase-only service lifecycle `pending -> ready -> completed|cancelled`, tenant isolation, workshop tool)
- `DESIGN.md` version alpha `Taller Claro Operacional` (variance 3 / motion 2 / density 6, zinc/ink `#2F5B8A`, Fira Sans/Code, `p-4 gap-4 rounded-sm 8px`)
- `openspec/changes/page-ui-redesign/exploration.md` (2026-09-01 authenticated read-only audit, preserved verbatim per instruction — not rewritten in this revision)

**Confirmed pre-proposal handoff (supersedes Taller Claro as future visual authority, current files remain read-only during research):**
- Direction: Bodega Tecnica (Operate+ hierarchy reform). Replace visual identity rather than merely correcting Taller Claro.
- Preserve dark mode and verify contrast.
- Separate metrics from filters; metric cards are informational and non-interactive.
- At 390px prioritize operational context: boleta, sede, ingreso, dias, estado, and actions; product may be summarized.
- Promote Registro as second primary surface after Dashboard.
- Enforce 13px minimum typography floor.
- Use compact operational rhythm: p-4, gap-4, 8px default radius.
- Empty/error states provide contextual actions and Spanish-constant user-facing errors.
- Create new brand identity/assets rather than retaining only current icon.
- Execution mode: automatic. Artifact store: OpenSpec. Delivery strategy: auto-chain. Review budget: 800 changed lines.
- These decisions are CONFIRMED. No interview or alternative inference was performed in revision 1 or in this relaunch.

**Requested research lanes (four, auditable source-backed evidence required):**
1. Compact operational UI density and hierarchy patterns (Q1)
2. Dark-mode palette and WCAG contrast with OKLCH constraints for desaturated workshop identity (Q2)
3. Accessible exact-layout skeleton/loading patterns with aria-busy, reduced motion, shimmer fallback (Q3)
4. Bodega Tecnica identity seed: palette direction, type pairing, logo/mark, iconography, motion character (Q4)

**Canonical desired content retained before any source access:**
Source-backed evidence that would support a future `proposal.md`/`design.md` for Bodega Tecnica covering: (a) density/hierarchy references showing `p-4/gap-4/8px` remains legible without admin-template signals, (b) OKLCH-derived dark palette construction with computed WCAG AA/AAA contrast, (c) Boneyard/aria-busy/reduced-motion/shimmer pattern references, (d) desaturated technical identity seeds that do not fabricate a finished brand. This intent is retained in memory for blocked recovery without deriving claims from it. Relaunch re-verified this intent before admission check.

## 2. Admission Verification (exact grants)

Runtime capability declaration received: `gentle-ai.sdd-research-capability/v1` with `documentation=[]; open-web=[]`.

- Persistence tools (Engram `mem_*`, filesystem `Read/Write`) are **not** evidence grants per execution prompt and must not be inferred as such. No evidence capability was inferred from Bash, MCP, persistence, or filenames.
- Requested classes for all four questions require `documentation` and/or `open-web` authority (all four lanes are source-backed external standards, palette science, and a11y specifications).
- Verification result: **denied — zero exact grants match any requested class**. Per Hard Rule: `Admit only gentle-ai.sdd-research-capability/v1 with exact declared grants for documentation or open-web` and `Unsupported or undeclared classes deny admission and emit no claims`.
- Relaunch re-attempt 2026-09-02 confirms identical denial as revision 1. No inference from tool permissions was made. No proposal to change the agent was made.

No source access was attempted beyond admission check, per Execution Step 2 (stop on denial). No webfetch, Context7, or ctx_fetch_and_index calls were made under evidence authority in revision 1 or in this relaunch.

## 3. Sources

| id | class | title | publisher | URL | accessed_at | authority |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

No sources admitted. Admission denial produces no source claims. No excerpts, URLs, or titles are recorded. Persistence layer access (file reads of `PRODUCT.md`/`DESIGN.md`/`exploration.md`) is incumbent evidence for context only and is not recorded as a source grant. Relaunch preserved this invariant.

## 4. Validated Claims

| claim_id | claim | source_ids | excerpt_refs |
|---|---|---|---|
| — | — | — | — |

No validated claims emitted. Per lifecycle contract: `partial or blocked outcomes MUST exclude unvalidated claims. Admission denial produces no source claims.` All four questions remain `unsupported`. Relaunch re-attempt produced no additional claims.

## 5. Contradictions, Uncertainty, and Freshness

**Contradictions:** None recorded. No sources were admitted, so no contradiction between sources and incumbent `DESIGN.md`/`PRODUCT.md` can be validated. Any apparent tension between Taller Claro (current DESIGN.md) and Bodega Tecnica (confirmed future authority) is a product decision, not an evidence contradiction, and is kept separate per Hard Rule. Relaunch confirms no new contradiction.

**Uncertainty:** High and explicit for all lanes. Without admitted `documentation` or `open-web` sources:
- Q1 uncertainty: Cannot cite authoritative density/hierarchy patterns; incumbent `exploration.md` diagnosis remains the only in-repo signal but is not external evidence.
- Q2 uncertainty: Cannot verify OKLCH desaturated dark construction or WCAG contrast ratios without authoritative color-science and accessibility specifications.
- Q3 uncertainty: Cannot verify aria-busy/reduced-motion/shimmer fallback patterns against WCAG/ARIA specifications without documentation grants.
- Q4 uncertainty: Cannot cite palette/type/logo/iconography/motion identity seeds without external brand/design-system authorities; must not fabricate a finished brand.
- Relaunch does not reduce uncertainty; it reaffirms it under identical denial.

**Freshness:** Not applicable. No sources accessed; no `accessed_at` to report. Retained intent timestamp: 2026-09-01 (exploration status) and 2026-09-02 (research revision 1 execution) and 2026-09-02 (this relaunch revision 2 execution). Re-validate freshness on next re-entry after grants are restored.

## 6. Evidence-Only Conclusion (no claims)

No evidence-only conclusion is admitted. The four lanes remain unsupported pending exact grant re-declaration and re-execution. Incumbent read-only files (`PRODUCT.md`, `DESIGN.md`, `exploration.md`) remain the only in-repo context for the next phase, but they do not substitute for the requested source-backed evidence. Relaunch conclusion is identical to revision 1.

## 7. Product Choices — Separate from Evidence (Non-Authoritative)

The confirmed handoff decisions listed in Section 1 are **not** evidence claims and are not validated by this research. They are retained as orchestrator-owned product truth to be carried into `sdd-propose` only after research reaches `done`. No alternative directions are inferred, and no new palette/type/logo recommendation is made here. Any future proposal must map Bodega Tecnica choices to admitted sources once grants exist; until then, proposal readiness is blocked. Relaunch preserved this separation without modification.

---

*Persistence: `gentle-ai.sdd-research/v1` revision 2, outcome `blocked`, admission denied (documentation `[]`, open-web `[]`), zero sources, zero validated claims. Retained intent and canonical desired content preserved for blocked recovery without source claims. Exploration preserved verbatim at `openspec/changes/page-ui-redesign/exploration.md`. Relaunch 2026-09-02 re-attempted all four lanes under identical denial; no source claims emitted per fail-closed contract.*

## 8. References for Next Phase

- Incumbent evidence (read-only): `PRODUCT.md`, `DESIGN.md`, `openspec/changes/page-ui-redesign/exploration.md`
- Confirmed handoff: Direction Bodega Tecnica (Operate+ hierarchy reform), rebrand replacement, dark-mode preservation, metric/filter separation, 390px operational priority, Registro promotion, 13px floor, p-4/gap-4/8px rhythm, Spanish-constant errors, new brand assets, auto-chain/800 budget
- Blocked lanes: Q1 density/hierarchy, Q2 dark/OKLCH/WCAG, Q3 skeleton/aria-busy/reduced-motion, Q4 identity seed
- Recovery requires: re-declaration of `gentle-ai.sdd-research-capability/v1` with exact `documentation` and/or `open-web` grants covering Q1-Q4, then re-entry of `sdd-research` with retained intent
