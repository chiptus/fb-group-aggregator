# FB Group Aggregator - Project Plan

## Project Overview

A Chrome/Firefox browser extension that aggregates posts from multiple Facebook groups into a unified dashboard with subscription management.

## Architecture

- **Framework**: WXT (Web Extension Tools) with React
- **Language**: TypeScript
- **Testing**: Vitest with jsdom + @webext-core/fake-browser
- **Validation**: Zod for runtime type safety
- **Package Manager**: pnpm

## Project Status: Phase 4 Complete ✅

### ✅ Phase 0: Test Infrastructure (COMPLETED)
- [x] Configure Vitest with WXT plugin
- [x] Set up jsdom environment
- [x] Add WxtVitest plugin for browser API polyfills
- [x] Create test/setup.ts with cleanup
- [x] Verify smoke tests pass

**Files Created:**
- [vitest.config.ts](vitest.config.ts) - Vitest configuration with WxtVitest plugin
- [test/setup.ts](test/setup.ts) - Global test setup with cleanup
- [test/smoke.test.ts](test/smoke.test.ts) - Basic smoke tests

**Test Count:** 3 tests passing

---

### ✅ Phase 1: Foundation & Data Layer (COMPLETED)

#### Zod Integration
- [x] Add Zod schemas for type validation
- [x] Update storage functions to use Zod parsing
- [x] All storage operations have runtime validation

#### Data Models
- [x] `Subscription` - User-created subscription groupings
- [x] `Group` - Facebook groups with metadata
- [x] `Post` - Scraped Facebook posts with content

#### Storage Layer
- [x] Type-safe chrome.storage.local wrappers
- [x] CRUD operations for subscriptions, groups, posts
- [x] Zod validation on all read operations

**Files Created/Updated:**
- [lib/types.ts](lib/types.ts) - Zod schemas and TypeScript types
- [lib/storage.ts](lib/storage.ts) - Storage API with Zod validation
- [lib/storage.test.ts](lib/storage.test.ts) - 16 tests for storage operations

**Test Count:** 16 tests passing (19 total with smoke tests)

---

### ✅ Phase 2: Facebook Scraping (COMPLETED)

