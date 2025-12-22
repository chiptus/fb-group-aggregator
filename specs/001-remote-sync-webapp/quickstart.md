# Quick Start: Remote Sync and Web Application

**Feature**: Remote sync + web app for cross-device access
**Target Audience**: Developers implementing this feature
**Prerequisites**: Node.js 20+, pnpm, PostgreSQL, existing extension knowledge

---

## Overview

This feature adds three projects to the repository:

1. **Extension** (`extension/`) - Existing browser extension (MOVED to /extension in Phase -1)
2. **Backend API Server** (`server/`) - NEW: Node.js + Fastify + PostgreSQL
3. **Web Application** (`webapp/`) - NEW: React SPA for viewing posts

**Development Flow**: Phase -1 Restructuring → TDD → Implement → Test → Commit

---

## Phase -1: Repository Restructuring (REQUIRED FIRST)

**Before implementing sync**, you MUST restructure the repository to move the extension into `/extension`:

See **Phase -1: Repository Restructuring** in [plan.md](plan.md) for detailed steps.

**Quick version**:
```bash
# 1. Create extension directory and move files
mkdir extension
mv entrypoints lib assets public test wxt.config.ts tsconfig.json vitest.config.ts package.json extension/

# 2. Create root workspace package.json (see plan.md for content)
# 3. Update paths in extension/wxt.config.ts and extension/tsconfig.json
# 4. Test extension still works
cd extension && pnpm install && pnpm dev

# 5. Commit restructuring
git add -A
git commit -m "refactor: restructure repo with extension, server, webapp as peers"
```

**After restructuring**, your repository should look like:
```
fb-group-aggregator/
├── extension/     # Existing extension code
├── specs/         # Feature specs
├── .specify/      # Speckit templates
└── package.json   # Root workspace config
```

---

## Local Setup (After Restructuring)

### 1. Install Dependencies

```bash
# Install all workspace dependencies from root
pnpm install

# Or install individually:
cd extension && pnpm install
cd ../server && pnpm install
cd ../webapp && pnpm install
```

### 2. Setup PostgreSQL

**Docker**

```bash
docker run --name fb-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fb_group_aggregator_dev \
  -p 5432:5432 \
  -d postgres:16

```

### 3. Configure Environment

**server/.env**:

```env
DATABASE_URL=postgresql://localhost:5432/fb_group_aggregator_dev
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:5173,chrome-extension://*
```

**webapp/.env**:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
cd server
pnpm db:generate  # Generate migration from schema
pnpm db:migrate   # Apply migration
pnpm db:seed      # (Optional) Seed test data
```

### 5. Start Development Servers

**Terminal 1 - Backend**:

```bash
cd server
pnpm dev  # Starts on http://localhost:3000
```

**Terminal 2 - Web App**:

```bash
cd webapp
pnpm dev  # Starts on http://localhost:5173
```

**Terminal 3 - Extension**:

```bash
cd ../extension  # From server or webapp
pnpm dev  # WXT dev mode for Chrome

# Or from root:
pnpm dev:extension
```

---

## Development Workflow

### Phase 0: Write Tests First (TDD)

**Example: Adding POST /api/sync/posts endpoint**

1. **Write contract test** (`server/src/api/routes/posts.test.ts`):

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { request } from "supertest";
import { app } from "../../server";
import { createTestUser } from "../../../tests/helpers";

describe("POST /api/sync/posts", () => {
  let apiKey: string;

  beforeAll(async () => {
    const user = await createTestUser();
    apiKey = user.apiKey;
  });

  it("should sync valid posts", async () => {
    const response = await request(app)
      .post("/api/sync/posts")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({
        posts: [
          {
            id: "post123",
            groupId: "group456",
            authorName: "John Doe",
            contentHtml: "<p>Test post</p>",
            scrapedAt: Date.now(),
            seen: false,
            url: "https://facebook.com/...",
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.synced).toBe(1);
  });

  it("should reject missing API key", async () => {
    const response = await request(app)
      .post("/api/sync/posts")
      .send({ posts: [] });

    expect(response.status).toBe(401);
  });
});
```

2. **Run test (should fail)**:

```bash
cd server
pnpm test  # Tests fail - endpoint doesn't exist yet
```

3. **Implement endpoint** (`server/src/api/routes/posts.ts`):

