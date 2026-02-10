# AI Agent Ruleset

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                                                                                                                                       | Skill                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Adding, customizing, refactoring, or troubleshooting UI components built with shadcn/ui or related design-system primitives.                                                 | `shadcn-ui`                   |
| Always use for ui. SEO-optimized programmatic generation is required.                                                                                                        | `programmatic-seo`            |
| Creating, modifying, or reviewing Next.js application code, architecture, routing, data fetching, rendering strategy, metadata, or performance behavior.                     | `next-best-practices`         |
| Creating, modifying, organizing, or running unit or component tests using Vitest, including mocking, coverage configuration, snapshots, or test environment setup.           | `vitest`                      |
| Creating, refactoring, debugging, or integrating global client state in React applications using Zustand, including persistence, hydration, or TypeScript typing concerns.   | `zustand-state-management`    |
| Creating, reviewing, refactoring, or optimizing React or Next.js code that may impact rendering performance, data fetching strategy, bundle size, or user-perceived latency. | `vercel-react-best-practices` |
| Designing, extending, or standardizing UI systems using Tailwind CSS, including tokens, theming, responsive behavior, and component composition.                             | `tailwind-design-system`      |
| Designing, refactoring, or scaling React component architecture using composition patterns such as compound components, context orchestration, or render-prop abstractions.  | `vercel-composition-patterns` |
| Implementing or refactoring complex TypeScript type logic, reusable type utilities, generics, conditional or mapped types, or compile-time safety constraints.               | `typescript-advanced-types`   |
| Implementing, refactoring, or validating UI forms that use React Hook Form, Zod schemas, or structured client-side validation logic.                                         | `react-hook-form-zod`         |
| Planning, designing, evaluating, or improving user interfaces or user experience, including layout, accessibility, interaction patterns, visual systems, and usability.      | `ui-ux-pro-max`               |

## Stack and Versions

- **Next.js**: 16.1.6 (App Router)
- **React**: 19.2.4
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.1.18
- **Zod**: 4.3.6
- **React Hook Form**: 7.71.1
- **Vitest**: 4.0.18
- **Biome**: 2.3.14
- **pnpm**: 10.7.1

## Commands

```bash
pnpm dev                  # Development (http://localhost:3000)
pnpm build                # Production build
pnpm start                # Production server
pnpm lint                 # Linter (Biome)
pnpm lint:fix             # Auto-fix linting
pnpm format               # Format code
pnpm check                # Lint + format
pnpm tsc                  # Type checking
pnpm test                 # Tests
pnpm coverage             # Tests with coverage
```

## Project Structure

```
app/
├── actions/               # Server Actions
│   ├── auth.ts           # Authentication actions
│   ├── locations.ts      # Location management actions
│   └── logs.ts           # Log management actions
├── api/                   # API Routes
│   └── Services/       # Service related endpoints
├── locations/             # Locations feature
├── login/                 # Login page
├── logs/                  # System logs feature
├── register/              # Registration page
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Home page

components/
├── services/             # Service components
│   ├── ServicesDashboard.tsx
│   ├── ServicesTable.tsx
│   ├── ServicesModal.tsx
│   └── ServicesDetailsModal.tsx
├── auth/                  # Authentication forms
└── ui/                    # UI Components (shadcn & custom)

lib/
├── appwrite.ts            # Appwrite client configuration
├── auth.ts                # Authentication logic
├── storage.ts             # Storage utilities
├── types.ts               # Shared type definitions
└── utils.ts               # General utility functions

scripts/                   # Utility scripts
└── setup-appwrite.ts      # Setup script
```

## Security Limits

### DO NOT:

- ❌ Use `any` in TypeScript
- ❌ Disable ESLint/Biome rules without justification
- ❌ Commit `.env.local` or secrets
- ❌ Use `dangerouslySetInnerHTML` without sanitization
- ❌ Direct fetch to external APIs from Client Components (use Server Actions)

### DO:

- ✅ Validate forms with Zod
- ✅ Use Server Components by default
- ✅ Strict type safety
- ✅ Tests for critical components
- ✅ Follow shadcn/ui conventions
- ✅ Lint code with Biome (`pnpm lint`)
- ✅ Tests for all components (`pnpm test`)
