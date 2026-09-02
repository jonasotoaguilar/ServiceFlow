# Proposal: Page UI Redesign

## Intent

Operators lack a reading path: metrics act as filters, craft drifts, Registro is third-rank, and 390px hides context. Replace Taller Claro as future visual authority with Bodega Técnica (Operate+). Lifecycle, tenant isolation, and audit writes stay unchanged.

## Scope

### In Scope
- Bodega Técnica identity and new brand assets (not the current icon alone)
- Non-interactive metric cards; separate filter toolbar
- 390px: boleta, sede, ingreso, días, estado, actions; product may be summarized
- Registro as second primary after Dashboard
- 13px floor; `p-4`/`gap-4`/8px; dark theme with contrast proof
- Empty/error states with Spanish-constant contextual actions

### Out of Scope
- Backend, schema, batch writes, RUT, pagination, query semantics
- Source-backed palette/type/logo claims (research deselected 2026-09-01)
- Fabricated brand assets; mutating `PRODUCT.md`/`DESIGN.md` before Archive
- Direction 1 and Direction 3

## Capabilities

### New Capabilities
- `bodega-tecnica-identity`: Future visual authority; new mark/assets; 13px floor; dark contrast. No research-derived palette/type authority.
- `dashboard-operate-plus`: Headline-led dashboard; metrics are facts; filters are a toolbar; confirmed 390px column priority.
- `registro-primary-surface`: Registro is nav rank 2; empty/error recovery with Spanish-constant actions.

### Modified Capabilities
- None

## Approach

Apply exploration Direction 2. Hierarchy via scale and grouping, not `border-l-4`. Keep shell, Boneyard `aria-busy`, dialog a11y, and icon+text badges. Design derives identity from product meaning and the audit only. Auto-chain under the 800-line budget.

## Affected Areas

- `components/services/ServicesDashboard.tsx` — Modified — metric/filter split
- `components/services/ServicesTable.tsx` — Modified — 390px columns
- `app/(app)/service-events/serviceEventsManager.tsx` — Modified — rank-2, empty/error
- `components/layout/Navbar.tsx` — Modified — nav rank, brand mark
- `styles/globals.css` — Modified — tokens; dark contrast
- `app/(app)/locations/locationsManager.tsx` — Modified — shared craft floor
- `DESIGN.md` — Deferred — read-only until Archive

## Risks

- Dark contrast unproven — High — computed AA/AAA; no invented OKLCH claims
- Identity fabrication — Med — assets in design, not here
- Review budget overrun — Med — auto-chain slices
- PocketBase batch 500 — Low — no API change

## Rollback Plan

Revert the feature branch and stacked PRs. No schema changes. Restore prior tokens, Navbar mark, and page components.

## Dependencies

- Handoff revision 3; `exploration.md`; `research.md` rev 2 historical only; `registro-filter-visibility` preserved

## Success Criteria

- [ ] Bodega Técnica is future visual authority; Taller Claro incumbent-only
- [ ] Metrics non-interactive; filters separate; Registro second primary after Dashboard
- [ ] 390px keeps boleta, sede, ingreso, días, estado, actions in viewport
- [ ] 13px floor; `p-4`/`gap-4`/8px; dark contrast verified
- [ ] Empty/error Spanish-constant with contextual actions
- [ ] New brand assets ship; no claims from blocked research
