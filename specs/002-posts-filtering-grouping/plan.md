# Implementation Plan: Posts Filtering and Grouping Enhancements

**Branch**: `002-posts-filtering-grouping` | **Date**: 2026-01-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-posts-filtering-grouping/spec.md`

## Summary

Enhance the FB Group Aggregator extension dashboard with three key capabilities: (1) keyword-based filtering with positive/negative filters to reduce information overload, (2) virtualized list rendering to maintain smooth scrolling performance with thousands of posts, and (3) automatic grouping of posts with identical text to reduce redundancy. This feature focuses on the browser extension's dashboard UI, implementing client-side filtering and grouping logic with persistence in chrome.storage.local.

## Technical Context

**Language/Version**: TypeScript 5.9
**Primary Dependencies**: React 19, WXT 0.20.6, @tanstack/react-query 5.90, Tailwind CSS 4.1
**Storage**: chrome.storage.local (existing storage layer via lib/storage.ts with Zod validation)
**Testing**: Vitest 4.0, @testing-library/react 16.3, jsdom 27.2
**Target Platform**: Browser extension (Chrome MV3, Firefox MV2/MV3)
**Project Type**: Browser extension (WXT-based) - monorepo structure with extension/ workspace
**Performance Goals**:
- Filter updates <500ms (SC-001)
- Smooth scrolling with 5000+ posts, max 100ms per scroll event (SC-002)
- Initial load <3 seconds regardless of post count (SC-003)
- Memory stability during 30+ minute sessions (SC-006)

**Constraints**:
- Must work with existing Post data model (id, groupId, authorName, contentHtml, scrapedAt, seen, url)
- Must integrate with existing storage layer (lib/storage.ts)
- Must maintain existing React Query patterns (non-destructured queries, named functions)
- Must follow WXT framework conventions (no manual manifest editing)
- Browser extension environment (limited to chrome.storage.local, no external APIs)

**Scale/Scope**:
- Optimize for up to 10,000 posts (Assumption #4 from spec)
- Support concurrent filters (multiple positive + multiple negative keywords)
- Grouping by exact text match (extensible for future fuzzy matching)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Test-First Development ✅
**Status**: PASS - No violation
**Justification**: Feature will be developed using TDD. Tests written before implementation code for:
- Filter logic (positive/negative keyword matching)
- Grouping algorithm (exact text match)
- Virtualization integration
- Storage persistence

### Gate 2: File Colocation ✅
**Status**: PASS - No violation
**Justification**: Tests will be colocated with implementation:
- `lib/filters/filterPosts.ts` → `lib/filters/filterPosts.test.ts`
- `lib/grouping/groupPosts.ts` → `lib/grouping/groupPosts.test.ts`
- `lib/hooks/filters/useFilters.ts` → `lib/hooks/filters/useFilters.test.ts`
- Dashboard components in `entrypoints/dashboard/components/` with adjacent test files

### Gate 3: No Barrel Exports ✅
**Status**: PASS - No violation
**Justification**: Direct imports will be used:
- `import { filterPosts } from '@/lib/filters/filterPosts'`
- `import { groupPosts } from '@/lib/grouping/groupPosts'`
- `import { useFilters } from '@/lib/hooks/filters/useFilters'`

### Gate 4: React Coding Standards ✅
**Status**: PASS - No violation
**Justification**:
- Named function declarations for event handlers
- Non-destructured React Query usage: `const filtersQuery = useFilters(); const filters = filtersQuery.data ?? defaultFilters;`
- Follows existing codebase patterns in `lib/hooks/useStorageData.ts`

### Gate 5: Component Size & Focus ✅
**Status**: PASS - No violation
**Justification**: Components will be broken down by responsibility:
- `FilterControls` - Filter input UI (<100 lines)
- `FilterChips` - Display active filters (<50 lines)
- `PostList` - Virtualized list container (<100 lines)
- `PostGroup` - Expandable group UI (<100 lines)
- `PostItem` - Individual post display (existing, may need updates <150 lines)

### Gate 6: Commit Granularity ✅
**Status**: PASS - No violation
**Justification**: Commits will be atomic:
- `feat(dashboard): add filter storage and hooks`
- `feat(dashboard): implement positive/negative filter logic`
- `feat(dashboard): add virtualized post list`
- `feat(dashboard): implement post grouping by exact text`
- `test(dashboard): add filter logic test coverage`

**Overall Status**: ✅ ALL GATES PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-posts-filtering-grouping/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root - monorepo)

```text
extension/
├── entrypoints/
│   └── dashboard/
│       ├── index.html                    # Dashboard entry point
│       ├── main.tsx                      # React root with QueryClientProvider
│       └── components/
│           ├── PostFeed.tsx              # Main feed component (existing)
│           ├── PostFeed.test.tsx
│           ├── FilterControls.tsx        # NEW: Filter input UI
│           ├── FilterControls.test.tsx
│           ├── FilterChips.tsx           # NEW: Active filters display
│           ├── FilterChips.test.tsx
│           ├── VirtualPostList.tsx       # NEW: Virtualized list
│           ├── VirtualPostList.test.tsx
│           ├── PostGroup.tsx             # NEW: Grouped posts UI
│           ├── PostGroup.test.tsx
│           └── PostItem.tsx              # Existing individual post
│
├── lib/
│   ├── types.ts                          # Existing types (Post, Group, Subscription)
│   ├── storage.ts                        # Existing storage layer
│   ├── storage.test.ts                   # Existing tests
│   ├── filters/
│   │   ├── filterPosts.ts                # NEW: Filter logic
│   │   ├── filterPosts.test.ts           # NEW: Filter tests
│   │   └── types.ts                      # NEW: Filter types
│   ├── grouping/
│   │   ├── groupPosts.ts                 # NEW: Grouping algorithm
│   │   ├── groupPosts.test.ts            # NEW: Grouping tests
│   │   └── types.ts                      # NEW: Post group types
│   └── hooks/
│       ├── useStorageData.ts             # Existing React Query hooks
│       └── filters/
│           ├── useFilters.ts             # NEW: Filter state hook
│           ├── useFilters.test.ts        # NEW: Filter hook tests
│           ├── useFilteredPosts.ts       # NEW: Posts + filters integration
│           └── useGroupedPosts.ts        # NEW: Grouping hook
│
└── test/
    └── setup.ts                          # Existing global test setup
