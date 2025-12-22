# Research: Remote Sync and Web Application

**Created**: 2025-12-18
**Purpose**: Resolve technical decisions for backend API, database, and testing infrastructure

## Research Questions

1. Web framework for Node.js backend
2. Database choice: PostgreSQL vs MongoDB
3. Database client/ORM
4. Authentication library
5. API design pattern
6. API testing tools

---

## Decision 1: Web Framework

**Question**: Which Node.js web framework for the backend API?

**Options Evaluated**:
- **Express.js**: Minimal, flexible, huge ecosystem
- **Fastify**: Fast, schema-based validation, TypeScript-friendly
- **Hono**: Ultra-light, edge-compatible, modern

**Decision**: **Fastify**

**Rationale**:
- Built-in TypeScript support with excellent type inference
- Schema-based validation (JSON Schema) aligns with existing Zod usage in extension
- Superior performance for sync workload (handles concurrent requests better)
- Plugin ecosystem for auth, CORS, rate limiting
- Simpler than Express for modern async/await patterns

**Alternatives Considered**:
- Express: More mature but requires more boilerplate for TypeScript + validation
- Hono: Too new, smaller ecosystem, edge-runtime focus not needed

---

## Decision 2: Database Storage

**Question**: PostgreSQL vs MongoDB for remote storage?

**Options Evaluated**:
- **PostgreSQL**: Relational, ACID, structured data, JSON support
- **MongoDB**: Document store, flexible schema, JSON-native

**Decision**: **PostgreSQL**

**Rationale**:
- Data is highly structured (posts, groups, subscriptions with clear relationships)
- ACID transactions crucial for sync conflict resolution
- Foreign key constraints ensure referential integrity
- JSONB type handles HTML content efficiently
- Better for querying relationships (groups → subscriptions, posts → groups)
- Excellent TypeScript support via pg/node-postgres
- Free tier on Render, Railway, Supabase for deployment

**Alternatives Considered**:
- MongoDB: Flexible but unnecessary - schema is well-defined
- MongoDB doesn't provide same guarantees for concurrent updates needed for multi-device sync

---

## Decision 3: Database Client

**Question**: Which PostgreSQL client/ORM?

**Options Evaluated**:
- **Drizzle ORM**: TypeScript-first, lightweight, type-safe queries
- **Kysely**: Type-safe SQL query builder, no ORM overhead
- **Prisma**: Full ORM, migrations, admin UI
- **node-postgres (pg)**: Raw SQL client

**Decision**: **Drizzle ORM**

**Rationale**:
- TypeScript-first design with perfect type inference
- Lightweight (<10kb) - no runtime overhead like Prisma
- SQL-like syntax that's easy to understand and debug
- Built-in migrations support
- Zod schema integration (project already uses Zod)
- Better for simple CRUD operations than Kysely
- Simpler than Prisma for small-scale single-user system

**Alternatives Considered**:
- Kysely: Excellent but more verbose for simple queries
- Prisma: Heavy runtime, slower, overkill for simple schema
- pg: Too low-level, requires manual type mapping

---

## Decision 4: Authentication

**Question**: How to implement simple API key authentication?

**Options Evaluated**:
- **Custom middleware**: Generate API key, store in DB, validate on requests
- **Fastify JWT plugin**: Token-based auth
- **Passport.js**: Full auth framework

**Decision**: **Custom middleware with API key**

**Rationale**:
- Single-user system doesn't need complex auth
- API key generated on first extension sync, stored in DB
- Simple Bearer token validation in Fastify middleware
- Extension stores API key in chrome.storage.local
- Web app prompts for API key, stores in localStorage
- Can upgrade to JWT later if multi-user support needed
- Simplest approach per user's "always the simplest" guidance

**Alternatives Considered**:
- JWT: More complex than needed for single-user
- Passport: Overkill for simple API key validation

---

## Decision 5: API Design

**Question**: REST vs GraphQL vs tRPC?

**Options Evaluated**:
- **REST**: Standard HTTP methods, well-understood, simple
- **GraphQL**: Flexible queries, single endpoint, learning curve
- **tRPC**: End-to-end type safety, TypeScript only, simpler than GraphQL

**Decision**: **REST API**

**Rationale**:
- Simple CRUD operations (GET /api/posts, POST /api/posts/sync)
- Well-understood by all developers
- Easy to test with standard tools (curl, Postman, Vitest)
- No need for flexible querying (fixed data shapes)
- Minimal API surface: ~10 endpoints total
- Fastify has excellent REST routing support
- Simpler than GraphQL/tRPC for this use case

**Alternatives Considered**:
- GraphQL: Over-engineered for simple sync operations
- tRPC: Cool tech but adds complexity for minimal benefit with small API

**API Endpoints**:
```
POST   /api/auth/register       # Generate API key
POST   /api/sync/posts          # Batch upload posts
GET    /api/sync/posts          # Get all posts (with pagination)
PATCH  /api/posts/:id           # Update single post (seen status)
DELETE /api/posts/:id           # Delete post
POST   /api/sync/subscriptions  # Batch upload subscriptions
GET    /api/sync/subscriptions  # Get all subscriptions
POST   /api/sync/groups         # Batch upload groups
GET    /api/sync/groups         # Get all groups
```

---

## Decision 6: API Testing

**Question**: Which tools for testing the backend API?

**Options Evaluated**:
- **Vitest + Supertest**: Existing test framework + HTTP testing
- **Jest + Supertest**: Popular combo but requires new setup
- **Playwright**: E2E testing for API + web app together

**Decision**: **Vitest + Supertest**

**Rationale**:
- Project already uses Vitest for extension
- Consistent testing framework across all code
- Supertest provides clean API for HTTP testing
- Fast test execution
- Works with Fastify out of the box
- TypeScript support matches existing setup

**Alternatives Considered**:
- Jest: Would require separate test config, slower than Vitest
- Playwright: Better for E2E but heavier, use for integration tests only

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Backend Framework | Fastify | TypeScript-native, fast, schema validation |
| Database | PostgreSQL | Structured data, ACID, relationships |
| Database Client | Drizzle ORM | TypeScript-first, lightweight, Zod integration |
| Authentication | Custom API Key | Simple, single-user, extensible |
| API Design | REST | Simple CRUD, well-understood, easy testing |
| API Testing | Vitest + Supertest | Consistent with extension, TypeScript support |
| Frontend | React + Vite | Reuse extension stack, fast builds |
| Frontend State | React Query | Existing pattern from extension |
| Frontend UI | Tailwind + shadcn/ui | Existing pattern from dashboard |

---

## Dependencies to Add

**Server (`server/package.json`)**:
```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "zod": "^3.22.0",
    "@fastify/cors": "^8.5.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "drizzle-kit": "^0.20.0",
    "@types/supertest": "^6.0.0"
  }
}
```

**Webapp (`webapp/package.json`)**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

**Extension (updates to existing `package.json`)**:
```json
{
  "dependencies": {
    "// No new runtime dependencies needed": ""
  },
  "devDependencies": {
    "// Existing Vitest setup sufficient": ""
  }
}
```

---

## Migration Path from NEEDS CLARIFICATION

**Before Research**:
- Primary Dependencies: NEEDS CLARIFICATION ❌
- Storage: NEEDS CLARIFICATION ❌
- Testing: NEEDS CLARIFICATION ❌

**After Research**:
- Primary Dependencies: Fastify, Drizzle ORM, Zod, React ✅
- Storage: PostgreSQL ✅
- Testing: Vitest + Supertest ✅

All technical unknowns resolved. Ready for Phase 1: Design.