#### Scraper Module
- [x] Multi-strategy DOM extraction (handles Facebook's changing structure)
- [x] Post ID extraction (4 strategies with comment filtering)
- [x] Author extraction (3 strategies, skips timestamps)
- [x] Timestamp parsing (handles relative time like "4d", "2 hours ago")
- [x] Content HTML extraction with formatting preserved
- [x] Group info extraction from page

#### Real Facebook DOM Analysis
- [x] Tested with actual Facebook HTML
- [x] Identified comment vs post patterns
- [x] Created browser exploration tool (scraper-explorer.js)
- [x] Documented findings in SCRAPER-NOTES.md

#### Content Script
- [x] Auto-detects Facebook group pages
- [x] Scrapes on page load (1s delay for rendering)
- [x] Scrapes on scroll (for lazy-loaded posts)
- [x] Debounced scraping (2s minimum interval)
- [x] Sends scraped posts to background script via messaging
- [x] Graceful error handling
- [x] Listens for manual scrape triggers

**Files Created:**
- [lib/scraper.ts](lib/scraper.ts) - Facebook DOM scraper with multi-strategy extraction
- [lib/scraper.test.ts](lib/scraper.test.ts) - 14 tests for scraper
- [lib/scraper-explorer.js](lib/scraper-explorer.js) - Browser console exploration tool
- [lib/SCRAPER-NOTES.md](lib/SCRAPER-NOTES.md) - DOM analysis and maintenance notes
- [entrypoints/content/index.ts](entrypoints/content/index.ts) - Content script implementation (needs tests - see Phase 6)

**Test Count:** 33 tests passing total

**Key Technical Achievements:**
- Comment filtering via aria-label detection
- Relative timestamp parsing ("4d" → milliseconds)
- Multiple fallback strategies for each data field
- Type-safe with Zod runtime validation

---

## ✅ Phase 3: Background Script Coordination (COMPLETED)

### Objectives
Implement the background service worker that:
1. Receives scraped posts from content scripts ✅
2. Deduplicates posts (don't save duplicates) ✅
3. Stores posts using storage API ✅
4. Auto-registers groups when posts are scraped ✅
5. Updates group lastScrapedAt timestamps ✅
6. Handles cross-tab communication ⚠️ (Deferred - not needed yet)
7. Manages extension lifecycle ✅

### Tasks
- [x] Write tests for background script message handling
- [x] Implement background.ts message listeners
- [x] Implement post deduplication logic (handled by storage.createPosts)
- [x] Implement group auto-registration
- [x] Test storage integration
- [x] Test error scenarios

### Files Created/Updated
- [entrypoints/background/index.ts](../entrypoints/background/index.ts) - Background script entry point
- [entrypoints/background/background-handler.ts](../entrypoints/background/background-handler.ts) - Testable message handling logic (colocated)
- [entrypoints/background/background-handler.test.ts](../entrypoints/background/background-handler.test.ts) - 10 tests for background handler (colocated)
- [lib/types.ts](../lib/types.ts) - Updated message types and added ScrapePostsResponse

**Test Count:** 10 tests passing (43 total with all phases)

### Implementation Highlights
- **Auto-registration**: New groups are automatically registered when posts are scraped
- **Deduplication**: Posts are deduplicated by ID (no duplicates saved)
- **Timestamp tracking**: lastScrapedAt is updated for both new and existing groups
- **Data preservation**: Existing group settings (subscriptions, enabled state) are preserved
- **Error handling**: Comprehensive error handling with detailed error messages
- **Testability**: Logic separated into background-handler.ts (colocated with entry point) for easy testing
- **Colocation**: All background-related files in entrypoints/background/ directory

### Message Protocol
```typescript
// Content → Background
{
  type: 'SCRAPE_POSTS',
  payload: {
    groupId: string,
    groupInfo: { name: string, url: string },
    posts: Omit<Post, 'scrapedAt' | 'seen'>[]
  }
}

// Background → Content (response)
{
  success: boolean,
  count?: number,  // Number of NEW posts saved
  error?: string
}
```

---

## ✅ Phase 4: Dashboard UI (COMPLETED)

### Objectives
Build the main dashboard where users view aggregated posts.

### Features
- [x] Post list with filtering by subscription
- [x] Mark posts as seen/unseen
- [x] Search and filter posts
- [x] View post content with formatting
- [x] Open original Facebook post
- [~] Pagination/infinite scroll (Deferred - all posts loaded at once for MVP)

### Files Created/Updated
- [entrypoints/dashboard/index.html](../entrypoints/dashboard/index.html) - Dashboard HTML with proper title
- [entrypoints/dashboard/main.tsx](../entrypoints/dashboard/main.tsx) - Dashboard React entry point (existing)
- [entrypoints/dashboard/App.tsx](../entrypoints/dashboard/App.tsx) - Main dashboard component with full functionality
- [entrypoints/dashboard/App.test.tsx](../entrypoints/dashboard/App.test.tsx) - 11 comprehensive tests for dashboard

**Test Count:** 11 tests passing (54 total with all phases)

### Implementation Highlights
- **TDD Approach**: All features test-driven with comprehensive coverage
- **Subscription Filtering**: Sidebar selector for filtering posts by subscription or viewing all
- **Search**: Real-time search filtering by post content and author name
- **Post Management**: Mark posts as seen/unseen with optimistic UI updates
- **Sorting**: Posts sorted by timestamp (newest first)
- **Empty States**: Graceful handling when no posts exist
- **Facebook Integration**: Click to open original posts in new tab
- **Responsive Design**: Clean Tailwind CSS styling with proper spacing
- **Type Safety**: Full TypeScript with proper type inference
- **Performance**: useMemo for filtered posts calculation

### Dashboard Features
1. **Header**: Shows app title and unseen post count
2. **Sidebar**: Subscription selector with "All Posts" option
3. **Search Bar**: Filter posts by content or author
4. **Post Cards**: Display author, timestamp, content (HTML), and actions
5. **Post Actions**:
   - Mark as seen/unseen
   - Open on Facebook (new tab)

### Technical Details
- Uses `listSubscriptions()`, `listGroups()`, `listPosts()` from storage API
- Updates posts via `markPostAsSeen(postId, seen)`
- Filters posts by group subscription IDs
- Handles HTML content safely with DOMPurify sanitization before rendering with dangerouslySetInnerHTML (Facebook content)
- Loading state during initial data fetch
- Error handling with user-friendly error messages and reload option

---

## 📋 Phase 5: Popup UI (PLANNED)

### Objectives
Build the extension popup for quick actions and management.

### Features
- [ ] Subscription CRUD (create, rename, delete)
- [ ] Group management (add, remove, enable/disable)
- [ ] Assign groups to subscriptions
- [ ] View recent posts count
- [ ] Quick link to dashboard
- [ ] Settings

### Files to Update
- [entrypoints/popup/App.tsx](entrypoints/popup/App.tsx) - Currently placeholder
- `entrypoints/popup/components/` - Popup components
- `entrypoints/popup/App.test.tsx` - Popup tests

---

## 📋 Phase 6: Integration & Polish (PLANNED)

### Objectives
End-to-end testing and refinement.

### Tasks
- [ ] **Add content script tests** - Properly test entrypoints/content/index.ts:
  - Test `scrapeAndSend()` function behavior
  - Test `isNearBottom()` scroll detection logic
  - Test debouncing mechanism (2s minimum interval)
  - Test message listener for TRIGGER_SCRAPE
  - Test integration with chrome.runtime.sendMessage
- [ ] Manual testing with real Facebook groups
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] User feedback on scraper accuracy
- [ ] Documentation updates
- [ ] Build and package extension

---

## Development Methodology

**Test-Driven Development (TDD)**:
1. Write failing tests first
2. Implement to pass tests
3. Refactor if needed
4. All code must have test coverage

**Current Test Coverage**: 54 tests across 5 test files

---

## Known Issues & Limitations

### Facebook Scraper
- Relative timestamps are approximate (months = 30 days)
- May capture comments if Facebook changes aria-label patterns
- Facebook DOM changes frequently - requires monitoring
- No distinction between post types (photo/text/link/video)

### Maintenance Required
- Monitor for Facebook DOM changes
- Run [scraper-explorer.js](lib/scraper-explorer.js) to identify new patterns
- Update extraction strategies as needed

---

## Next Steps for New Claude Code Session

1. **Review this file** to understand current progress
2. **Run tests** to verify everything works: `pnpm test:run`
3. **Start Phase 5**: Popup UI (subscription and group management)
4. **Check [CLAUDE.md](../CLAUDE.md)** for WXT framework conventions
5. **Check [lib/SCRAPER-NOTES.md](../lib/SCRAPER-NOTES.md)** for scraper maintenance info

---

## Quick Commands

```bash
# Development
pnpm dev              # Start Chrome dev mode
pnpm dev:firefox      # Start Firefox dev mode

# Testing
pnpm test:run         # Run all tests
pnpm test:watch       # Watch mode
pnpm compile          # Type-check only

# Building
pnpm build            # Build for Chrome
pnpm build:firefox    # Build for Firefox
pnpm zip              # Package for distribution
```

---

**Last Updated**: 2025-12-07 (Phase 4 complete, 54 tests passing, Dashboard UI implemented with TDD)
