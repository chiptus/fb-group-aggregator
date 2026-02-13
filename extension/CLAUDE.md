# Extension Package

WXT browser extension for scraping Facebook group posts.

## Stack

- **Framework**: WXT 0.20.x (automatic manifest, HMR)
- **UI**: React 19 + Tailwind CSS 4 + shadcn/ui
- **State**: React Query 5.x
- **Storage**: chrome.storage.local (via `lib/storage.ts`)

## Entry Points

| Entry | Purpose | File |
|-------|---------|------|
| Background | Service worker, coordinates storage | `entrypoints/background/` |
| Content | Injected into FB groups, scrapes posts | `entrypoints/content/` |
| Popup | Quick actions UI | `entrypoints/popup/` |
| Dashboard | Full post viewer | `entrypoints/dashboard/` |

## Data Model

Defined in `lib/types.ts`:

- **Subscription**: Named feed (e.g., "Apartments TLV")
- **Group**: Facebook group linked to subscriptions
- **Post**: Scraped post with `contentHtml`, `authorName`, `scrapedAt`

Post ordering uses Facebook post ID (higher = newer). `timestamp` field is always undefined (Facebook obfuscates it).

## Storage Hooks

All in `lib/hooks/`:

```typescript
// Queries
useSubscriptions(), useGroups(), usePosts()

// Mutations
useCreateSubscription(), useUpdateGroup(), useMarkPostSeen()

// Filters (lib/hooks/filters/)
useFilters(), useSaveFilters(), useFilteredPosts()

// Grouping (lib/hooks/grouping/)
useGroupedPosts(posts)
```

## Message Protocol

Content Script → Background:
- `SCRAPE_POSTS` - Send scraped posts
- `GET_CURRENT_GROUP` - Check if group is tracked
- `ADD_GROUP_TO_SUBSCRIPTION` - Assign group

## Commands

```bash
pnpm dev              # Chrome dev
pnpm dev:firefox      # Firefox dev
pnpm build            # Production build
pnpm compile          # Type check
pnpm test             # Run tests
```

After modifying dependencies, run `pnpm postinstall` (WXT regenerates types).

## Loading Extension

- Chrome: Load unpacked from `.output/chrome-mv3/`
- Firefox: Load temporary from `.output/firefox-mv2/`
