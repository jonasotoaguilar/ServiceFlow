# Design System: ServiceFlow Premium

**Project ID:** 705337219848612179

## 1. Visual Theme & Atmosphere

Sleek, futuristic, and premium dashboard aesthetic ("Obsidian/Glass").
High contrast dark mode with deep blue backgrounds and vibrant electric blue accents.
Uses glassmorphism extensively for depth and hierarchy.

## 2. Color Palette & Roles

- **Obsidian Deep Blue (#0f172a / hsl(222.2 84% 4.9%))**: Primary background color.
- **Electric Blue (#3b82f6 / hsl(217.2 91.2% 59.8%))**: Primary action color, glow effects.
- **Glass White (rgba(255, 255, 255, 0.05))**: Translucent surface for cards and inputs.
- **Emerald Green (#10b981)**: Success/Active status indicators.
- **Muted Slate (#64748b)**: Secondary text and inactive elements.

## 3. Typography Rules

- **Font Family**: Inter (System sans-serif).
- **Headings**: Bold, tight tracking. H1 uses glowing underline effect.
- **Body**: Clean, readable, with good contrast.
- **Labels**: Uppercase, tracking-widest, small size (10px/11px) for metadata.

## 4. Component Stylings

- **Buttons**:
  - Primary: Vibrant gradient (Electric Blue -> Darker Blue), subtle shadow.
  - Secondary/Ghost: Transparent with hover effects (bg-white/5).
- **Inputs**: Rounded-xl, glass background, border-white/10.
- **Cards/Tables**: Glassmorphism container (backdrop-blur-xl), rounded-xl, subtle border.
- **Badges**: Minimalist, often just a colored dot with text, or pill-shaped outline.

## 5. Layout Principles

- **Spacing**: Generous padding (p-6, gap-6).
- **Grid/Flex**: Responsive flex layouts for headers and toolbars.
- **Depth**: Layering using z-index and backdrop-blur to create a sense of floating elements.
