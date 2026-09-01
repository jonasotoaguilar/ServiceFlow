---
version: alpha
name: "Taller Claro Operacional"
description: "Minimal luminoso y denso — Operate mode for technicians and managers doing rapid scanning and repetitive workflows."
colors:
  # Primitives — zinc neutrals
  zinc-50: "#fafafa"
  zinc-100: "#f4f4f5"
  zinc-200: "#e4e4e7"
  zinc-300: "#d4d4d8"
  zinc-500: "#71717a"
  zinc-600: "#52525b"
  zinc-700: "#3f3f46"
  zinc-900: "#18181b"
  white: "#ffffff"
  # Primitive — desaturated ink accent (verified contrast 7.04:1 on white)
  slate-blue-700: "#2F5B8A"
  slate-blue-600: "#3a6fa3"
  slate-blue-50: "#eff6ff"
  # Primitives — status hues (raw)
  amber-500: "#d97706"
  amber-50: "#fef3c7"
  amber-800: "#92400e"
  blue-600: "#2563eb"
  blue-50: "#dbeafe"
  blue-800: "#1e40af"
  emerald-600: "#059669"
  emerald-50: "#d1fae5"
  emerald-800: "#065f46"
  red-600: "#dc2626"
  red-50: "#fee2e2"
  red-800: "#991b1b"
  # Semantic — app surfaces (light default)
  background: "#fafafa"
  surface: "#ffffff"
  surface-muted: "#f4f4f5"
  foreground: "#18181b"
  foreground-muted: "#52525b"
  foreground-subtle: "#71717a"
  border: "#e4e4e7"
  border-strong: "#d4d4d8"
  focus: "#2F5B8A"
  # Semantic — interactive
  primary: "#2F5B8A"
  on-primary: "#ffffff"
  primary-hover: "#264a71"
  secondary: "#f4f4f5"
  on-secondary: "#18181b"
  # Semantic — status (accessible tinted bg + darker fg, icon + text required)
  pending-bg: "#fef3c7"
  pending-fg: "#92400e"
  pending-border: "#fcd34d"
  ready-bg: "#dbeafe"
  ready-fg: "#1e40af"
  ready-border: "#93c5fd"
  completed-bg: "#d1fae5"
  completed-fg: "#065f46"
  completed-border: "#6ee7b7"
  cancelled-bg: "#fee2e2"
  cancelled-fg: "#991b1b"
  cancelled-border: "#fca5a5"
  # Semantic — skeleton / loading
  skeleton-base: "#e4e4e7"
  skeleton-shimmer: "#f4f4f5"
  overlay: "rgba(24, 24, 27, 0.04)"
typography:
  display:
    fontFamily: "Fira Sans"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h2:
    fontFamily: "Fira Sans"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: "Fira Sans"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: "Fira Sans"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Fira Sans"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Fira Sans"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  label-strong:
    fontFamily: "Fira Sans"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  mono-data:
    fontFamily: "Fira Code"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  mono-sm:
    fontFamily: "Fira Code"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Fira Sans"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-strong}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "16px"
  card-muted:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "10px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  navbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    height: "64px"
  table-header:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground-muted}"
    typography: "{typography.label}"
  badge-pending:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending-fg}"
    rounded: "{rounded.full}"
  badge-ready:
    backgroundColor: "{colors.ready-bg}"
    textColor: "{colors.ready-fg}"
    rounded: "{rounded.full}"
  badge-completed:
    backgroundColor: "{colors.completed-bg}"
    textColor: "{colors.completed-fg}"
    rounded: "{rounded.full}"
  badge-cancelled:
    backgroundColor: "{colors.cancelled-bg}"
    textColor: "{colors.cancelled-fg}"
    rounded: "{rounded.full}"
  skeleton:
    backgroundColor: "{colors.skeleton-base}"
    textColor: "{colors.foreground}"
---

## Overview

Taller Claro Operacional is an **Operate**-mode system. The audience is technicians and managers performing repetitive operational tasks that require rapid scanning, reliable state recognition, and low cognitive overhead across many daily repetitions. The surface is a tool, not a gallery — familiarity and predictability are features.

Atmosphere: restrained, workshop-bright, compact, and quietly precise — like a well-lit service workshop with white walls, zinc shelving, and ink-blue signage. Density is deliberately **compact (6)**, variance is **low (3)**, motion is **minimal (2)**. The system prioritizes legibility at 14px, tight but breathable stacks, and a single ink accent over decoration.

Physical scene that forces the palette: bright interior workshop under neutral daylight, off-white walls and white work surfaces, zinc fixtures, ink-blue stenciled type. This forces light by default. Dark counterpart may exist later but is not the implementation target for this change.

