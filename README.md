# FoosRank

A shared foosball match and Elo tracker built with TanStack Start, TanStack Query, DynamoDB, React, and Tailwind CSS.

## Development

```bash
corepack enable
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000`. DynamoDB is the default datastore, and SST creates an isolated table for each stage. Organizations are unlisted and unauthenticated: anyone with an organization URL can view and update its data.

The home page stores only a list of recently visited organization IDs in the browser; all organization, player, and match data remains in DynamoDB. The app does not enumerate the table.

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

Playwright exercises the shared datastore. Start `pnpm dev` first, then run `pnpm test:e2e` in another terminal. Pull requests also run E2E against their deployed preview stage.

## Structure

```text
apps/web/src/data         Query definitions and browser recent-organization index
apps/web/src/domain       Match and Elo rules
apps/web/src/server       DynamoDB repository and TanStack Start server functions
apps/web/src/routes       TanStack Router pages and layouts
apps/web/src/components   Shared UI
apps/web/tests/e2e        Playwright workflows
```

Route loaders preload one DynamoDB-backed snapshot per organization. Components use TanStack Query; snapshots refresh after mutations and when the browser regains focus. Organization setup and match completion are atomic server commands.

Production data is retained by SST. Preview-stage data is isolated and removed with its stage.

GitHub Actions runs formatting, linting, type checking, unit tests, and the production build. Pull requests from this repository also deploy an isolated stage and run Playwright against it.
