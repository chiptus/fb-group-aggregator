# Implementation Plan: Remote Sync and Web Application

**Branch**: `001-remote-sync-webapp` | **Date**: 2025-12-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-remote-sync-webapp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add remote database synchronization and standalone web application to enable cross-device access to scraped Facebook posts. Extension continues scraping locally, scheduled background job syncs data to remote storage, and users can view/manage posts via web browser on any device. Single-user authentication with merge-based conflict resolution.

## Technical Context

**Language/Version**: TypeScript 5.x (extension + web app consistency), Node.js 20.x LTS (backend)
**Primary Dependencies**: Fastify (backend framework), Drizzle ORM (database client), React + Vite (frontend), React Query (state), Tailwind CSS (UI)
**Storage**: PostgreSQL with JSONB for HTML content
**Testing**: Vitest + @testing-library/react (frontend/extension), Vitest + Supertest (backend API)
**Target Platform**: Web (Node.js backend + browser-based React frontend) + Browser Extension (existing Chrome/Firefox)
**Project Type**: Web application (backend API + frontend SPA)
**Performance Goals**: Sync 1000 posts in <2 min, web app loads in <3s, 50k+ posts supported
**Constraints**: Sync within 5 min of scraping, 99% sync success rate, offline extension operation, mobile-responsive (375px+)
**Scale/Scope**: Single-user per extension installation, 50k+ posts, cross-device sync (2-3 devices typical)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development ✅

**Status**: PASS
- All new backend API endpoints will have tests written first
- All new React components for web app will use TDD with Vitest + @testing-library/react
- Sync logic will be test-driven using existing Vitest infrastructure
- Contract tests will define API behavior before implementation

### Principle II: File Colocation ✅

**Status**: PASS
- Backend: API route handlers with collocated tests (`api/posts.ts` → `api/posts.test.ts`)
- Frontend: Components with collocated tests (`components/PostList.tsx` → `components/PostList.test.tsx`)
- Extension sync logic: Colocated tests in `lib/sync/` directory
- Follows existing project pattern

### Principle III: No Barrel Exports ✅

**Status**: PASS
- Direct imports from specific files
- No `index.ts` re-export files
- Explicit dependency graph

### Principle IV: React Coding Standards ✅

**Status**: PASS
- Named function declarations for web app components
- No destructuring of React Query results
- Consistent with existing dashboard/popup code

### Principle V: Component Size & Focus ✅

**Status**: PASS
- Web app components will follow <150 line guideline
- Sync logic separated into focused modules
- UI components reuse existing dashboard patterns where applicable

### Principle VI: Commit Granularity ✅

**Status**: PASS
- Atomic commits per feature/fix
- Conventional commit format
- Tests pass before commit

### Browser Extension Architecture ✅

**Status**: PASS - No violations
- Existing WXT framework continues to work
- Extension remains local-first with sync as enhancement
- Chrome storage + remote storage dual-mode
- New background sync job uses chrome.alarms API (WXT compatible)

### Additional Checks

**New Infrastructure Components**: Backend API server + web frontend (2 new projects)
**Justification**: Required for remote access - extension cannot serve web UI
**Complexity**: Moderate - standard web stack, follows existing React patterns

**Gate Decision**: ✅ PASS - Proceed to Phase -1 restructuring

## Phase -1: Repository Restructuring (Prerequisite)

**Purpose**: Restructure repository to cleanly separate extension, server, and webapp as peer projects

**Why**: Current structure has extension at root with server/webapp as subdirectories. For better separation of concerns and clearer architecture, move extension into its own `/extension` folder so all three projects are peers.

### Restructuring Tasks

1. **Create extension directory structure**
   ```bash
   mkdir -p extension
   ```

2. **Move extension files**
   - Move `entrypoints/` → `extension/entrypoints/`
   - Move `lib/` → `extension/lib/`
   - Move `assets/` → `extension/assets/`
   - Move `public/` → `extension/public/`
   - Move `components/` → `extension/components/` (if exists)
   - Move `test/` → `extension/test/`
   - Move `wxt.config.ts` → `extension/wxt.config.ts`
   - Move `tsconfig.json` → `extension/tsconfig.json`
   - Move `vitest.config.ts` → `extension/vitest.config.ts`
   - Move `tailwind.config.ts` → `extension/tailwind.config.ts` (if exists)
   - Move `.output/` → `extension/.output/`
   - Move `.wxt/` → `extension/.wxt/`

3. **Update extension/wxt.config.ts**
   - Update all relative paths to account for new directory depth
   - Ensure outDir points to `.output/` (relative to extension/)

4. **Update extension/tsconfig.json**
   - Update path aliases if needed (e.g., `@/*` should point to `./` or `./src/`)
   - Ensure paths work from extension/ directory

5. **Create root package.json for workspace**
   ```json
   {
     "name": "fb-group-aggregator",
     "private": true,
     "workspaces": [
       "extension",
       "server",
       "webapp"
     ],
     "scripts": {
       "dev:extension": "pnpm --filter extension dev",
       "dev:server": "pnpm --filter server dev",
       "dev:webapp": "pnpm --filter webapp dev",
       "dev:all": "pnpm run --parallel dev:extension dev:server dev:webapp",
       "test": "pnpm run --recursive test",
       "build:all": "pnpm run --recursive build"
     }
   }
   ```

