---
description: "Task list for remote sync and web application implementation"
---

# Tasks: Remote Sync and Web Application

**Input**: Design documents from `/specs/001-remote-sync-webapp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This project follows Test-First Development (TDD) as per constitution. All implementation tasks have corresponding test tasks that MUST be completed first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Extension**: `extension/` (after Phase -1 restructuring)
- **Backend**: `server/src/`
- **Web app**: `webapp/src/`
- **Tests**: Colocated with source files (`.test.ts` suffix)

---

## Phase -1: Repository Restructuring (Prerequisite)

**Purpose**: Move extension to `/extension` folder for clean project separation

**⚠️ CRITICAL**: This phase MUST be completed before any other work. All subsequent tasks assume the restructured layout.

- [ ] T001 Create extension directory: `mkdir -p extension`
- [ ] T002 Move extension files to extension/ (entrypoints, lib, assets, public, test, configs)
- [ ] T003 Update extension/wxt.config.ts paths for new directory depth
- [ ] T004 Update extension/tsconfig.json paths and aliases
- [ ] T005 Move current package.json to extension/package.json
- [ ] T006 Create root package.json with pnpm workspaces config
- [ ] T007 Update .gitignore for new structure (extension/.output, server/dist, webapp/dist, .env files)
- [ ] T008 Test extension builds: `cd extension && pnpm install && pnpm dev`
- [ ] T009 Run extension tests to verify no breakage: `cd extension && pnpm test:run`
- [ ] T010 Commit restructuring with message: "refactor: restructure repo with extension, server, webapp as peers"

**Checkpoint**: Extension works from `/extension` directory, all tests pass, repository ready for server/webapp

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend and webapp projects with dependencies and configurations

- [ ] T011 [P] Create server directory structure: `server/src/{api,db,models}`, `server/tests/{integration,helpers}`
- [ ] T012 [P] Create server/package.json with Fastify, Drizzle ORM, Zod, Vitest, Supertest dependencies
- [ ] T013 [P] Create server/tsconfig.json with strict TypeScript settings
- [ ] T014 [P] Create server/vitest.config.ts for backend testing
- [ ] T015 [P] Create server/.env.example with DATABASE_URL, PORT, CORS_ORIGINS template
- [ ] T016 [P] Create webapp directory structure: `webapp/src/{components,pages,hooks,services}`
- [ ] T017 [P] Create webapp/package.json with React, Vite, React Query, Tailwind dependencies
- [ ] T018 [P] Create webapp/tsconfig.json
- [ ] T019 [P] Create webapp/vite.config.ts
- [ ] T020 [P] Create webapp/tailwind.config.ts (Tailwind v4)
- [ ] T021 [P] Create webapp/.env.example with VITE_API_URL template
- [ ] T022 [P] Install all workspace dependencies: `pnpm install` from root
- [ ] T023 [P] Create server/drizzle.config.ts for database migrations
- [ ] T024 [P] Add root workspace scripts: dev:all, test, build:all in root package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [ ] T025 Create Drizzle schema in server/src/db/schema.ts (users, subscriptions, groups, group_subscriptions, posts, sync_logs tables)
- [ ] T026 Create database client in server/src/db/client.ts with Drizzle initialization
- [ ] T027 Generate initial migration: `cd server && pnpm db:generate`
- [ ] T028 Create test helpers in server/tests/helpers.ts (createTestUser, cleanDatabase functions)

### Backend API Foundation

- [ ] T029 Create Fastify server setup in server/src/api/server.ts (CORS, error handling, logging)
- [ ] T030 Write auth middleware tests in server/src/api/middleware/auth.test.ts
- [ ] T031 Implement auth middleware in server/src/api/middleware/auth.ts (API key validation from Bearer token)
- [ ] T032 Create server entry point in server/src/index.ts
- [ ] T033 Test server starts: `cd server && pnpm dev`

### Web App Foundation

- [ ] T034 Create webapp entry point in webapp/src/main.tsx with QueryClientProvider
- [ ] T035 Create webapp App shell in webapp/src/App.tsx with basic routing
- [ ] T036 Create API client service in webapp/src/services/api-client.ts (HTTP wrapper with auth headers)
- [ ] T037 Create webapp index.html
- [ ] T038 Test webapp builds: `cd webapp && pnpm dev`

**Checkpoint**: Foundation ready - database schema exists, backend server runs, webapp builds. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - View Posts on Web Application (Priority: P1) 🎯 MVP

**Goal**: Enable cross-device access to scraped posts via web browser

**Independent Test**: Install extension, scrape posts, manually trigger sync (or wait), open web app on different device, verify posts appear with correct content

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T039 [P] [US1] Write contract test for POST /api/auth/register in server/src/api/routes/auth.test.ts
- [ ] T040 [P] [US1] Write contract test for POST /api/sync/posts in server/src/api/routes/posts.test.ts
- [ ] T041 [P] [US1] Write contract test for GET /api/sync/posts in server/src/api/routes/posts.test.ts
- [ ] T042 [P] [US1] Write contract test for POST /api/sync/subscriptions in server/src/api/routes/subscriptions.test.ts
- [ ] T043 [P] [US1] Write contract test for GET /api/sync/subscriptions in server/src/api/routes/subscriptions.test.ts
- [ ] T044 [P] [US1] Write contract test for POST /api/sync/groups in server/src/api/routes/groups.test.ts
- [ ] T045 [P] [US1] Write contract test for GET /api/sync/groups in server/src/api/routes/groups.test.ts

### Backend API Implementation for User Story 1

- [ ] T046 [P] [US1] Implement POST /api/auth/register endpoint in server/src/api/routes/auth.ts (generate UUID user + API key)
- [ ] T047 [P] [US1] Implement POST /api/sync/posts endpoint in server/src/api/routes/posts.ts (batch upload with deduplication)
- [ ] T048 [P] [US1] Implement GET /api/sync/posts endpoint in server/src/api/routes/posts.ts (paginated retrieval)
- [ ] T049 [P] [US1] Implement POST /api/sync/subscriptions endpoint in server/src/api/routes/subscriptions.ts
- [ ] T050 [P] [US1] Implement GET /api/sync/subscriptions endpoint in server/src/api/routes/subscriptions.ts
- [ ] T051 [P] [US1] Implement POST /api/sync/groups endpoint in server/src/api/routes/groups.ts (with junction table updates)
- [ ] T052 [P] [US1] Implement GET /api/sync/groups endpoint in server/src/api/routes/groups.ts (with subscription IDs resolved)
- [ ] T053 [US1] Register all routes in server/src/api/server.ts

### Extension Sync Client for User Story 1

- [ ] T054 [US1] Write tests for API client in extension/lib/sync/client.test.ts
- [ ] T055 [US1] Implement sync API client in extension/lib/sync/client.ts (HTTP wrapper for backend endpoints)
- [ ] T056 [US1] Write tests for sync manager in extension/entrypoints/background/sync-manager.test.ts
- [ ] T057 [US1] Implement manual sync trigger in extension/entrypoints/background/sync-manager.ts (full sync on demand)
- [ ] T058 [US1] Update extension types in extension/lib/types.ts (add apiKey, lastSyncAt to storage schema)
- [ ] T059 [US1] Add sync UI in extension popup (manual sync button, last sync status)

### Web App UI for User Story 1

- [ ] T060 [P] [US1] Write tests for LoginPage in webapp/src/pages/LoginPage.test.tsx
- [ ] T061 [P] [US1] Write tests for HomePage in webapp/src/pages/HomePage.test.tsx
- [ ] T062 [P] [US1] Write tests for PostList component in webapp/src/components/PostList.test.tsx
- [ ] T063 [P] [US1] Write tests for PostCard component in webapp/src/components/PostCard.test.tsx
- [ ] T064 [P] [US1] Write tests for SubscriptionFilter in webapp/src/components/SubscriptionFilter.test.tsx
- [ ] T065 [P] [US1] Implement LoginPage in webapp/src/pages/LoginPage.tsx (API key entry + localStorage)
- [ ] T066 [P] [US1] Implement useApi hook in webapp/src/hooks/useApi.ts (React Query hooks for posts, subscriptions, groups)
- [ ] T067 [P] [US1] Implement PostCard component in webapp/src/components/PostCard.tsx (display post with HTML content)
- [ ] T068 [P] [US1] Implement PostList component in webapp/src/components/PostList.tsx (list + search)
- [ ] T069 [P] [US1] Implement SubscriptionFilter in webapp/src/components/SubscriptionFilter.tsx (sidebar selector)
- [ ] T070 [US1] Implement HomePage in webapp/src/pages/HomePage.tsx (integrate PostList + SubscriptionFilter + search)
- [ ] T071 [US1] Update webapp routing in webapp/src/App.tsx (LoginPage → HomePage flow)

### Integration Testing for User Story 1

- [ ] T072 [US1] Write integration test in server/tests/integration/sync-flow.test.ts (register → upload → retrieve)
- [ ] T073 [US1] Manual test: Scrape posts in extension → manual sync → verify in webapp
- [ ] T074 [US1] Manual test: Filter posts by subscription in webapp
- [ ] T075 [US1] Manual test: Search posts in webapp
- [ ] T076 [US1] Manual test: Verify offline message when no network

**Checkpoint**: User Story 1 complete - users can view scraped posts on web app across devices

---

## Phase 4: User Story 2 - Automatic Background Sync (Priority: P2)

**Goal**: Automate sync so users don't need to manually trigger it

**Independent Test**: Scrape posts, wait 5 minutes, check backend - posts should appear without manual action

### Tests for User Story 2

- [ ] T077 [P] [US2] Write tests for sync scheduler in extension/lib/sync/scheduler.test.ts
- [ ] T078 [P] [US2] Write tests for incremental sync logic in extension/lib/sync/client.test.ts

### Implementation for User Story 2

- [ ] T079 [US2] Implement sync scheduler in extension/lib/sync/scheduler.ts (chrome.alarms API, 5-min interval)
- [ ] T080 [US2] Implement incremental sync in extension/lib/sync/client.ts (only sync changes since lastSyncAt)
- [ ] T081 [US2] Add retry logic in extension/lib/sync/client.ts (3 retries with exponential backoff)
- [ ] T082 [US2] Update sync-manager in extension/entrypoints/background/sync-manager.ts (integrate scheduler)
- [ ] T083 [US2] Add sync status indicator in extension popup (show last sync time, pending changes count)

### Integration Testing for User Story 2

- [ ] T084 [US2] Write integration test for scheduled sync in extension/lib/sync/scheduler.test.ts
- [ ] T085 [US2] Manual test: Scrape posts → wait 5 min → verify auto-sync in webapp
- [ ] T086 [US2] Manual test: Create subscription → wait → verify appears in webapp
- [ ] T087 [US2] Manual test: Disable network → enable → verify retry succeeds
- [ ] T088 [US2] Manual test: Scrape 5000 posts → verify incremental sync doesn't freeze

**Checkpoint**: User Story 2 complete - automatic background sync works without user intervention

---

## Phase 5: User Story 3 - Multi-Device Consistency (Priority: P3)

**Goal**: Changes on one device appear on all devices

**Independent Test**: Mark post as seen on device A → sync → verify seen on device B (extension + webapp)

### Tests for User Story 3

- [ ] T089 [P] [US3] Write tests for conflict resolver in extension/lib/sync/conflict-resolver.test.ts
- [ ] T090 [P] [US3] Write contract test for PATCH /api/posts/:id in server/src/api/routes/posts.test.ts
- [ ] T091 [P] [US3] Write contract test for DELETE /api/posts/:id in server/src/api/routes/posts.test.ts

### Backend Implementation for User Story 3

- [ ] T092 [P] [US3] Implement PATCH /api/posts/:id endpoint in server/src/api/routes/posts.ts (update seen status)
- [ ] T093 [P] [US3] Implement DELETE /api/posts/:id endpoint in server/src/api/routes/posts.ts (soft delete)
- [ ] T094 [US3] Implement conflict resolution in server/src/api/routes/posts.ts (merge seen status, deletion precedence)

### Extension Implementation for User Story 3

- [ ] T095 [US3] Implement conflict resolver in extension/lib/sync/conflict-resolver.ts (merge strategies)
- [ ] T096 [US3] Implement bidirectional sync in extension/lib/sync/client.ts (pull changes from server)
- [ ] T097 [US3] Update sync-manager to call bidirectional sync in extension/entrypoints/background/sync-manager.ts

### Web App Implementation for User Story 3

- [ ] T098 [P] [US3] Write tests for mark-as-seen action in webapp/src/components/PostCard.test.tsx
- [ ] T099 [P] [US3] Write tests for delete action in webapp/src/components/PostCard.test.tsx
- [ ] T100 [US3] Add mark-as-seen button to PostCard in webapp/src/components/PostCard.tsx
- [ ] T101 [US3] Add delete button to PostCard in webapp/src/components/PostCard.tsx
- [ ] T102 [US3] Implement mutation hooks in webapp/src/hooks/useApi.ts (useMarkPostSeen, useDeletePost)

### Integration Testing for User Story 3

- [ ] T103 [US3] Write integration test for conflict resolution in server/tests/integration/conflict-resolution.test.ts
- [ ] T104 [US3] Manual test: Mark seen on device A → verify on device B extension
- [ ] T105 [US3] Manual test: Delete on webapp → verify removed in extension
- [ ] T106 [US3] Manual test: Create subscription on device A → verify on device B
- [ ] T107 [US3] Manual test: Simultaneous edit (seen on A + delete on B) → verify deletion wins

**Checkpoint**: User Story 3 complete - all devices stay in sync automatically

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T108 [P] Add sync status endpoint: GET /api/sync/status in server/src/api/routes/sync.ts
- [ ] T109 [P] Write integration test for full sync flow in server/tests/integration/full-sync.test.ts
- [ ] T110 [P] Add error boundaries to webapp in webapp/src/App.tsx
- [ ] T111 [P] Add loading states to all webapp components
- [ ] T112 [P] Implement responsive design testing (375px+) for webapp
- [ ] T113 [P] Add database indexes for performance (scraped_at, user_id composite) in schema
- [ ] T114 [P] Write performance test for 50k posts in server/tests/integration/performance.test.ts
- [ ] T115 [P] Add encryption for sensitive data in transit (HTTPS required) via server config
- [ ] T116 [P] Update CLAUDE.md with new server and webapp architecture
- [ ] T117 [P] Update README.md with workspace structure and development instructions
- [ ] T118 [P] Add deployment guide in specs/001-remote-sync-webapp/deployment.md
- [ ] T119 Run quickstart.md validation (all commands work end-to-end)
- [ ] T120 Final testing: Complete integration test across extension → server → webapp

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase -1 (Restructuring)**: No dependencies - MUST START HERE
- **Phase 1 (Setup)**: Depends on Phase -1 completion
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion - No dependencies on other stories
- **Phase 4 (US2)**: Depends on Phase 2 completion - Builds on US1 sync client but is independently testable
- **Phase 5 (US3)**: Depends on Phase 2 completion - Builds on US1+US2 but is independently testable
- **Phase 6 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses sync client from US1 but adds scheduling
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses sync infrastructure from US1+US2 but adds bidirectional sync

### Within Each User Story

**TDD Workflow (STRICT)**:

1. Tests MUST be written and MUST FAIL before implementation
2. Models before services (if applicable)
3. Services before endpoints
4. Core implementation before integration
5. Story complete before moving to next priority

### Parallel Opportunities

**Phase -1**: Sequential (file moves must happen in order)

**Phase 1**: All setup tasks marked [P] can run in parallel (T011-T024)

**Phase 2**: Database tasks sequential, but API foundation (T029-T033) and webapp foundation (T034-T038) can run in parallel

**Phase 3 (US1)**:

- All test tasks (T039-T045) can run in parallel
- All backend implementations (T046-T052) can run in parallel after tests
- Extension sync client (T054-T059) and web app UI (T060-T071) can run in parallel

**Phase 4 (US2)**: Tests (T077-T078) in parallel, implementation tasks sequential

**Phase 5 (US3)**: Tests (T089-T091) in parallel, backend (T092-T094) parallel, webapp (T098-T102) parallel

**Phase 6**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 Backend

```bash
# Launch all contract tests for US1 together (write first, all should fail):
Task T039: "Write contract test for POST /api/auth/register"
Task T040: "Write contract test for POST /api/sync/posts"
Task T041: "Write contract test for GET /api/sync/posts"
Task T042: "Write contract test for POST /api/sync/subscriptions"
Task T043: "Write contract test for GET /api/sync/subscriptions"
Task T044: "Write contract test for POST /api/sync/groups"
Task T045: "Write contract test for GET /api/sync/groups"

