# Data Model: Remote Sync and Web Application

**Created**: 2025-12-18
**Database**: PostgreSQL with Drizzle ORM
**Source**: Derived from existing extension types + sync requirements

## Overview

The data model extends the existing extension's local storage schema to support remote synchronization and multi-device consistency. All entities mirror chrome.storage.local structure with added fields for sync metadata.

---

## Entities

### 1. User

**Purpose**: Represents a single user account (extension installation)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| api_key | VARCHAR(64) | UNIQUE, NOT NULL, INDEXED | Generated API key for authentication |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| last_sync_at | TIMESTAMP | NULLABLE | Last successful sync timestamp |

**Relationships**:
- One user HAS MANY subscriptions
- One user HAS MANY groups
- One user HAS MANY posts

**Indexes**:
- PRIMARY: id
- UNIQUE: api_key

**Validation Rules**:
- api_key: 64-character alphanumeric string
- created_at: Cannot be in future

**State Transitions**: None (users are created, never deleted in MVP)

---

### 2. Subscription

**Purpose**: User-created category for organizing Facebook groups

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Client-generated UUID (matches extension) |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Owner of this subscription |
| name | VARCHAR(255) | NOT NULL | Display name (e.g., "Apartments TLV") |
| created_at | BIGINT | NOT NULL | Unix timestamp (milliseconds) |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modified timestamp (server) |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Relationships**:
- Many subscriptions BELONG TO one user
- One subscription HAS MANY group_subscriptions (junction)

**Indexes**:
- PRIMARY: id
- INDEX: user_id
- INDEX: deleted_at (for filtering active records)

**Validation Rules**:
- name: 1-255 characters, non-empty after trim
- created_at: Matches extension timestamp format (milliseconds since epoch)

**State Transitions**:
- Created → Active (deleted_at = NULL)
- Active → Deleted (soft delete: set deleted_at)

---

### 3. Group

**Purpose**: Facebook group tracked by extension

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(255) | PRIMARY KEY | Facebook group ID (matches extension) |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Owner of this group |
| name | VARCHAR(500) | NOT NULL | Group display name |
| url | TEXT | NOT NULL | Full Facebook group URL |
| enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether scraping is active |
| added_at | BIGINT | NOT NULL | Unix timestamp when added (milliseconds) |
| last_scraped_at | BIGINT | NULLABLE | Unix timestamp of last scrape |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modified timestamp (server) |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Relationships**:
- Many groups BELONG TO one user
- One group HAS MANY group_subscriptions (junction)
- One group HAS MANY posts

**Indexes**:
- PRIMARY: id
- INDEX: user_id
- INDEX: deleted_at
- INDEX: last_scraped_at (for sync queries)

**Validation Rules**:
- id: Non-empty string (Facebook group ID)
- url: Valid URL starting with facebook.com/groups/
- enabled: Boolean
- added_at, last_scraped_at: Positive integers (milliseconds)

**State Transitions**:
- Created (enabled=false) → Enabled (enabled=true) when assigned to subscription
- Enabled → Disabled when removed from all subscriptions
- Active → Deleted (soft delete: set deleted_at)

---

### 4. GroupSubscription (Junction Table)

**Purpose**: Many-to-many relationship between groups and subscriptions

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| group_id | VARCHAR(255) | FOREIGN KEY → groups(id), NOT NULL | Reference to group |
| subscription_id | VARCHAR(36) | FOREIGN KEY → subscriptions(id), NOT NULL | Reference to subscription |
| assigned_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When assignment was made |

**Relationships**:
- Links groups to subscriptions (many-to-many)

**Indexes**:
- PRIMARY: (group_id, subscription_id) composite key
- INDEX: subscription_id (for reverse lookups)

**Validation Rules**:
- Both group and subscription must exist and belong to same user
- No duplicate assignments

**State Transitions**: None (assignments are created or deleted)

---

### 5. Post

