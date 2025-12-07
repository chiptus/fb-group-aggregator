# FB Group Aggregator - Project Plan

## Project Overview

A Chrome/Firefox browser extension that aggregates posts from multiple Facebook groups into a unified dashboard with subscription management.

## Architecture

- **Framework**: WXT (Web Extension Tools) with React
- **Language**: TypeScript
- **Testing**: Vitest with jsdom + @webext-core/fake-browser
- **Validation**: Zod for runtime type safety
- **Package Manager**: pnpm

## Project Status: Phase 3 Complete ✅

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
- [entrypoints/background/background.test.ts](../entrypoints/background/background.test.ts) - 10 tests for background script (colocated)
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

## 📋 Phase 4: Dashboard UI (PLANNED)

### Objectives
Build the main dashboard where users view aggregated posts.

### Features
- [ ] Post list with filtering by subscription
- [ ] Mark posts as seen/unseen
- [ ] Search and filter posts
- [ ] View post content with formatting
- [ ] Open original Facebook post
- [ ] Pagination/infinite scroll

### Files to Create
- `entrypoints/dashboard/` - Dashboard entry point directory
- `entrypoints/dashboard/index.html` - Dashboard HTML
- `entrypoints/dashboard/main.tsx` - Dashboard React entry
- `entrypoints/dashboard/App.tsx` - Main dashboard component
- `entrypoints/dashboard/components/` - UI components
- `entrypoints/dashboard/App.test.tsx` - Dashboard tests

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

**Current Test Coverage**: 43 tests across 4 test files

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
3. **Start Phase 4**: Dashboard UI (post viewing and management)
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

**Last Updated**: 2025-12-07 (Phase 3 complete, 43 tests passing, file colocation applied)