6. **Move existing package.json to extension/package.json**
   - Rename current root package.json → extension/package.json
   - Add `"name": "fb-group-aggregator-extension"` if not present

7. **Update .gitignore**
   - Add `extension/.output/`
   - Add `extension/.wxt/`
   - Add `server/dist/`
   - Add `webapp/dist/`
   - Add `server/.env`
   - Add `webapp/.env`

8. **Test extension still works**
   ```bash
   cd extension
   pnpm install
   pnpm dev
   # Verify extension loads in chrome://extensions
   # Test scraping, dashboard, popup
   pnpm test:run
   # All tests should pass
   ```

9. **Commit restructuring**
   ```bash
   git add -A
   git commit -m "refactor: restructure repo with extension, server, webapp as peers

   - Move extension code to /extension directory
   - Create pnpm workspace at root
   - Update paths in wxt.config.ts and tsconfig.json
   - Extension functionality unchanged, all tests pass

   Prepares repository for adding server and webapp projects.

   🤖 Generated with Claude Code
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

### Success Criteria

- ✅ Extension builds successfully from `extension/` directory
- ✅ Extension loads in browser with all features working
- ✅ All existing tests pass (`pnpm test:run` in extension/)
- ✅ No functionality broken
- ✅ Clean git commit with restructuring complete

**Duration Estimate**: 30 minutes - 1 hour

**Blockers**: None - straightforward file moves and config updates

**After Completion**: Proceed to implement server and webapp in Phase 0+

---

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**After Phase -1 Restructuring**:

```text
fb-group-aggregator/
├── extension/                    # MOVED - Browser extension (existing code)
│   ├── entrypoints/
│   │   ├── background/
│   │   │   ├── index.ts
│   │   │   ├── sync-manager.ts          # NEW: Manages sync schedule
│   │   │   └── sync-manager.test.ts     # NEW: Sync tests
│   │   ├── content/
│   │   ├── popup/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── sync/                         # NEW: Sync logic library
│   │   │   ├── client.ts                 # API client for backend
│   │   │   ├── client.test.ts
│   │   │   ├── conflict-resolver.ts      # Merge strategies
│   │   │   └── conflict-resolver.test.ts
│   │   ├── storage.ts                    # EXISTING: Local storage
│   │   ├── types.ts                      # UPDATED: Add sync-related types
│   │   └── ...
│   ├── assets/
│   ├── public/
│   ├── test/
│   ├── wxt.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── package.json
│
├── server/                       # NEW - Backend API Server
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── posts.ts              # POST /api/posts, GET /api/posts
│   │   │   │   ├── posts.test.ts
│   │   │   │   ├── subscriptions.ts
│   │   │   │   ├── subscriptions.test.ts
│   │   │   │   ├── groups.ts
│   │   │   │   └── groups.test.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts               # API key validation
│   │   │   │   └── auth.test.ts
│   │   │   └── server.ts                 # Fastify app setup
│   │   ├── db/
│   │   │   ├── client.ts                 # Database connection
│   │   │   ├── schema.ts                 # Drizzle schema
│   │   │   └── migrations/               # Schema migrations
│   │   ├── models/
│   │   │   ├── post.ts
│   │   │   ├── subscription.ts
│   │   │   └── group.ts
│   │   └── index.ts                      # Server entry point
│   ├── tests/
│   │   ├── integration/                  # API integration tests
│   │   └── e2e/                          # End-to-end tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── webapp/                       # NEW - Web Application Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostList.test.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostCard.test.tsx
│   │   │   ├── SubscriptionFilter.tsx
│   │   │   └── SubscriptionFilter.test.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx              # Main feed view
│   │   │   ├── HomePage.test.tsx
│   │   │   └── LoginPage.tsx             # API key entry
│   │   ├── hooks/
│   │   │   ├── useApi.ts                 # API data fetching
│   │   │   └── useApi.test.ts
│   │   ├── services/
│   │   │   ├── api-client.ts             # Backend API calls
│   │   │   └── api-client.test.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── tsconfig.json
│
├── specs/                        # EXISTING - Feature specifications
│   └── 001-remote-sync-webapp/
├── .specify/                     # EXISTING - Speckit templates
├── package.json                  # NEW - Root workspace config (pnpm workspaces)
├── .gitignore                    # UPDATED - Add new project outputs
└── README.md                     # UPDATED - Document workspace structure
```

**Structure Decision**: Three peer projects (extension, server, webapp) with pnpm workspaces

**Rationale**:
- **Clean separation**: Each project is independent and self-contained
- **Consistent structure**: All three projects are peers at root level
- **Workspace benefits**: Shared dependencies, parallel commands, unified testing
- **Scalability**: Easy to add more projects (e.g., admin panel, CLI tools)
- **Clear boundaries**: No ambiguity about which code belongs to which project
- **Better DX**: Each project has its own package.json, can be developed independently

**Trade-offs**:
- ✅ Cleaner architecture (worth the upfront restructuring)
- ⚠️ Requires Phase -1 restructuring before implementing sync (30-60 min)
- ✅ Extension tests must pass after restructuring (validates no breakage)

## Complexity Tracking

No constitution violations - section not applicable.
