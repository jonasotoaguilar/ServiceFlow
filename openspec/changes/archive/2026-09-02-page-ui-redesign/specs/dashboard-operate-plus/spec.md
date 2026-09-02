# Dashboard Operate Plus Specification

## Purpose

Dashboard becomes a headline-led Operate+ reading path. Metrics are facts. Filters are a separate toolbar. At 390px, operational context stays in view. Data and query behavior stay unchanged.

## Requirements

### Requirement: Headline-Led Dashboard

The dashboard MUST lead with a headline band before metrics, filters, and the table. The band MUST include the Servicios title, count context, and the primary create action. Metric cards MUST NOT compete as equal-weight page chrome with that band.

#### Scenario: Headline precedes metrics

- GIVEN an authenticated operator opens Dashboard
- WHEN the page first paints
- THEN the headline band MUST appear before metric cards
- AND it MUST include Servicios, count context, and Nuevo servicio

#### Scenario: Create remains reachable at 390px

- GIVEN a 390px-wide viewport
- WHEN Dashboard renders
- THEN Nuevo servicio MUST remain on-screen without horizontal page overflow

### Requirement: Informational Non-Interactive Metrics

Metric cards MUST be informational facts. They MUST NOT be buttons, links, toggles, or filter controls. Activating a metric MUST NOT change status, sede, search, sort, or the list query.

#### Scenario: Metrics do not filter

- GIVEN visible metric cards and an unfiltered or filtered list
- WHEN the operator activates a metric card
- THEN no filter value MUST change
- AND the list MUST NOT requery because of that activation

#### Scenario: Keyboard does not treat metrics as controls

- GIVEN keyboard-only use
- WHEN the operator tabs the metric region
- THEN metric cards MUST NOT be focusable controls
- AND filter controls MUST remain in the toolbar

### Requirement: Separate Filter Toolbar

Search, sort, sede, and estado MUST live in a toolbar distinct from metric cards. The toolbar MUST NOT be presented as another metric card. Filter matching, pagination, and query fields MUST keep current semantics. This capability MUST NOT add backend, schema, or query changes.

#### Scenario: Filters are separate from metrics

- GIVEN Dashboard with metrics and a list
- WHEN the operator changes search, sort, sede, or estado
- THEN only the toolbar control MUST apply that filter
- AND metric cards MUST stay non-interactive facts

#### Scenario: Query semantics unchanged

- GIVEN an existing filter combination and page
- WHEN the operator changes a toolbar filter
- THEN matching and pagination MUST follow current dashboard behavior
- AND no new query field or schema MUST be introduced

### Requirement: 390px Operational Column Priority

At a 390px-wide viewport the dashboard list MUST keep boleta, sede, ingreso, días, estado, and actions in view. Product MAY be summarized. The page MUST NOT hide actions behind horizontal overflow.

#### Scenario: Priority fields remain in viewport

- GIVEN Dashboard list at 390×844 with at least one row
- WHEN the row renders
- THEN boleta, sede, ingreso, días, estado, and actions MUST be in the viewport
- AND product MAY be truncated or summarized

#### Scenario: Empty list does not drop operational chrome

- GIVEN Dashboard at 390px with zero rows after filters
- WHEN the empty state renders
- THEN the headline band and filter toolbar MUST remain
- AND the empty copy MUST stay Spanish-constant

### Requirement: Preserved Loading Overlay

Initial empty load MUST keep Boneyard exact-layout skeletons. Populated refetch MUST keep `aria-busy` overlay without swapping in a spinner-only page.

#### Scenario: Populated refetch keeps rows

- GIVEN a populated dashboard list
- WHEN a toolbar filter refetch starts
- THEN existing rows MUST remain visible under `aria-busy`
- AND the stats region MUST NOT collapse to a non-Boneyard spinner-only layout