**Purpose**: Scraped Facebook post content

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(255) | PRIMARY KEY | Facebook post ID (matches extension) |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Owner of this post |
| group_id | VARCHAR(255) | FOREIGN KEY → groups(id), NOT NULL | Source group |
| author_name | VARCHAR(500) | NOT NULL | Post author's name |
| content_html | TEXT | NOT NULL | HTML content (sanitized on client) |
| timestamp | BIGINT | NULLABLE | Facebook post timestamp (often undefined) |
| scraped_at | BIGINT | NOT NULL, INDEXED | When extension scraped this (milliseconds) |
| seen | BOOLEAN | NOT NULL, DEFAULT FALSE | User has marked as seen |
| url | TEXT | NOT NULL | Direct link to Facebook post |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Server creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modified timestamp (server) |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Relationships**:
- Many posts BELONG TO one user
- Many posts BELONG TO one group

**Indexes**:
- PRIMARY: id
- INDEX: user_id
- INDEX: group_id
- INDEX: scraped_at (for chronological ordering)
- INDEX: seen (for filtering unseen posts)
- INDEX: deleted_at
- COMPOSITE INDEX: (user_id, scraped_at DESC) for feed queries

**Validation Rules**:
- id: Non-empty string (Facebook post ID)
- content_html: Non-empty text (HTML allowed)
- url: Valid URL
- scraped_at: Positive integer (milliseconds)
- seen: Boolean

**State Transitions**:
- Created (seen=false) → Seen (seen=true) → Unseen (seen=false) (user action)
- Active → Deleted (soft delete: set deleted_at)

---

### 6. SyncLog

**Purpose**: Track sync operations for debugging and status display

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log entry ID |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | User who synced |
| started_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Sync start time |
| completed_at | TIMESTAMP | NULLABLE | Sync completion time |
| status | VARCHAR(20) | NOT NULL | 'pending', 'success', 'failed' |
| posts_synced | INTEGER | DEFAULT 0 | Number of posts synced |
| error_message | TEXT | NULLABLE | Error details if failed |

**Relationships**:
- Many sync logs BELONG TO one user

**Indexes**:
- PRIMARY: id
- INDEX: user_id
- INDEX: started_at DESC (for recent logs)

**Validation Rules**:
- status: Must be one of ['pending', 'success', 'failed']
- posts_synced: Non-negative integer
- completed_at: Must be after started_at if present

**State Transitions**:
- Created (status='pending') → Success (status='success', completed_at set)
- Created (status='pending') → Failed (status='failed', error_message set)

---

## Schema Diagram

```
┌─────────┐
│  User   │
│─────────│
│ id (PK) │
│ api_key │
│created_at│
└────┬────┘
     │
     │ 1:N
     ├──────────────┬───────────────┬─────────────┐
     │              │               │             │
     ▼              ▼               ▼             ▼
┌──────────────┐ ┌──────┐    ┌─────────┐   ┌──────────┐
│Subscription  │ │ Group│    │  Post   │   │ SyncLog  │
│──────────────│ │──────│    │─────────│   │──────────│
│ id (PK)      │ │id(PK)│    │ id (PK) │   │ id (PK)  │
│ user_id (FK) │ │user_id    │user_id  │   │ user_id  │
│ name         │ │name  │    │group_id │   │ status   │
│ created_at   │ │url   │    │author   │   │posts_synced│
│ deleted_at   │ │enabled    │content  │   │started_at│
└──────┬───────┘ │deleted_at │scraped_at│   └──────────┘
       │         └───┬──┘    │seen     │
       │             │       │deleted_at│
       │             │       └─────┬────┘
       │             │             │
       │  N:M        │             │ N:1
       └──────┬──────┘             │
              │                    │
              ▼                    │
    ┌──────────────────┐          │
    │GroupSubscription │          │
    │──────────────────│          │
    │ group_id (PK,FK) │◄─────────┘
    │ subscription_id  │
    │   (PK, FK)       │
    │ assigned_at      │
    └──────────────────┘
```

---

## Sync Conflict Resolution

**Strategy**: Merge-based (from spec clarification)