```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/client";
import { posts } from "../../db/schema";

const postSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  authorName: z.string(),
  contentHtml: z.string(),
  scrapedAt: z.number(),
  seen: z.boolean(),
  url: z.string().url(),
});

const syncPostsSchema = z.object({
  posts: z.array(postSchema).max(1000),
});

export function registerPostRoutes(app: FastifyInstance) {
  app.post(
    "/api/sync/posts",
    {
      onRequest: [app.authenticate], // Auth middleware
    },
    async (request, reply) => {
      const { posts } = syncPostsSchema.parse(request.body);
      const userId = request.user.id;

      // Insert posts with conflict resolution
      const inserted = await db
        .insert(posts)
        .values(posts.map((p) => ({ ...p, userId })))
        .onConflictDoUpdate({
          target: posts.id,
          set: { seen: posts.seen, updatedAt: new Date() },
        });

      return { synced: inserted.length, conflicts: 0, errors: [] };
    }
  );
}
```

4. **Run test again (should pass)**:

```bash
pnpm test  # Tests pass ✓
```

5. **Commit**:

```bash
git add server/src/api/routes/posts.ts server/src/api/routes/posts.test.ts
git commit -m "feat(server): add POST /api/sync/posts endpoint

- Accept batch post uploads with auth
- Implement conflict resolution (merge seen status)
- Validate with Zod schema
- Return sync stats

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Phase 1: Implement Feature

Repeat TDD cycle for each endpoint/component:

- Tests first → Red
- Implementation → Green
- Refactor → Green
- Commit

### Phase 2: Integration Testing

**Test full sync flow**:

```bash
# Start all servers
pnpm dev:all  # (Add script to package.json)

# Test extension → backend sync
1. Open extension
2. Scrape posts from Facebook
3. Trigger sync (manual or wait 5 min)
4. Verify backend has posts: curl http://localhost:3000/api/sync/posts \
   -H "Authorization: Bearer <api_key>"

# Test webapp display
1. Open http://localhost:5173
2. Enter API key
3. Verify posts appear
4. Mark post as seen
5. Check extension - should show as seen
```

---

## Project Structure Guide

### Backend (`server/`)

```
server/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── posts.ts              # Posts endpoints
│   │   │   ├── posts.test.ts         # COLOCATED tests
│   │   │   ├── subscriptions.ts
│   │   │   └── subscriptions.test.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts               # API key validation
│   │   │   └── auth.test.ts
│   │   └── server.ts                 # Fastify app setup
│   ├── db/
│   │   ├── client.ts                 # Drizzle client
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   └── migrations/               # SQL migrations (auto-generated)
│   └── index.ts                      # Server entry point
├── tests/
│   ├── helpers.ts                    # Test utilities
│   └── setup.ts                      # Global test setup
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── drizzle.config.ts
```

### Web App (`webapp/`)

```
webapp/
├── src/
│   ├── components/
│   │   ├── PostList.tsx
│   │   ├── PostList.test.tsx         # COLOCATED tests
│   │   ├── PostCard.tsx
│   │   └── PostCard.test.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── HomePage.test.tsx
│   ├── hooks/
│   │   ├── useApi.ts                 # React Query hooks
│   │   └── useApi.test.ts
│   ├── services/
│   │   ├── api-client.ts             # HTTP client
│   │   └── api-client.test.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Extension Sync (`extension/lib/sync/`)

```
extension/lib/sync/
├── client.ts                         # API client for backend
├── client.test.ts                    # COLOCATED tests
├── conflict-resolver.ts              # Merge strategies
├── conflict-resolver.test.ts
├── scheduler.ts                      # chrome.alarms management
└── scheduler.test.ts
```

---

## Key Commands

### Workspace (from root)

```bash
# Development - Start all projects
pnpm dev:all              # Parallel: extension + server + webapp

# Or individually:
pnpm dev:extension        # Start extension dev mode
pnpm dev:server           # Start backend server
pnpm dev:webapp           # Start web app

# Testing
pnpm test                 # Run all tests across all projects
pnpm build:all            # Build all projects for production
```

### Backend

```bash
cd server

# Development
pnpm dev                  # Start server with hot reload
pnpm test                 # Run tests in watch mode
pnpm test:run             # Run tests once (CI)
pnpm compile              # Type-check only

# Database
pnpm db:generate          # Generate migration from schema changes
pnpm db:migrate           # Apply pending migrations
pnpm db:studio            # Open Drizzle Studio (GUI)
pnpm db:seed              # Seed test data

# Production
pnpm build                # Build for production
pnpm start                # Start production server
```

### Web App

```bash
cd webapp

# Development
pnpm dev                  # Start Vite dev server
pnpm test                 # Run tests in watch mode
pnpm test:run             # Run tests once (CI)
pnpm compile              # Type-check only

# Production
pnpm build                # Build for production
pnpm preview              # Preview production build
```

### Extension

```bash
cd extension

# Development
pnpm dev                  # WXT dev mode
pnpm test                 # Run all tests (including new sync tests)
pnpm compile              # Type-check

# Production
pnpm build                # Build extension
pnpm zip                  # Create distributable zip

# New: Test sync integration
pnpm test:sync            # Run sync-specific tests (add to package.json)
```

