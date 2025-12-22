# API Contracts: Remote Sync and Web Application

**Version**: 1.0.0
**Base URL**: `https://api.fb-group-aggregator.com` (production) or `http://localhost:3000` (development)
**Authentication**: Bearer token (API key in Authorization header)
**Content-Type**: `application/json`

---

## Authentication

All endpoints except `/api/auth/register` require authentication.

**Header**:
```
Authorization: Bearer <api_key>
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: API key valid but access denied

---

## Endpoints

### 1. Register User

**Purpose**: Generate API key for new user (extension first sync)

```
POST /api/auth/register
```

**Request Body**: None (anonymous registration)

**Response** (`201 Created`):
```json
{
  "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2025-12-18T10:30:00.000Z"
}
```

**Errors**:
- `500 Internal Server Error`: Failed to generate API key

**Notes**:
- Extension calls this once on first sync
- Stores returned apiKey in chrome.storage.local
- userId is auto-generated UUID

---

### 2. Sync Posts (Upload)

**Purpose**: Batch upload posts from extension

```
POST /api/sync/posts
```

**Authentication**: Required

**Request Body**:
```json
{
  "posts": [
    {
      "id": "10159123456789012",
      "groupId": "123456789012345",
      "authorName": "John Doe",
      "contentHtml": "<p>Looking for an apartment...</p>",
      "timestamp": undefined,
      "scrapedAt": 1702900800000,
      "seen": false,
      "url": "https://www.facebook.com/groups/123456789012345/posts/10159123456789012/"
    }
  ]
}
```

**Response** (`200 OK`):
```json
{
  "synced": 42,
  "conflicts": 0,
  "errors": []
}
```

**Response** (`207 Multi-Status` - partial success):
```json
{
  "synced": 40,
  "conflicts": 2,
  "errors": [
    {
      "postId": "10159123456789013",
      "error": "Group not found"
    }
  ]
}
```

**Errors**:
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing/invalid API key
- `413 Payload Too Large`: Too many posts (>1000 per request)

**Notes**:
- Maximum 1000 posts per request
- Server deduplicates by post ID
- Applies merge conflict resolution
- Returns count of successfully synced posts

---

### 3. Get Posts (Download)

**Purpose**: Fetch all posts for user (webapp or extension pull sync)

```
GET /api/sync/posts?limit=100&offset=0&since=1702900000000
```

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of posts to return (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)
- `since` (optional): Unix timestamp (ms) - only return posts updated after this time

**Response** (`200 OK`):
```json
{
  "posts": [
    {
      "id": "10159123456789012",
      "groupId": "123456789012345",
      "authorName": "John Doe",
      "contentHtml": "<p>Looking for an apartment...</p>",
      "timestamp": null,
      "scrapedAt": 1702900800000,
      "seen": false,
      "url": "https://www.facebook.com/groups/123456789012345/posts/10159123456789012/",
      "createdAt": "2025-12-18T10:30:00.000Z",
      "updatedAt": "2025-12-18T10:30:00.000Z",
      "deletedAt": null
    }
  ],
  "total": 5432,
  "limit": 100,
  "offset": 0
}
```

**Errors**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Returns only non-deleted posts (deletedAt = null) unless explicitly requested
- Sorted by scrapedAt DESC (newest first)
- Use `since` parameter for incremental sync

---

### 4. Update Post

**Purpose**: Mark post as seen/unseen (webapp or extension)

```
PATCH /api/posts/:id
```

**Authentication**: Required

**Request Body**:
```json
{
  "seen": true
}
```

**Response** (`200 OK`):
```json
{
  "id": "10159123456789012",
  "seen": true,
  "updatedAt": "2025-12-18T11:00:00.000Z"
}
```

**Errors**:
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing/invalid API key
- `404 Not Found`: Post not found or belongs to different user

**Notes**:
- Only `seen` field is mutable via this endpoint
- Content, author, etc. are immutable after creation
- Updates `updatedAt` timestamp for sync tracking

---

### 5. Delete Post

**Purpose**: Soft delete post (webapp or extension)

```
DELETE /api/posts/:id
```

**Authentication**: Required

**Request Body**: None

**Response** (`204 No Content`):
(Empty body)

**Errors**:
- `401 Unauthorized`: Missing/invalid API key
- `404 Not Found`: Post not found or belongs to different user

**Notes**:
- Soft delete: sets `deletedAt` timestamp
- Post still exists in database but hidden from queries
- Sync propagates deletion to all devices

---

### 6. Sync Subscriptions (Upload)

**Purpose**: Batch upload subscriptions from extension

```
POST /api/sync/subscriptions
```

**Authentication**: Required

**Request Body**:
```json
{
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Apartments TLV",
      "createdAt": 1702900800000
    }
  ]
}
```

**Response** (`200 OK`):
```json
{
  "synced": 5,
  "conflicts": 0,
  "errors": []
}
```

**Errors**:
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Server deduplicates by subscription ID
- Last-write-wins for conflicts

---

### 7. Get Subscriptions

**Purpose**: Fetch all subscriptions for user

```
GET /api/sync/subscriptions
```

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Apartments TLV",
      "createdAt": 1702900800000,
      "updatedAt": "2025-12-18T10:30:00.000Z",
      "deletedAt": null
    }
  ],
  "total": 5
}
```

