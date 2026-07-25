# FoosRank

A local-first foosball match and Elo tracker built with TanStack Start, TanStack DB, React, and Tailwind CSS.

## Development

```bash
corepack enable
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000`. Organizations, players, and matches are stored in browser localStorage.

## Commands

Run these from the repository root:

```bash
pnpm check       # Prettier
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm test        # Vitest unit tests
pnpm test:e2e    # Playwright browser tests
pnpm build       # Production build
```

Install Playwright's Chromium browser before running E2E tests locally:

```bash
pnpm --filter @foos-rank/web exec playwright install chromium
```

## Structure

```text
apps/web/src/collections  TanStack DB collections and persistence
apps/web/src/domain       Match and Elo rules
apps/web/src/routes       TanStack Router pages and layouts
apps/web/src/components   Shared UI
apps/web/tests/e2e        Playwright workflows
```

Route loaders preload the local collections before rendering. Components continue to use `useLiveQuery` so mutations update the UI reactively.

GitHub Actions runs formatting, linting, type checking, unit tests, the production build, and Playwright tests on pushes to `main` and pull requests.
