# Webapp Package

Vite React dashboard for viewing synced posts.

## Stack

- **Bundler**: Vite 7.x
- **Framework**: React 19
- **Routing**: TanStack React Router
- **State**: TanStack React Query 5.x
- **Styling**: Tailwind CSS 4.x

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (tsc + vite)
pnpm preview      # Preview production build
pnpm typecheck      # Type check
pnpm test         # Run tests
```

## Structure

```
src/
  main.tsx        # App entry point
  routes/         # TanStack Router route definitions
  components/     # Shared UI components
  hooks/          # Custom React hooks
  api/            # API client functions
```

## Shared Patterns

- Uses DOMPurify for sanitizing post HTML (same as extension)
- React Query for server state
- Same component patterns as extension dashboard
