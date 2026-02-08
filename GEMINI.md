# Project Guidelines

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

- **Next.js**: 16.0.10 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 4.1.18
- **Prisma**: 7.2.0
- **Appwrite**: 14.1.0 (Node SDK)
- **PostgreSQL**: 8.16.3 (pg driver)
- **ESLint**: 9.39.2
- **npm**: (Project uses package-lock.json)

## Commands

```bash
npm run dev               # Development (http://localhost:3000)
npm run build             # Production build
npm run start             # Production server
npm run lint              # Linter (ESLint)
npm run changelog         # Generate changelog
npm run version           # standard-version dry-run
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Generate Prisma Client
npx prisma migrate dev    # Run migrations
```

## Project Structure

```
app/
├── actions/               # Server Actions
├── api/                   # API Routes
├── locations/             # Location routes
├── login/                 # Login page
├── logs/                  # Logs routes
├── register/              # Register page
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Root page

components/
├── auth/                  # Authentication components
├── ui/                    # UI components
├── WarrantyDashboard.tsx  # Dashboard component
├── WarrantyDetailsModal.tsx
├── WarrantyModal.tsx
└── WarrantyTable.tsx

lib/
├── appwrite.ts            # Appwrite configuration
├── auth.ts                # Appwrite authentication helper
├── storage.ts             # Storage utilities
├── types.ts               # Type definitions
└── utils.ts               # Utility functions
```

## Security Limits

### DO NOT:

- ❌ Commit `.env` or secrets
- ❌ Use `any` in TypeScript (unless absolutely necessary)
- ❌ Expose Appwrite Admin Keys in client-side code
- ❌ Disable ESLint rules without justification

### DO:

- ✅ Use Server Actions for data mutations
- ✅ Validate inputs
- ✅ Use strict type safety
- ✅ Follow Tailwind CSS conventions
- ✅ Use Prettier/ESLint for formatting
