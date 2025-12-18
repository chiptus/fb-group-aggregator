<!--
Sync Impact Report:
Version Change: 0.0.0 → 1.0.0
Modified Principles: N/A (initial constitution)
Added Sections: All sections (initial creation)
Removed Sections: None
Templates Status:
  ✅ plan-template.md - Constitution Check section present
  ✅ spec-template.md - Aligned with mandatory requirements sections
  ✅ tasks-template.md - Aligned with TDD principles and test-first workflow
Follow-up TODOs: None
-->

# FB Group Aggregator Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written before implementation code. For new features or bug fixes:
- Write failing tests that define expected behavior
- Ensure tests fail for the right reason
- Implement minimal code to pass tests
- Refactor while keeping tests green

**Rationale**: Test-first ensures testable design, prevents feature creep, and provides
regression safety. Testing after code leads to implementation-biased tests that miss edge cases.

### II. File Colocation

Test files MUST be placed next to the code they test using `<filename>.test.ts` naming:
- Library files: tests adjacent in same directory (`lib/storage.ts` → `lib/storage.test.ts`)
- Entrypoints: create subdirectory with `index.ts` for entry point (`entrypoints/background/index.ts`, `entrypoints/background/background-handler.test.ts`)
- DO NOT use separate `test/` directories for feature tests (only for global setup/utilities)

**Rationale**: Colocation ensures tests move with code during refactoring, improves discoverability,
and prevents orphaned tests. WXT framework treats entrypoint files specially, so subdirectory
pattern avoids build conflicts while maintaining colocation.

### III. No Barrel Exports

DO NOT create `index.ts` files that re-export from other modules:
- Always import directly from specific files where code is defined
- Example: `import { useSubscriptions } from '@/lib/hooks/storage/useSubscriptions'` (GOOD)
- Example: `import { useSubscriptions } from '@/lib/hooks'` (BAD - barrel export)

**Rationale**: Barrel exports obscure dependencies, harm tree-shaking, create circular dependency
risks, and complicate refactoring. Direct imports make dependencies explicit and enable better IDE navigation.

### IV. React Coding Standards

**Function Declarations**: Use named function declarations, NOT arrow functions:
```typescript
// VALID
function handleClick(id: string) { /* ... */ }

// INVALID
const handleClick = (id: string) => { /* ... */ };
```

**React Query Usage**: DO NOT destructure query results, use dot notation:
```typescript
// VALID
const postsQuery = usePosts();
const posts = postsQuery.data ?? [];

// INVALID
const { data: posts = [] } = usePosts();
```

**Rationale**: Named functions provide better stack traces and hoisting flexibility. Non-destructured
queries make refactoring safer and align with query object patterns.

### V. Component Size & Focus

Components MUST do ONE thing well:
- If component exceeds 150 lines, consider breaking down
- Extract repeated UI patterns (2+ occurrences) into smaller components
- Separate business logic into custom hooks
- Avoid deeply nested conditional rendering (> 3 levels)

**Rationale**: Small, focused components improve maintainability, testability, and reusability.
Monolithic components become bottlenecks for parallel development.

### VI. Commit Granularity

Create ONE commit per logical change:
- DO NOT combine multiple concerns (feature + refactor, multiple features, multiple fixes)
- Each commit MUST be complete and independently revertible
- Run tests before each commit
- Format: `type(scope): imperative description under 72 chars`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

**Rationale**: Atomic commits enable surgical reverts, clear history for debugging, and meaningful
code review. Mixed-concern commits make bisecting and cherry-picking impossible.

## Browser Extension Architecture

### WXT Framework Requirements

This project uses WXT (Web Extension Tools):
- Automatic manifest generation - DO NOT manually edit manifest
- Entry points use `defineBackground()`, `defineContentScript()`, etc.
- Hot Module Replacement during development
- TypeScript and React integration built-in
- Package manager MUST be pnpm (not npm or yarn)

### Extension Message Protocol

Cross-context communication MUST use chrome.runtime messaging:
- Content scripts → Background: Send messages via `chrome.runtime.sendMessage`
- Background → Content: Respond via callback or return value
- All messages MUST use typed message objects from `lib/types.ts`
- Message handlers MUST validate payloads with Zod schemas

### Storage Conventions

Use chrome.storage.local (NOT sync due to data size):
- All storage operations MUST use wrappers from `lib/storage.ts`
- Automatic Zod validation on all read operations
- Post deduplication by ID enforced at storage layer
- Type-safe CRUD operations for subscriptions, groups, posts

## Development Workflow

### Starting Development

- Chrome: `pnpm dev` → Load unpacked from `.output/chrome-mv3/`
- Firefox: `pnpm dev:firefox` → Load temporary from `.output/firefox-mv2/`
- Always run `pnpm postinstall` after dependency changes (WXT regenerates types)

### Type Checking

Run `pnpm compile` to verify TypeScript before committing:
- DO NOT commit code with type errors
- Fix errors at source, not with `@ts-ignore`
- Use proper TypeScript types, avoid `any` unless absolutely necessary

### Testing Requirements

- Framework: Vitest (NOT Jest - faster, Vite-native)
- All features MUST have test coverage
- Tests run with `pnpm test` (watch) or `pnpm test:run` (CI)
- Use `@testing-library/react` for component tests
- Mock chrome APIs via `test/setup.ts` global mocks

## Governance

This constitution supersedes all other development practices. When in doubt:
1. Follow TDD principles (Principle I)
2. Prefer simplicity and directness
3. Optimize for maintainability over cleverness
4. Consult `CLAUDE.md` for WXT-specific guidance

### Amendments

Constitution changes require:
1. Clear rationale for change
2. Version bump following semantic versioning:
   - MAJOR: Backward-incompatible principle changes
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording fixes, typo corrections
3. Update to all dependent templates (plan, spec, tasks, commands)
4. Sync Impact Report documenting changes

### Compliance Review

All pull requests MUST verify compliance with:
- Test-first development (tests before code)
- File colocation (tests next to code)
- No barrel exports (direct imports only)
- React standards (named functions, no destructuring queries)
- Commit granularity (one logical change per commit)

Use `CLAUDE.md` for detailed runtime development guidance and WXT framework conventions.

**Version**: 1.0.0 | **Ratified**: 2025-12-18 | **Last Amended**: 2025-12-18
