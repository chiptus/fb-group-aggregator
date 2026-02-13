# Testing Rules

## Test Colocation

Place test files next to the code they test, named `<filename>.test.ts`.

```
lib/
  storage.ts
  storage.test.ts
  scraper.ts
  scraper.test.ts
```

For entrypoints, use subdirectory with `index.ts`:

```
entrypoints/
  background/
    index.ts                    # Entry point
    background-handler.ts       # Logic
    background-handler.test.ts  # Tests
```

## Framework

- **Runner**: Vitest
- **React testing**: @testing-library/react
- **Async hooks**: Use `waitFor` for React Query hook tests

## Commands

```bash
pnpm test        # Watch mode
pnpm test:run    # Single run (CI)
pnpm test:ui     # Interactive UI
```

## Known Issues

- Pre-existing App.test.tsx failures exist (11 tests) - unrelated to new feature work