# After tests fail, implement all endpoints in parallel:
Task T046: "Implement POST /api/auth/register endpoint"
Task T047: "Implement POST /api/sync/posts endpoint"
Task T048: "Implement GET /api/sync/posts endpoint"
Task T049: "Implement POST /api/sync/subscriptions endpoint"
Task T050: "Implement GET /api/sync/subscriptions endpoint"
Task T051: "Implement POST /api/sync/groups endpoint"
Task T052: "Implement GET /api/sync/groups endpoint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Recommended for initial release:**

1. Complete Phase -1: Repository Restructuring
2. Complete Phase 1: Setup
3. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
4. Complete Phase 3: User Story 1
5. **STOP and VALIDATE**: Test User Story 1 independently
6. Deploy backend + webapp (if ready)
7. Release extension update with manual sync

**This gives users**:

- Cross-device access to posts via web app ✅
- Manual sync when needed ✅
- Full viewing/filtering/search on web ✅

### Incremental Delivery

**After MVP:**

1. Add User Story 2 → Test independently → Release (adds automatic sync)
2. Add User Story 3 → Test independently → Release (adds multi-device consistency)
3. Polish phase → Final release

**Each story adds value without breaking previous stories.**

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase -1, Phase 1, Phase 2 together
2. Once Foundational is done:
   - **Developer A**: User Story 1 backend (T039-T053)
   - **Developer B**: User Story 1 extension (T054-T059)
   - **Developer C**: User Story 1 webapp (T060-T071)
