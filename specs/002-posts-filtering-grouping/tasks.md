# Tasks: Posts Filtering and Grouping Enhancements

**Input**: Design documents from `/specs/002-posts-filtering-grouping/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included - TDD approach confirmed in Constitution Check (Gate 1)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a browser extension using WXT framework in a monorepo structure. All paths are relative to the `extension/` workspace:

- `extension/lib/` - Library modules (filters, grouping, utilities)
- `extension/entrypoints/dashboard/components/` - Dashboard UI components
- `extension/lib/hooks/` - React hooks

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create directory structure

- [x] T001 Install @tanstack/react-virtual dependency using pnpm in extension/ workspace
- [x] T002 [P] Create extension/lib/filters/ directory structure
- [x] T003 [P] Create extension/lib/grouping/ directory structure
- [x] T004 [P] Create extension/lib/hooks/filters/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: This feature leverages existing infrastructure (storage layer, React Query setup, UI framework). No blocking foundational tasks required.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Filter Posts by Keywords (Priority: P1) 🎯 MVP

**Goal**: Enable users to filter posts using positive and negative keywords to quickly find relevant content and reduce information overload

**Independent Test**: Create filters with keywords like "apartment" (positive) and "sold" (negative), verify only matching posts are displayed. Clear filters and verify all posts return. Test filter persistence across browser sessions.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Write test for FilterSettings Zod schema validation in extension/lib/filters/types.test.ts
- [x] T006 [P] [US1] Write test for filterPosts function with positive keywords in extension/lib/filters/filterPosts.test.ts
- [x] T007 [P] [US1] Write test for filterPosts function with negative keywords in extension/lib/filters/filterPosts.test.ts
- [x] T008 [P] [US1] Write test for filterPosts function with both positive and negative keywords (negative precedence) in extension/lib/filters/filterPosts.test.ts
- [x] T009 [P] [US1] Write test for case-insensitive keyword matching in extension/lib/filters/filterPosts.test.ts
- [x] T010 [P] [US1] Write test for empty filters (show all posts) in extension/lib/filters/filterPosts.test.ts
- [x] T011 [P] [US1] Write test for useFilters hook (load/save to chrome.storage.local) in extension/lib/hooks/filters/useFilters.test.ts
- [x] T012 [P] [US1] Write test for useFilteredPosts hook (integration with usePosts) in extension/lib/hooks/filters/useFilteredPosts.test.ts
- [x] T013 [P] [US1] Write test for FilterControls component (add/remove keywords) in extension/entrypoints/dashboard/components/FilterControls.test.tsx
- [x] T014 [P] [US1] Write test for FilterChips component (display/remove chips) in extension/entrypoints/dashboard/components/FilterChips.test.tsx

### Implementation for User Story 1

- [x] T015 [P] [US1] Create FilterSettings Zod schema and type in extension/lib/filters/types.ts
- [x] T016 [US1] Implement filterPosts function with positive/negative keyword logic in extension/lib/filters/filterPosts.ts
- [x] T017 [US1] Implement useFilters hook with chrome.storage.local persistence (use wxt/storage instead of chrome.storage.local per data-model.md note) in extension/lib/hooks/filters/useFilters.ts
- [x] T018 [US1] Implement useFilteredPosts hook combining usePosts with filter logic in extension/lib/hooks/filters/useFilteredPosts.ts
- [x] T019 [US1] Implement FilterControls component with keyword input and add/remove functionality in extension/entrypoints/dashboard/components/FilterControls.tsx
- [x] T020 [US1] Implement FilterChips component with active filter display and removal in extension/entrypoints/dashboard/components/FilterChips.tsx
- [x] T021 [US1] Add 300ms debounce to search input in SearchBar component in extension/entrypoints/dashboard/components/SearchBar.tsx
- [x] T022 [US1] Integrate FilterControls and FilterChips into PostsTab component in extension/entrypoints/dashboard/tabs/PostsTab.tsx
- [x] T023 [US1] Optimize filtering with Set-based lookups for subscription filtering (replace Array.includes with Set.has) in PostsTab filter logic
- [x] T024 [US1] Add FilterStatsBanner component showing "X of Y posts" with filter counts in extension/entrypoints/dashboard/components/FilterStatsBanner.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently
- Users can add/remove positive/negative keywords
- Filters update in real-time (<500ms per SC-001)
- Filters persist across sessions
- All tests pass

---

## Phase 4: User Story 2 - Scroll Through Large Lists Efficiently (Priority: P2)

**Goal**: Implement virtualized scrolling to maintain smooth 60 FPS performance with 5000+ posts, preventing browser lag and ensuring responsive UI

**Independent Test**: Load 1000+ posts, scroll rapidly up and down, verify smooth scrolling without lag. Monitor initial load time (<3 seconds per SC-003) and scroll performance (<100ms per event per SC-002).

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T025 [P] [US2] Write test for VirtualPostList component rendering only visible items in extension/entrypoints/dashboard/components/VirtualPostList.test.tsx
- [x] T026 [P] [US2] Write test for VirtualPostList scroll position preservation in extension/entrypoints/dashboard/components/VirtualPostList.test.tsx
- [x] T027 [P] [US2] Write test for VirtualPostList with empty posts array in extension/entrypoints/dashboard/components/VirtualPostList.test.tsx
- [x] T028 [P] [US2] Write test for VirtualPostList estimateSize calculation in extension/entrypoints/dashboard/components/VirtualPostList.test.tsx

### Implementation for User Story 2

- [x] T029 [US2] Implement VirtualPostList component using @tanstack/react-virtual with useVirtualizer hook in extension/entrypoints/dashboard/components/VirtualPostList.tsx
- [x] T030 [US2] Configure virtualizer with estimateSize (200px), overscan (5 items), and proper scroll container ref in extension/entrypoints/dashboard/components/VirtualPostList.tsx
- [x] T031 [US2] Apply React 19 workaround for TanStack Virtual (wrap virtualizer in useRef per research.md) in extension/entrypoints/dashboard/components/VirtualPostList.tsx
- [x] T032 [US2] Implement absolute positioning with transform for virtual items in extension/entrypoints/dashboard/components/VirtualPostList.tsx
- [x] T033 [US2] Replace existing post list rendering with VirtualPostList in PostsTab component in extension/entrypoints/dashboard/tabs/PostsTab.tsx
- [x] T034 [US2] Ensure scroll position is preserved when filters change (FR-016) in VirtualPostList implementation
- [ ] T035 [US2] Test performance with 1000+ posts and verify <100ms scroll latency

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
- Virtualized scrolling works with 5000+ posts
- Filtering + virtualization work together smoothly
- Initial load <3 seconds, scroll lag <100ms
- All tests pass

---

## Phase 5: User Story 3 - Group Similar Posts Together (Priority: P3)

**Goal**: Automatically group posts with identical text content to reduce redundancy and cognitive load, allowing users to expand/collapse groups and mark entire groups as seen

**Independent Test**: Scrape posts with duplicate text, verify they appear grouped with count indicator. Expand group to see individual posts. Mark group as seen and verify all posts marked. Test grouping with active filters.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T036 [P] [US3] Write test for normalizeContent function (HTML stripping, whitespace, lowercase) in extension/lib/grouping/normalizer.test.ts
- [x] T037 [P] [US3] Write test for PostGroup Zod schema validation in extension/lib/grouping/types.test.ts
- [x] T038 [P] [US3] Write test for GroupingResult Zod schema validation in extension/lib/grouping/types.test.ts
- [x] T039 [P] [US3] Write test for ExactMatchStrategy grouping with identical posts in extension/lib/grouping/strategies/exact-match.test.ts
- [x] T040 [P] [US3] Write test for ExactMatchStrategy with posts below min length (10 chars) in extension/lib/grouping/strategies/exact-match.test.ts
- [x] T041 [P] [US3] Write test for PostGroupingService with strategy switching in extension/lib/grouping/service.test.ts
- [x] T042 [P] [US3] Write test for getPostsByGroup helper method in extension/lib/grouping/service.test.ts
- [x] T043 [P] [US3] Write test for getGroupsSorted helper method (largest first) in extension/lib/grouping/service.test.ts
- [x] T044 [P] [US3] Write test for useGroupedPosts hook with expansion state in extension/lib/hooks/grouping/useGroupedPosts.test.ts
- [x] T045 [P] [US3] Write test for PostGroup component (expand/collapse, mark as seen) in extension/entrypoints/dashboard/components/PostGroup.test.tsx

### Implementation for User Story 3

- [x] T046 [P] [US3] Create PostGroup and GroupingResult Zod schemas and types in extension/lib/grouping/types.ts
- [x] T047 [P] [US3] Implement normalizeContent function (strip HTML, collapse whitespace, lowercase) in extension/lib/grouping/normalizer.ts
- [x] T048 [US3] Create GroupingStrategy interface in extension/lib/grouping/strategies/base.ts
- [x] T049 [US3] Implement ExactMatchStrategy class with Map-based grouping in extension/lib/grouping/strategies/exact-match.ts
- [x] T050 [US3] Implement PostGroupingService with strategy pattern and helper methods in extension/lib/grouping/service.ts
- [x] T051 [US3] Create useGroupedPosts hook with grouping logic and expansion state management in extension/lib/hooks/grouping/useGroupedPosts.ts
- [x] T052 [US3] Implement PostGroup component with expand/collapse and mark-as-seen functionality in extension/entrypoints/dashboard/components/PostGroup.tsx
- [x] T053 [US3] Implement GroupingStatsBanner component showing group count and reduction percentage in extension/entrypoints/dashboard/components/GroupingStatsBanner.tsx
- [x] T054 [US3] Integrate grouping UI into PostFeed with toggle for grouped/ungrouped view in extension/entrypoints/dashboard/components/PostFeed.tsx (or tabs/PostsTab.tsx)
- [x] T055 [US3] Ensure grouped posts work with filters (FR-015) - hide groups that don't match filters
- [x] T056 [US3] Verify 30% list reduction with 10+ similar posts (SC-007)

**Checkpoint**: All user stories should now be independently functional
- Grouping works with exact text matching
- Groups can be expanded/collapsed
- Mark-all-as-seen works on groups
- Grouping + filtering + virtualization all work together
- All tests pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T057 [P] Add empty state handling for "No posts match your current filters" message
- [x] T058 [P] Add loading states for filter/grouping operations
- [x] T059 [P] Verify filter persistence uses wxt/storage API (per data-model.md note on line 67)
- [ ] T060 [P] Performance testing: Verify <500ms filter updates with 5000 posts (SC-001)
- [ ] T061 [P] Performance testing: Verify smooth scrolling with 5000+ posts, <100ms lag (SC-002)
- [ ] T062 [P] Memory leak testing: Verify stable memory during 30+ minute sessions (SC-006)
- [ ] T063 [P] Add keyboard shortcuts for filter operations (optional enhancement)
- [ ] T064 [P] Add analytics/telemetry for filter usage patterns (optional)
- [x] T065 Code cleanup: Remove any commented code and TODOs
- [x] T066 Documentation: Update CLAUDE.md with new filter/grouping hooks patterns
- [x] T067 Run quickstart.md validation examples to verify all code samples work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - No blocking tasks (existing infrastructure sufficient)
- **User Stories (Phase 3+)**: Can proceed in parallel after Setup
  - User Story 1 (P1): No dependencies - can start after Setup
  - User Story 2 (P2): No dependencies - can start after Setup
  - User Story 3 (P3): No dependencies - can start after Setup
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - Independent (filtering)
- **User Story 2 (P2)**: Can start after Setup - Independent (virtualization)
- **User Story 3 (P3)**: Can start after Setup - Independent (grouping)

**Note**: All three user stories are designed to be independently implementable. However, they integrate naturally:
- US2 (virtualization) enhances US1 (filtering) performance
- US3 (grouping) works with US1 (filters apply to groups)
- US2 (virtualization) works with US3 (virtualized group rendering)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per Constitution)
- Types before logic (Zod schemas first)
- Core logic before hooks
- Hooks before components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 Setup**: All T001-T004 can run in parallel
- **Within User Story 1**:
  - All tests (T005-T014) can run in parallel
  - T015 (types) can run alone
  - T016 (filter logic) depends on T015
  - T017-T018 (hooks) can run in parallel after T016
  - T019-T020 (components) can run in parallel after T017-T018
- **Within User Story 2**:
  - All tests (T025-T028) can run in parallel
  - Implementation tasks (T029-T032) sequential for VirtualPostList
  - T033-T034 integration tasks sequential
- **Within User Story 3**:
  - All tests (T036-T045) can run in parallel
  - T046-T047 (types + normalizer) can run in parallel
  - T048-T050 (strategies + service) sequential (strategy interface → implementation → service)
  - T051-T053 (hooks + components) can run in parallel after T050
- **Phase 6 Polish**: All tasks (T057-T067) can run in parallel except T065-T067 which are sequential cleanup

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (FIRST - TDD):
Task: "Write test for FilterSettings Zod schema validation in extension/lib/filters/types.test.ts"
Task: "Write test for filterPosts function with positive keywords in extension/lib/filters/filterPosts.test.ts"
Task: "Write test for filterPosts function with negative keywords in extension/lib/filters/filterPosts.test.ts"
Task: "Write test for filterPosts with both positive and negative keywords in extension/lib/filters/filterPosts.test.ts"
Task: "Write test for case-insensitive keyword matching in extension/lib/filters/filterPosts.test.ts"
Task: "Write test for empty filters in extension/lib/filters/filterPosts.test.ts"
Task: "Write test for useFilters hook in extension/lib/hooks/filters/useFilters.test.ts"
Task: "Write test for useFilteredPosts hook in extension/lib/hooks/filters/useFilteredPosts.test.ts"
Task: "Write test for FilterControls component in extension/entrypoints/dashboard/components/FilterControls.test.tsx"
Task: "Write test for FilterChips component in extension/entrypoints/dashboard/components/FilterChips.test.tsx"

# After tests fail, implement types:
Task: "Create FilterSettings Zod schema and type in extension/lib/filters/types.ts"

# Then implement filter logic:
Task: "Implement filterPosts function in extension/lib/filters/filterPosts.ts"

# Then implement hooks in parallel:
Task: "Implement useFilters hook in extension/lib/hooks/filters/useFilters.ts"
Task: "Implement useFilteredPosts hook in extension/lib/hooks/filters/useFilteredPosts.ts"

# Then implement components in parallel:
Task: "Implement FilterControls component in extension/entrypoints/dashboard/components/FilterControls.tsx"
Task: "Implement FilterChips component in extension/entrypoints/dashboard/components/FilterChips.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 3: User Story 1 (T005-T024)
3. **STOP and VALIDATE**: Test User Story 1 independently
   - Verify filters work with positive/negative keywords
   - Verify filter persistence across sessions
   - Verify <500ms update time
   - All tests pass
4. Deploy/demo if ready - **MVP complete with core filtering**

### Incremental Delivery

1. Complete Setup → Foundation ready
2. Add User Story 1 (Filtering) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Virtualization) → Test independently → Deploy/Demo (Performance boost!)
4. Add User Story 3 (Grouping) → Test independently → Deploy/Demo (Deduplication!)
5. Add Polish → Complete feature

### Parallel Team Strategy

With multiple developers after Setup completes:

1. **Developer A**: User Story 1 (Filtering) - P1 priority
2. **Developer B**: User Story 2 (Virtualization) - P2 priority
3. **Developer C**: User Story 3 (Grouping) - P3 priority

Stories complete and integrate independently. Final integration testing ensures all three work together.

---

## Task Count Summary

- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 0 tasks (leveraging existing infrastructure)
- **Phase 3 (User Story 1 - Filtering)**: 20 tasks (10 tests + 10 implementation)
- **Phase 4 (User Story 2 - Virtualization)**: 11 tasks (4 tests + 7 implementation)
- **Phase 5 (User Story 3 - Grouping)**: 21 tasks (10 tests + 11 implementation)
- **Phase 6 (Polish)**: 11 tasks
- **Total**: 67 tasks

**Parallel Opportunities**: 42 tasks marked [P] can run in parallel (63% parallelizable)

**Independent Tests**: Each user story has clear acceptance criteria and can be validated independently

**MVP Scope**: User Story 1 (24 tasks including setup) delivers core filtering capability

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD workflow: Write tests first, ensure they FAIL, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow React coding standards: named functions, non-destructured React Query
- Use wxt/storage instead of chrome.storage.local per data-model.md note
