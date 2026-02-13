# Server Package

Fastify API server for remote post sync.

## Stack

- **Framework**: Fastify 5.x
- **Database**: PostgreSQL with JSONB for HTML content
- **ORM**: Drizzle ORM
- **Validation**: Zod 3.x

## Commands

```bash
pnpm dev          # Start dev server (tsx watch)
pnpm build        # Compile TypeScript
pnpm start        # Run production build
pnpm compile      # Type check
pnpm test         # Run tests
```

## Database Commands

```bash
pnpm db:generate  # Generate migrations from schema
pnpm db:migrate   # Run pending migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio GUI
```

## Structure

```
src/
  index.ts        # Server entry point
  routes/         # API route handlers
  db/
    schema.ts     # Drizzle schema definitions
    index.ts      # Database connection
```

## API Design

- RESTful endpoints for posts sync
- CORS enabled for extension/webapp access
- JSON request/response with Zod validation
