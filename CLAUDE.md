# FB Group Aggregator

Browser extension + web app to aggregate Facebook group posts into subscription-based feeds.

## Monorepo Structure

| Package      | Description                            | Dev Command          |
| ------------ | -------------------------------------- | -------------------- |
| `extension/` | WXT browser extension (Chrome/Firefox) | `pnpm dev:extension` |
| `server/`    | Fastify API + PostgreSQL               | `pnpm dev:server`    |
| `webapp/`    | Vite React dashboard                   | `pnpm dev:webapp`    |

## Quick Reference

- **Package manager**: pnpm (not npm/yarn)
- **TypeScript**: 5.9.x
- **Path alias**: `@/` maps to package root
- **Run all**: `pnpm dev:all`

## Commands

```bash
pnpm dev:extension    # Start extension dev (Chrome)
pnpm dev:server       # Start API server
pnpm dev:webapp       # Start web dashboard
pnpm test             # Run all tests
pnpm build:all        # Build all packages
```

## Rules

See [.claude/rules/](.claude/rules/) for coding conventions:

- [typescript.md](.claude/rules/typescript.md) - TypeScript patterns
- [react.md](.claude/rules/react.md) - React Query, components
- [testing.md](.claude/rules/testing.md) - Test organization
- [git.md](.claude/rules/git.md) - Commit practices

Each package has its own CLAUDE.md with package-specific context.
