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

### Requirement: Exclusive Single Status Filter

Estado MUST be a mutually exclusive single selection (`ServiceStatus` or all-status). The operator MUST NOT stack statuses. Selecting one status MUST replace any prior status. Selecting all-status MUST reset estado so the list is not status-filtered. The URL and `GET /api/services` status argument MUST carry at most one allowlisted status or omit/empty for all. The control MUST expose single-selection semantics (one selected option; keyboard activation selects and does not multi-toggle).

#### Scenario: One status replaces another

- GIVEN Dashboard with estado Pendiente
- WHEN the operator selects Listo
- THEN the list MUST match only Listo
- AND the URL/API MUST include a single status value, not a comma-joined list

#### Scenario: All-status reset

- GIVEN a selected status filter
- WHEN the operator selects all-status or equivalent reset
- THEN status MUST be absent or empty
- AND rows of every status MAY appear subject to other filters

#### Scenario: Accessible exclusive selection

- GIVEN the estado control is open
- WHEN the operator selects a status by pointer or keyboard
- THEN exactly one option MUST be selected
- AND a second status MUST NOT remain selected

### Requirement: Reachable Table Actions Across Viewports

Desktop Services table actions MUST remain reachable at 1280, 1366, and 1920 CSS px. If columns exceed the pane, the table MUST provide horizontal overflow with a usable right gutter so Acciones are not clipped. At 390 and 375 CSS px, the mobile card list MUST keep boleta, sede, ingreso, días, estado, and actions in view without page-level clip. Horizontal scroll of the table MUST NOT be required at 390/375.

#### Scenario: Actions reachable at 1280 and 1366

- GIVEN a populated Services table at 1280×800 or 1366×768
- WHEN the operator views a row
- THEN Acciones MUST be reachable without leaving the table region
- AND the rightmost control MUST NOT be clipped by overflow-hidden

#### Scenario: Actions reachable at 1920

- GIVEN a populated Services table at 1920×1080
- WHEN the row renders
- THEN Acciones MUST remain fully visible or reachable in the right gutter
- AND the table MUST use the shared large-screen content width

#### Scenario: Mobile card continuity at 390 and 375

- GIVEN a populated list at 390×844 or 375×667
- WHEN a card renders
- THEN boleta, sede, ingreso, días, estado, and actions MUST stay in viewport
- AND the page MUST NOT hide actions behind horizontal overflow

### Requirement: Separate Filter Toolbar

Search, sort, sede, and estado MUST live in a toolbar distinct from metric cards. The toolbar MUST NOT be presented as another metric card. Search, sort, sede, pagination, and query field names MUST keep current semantics except that estado MUST be exclusive single-select as specified in Exclusive Single Status Filter. This capability MUST NOT add schema or new query field names.

#### Scenario: Filters are separate from metrics

- GIVEN Dashboard with metrics and a list
- WHEN the operator changes search, sort, sede, or estado
- THEN only the toolbar control MUST apply that filter
- AND metric cards MUST stay non-interactive facts

#### Scenario: Query field names unchanged

- GIVEN an existing filter combination and page
- WHEN the operator changes a toolbar filter
- THEN matching and pagination MUST follow current dashboard behavior except exclusive estado
- AND no new query field name or schema MUST be introduced

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