```

**Structure Decision**: This is a monorepo with separate workspaces for extension, server, and webapp. This feature targets the `extension/` workspace only, specifically enhancing the dashboard UI. The extension uses WXT framework which treats `entrypoints/` specially, so we follow the existing pattern of placing dashboard components in `entrypoints/dashboard/components/` with colocated tests. New library code goes in `lib/` with feature-specific subdirectories (filters/, grouping/) following the project's direct import pattern (no barrel exports).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Not applicable - all constitution gates passed.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion*

**Date**: 2026-01-02

### Gate 1: Test-First Development ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- Test files planned for all new modules (see Project Structure section)
- Contracts define testable interfaces
- Quickstart.md includes test examples following TDD workflow

### Gate 2: File Colocation ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- All new files follow colocation pattern:
  - `lib/filters/filterPosts.ts` + `lib/filters/filterPosts.test.ts`
  - `lib/grouping/groupPosts.ts` + `lib/grouping/groupPosts.test.ts`
  - Components in `entrypoints/dashboard/components/*.tsx` + `*.test.tsx`

### Gate 3: No Barrel Exports ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- Contracts specify direct imports only
- No index.ts files in planned structure
- Example imports in quickstart.md use direct paths

### Gate 4: React Coding Standards ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- UI contracts use named function declarations: `export declare function FilterControls()`
- Hook contracts demonstrate non-destructured patterns: `const filtersQuery = useFilters()`
- Quickstart examples follow project patterns

### Gate 5: Component Size & Focus ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- Components broken down by responsibility (FilterControls, FilterChips, VirtualPostList, PostGroup)
- Each component has single, focused purpose
- Estimated <150 lines per component

### Gate 6: Commit Granularity ✅
**Status**: PASS - Reconfirmed
**Evidence**:
- Implementation plan suggests atomic commits per feature
- Separate commits for filters, virtualization, grouping
- Test commits separate from implementation commits

**Overall Status**: ✅ ALL GATES PASSED - Design adheres to all constitutional principles

**Conclusion**: The detailed design maintains alignment with all constitutional requirements. No violations introduced during planning phase. Ready to proceed with implementation (Phase 2: Tasks).