3. Integration testing together (T072-T076)
4. Stories 2 and 3 can follow similar parallel pattern

---

## Task Completion Tracking

**Total Tasks**: 120
**By Phase**:

- Phase -1 (Restructuring): 10 tasks
- Phase 1 (Setup): 14 tasks
- Phase 2 (Foundational): 14 tasks
- Phase 3 (US1): 38 tasks
- Phase 4 (US2): 12 tasks
- Phase 5 (US3): 19 tasks
- Phase 6 (Polish): 13 tasks

**By User Story**:

- User Story 1: 38 tasks (tests + backend + extension + webapp + integration)
- User Story 2: 12 tasks (scheduling + retry + incremental)
- User Story 3: 19 tasks (bidirectional + conflict resolution + webapp actions)

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel within their phase

**Test Tasks**: 36 tasks (all tests written first per TDD)

---

## Notes

- **[P] tasks** = different files, no dependencies, safe to parallelize
- **[Story] label** = maps task to specific user story for traceability
- **Each user story is independently completable and testable**
- **Verify tests fail before implementing** (RED → GREEN → REFACTOR)
- **Commit after each task or logical group**
- **Stop at any checkpoint to validate story independently**
- **Avoid**: vague tasks, same file conflicts, cross-story dependencies that break independence

**Constitution Compliance**:

- ✅ Test-First Development: All tests written before implementation
- ✅ File Colocation: All .test.ts files next to source
- ✅ No Barrel Exports: Direct imports enforced
- ✅ React Standards: Named functions, no destructuring
- ✅ Component Size: <150 lines per component
- ✅ Commit Granularity: One logical change per commit