**Rules**:
1. **Seen status**: Union (if seen on ANY device, mark seen everywhere)
2. **Deletions**: Take precedence over updates (deleted = delete everywhere)
3. **Content updates**: Last-write-wins by `updated_at` timestamp
4. **New records**: Always accept (no conflicts possible)

**Implementation**:
- Client sends `updated_at` with each record
- Server compares timestamps for existing records
- Server applies merge rules before saving
- Server returns conflict resolution results to client

---

## Migration from Extension Local Storage

**Extension Schema** (chrome.storage.local):
```typescript
{
  subscriptions: Subscription[],
  groups: Group[],
  posts: Post[]
}
```

**Migration Strategy**:
1. Extension detects no API key → calls POST /api/auth/register
2. Server creates User record, returns api_key
3. Extension stores api_key in chrome.storage.local
4. Extension triggers full sync → POST /api/sync/all with entire local dataset
5. Server inserts all records with user_id = current user
6. Future syncs are incremental (only changes since last_sync_at)

---

## Data Retention

**Policy**:
- Posts: Keep indefinitely (user-controlled deletion)
- Sync logs: Keep last 100 per user (automatic cleanup)
- Soft deletes: Keep for 30 days, then hard delete (future enhancement)

---

## Performance Considerations

**Indexing**:
- All foreign keys indexed
- Composite index on (user_id, scraped_at DESC) for main feed query
- Partial indexes on deleted_at IS NULL for active records

**Partitioning** (future):
- Partition posts table by scraped_at (monthly) if >100k posts

**Query Patterns**:
```sql
-- Most common: Get user's posts for feed (webapp)
SELECT * FROM posts
WHERE user_id = ? AND deleted_at IS NULL
ORDER BY scraped_at DESC
LIMIT 100 OFFSET ?;

-- Sync: Get all posts since last sync (extension)
SELECT * FROM posts
WHERE user_id = ? AND updated_at > ?;

-- Filter by subscription
SELECT p.* FROM posts p
JOIN groups g ON p.group_id = g.id
JOIN group_subscriptions gs ON g.id = gs.group_id
WHERE gs.subscription_id = ? AND p.deleted_at IS NULL
ORDER BY p.scraped_at DESC;
```

---

## Type Definitions (TypeScript)

**Server-side** (matches extension types):
```typescript
export interface User {
  id: string;
  apiKey: string;
  createdAt: Date;
  lastSyncAt: Date | null;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  createdAt: number; // Matches extension (milliseconds)
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  url: string;
  enabled: boolean;
  addedAt: number;
  lastScrapedAt: number | null;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Post {
  id: string;
  userId: string;
  groupId: string;
  authorName: string;
  contentHtml: string;
  timestamp: number | undefined;
  scrapedAt: number;
  seen: boolean;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SyncLog {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'pending' | 'success' | 'failed';
  postsSynced: number;
  errorMessage: string | null;
}
```

---

## Drizzle Schema (Simplified)

```typescript
// server/src/db/schema.ts
import { pgTable, uuid, varchar, text, bigint, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKey: varchar('api_key', { length: 64 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSyncAt: timestamp('last_sync_at'),
});

export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const groups = pgTable('groups', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  url: text('url').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  addedAt: bigint('added_at', { mode: 'number' }).notNull(),
  lastScrapedAt: bigint('last_scraped_at', { mode: 'number' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const posts = pgTable('posts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  groupId: varchar('group_id', { length: 255 }).references(() => groups.id).notNull(),
  authorName: varchar('author_name', { length: 500 }).notNull(),
  contentHtml: text('content_html').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }),
  scrapedAt: bigint('scraped_at', { mode: 'number' }).notNull(),
  seen: boolean('seen').default(false).notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const groupSubscriptions = pgTable('group_subscriptions', {
  groupId: varchar('group_id', { length: 255 }).references(() => groups.id).notNull(),
  subscriptionId: varchar('subscription_id', { length: 36 }).references(() => subscriptions.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey(table.groupId, table.subscriptionId),
}));

export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 20 }).notNull(),
  postsSynced: integer('posts_synced').default(0).notNull(),
  errorMessage: text('error_message'),
});
```
