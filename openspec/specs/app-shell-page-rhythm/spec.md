# App Shell Page Rhythm Specification

## Purpose

Services, Registry, and Locations share one large-screen content width and a common title/vertical rhythm. Locations aligns with the other two pages.

## Requirements

### Requirement: Shared Large-Screen Content Width

Authenticated `main` MUST use the same max content width on Dashboard, Registro, and Locations. At 2xl (1536px+) that width MUST be wider than `max-w-7xl` (documented 1600px target) so 1920×1080 does not leave unused side gutters while 1280 still fits. Below 2xl, existing `px-4 sm:px-6 lg:px-8` gutters MUST remain.

#### Scenario: Three pages share 2xl width

- GIVEN authenticated Dashboard, Registro, and Locations at 1920×1080
- WHEN each page renders
- THEN content columns MUST share the same max width
- AND that width MUST be the documented 2xl shell, not three different caps

#### Scenario: 1280 shell still fits

- GIVEN the same routes at 1280×800
- WHEN each page renders
- THEN content MUST remain within the viewport without horizontal page overflow
- AND 2xl widening MUST NOT apply

### Requirement: Shared Title And Vertical Rhythm

Page titles MUST use the same type rhythm: `text-2xl font-semibold tracking-tight` (or equivalent computed result). Headline-to-toolbar spacing MUST match across the three pages. Locations MUST NOT keep a divergent `text-xl font-bold` title or mismatched header/toolbar vertical gaps.

#### Scenario: Locations title matches peers

- GIVEN Locations, Dashboard, and Registro
- WHEN headlines render
- THEN Locations title size, weight, and tracking MUST match the other two
- AND the header-to-toolbar gap MUST match the shared band

#### Scenario: Toolbar band rhythm

- GIVEN each page toolbar
- WHEN spacing is compared
- THEN vertical padding and surface/border treatment MUST follow the shared operate band
- AND Locations MUST NOT use a one-off denser or looser header stack