Dials for this change: **variance 3 / motion 2 / density 6**. Variance 3 keeps symmetry and repeated patterns. Motion 2 limits transitions to 150-200ms transform/opacity only. Density 6 establishes card `p-4` / `gap-4` and table `px-4` `py-3` as the compact operational rhythm.

Product truth preserved: PocketBase-backed warranties, locations (Sedes), and Registro history. Visual redesign does not change business rules, only how state, density, and hierarchy are read.

## Colors

The palette is Restrained: neutrals plus one desaturated ink accent. No gradients. Three token layers are defined in YAML above and materialized as CSS variables by implementers.

### Primitive tokens — raw values (Layer 1)

Do not use primitives directly in components. Map through semantics.

- **Zinc-50 (#fafafa)** — off-white page ground, primitive warm-light neutral, never pure clinical blue-white
- **White (#ffffff)** — card and dialog surface primitive
- **Zinc-100 (#f4f4f5)** — muted surface primitive for table headers and subtle fills
- **Zinc-200 (#e4e4e7)** — hairline border primitive (1px structure)
- **Zinc-300 (#d4d4d8)** — strong border primitive for dividers needing slightly more weight
- **Zinc-500 (#71717a)** — subtle foreground primitive for tertiary/meta text
- **Zinc-600 (#52525b)** — muted foreground primitive for secondary body
- **Zinc-700 (#3f3f46)** — not used for text on light; reserved if needed for future dark counterpart
- **Zinc-900 (#18181b)** — charcoal ink, primary text primitive, never `#000`
- **Slate-Blue-700 (#2F5B8A)** — desaturated ink accent primitive, sole accent hue, saturation < 80%
- **Slate-Blue-600 (#3a6fa3)** — accent hover/pressed step derived from primitive
- **Slate-Blue-50 (#eff6ff)** — accent tint for focus rings and subtle active fills
- **Amber-500 (#d97706)** — status raw amber for pending
- **Amber-50 (#fef3c7)** — pending tint
- **Amber-800 (#92400e)** — pending accessible text on tint
- **Blue-600 (#2563eb)** — status raw blue for ready
- **Blue-50 (#dbeafe)** — ready tint
- **Blue-800 (#1e40af)** — ready accessible text on tint
- **Emerald-600 (#059669)** — status raw emerald for delivered/completed
- **Emerald-50 (#d1fae5)** — delivered tint
- **Emerald-800 (#065f46)** — delivered accessible text on tint
- **Red-600 (#dc2626)** — status raw red for cancelled
- **Red-50 (#fee2e2)** — cancelled tint
- **Red-800 (#991b1b)** — cancelled accessible text on tint

### Semantic tokens — purpose aliases (Layer 2)

Implementers switch themes by remapping semantics, not primitives. Dark counterpart may exist later under `[data-theme="dark"]` or `dark:` overrides, but current implementation ships only light.

- **Background (#fafafa)** — page ground, `{colors.background}` maps to `{colors.zinc-50}`, role: viewport fill
- **Surface (#ffffff)** — card/dialog/table surface, `{colors.surface}` maps to `{colors.white}`
- **Surface-Muted (#f4f4f5)** — table header and subtle panel fill, `{colors.surface-muted}` maps to `{colors.zinc-100}`
- **Foreground (#18181b)** — primary text, `{colors.foreground}` maps to `{colors.zinc-900}`, contrast 17.72:1 on `#ffffff` and 16.97:1 on `#fafafa`, AAA
- **Foreground-Muted (#52525b)** — secondary body, `{colors.foreground-muted}` maps to `{colors.zinc-600}`
- **Foreground-Subtle (#71717a)** — tertiary/meta/disabled, `{colors.foreground-subtle}` maps to `{colors.zinc-500}`
- **Border (#e4e4e7)** — 1px hairline, `{colors.border}` maps to `{colors.zinc-200}`
- **Border-Strong (#d4d4d8)** — emphasized divider, `{colors.border-strong}` maps to `{colors.zinc-300}`
- **Focus (#2F5B8A)** — focus ring and active accent, `{colors.focus}` maps to `{colors.slate-blue-700}`
- **Primary (#2F5B8A)** — sole interaction color, `{colors.primary}` maps to `{colors.slate-blue-700}`, verified contrast 7.04:1 on white and 6.74:1 on `#fafafa`, AAA for white text on primary
- **On-Primary (#ffffff)** — text on primary, `{colors.on-primary}` maps to `{colors.white}`
- **Primary-Hover (#264a71)** — pressed/hover step, darker ink than primitive
- **Secondary (#f4f4f5)** — secondary button and muted fill, `{colors.secondary}` maps to `{colors.zinc-100}`
- **On-Secondary (#18181b)** — text on secondary
- **Skeleton-Base (#e4e4e7)** — skeleton bone fill, `{colors.skeleton-base}` maps to `{colors.zinc-200}`
- **Skeleton-Shimmer (#f4f4f5)** — skeleton highlight, `{colors.skeleton-shimmer}` maps to `{colors.zinc-100}`
- **Overlay (rgba(24,24,27,0.04))** — loading overlay wash for `aria-busy` refetch state, derived from zinc-900 at 4%

Status semantics are always paired tint + darker text + hairline border, plus icon + text in the UI. Never color only.

- **Pending-Bg (#fef3c7)** / **Pending-Fg (#92400e)** / **Pending-Border (#fcd34d)** — pending warranty, amber family, text-on-tint contrast 6.37:1, AA
- **Ready-Bg (#dbeafe)** / **Ready-Fg (#1e40af)** / **Ready-Border (#93c5fd)** — ready for delivery, blue family, contrast 7.15:1, AA
- **Completed-Bg (#d1fae5)** / **Completed-Fg (#065f46)** / **Completed-Border (#6ee7b7)** — delivered, emerald family, display label `Entregada`, storage enum remains `completed`, contrast 6.78:1, AA
- **Cancelled-Bg (#fee2e2)** / **Cancelled-Fg (#991b1b)** / **Cancelled-Border (#fca5a5)** — cancelled, red family, contrast 6.80:1, AA

Banned: purple/violet neon, `#000000`, mixed warm/cool gray families, electric-blue `#3b82f6` as primary button, accent saturation over 80%, decorative gradients, glow orbs, glassmorphism, `backdrop-blur`, dynamic Tailwind color interpolation such as `bg-{color}-500/10` constructed at runtime, and decorative left-border cards as the only status signal.

## Typography

One workhorse sans plus one monospace companion. Fixed scale, not fluid `clamp()`. No display serif in operational UI.

Typography tokens are defined in YAML under `typography.*`. Component tokens reference them via `{typography.*}`.

- **Families (Layer 1 primitives materialized as CSS variables):**
  - Sans: `Fira Sans` via `next/font/google` (`--font-fira-sans`), weights 300/400/500/600/700 already installed. Fallbacks: `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.
  - Mono: `Fira Code` via `next/font/google` (`--font-fira-code`), weights 400/500/600 already installed. Fallbacks: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
  - Do not add a new font package. If Fira families are unavailable, fall back to system stack above.

- **Scale (Layer 2 semantic roles):**
  - **Display (#1.875rem / 30px, 600, -0.015em, 1.2)** — page titles, `typography.display`
  - **H2 (#1.5rem / 24px, 600, 1.25)** — section titles, `typography.h2`
  - **H3 (#1.25rem / 20px, 600, 1.3)** — card and dialog titles, `typography.h3`
  - **Body-MD (#0.875rem / 14px, 400, 1.6)** — default body, `typography.body-md`
  - **Body-SM (#0.8125rem / 13px, 400, 1.5)** — secondary rows and helper text, `typography.body-sm`
  - **Label (#0.8125rem / 13px, 500, 0.01em, 1.4)** — form labels, table headers, badges, card descriptors; medium weight, never `10px tracking-widest`, `typography.label`
  - **Label-Strong (#0.8125rem / 13px, 600, 1.4)** — primary button and emphasized inline actions, `typography.label-strong`
  - **Mono-Data (#0.8125rem / 13px, 400, 1.5, Fira Code)** — operational data: RUT, SKU, currency, dates, log identifiers, `typography.mono-data`
  - **Mono-SM (#0.75rem / 12px, 400, 1.5, Fira Code)** — compact meta in tables when density demands it, `typography.mono-sm`
  - **Caption (#0.75rem / 12px, 400, 1.4)** — captions and footnotes only, not labels, `typography.caption`

- **Rules:**
  - Ratio between steps is 1.125-1.2 (operate-tight). No fluid display sizing.
  - Prose measure 65-75ch; data tables may run to 120ch.
  - Labels are at least 13px medium; `text-xs uppercase tracking-widest` at 10-11px is banned as a label pattern except for `caption` footnotes.
  - Operational data (RUT, SKU, repairCost, entryDate/deliveryDate/readyDate/cancellationDate, log identifiers) always uses `mono-data` or `mono-sm` so characters align and scan without re-reading.
  - Banned: Inter as display in premium contexts (not relevant here but kept), generic serif (Times, Georgia, Garamond, Palatino) in dashboard, distinctive editorial serif, custom cursor type.

## Layout

Layout is CSS Grid and flex with a strict operational rhythm. No `calc(33% - 1rem)`. Use Tailwind grid utilities with semantic spacing tokens.

- **Shell constraint:** `max-w-7xl` (1280px) centered via `mx-auto`. Single source of gutter truth: `px-4 sm:px-6 lg:px-8` and `py-8`. No outer padded wrapper (`p-4 md:p-8`) around the authenticated shell. One shared layout owns Navbar placement and gutters.
- **Density (6):** Content is deliberately compact. Card rhythm is `p-4` with `gap-4` internal stacks. Table rhythm is `px-4` horizontal and `py-3` vertical. Toolbar rows are `gap-3` to `gap-4`. Section gap is `gap-6` between card groups, not `gap-8` or `p-6`.
- **Grid:** Dashboard metrics use `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5` or equivalent; gaps `gap-4`. No three equal feature cards as hero; metrics are controls, not marketing.
- **Full height:** `min-height: 100dvh`, never `100vh`.
- **Containers:** Cards use `gap-4` vertical stacks (`space-y-4`). Filters and toolbars use `flex flex-wrap gap-3`. Tables live in an `overflow-x-auto` wrapper with no extra outer card padding doubling.
- **Gutter divergence banned:** `px-6 py-10` versus `px-4 lg:px-8 py-8` mixed across routes is forbidden. Normalize to `px-4 sm:px-6 lg:px-8 py-8`.

## Elevation & Depth

Elevation marks hierarchy only. No decorative blur.

- **Borders:** 1px hairline `border border-zinc-200` (`{colors.border}`) on cards, tables, inputs, and dialogs. `border-strong` only for active filter indication or table outer ring when needed.
- **Shadows:** Minimal tinted shadows for true elevation only. Allowed: card/dialog elevation `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)`. Disallowed: `shadow-lg` as default, neon glow, colored outer shadow. Flat cards with hairline border and no shadow are valid when hierarchy is already established by layout.
- **Layering:** Navbar at `z-40`, dialogs and overlays above, toasts above dialogs. No `z-50` or `z-10` spam; z-index is systemic.
- **Glass forbidden:** `glass-card`, `glass-effect`, `backdrop-blur-xl`, `bg-white/5`, `border-white/10`, `glow-orb`, and any `radial-gradient` glow are removed, not blended with the new system.

## Shapes

Radius is locked to the operational range.

- **Sm (8px, `{rounded.sm}`)** — buttons, inputs, cards, table wrapper, badges wrapper
- **Md (10px, `{rounded.md}`)** — alternative when two radii are needed to show parent/child nesting, but both stay in 8-10px band
- **Lg (12px, `{rounded.lg}`)** — dialogs and large overlays only. `rounded-xl` is reserved for dialogs; it is banned on cards, buttons, and inputs.
- **Full (9999px, `{rounded.full}`)** — status badges (pills) and icon-only round buttons
- Do not mix undocumented radii such as `rounded-2xl` or `rounded-3xl`. Do not invent `rounded-[14px]` outside YAML.

## Components

Component tokens are Layer 3. They reference semantic tokens via `{colors.*}`, `{rounded.*}`, `{typography.*}` and are the only values components may use. Prose describes visible behavior.

- **Button-Primary:** `{colors.primary}` on `{colors.on-primary}`, `{rounded.sm}`, `typography.label-strong`, `px-4 py-2.5`, no gradient. Hover is `{colors.primary-hover}`. Active is `scale(0.98)` or `translateY(-1px)` in prose, not a separate color. Focus is 2px `ring` in `{colors.focus}`. Never electric-blue saturated gradient or glow.
- **Button-Primary-Hover:** sibling token `{colors.primary-hover}` on `{colors.on-primary}`, `{rounded.sm}`.
- **Button-Secondary / Ghost:** `{colors.secondary}` on `{colors.on-secondary}` or transparent ghost with `border border-zinc-200`, same type and radius. Hover is fill shift to `zinc-100`, never glow.
- **Card:** `{colors.surface}` on `{colors.foreground}`, `{rounded.sm}`, `padding 16px` (`p-4`), `border border-zinc-200`, minimal shadow or none, internal stack `gap-4`. No `glass-card p-6 border-l-4`. Status is not a single left border; badges inside the card carry status (icon + text).
- **Card-Muted:** `{colors.surface-muted}` variant for header summaries or subtle grouping.
- **Input:** `{colors.surface}` on `{colors.foreground}`, `{rounded.sm}`, `padding 10px` (`px-4 py-2.5`), `border border-zinc-200`, focus `ring 2px {colors.focus}` + `border {colors.focus}`. Label above via `typography.label`, error below in `{colors.cancelled-fg}`. No floating labels, gap `0.5rem` between label and field.
- **Dialog:** `{colors.surface}` on `{colors.foreground}`, `{rounded.lg}` (12px, the only place `rounded-xl` maps), `padding 24px` (`p-6`), `border border-zinc-200`, overlay `rgba(24,24,27,0.04)` or standard `bg-black/30` at most 30% opacity. Semantics `role="dialog"` + `aria-modal="true"`, focus trap, `Esc` to close, focus returns to trigger. Max `90dvh` with `overflow-y-auto`.
- **Navbar:** `{colors.surface}` on `{colors.foreground}`, `height 64px`, `border-b border-zinc-200`, no `backdrop-blur`, no `bg-background/50`. Sticky `top-0`. Internal max-width and gutters reuse shell tokens.
- **Table-Header:** `{colors.surface-muted}` on `{colors.foreground-muted}`, `typography.label`, `px-4 py-3`, `border-b border-zinc-200`, sticky header where needed.
- **Table cells:** `px-4 py-3`, `typography.body-md` for names, `typography.mono-data` for RUT/SKU/currency/dates. Row hover `bg-zinc-50`. Dividers `border-b border-zinc-200` on rows only (one direction).
- **Badge-Pending / Badge-Ready / Badge-Completed / Badge-Cancelled:** component tokens map to status semantic pairs above, `typography.label`, `rounded.full`, `px-2.5 py-1`, `border` in status border token, `inline-flex items-center gap-1.5` with 14px icon + text. Pending amber, ready blue, delivered/completed emerald with display text `Entregada` (storage `completed`), cancelled red. Never color only; verify via axe that icon or text alone still conveys status in monochrome.
- **Skeleton:** `{colors.skeleton-base}` fill, highlight `{colors.skeleton-shimmer}`, no primary accent. Used only via Boneyard wrapper; see Loading & Skeletons.

Hover/active/pressed/disabled are sibling component states, not inline dynamic colors. Active filter indication uses `border-strong` or `bg-zinc-100` with ink accent, not a fourth accent color.

Loaders are skeletons matching layout, not circular spinners. Empty states compose guidance with an action, not bare `No se encontraron registros` alone.

## Do's and Don'ts

- Do bind every hex in prose to a YAML token. Prose names include Name + value + role and must not contradict YAML.
- Do use the three layers: primitive raw → semantic alias → component reference via `{path}`. Never use a raw hex in component code.
- Do keep Operate discipline: one type family + mono companion, fixed scale, compact density, predictable patterns screen to screen.
- Do use icon + text for status, tinted bg + dark text for badges, 1px hairlines, minimal shadows, 8-10px radii, 44px touch targets, zoom allowed, visible focus.
- Do not invent colors, radii, or spacing beside this file.
- Don't: glassmorphism, `backdrop-blur`, glow orbs, decorative gradients or gradient text, electric-blue `#3b82f6` saturated primary buttons, ubiquitous `rounded-xl` on cards, dynamic Tailwind interpolation (`bg-${color}-500/10`, `border-${status}!`), decorative left-border cards as the only status signal, emoji in operational UI, Inter as display default without reason, generic serif in dashboards, `#000`, neon, overlapping text/image, three equal marketing cards, scroll-bait copy, John Doe / Acme / Nexus / SmartFlow placeholders, Elevate / Seamless / Unleash marketing verbs, custom cursors, `h-screen` layout, `z-index` spam, `maximum-scale=1, user-scalable=no`, fake product UIs built from divs, version labels in hero, section-number eyebrows like `00 / INDEX`, middle-dot `·` overuse, em-dash `—` as decoration, border-t + border-b on every row, `window.addEventListener("scroll")` motion, or layout animation on `width`/`height`/`top`/`left`.

---

## Motion

Intent is minimal feedback, not storytelling. `MOTION_INTENSITY 2` (Static to Fluid edge).

- **Durations:** 150-200ms for all transitions. Ease `cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`.
- **Properties:** animate only `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `background-position`, or `box-shadow` size.
- **Allowed:** hover fill shift, focus ring, active `scale(0.98)` / `translateY(-1px)`, dialog enter `opacity + translateY(4px)`, table row hover `bg` via opacity. No perpetual loops, no shimmer loops outside loading, no parallax, no scroll-hijack, no magnetic physics.
- **Reduced motion:** anything above motion 3 must honor `prefers-reduced-motion`. At `reduce`, all transitions collapse to `duration 0` or `opacity` only; skeleton shimmer becomes static solid (see Loading & Skeletons); grain/filter effects are disabled; glow orbs are removed entirely.
- **Reduced transparency:** honor `prefers-reduced-transparency` if present: glass fallback is not needed because glass is banned, but any overlay opacity reduces to solid or minimal.

## Accessibility

- **Zoom:** `viewport` must allow zoom. `maximumScale` is omitted or `>= 5` and `userScalable: true` (never `maximum-scale=1, user-scalable=no`). The dark theme `themeColor` pair may remain but does not block zoom.
- **Contrast:** WCAG AA minimum for body, AAA target for primary actions and badge text. Verified pairs are listed under Colors. Never rely on color alone for status.
- **Focus:** visible 2px ring in `{colors.focus}` on every interactive element. Focus is not removed without a replacement.
- **Dialogs:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, `Esc` closes, return focus to trigger, max `90dvh`.
- **Hit targets:** minimum 44px for buttons, selects, toggles, pagination, and table row actions.
- **Loading:** announce via `aria-busy="true"` on the preserved container and polite live region only when needed, without repeated `Cargando...` noise. See Loading & Skeletons.

## App Shell & Navigation

Single shared authenticated shell. Navbar placement is structural, not per-page decoration.

- **Owner:** one layout (e.g., `app/(app)/layout.tsx`) renders `<div class="min-h-screen bg-background"><Navbar /><main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">` for all authenticated routes (`/dashboard`, `/locations`, future `/service-events`). `/dashboard` must not re-wrap with `p-4 md:p-8` and a second `max-w-7xl` inside `ServicesDashboard`.
- **Navbar geometry:** `height 64px` (`h-16`) + `1px border` = 65px total at desktop. Sticky `top-0` `z-40` as direct child of the viewport-filling container. Background `{colors.surface}` solid, no translucency. No `backdrop-blur-md`.
- **Gutters:** `px-4 sm:px-6 lg:px-8` everywhere and `py-8` for content. Deviation such as `px-6 py-10` on one route is a regression.
- **Regression contract:** at 1280x800 and 390x844, `header.getBoundingClientRect().top === 0`, `header bottom === 65`, `header left/width` equal across `/dashboard`, `/locations`, `/locationLogs` (and future `/service-events`) before and after scroll. `firstContent.getBoundingClientRect().left/width/padding` also equal. Mobile hamburger `absolute top-16` aligns to header bottom.
- **Navigation:** horizontal top nav on desktop. No unlabeled hamburger on desktop. Active state uses `border-b` or `bg-zinc-100` with `{colors.focus}` indicator, not color wash alone. Consistent across dashboard, locations, Registro at desktop and mobile.

## Dashboard & Filtering

Metrics are operational controls with global semantics.

- **Stats cards:** counts are global per status (scoped to `userId` and to `search`/`location` when filters are intentionally scoped), not derived from the current page slice. Cards read from `GET /api/services/stats` or equivalent, not from `Services[]`. No `0,0,0` flash when filtering to `Entregada` while global pending exists.
- **Visual rules:**
  - Card container: `card` token, `p-4`, `gap-4`, `rounded.sm`, `border border-zinc-200`, no `glass-card` or `border-l-4`.
  - Metric number: `typography.h3` or `typography.display` at most 1.875rem, never oversized display. Label is `typography.label` (13px medium), not `text-xs tracking-widest`.
  - Active filter feedback: `border border-zinc-300` or `border-{status-border}` plus `bg-{status-bg}` tint at 4-6% fill and `ring-1` in border token. Dynamic `border-primary!` or interpolated `!` classes are banned; use data-attribute variants or explicit token classes safelisted in Tailwind config.
  - Exclusive vs multi-select is a single behavior per spec (not both `toggleStatus` exclusive and `toggleStatusInFilter` multi). Active state must visually match the filter semantics the spec locks.
  - Filter transition does not replace the table with a full-page spinner or `Cargando...` cut. See Loading & Skeletons for the `aria-busy` overlay path.

## Forms, Dialogs, Tables & Registro

### Forms
- Label above (`typography.label`), field (`typography.body-md` or `mono-data` for operational values), error below in `{colors.cancelled-fg}`, gap `sm` (8px) between label and input, `gap-md` (16px) between fields, `grid-cols-1 md:grid-cols-2` where appropriate, single-column on mobile.
- Validation states: hover `border-zinc-300`, focus `border {colors.focus}` + `ring-2`, error `border {colors.cancelled-border}` + `ring`.
- RUT, SKU, currency, dates, log identifiers always render and edit via `mono-data` so operators can compare character-by-character.

### Dialogs
- Only `dialog` token uses `rounded.lg` (12px). Content max `90dvh` with `overflow-y-auto`, sticky footer for actions. Focus trap and return focus required. Do not abuse modal as first thought — prefer inline/progressive disclosure when the task allows, but when a modal is required it follows the dialog token strictly.

### Tables
- Wrapper: `overflow-x-auto custom-scrollbar` with hairline outer ring. Header: `table-header` token, `px-4 py-3`, `whitespace-nowrap`, sticky where the spec requires. Rows: `px-4 py-3`, hover `hover:bg-zinc-50`, dividers `border-b border-zinc-200` (single direction).
- Badges in cells use badge component tokens (icon 14px + `typography.label` text), never plain colored dot alone.
- On narrow viewports, tables use progressive disclosure (collapsible rows, priority columns, or a card fallback) instead of forcing only a horizontal scroll that hides actions. Touch targets for row actions are `h-11 w-11` (44px) minimum. Header text is `typography.label` at 13px, not `text-xs` that collapses to 10px on mobile.
- Empty states are composed: icon, one-line explanation, and a primary action (`Nuevo servicio` or `Crear sede`), not bare `No se encontraron registros` without guidance.

### Registro (Movimientos → Registro)
- Future `Registro` lists both location transfers and status transitions. Filter chips for `kind` (`transfer` vs `status`), status, location, and date range. Each entry shows `from → to` or `fromStatus → toStatus` with mono timestamp, actor, and note, using the same density and badge language as the rest of the system. No glass panel or timeline dot decoration that carries no state.

## Loading & Skeletons (Boneyard)

Boneyard is selected as the exact-layout skeleton strategy. Geometry comes from the real DOM; tokens come from this DESIGN.md.

- **Initial load (empty container, first paint):** dashboard metrics and table wrapper render Boneyard bones via `<Skeleton name="dashboard-stats" loading={isLoading && items.length === 0}>` and `<Skeleton name="dashboard-table" ...>`. Bones are generated by `pnpm exec boneyard-js build http://localhost:3000/dashboard` into `src/bones/*.bones.json` + `src/bones/registry` imported once in `app/layout.tsx`. Config: `breakpoints [375, 768, 1280]`, `out ./src/bones`, `color {colors.skeleton-base} (#e4e4e7)`, `darkColor` aligned if dark ever ships, `animate shimmer`, `shimmerAngle`, `speed`, `stagger` at conservative values.
- **Populated refetch (filters, pagination):** do not unmount the table. Preserve the container, set `aria-busy="true"` on the table/container, and apply a non-jarring pending treatment: `opacity-60` overlay plus border pulse at most. No full `Cargando...` replacement, no layout shift, container height remains stable at normal and throttled (3G) latency.
- **Tokens:** skeleton bones use `{colors.skeleton-base}` (`#e4e4e7`) and `{colors.skeleton-shimmer}` (`#f4f4f5`). Never obsidian `#0f172a` or electric blue. The registry colors are tied to semantic skeleton tokens, not hard-coded.
- **Reduced motion:** under `@media (prefers-reduced-motion: reduce)`, `animate shimmer` degrades to static solid fill (shimmer `none`). The same applies to `prefers-reduced-transparency` if present.
- **Announcements:** loading is announced via `aria-busy` on the container and at most one polite live region for initial load. Repeated `Cargando...` text on every filter change is banned as noise.
- **Acceptance evidence:** no standalone `Cargando...` cut on refetch, stable container height (no CLS at normal and `page.route` throttled latency), mobile and desktop bones exist (375 and 1280), `aria-busy` and shimmer respect reduced motion.

## Responsive & Mobile

Hard responsive contract per `design-ui` and `operate` mode.

- **Breakpoints verified:** 375, 390, 768, 1024, 1440. Below 768px: single column, `width: 100%`, content padding `16px`, card gap `16px`, section gaps `clamp(2rem, 5vw, 3rem)` (operate compact, not `clamp(3rem, 8vw, 6rem)` gallery).
- **Hit targets:** all tappable controls are at least 44px (`h-11 min-h-11`, `p-2.5` on inputs is 44px effective with vertical rhythm). Table row actions are 44px, not `p-1.5` (32px).
- **Status controls:** filter chips and status selectors wrap via `flex-wrap gap-3`; on narrow they are not clipped. Status badges stay `icon + text` and wrap rather than overflow.
- **Tables:** either `overflow-x-auto` with visible scrollbar (no hidden clip) or card fallback. No requirement that operators scroll a 9-column table on 390px to reveal a critical action; progressive disclosure or card view must surface primary actions without horizontal drag.
- **Dialogs:** max `90dvh`, sticky footer, `overflow-y-auto` inner, close via `X`, `Esc`, and backdrop.
- **Typography at mobile:** body remains `body-md` (14px) and labels `label` (13px); never drops to 10px.
- **Buttons on mobile:** primary actions are full-width where the spec calls for it (e.g., `Nuevo servicio` in empty state), otherwise at least 44px tall with adequate margin.
- **Shell on mobile:** Navbar height remains 65px (`h-16 + border`), hamburger `absolute top-16` with slide-in and labeled menu, user dropdown stays accessible. Header `top === 0` after scroll, same as desktop.

## Verification Checklist

Pass these before the feature is considered done. Every item is observable; adjectives alone fail.

- [ ] YAML lint: `npx @google/design.md lint DESIGN.md` is clean (no `broken-ref`); warnings `missing-primary`, `missing-typography`, `contrast-ratio`, `section-order` are zero for tokens introduced in this turn.
- [ ] No second DESIGN.md; body order is Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts, then extras.
- [ ] Every hex in prose binds to a YAML token via Name + value + role; no stray hex outside YAML.
- [ ] Tokens follow three layers: primitive raw zinc/accent/status → semantic purpose → component reference `{colors.*}` / `{rounded.*}` / `{typography.*}`; no raw hex in component code.
- [ ] Contrast: primary `#2F5B8A` on white 7.04:1, pending/ready/completed/cancelled badge pairs each ≥ 4.5:1 (6.3-7.1:1), foreground `#18181b` on `#fafafa` 16.97:1.
- [ ] Type: Fira Sans + Fira Code loaded via `next/font/google`, fallbacks documented, fixed scale, labels at `0.8125rem` (13px) medium not `10px tracking-widest`; operational data in mono.
- [ ] Density: cards `p-4 gap-4`, table `px-4 py-3`, section gap `gap-6` or compact equivalent; no `p-6 gap-6` as default.
- [ ] Radius: cards/inputs/buttons `8px` (`sm`) to `10px` (`md`), dialogs only at `12px` (`lg`), badges at `full`.
- [ ] Borders 1px hairline `border-zinc-200` on every container; shadows only tinted `0 1px 2px` + `0 4px 12px` when elevation is hierarchy.
- [ ] Buttons: flat, no gradient, primary `{colors.primary}` on white, secondary ghost, hover fill shift, active `scale(0.98)` / `translateY(-1px)`.
- [ ] Status: pending amber, ready blue, `Entregada` emerald (storage `completed`), cancelled red — always icon + text, never color only.
- [ ] Motion: 150-200ms `transform`/`opacity` only, no loops; `prefers-reduced-motion` disables transitions and skeleton shimmer; `prefers-reduced-transparency` honored.
- [ ] App shell regression green: at 1280x800 and 390x844, header `top 0 bottom 65 left/right/width` and first content `left/width/padding` equal across `/dashboard`, `/locations`, `/locationLogs` before and after scroll; gutters `px-4 sm:px-6 lg:px-8 py-8`.
- [ ] Dashboard: cards read global stats, not page slice; active filter border uses token classes not interpolated `border-xxx!`.
- [ ] Boneyard: initial bones at 375 and 1280 exist under `src/bones/` and preserve exact layout; populated refetch keeps container with `aria-busy` overlay, no `Cargando...` full replacement, stable height at throttled latency, reduced-motion static.
- [ ] Mobile: 44px targets verified, responsive status controls wrap, cards/progressive disclosure exist for narrow table, dialogs max `90dvh`.
- [ ] Accessibility: zoom allowed (`viewport maximumScale >= 5, userScalable: true`), AA contrast, visible focus ring, dialog `role="dialog" aria-modal` + trap + `Esc`, `aria-busy` without repeated noise, axe-core clean on authenticated routes.

## Migration Notes

- **Removed world:** Obsidian `#0f172a` / electric blue `#3b82f6` / glass-white `rgba(255,255,255,0.05)` / `backdrop-blur-xl` / `glass-card p-6 border-l-4` / `rounded-xl` everywhere / `glow-orb` / gradient buttons is the incumbent verified in `app/` and `styles/globals.css` up to 2026-08-25. It is replaced, not blended. Keep these values only in ban lists and this migration note; do not reuse them.
- **Font migration:** `Inter` via system stack is superseded by `Fira Sans` + `Fira Code` already installed via `next/font/google` in `app/layout.tsx`. Existing variable `--font-fira-sans` / `--font-fira-code` stays; no new package.
- **Storage:** `services.status` enum keeps `completed`; presentation maps `completed → Entregada` via a central `statusLabel` helper. No enum migration.
- **Boneyard retuning:** `color`/`darkColor`/`shimmerColor` previously pointed at obsidian in exploration; they now point at `{colors.skeleton-base}` (`#e4e4e7`) and `{colors.skeleton-shimmer}` (`#f4f4f5`).
- **`viewport` fix:** `app/layout.tsx` must change `viewport { maximumScale: 1, userScalable: false }` to `userScalable: true` (or remove both) so zoom is allowed; verified as prior audit finding.
- **Tailwind safelist:** dynamic `border-primary!`, `border-amber-500!` interpolations must be removed or safelisted via explicit data-attribute variants tied to status semantic tokens.