---

## Testing Strategy

### Unit Tests

**Location**: Colocated with source files (`*.test.ts` next to `*.ts`)

**Run**: `pnpm test` in each project directory

**Coverage Target**: 80%+

### Contract Tests

**Location**: `server/tests/contract/`

**Purpose**: Validate API endpoints match contracts/api.md spec

**Example**:

```typescript
// Validates all /api/sync/* endpoints
import { validateContract } from "./contract-validator";

describe("API Contract Compliance", () => {
  it("POST /api/sync/posts matches contract", async () => {
    const result = await validateContract("POST", "/api/sync/posts");
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

**Location**: `server/tests/integration/`

**Purpose**: Test multi-endpoint flows

**Example**:

```typescript
describe('Full Sync Flow', () => {
  it('should sync extension data to server', async () => {
    // 1. Register user
    const { apiKey } = await registerUser();

    // 2. Upload subscriptions
    await syncSubscriptions(apiKey, [...]);

    // 3. Upload groups
    await syncGroups(apiKey, [...]);

    // 4. Upload posts
    const result = await syncPosts(apiKey, [...]);

    expect(result.synced).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Future)

**Tool**: Playwright

**Purpose**: Test extension ↔ backend ↔ webapp together

---

## Debugging

### Backend API

**Enable debug logs**:

```bash
DEBUG=fastify:* pnpm dev
```

**Inspect database**:

```bash
pnpm db:studio  # Opens Drizzle Studio on http://localhost:4983
```

**SQL query logging**:

```typescript
// db/client.ts
export const db = drizzle(client, {
  logger: process.env.NODE_ENV === "development", // Logs all SQL queries
});
```

### Web App

**React DevTools**: Install browser extension

**Network Inspection**: Use browser DevTools Network tab

**Query DevTools**:

```typescript
// main.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools /> {/* Shows React Query state */}
</QueryClientProvider>;
```

### Extension Sync

**Background script logs**:

```
chrome://extensions → FB Group Aggregator → Inspect views: background page
```

**Storage inspection**:

```javascript
// In background script console
chrome.storage.local.get(["apiKey", "lastSyncAt"], console.log);
```

---

## Common Issues

### "Connection refused" when extension calls backend

**Problem**: CORS or backend not running

**Solution**:

1. Verify backend running: `curl http://localhost:3000/api/sync/status`
2. Check CORS config in `server/.env`: `CORS_ORIGINS=chrome-extension://*`
3. Restart backend after CORS changes

### "Invalid API key" error

**Problem**: API key not saved or expired

**Solution**:

1. Check chrome.storage: `chrome.storage.local.get('apiKey', console.log)`
2. Re-register: Delete apiKey, trigger sync → should call /api/auth/register

### Web app won't connect to backend

**Problem**: API URL misconfigured

**Solution**:

1. Check `webapp/.env`: `VITE_API_URL=http://localhost:3000`
2. Restart Vite after .env changes: `pnpm dev`
3. Verify in browser console: `console.log(import.meta.env.VITE_API_URL)`

### Database migration fails

**Problem**: Schema change conflicts with existing data

**Solution**:

```bash
# Reset database (DEVELOPMENT ONLY)
pnpm db:reset      # Drops all tables
pnpm db:migrate    # Re-apply migrations
pnpm db:seed       # Re-seed data
```

---

## Deployment (Future)

### Backend

**Platforms**: Render, Railway, Fly.io

**Steps**:

1. Push to GitHub
2. Connect repo to platform
3. Set environment variables (DATABASE_URL, CORS_ORIGINS)
4. Deploy

### Web App

**Platforms**: Vercel, Netlify, Cloudflare Pages

**Steps**:

1. Set build command: `pnpm build`
2. Set output directory: `dist`
3. Set environment variable: `VITE_API_URL=https://api.fb-group-aggregator.com`
4. Deploy

### Extension

No changes to existing deployment process (Chrome Web Store, Firefox Add-ons)

---

## Next Steps After Setup

1. **Read** [research.md](research.md) - Understand technology choices
2. **Read** [data-model.md](data-model.md) - Understand database schema
3. **Read** [contracts/api.md](contracts/api.md) - Understand API endpoints
4. **Run** `pnpm test:run` in all projects - Verify setup
5. **Start** implementing User Story 1 (view posts on web app) following TDD

---

## Resources

- [Fastify Documentation](https://fastify.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vitest Docs](https://vitest.dev/)
- [WXT Framework](https://wxt.dev/)
- [Project Constitution](../../../.specify/memory/constitution.md)