**Errors**:
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Returns only non-deleted subscriptions

---

### 8. Sync Groups (Upload)

**Purpose**: Batch upload groups from extension

```
POST /api/sync/groups
```

**Authentication**: Required

**Request Body**:
```json
{
  "groups": [
    {
      "id": "123456789012345",
      "name": "Tel Aviv Apartments",
      "url": "https://www.facebook.com/groups/123456789012345/",
      "enabled": true,
      "subscriptionIds": ["550e8400-e29b-41d4-a716-446655440001"],
      "addedAt": 1702900800000,
      "lastScrapedAt": 1702904400000
    }
  ]
}
```

**Response** (`200 OK`):
```json
{
  "synced": 10,
  "conflicts": 0,
  "errors": []
}
```

**Errors**:
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Server creates/updates GroupSubscription junction records
- Validates subscriptionIds exist and belong to user

---

### 9. Get Groups

**Purpose**: Fetch all groups for user

```
GET /api/sync/groups
```

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "groups": [
    {
      "id": "123456789012345",
      "name": "Tel Aviv Apartments",
      "url": "https://www.facebook.com/groups/123456789012345/",
      "enabled": true,
      "subscriptionIds": ["550e8400-e29b-41d4-a716-446655440001"],
      "addedAt": 1702900800000,
      "lastScrapedAt": 1702904400000,
      "updatedAt": "2025-12-18T10:30:00.000Z",
      "deletedAt": null
    }
  ],
  "total": 10
}
```

**Errors**:
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Returns groups with resolved subscriptionIds array
- Includes junction table data

---

### 10. Get Sync Status

**Purpose**: Check last sync status and stats (for extension/webapp UI)

```
GET /api/sync/status
```

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "lastSyncAt": "2025-12-18T10:30:00.000Z",
  "stats": {
    "totalPosts": 5432,
    "unseenPosts": 123,
    "totalGroups": 10,
    "totalSubscriptions": 5
  },
  "recentLogs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "startedAt": "2025-12-18T10:29:45.000Z",
      "completedAt": "2025-12-18T10:30:12.000Z",
      "status": "success",
      "postsSynced": 42
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Missing/invalid API key

**Notes**:
- Returns last 5 sync logs
- Used for displaying sync status in extension popup/webapp

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or has been revoked",
    "details": {
      "field": "Authorization",
      "value": "Bearer abc123..."
    }
  }
}
```

**Common Error Codes**:
- `INVALID_API_KEY`: API key missing, malformed, or invalid
- `VALIDATION_ERROR`: Request body validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (duplicate ID)
- `RATE_LIMIT_EXCEEDED`: Too many requests (future enhancement)

---

## Rate Limiting (Future)

**Current**: No rate limiting
**Planned**: 100 requests per minute per API key

**Headers** (when implemented):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702900920
```

---

## Versioning

**Strategy**: URL path versioning (e.g., `/api/v1/posts`)

**Current**: v1 (implicit, no version in path)
**Future**: Version in path when breaking changes needed

---

## CORS Configuration

**Allowed Origins**:
- `chrome-extension://*` (for browser extension)
- `https://webapp.fb-group-aggregator.com` (production webapp)
- `http://localhost:5173` (development webapp - Vite default)

**Allowed Methods**: GET, POST, PATCH, DELETE, OPTIONS
**Allowed Headers**: Authorization, Content-Type

---

## Request/Response Examples

### Full Sync Flow (Extension → Server)

**Step 1: Register (first time only)**
```bash
curl -X POST http://localhost:3000/api/auth/register
```

Response:
```json
{
  "apiKey": "a1b2c3...f2",
  "userId": "550e8400-...",
  "createdAt": "2025-12-18T10:30:00.000Z"
}
```

**Step 2: Upload subscriptions**
```bash
curl -X POST http://localhost:3000/api/sync/subscriptions \
  -H "Authorization: Bearer a1b2c3...f2" \
  -H "Content-Type: application/json" \
  -d '{"subscriptions": [{"id": "sub1", "name": "Apartments", "createdAt": 1702900800000}]}'
```

**Step 3: Upload groups**
```bash
curl -X POST http://localhost:3000/api/sync/groups \
  -H "Authorization: Bearer a1b2c3...f2" \
  -H "Content-Type: application/json" \
  -d '{"groups": [{"id": "grp1", "name": "TLV Apartments", "url": "...", "enabled": true, "subscriptionIds": ["sub1"], "addedAt": 1702900800000}]}'
```

**Step 4: Upload posts**
```bash
curl -X POST http://localhost:3000/api/sync/posts \
  -H "Authorization: Bearer a1b2c3...f2" \
  -H "Content-Type: application/json" \
  -d '{"posts": [{...1000 posts...}]}'
```

---

## Testing Contracts

**Contract Tests** (server/tests/contract/):
- Validate request/response schemas against this spec
- Use JSON Schema validation
- Test all endpoints with valid/invalid payloads
- Verify error responses match documented format

**Example Test**:
```typescript
describe('POST /api/sync/posts', () => {
  it('should accept valid post batch', async () => {
    const response = await request(app)
      .post('/api/sync/posts')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ posts: [validPost] });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      synced: expect.any(Number),
      conflicts: expect.any(Number),
      errors: expect.any(Array),
    });
  });
});
```
