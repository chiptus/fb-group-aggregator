# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FB Group Aggregator** is a browser extension built with WXT (Web Extension Tools) and React to aggregate Facebook group posts into custom subscription-based feeds.

**Purpose**: Organize and track posts from multiple Facebook groups by categorizing them into named subscriptions (e.g., "Apartments TLV", "Jobs Tech").

**Key Features**:
- Automatically scrape posts when visiting Facebook group pages
- Organize groups into custom subscriptions
- View aggregated posts in a dedicated dashboard
- Mark posts as seen
- Delete old posts manually
- Filter posts by subscription

## Build System & Commands

**Package Manager**: pnpm (not npm or yarn)

**Development Commands**:
- `pnpm dev` - Start development mode (Chrome by default)
- `pnpm dev:firefox` - Start development mode for Firefox
- `pnpm build` - Build production extension (Chrome)
- `pnpm build:firefox` - Build production extension for Firefox
- `pnpm zip` - Create distributable zip file (Chrome)
- `pnpm zip:firefox` - Create distributable zip file for Firefox
- `pnpm compile` - Type-check TypeScript without emitting files
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with UI
- `pnpm postinstall` - Run WXT prepare (auto-runs after install)

**Important**: Always run `pnpm postinstall` or `pnpm install` after modifying dependencies, as WXT needs to regenerate type definitions.

## Architecture

### WXT Framework

This project uses WXT, a framework for building browser extensions with:
- Automatic manifest generation
- Hot Module Replacement (HMR) during development
- Built-in TypeScript support
- React integration via `@wxt-dev/module-react`

### Entry Points

Browser extensions in WXT use distinct entry points, each with a specific role:

1. **Background Script** ([entrypoints/background.ts](entrypoints/background.ts))
   - Service worker that runs in the background
   - No direct DOM access
   - Coordinates storage operations and deduplication
   - Handles messages from content script
   - Uses `defineBackground()` from WXT

2. **Content Script** ([entrypoints/content.ts](entrypoints/content.ts))
   - Injected into Facebook group pages matching:
     - `*://www.facebook.com/groups/*`
     - `*://facebook.com/groups/*`
   - Has DOM access to scrape posts
   - Sends scraped posts to background script via messaging
   - Uses `defineContentScript()` with `matches` array

3. **Popup UI** ([entrypoints/popup/](entrypoints/popup/))
   - React application for the extension's popup interface
   - Quick actions: "Add group to subscription", "Open Dashboard"
   - Display stats: subscription count, unseen posts
   - Standard React app structure with Tailwind CSS + shadcn/ui

4. **Dashboard** ([entrypoints/dashboard/](entrypoints/dashboard/))
   - Full-page React app (not a popup) for viewing aggregated posts
   - Subscription selector sidebar
   - Post feed filtered by selected subscription
   - Actions: mark posts as seen, delete old posts
   - Uses Tailwind CSS + shadcn/ui components

### Directory Structure

- `entrypoints/` - Extension entry points (background, content, popup, dashboard)
- `entrypoints/dashboard/components/` - Dashboard React components
- `lib/` - Shared modules (types, storage, scraper, utils)
- `test/` - Test setup and utilities
- `assets/` - Static assets like images (imported via `@/assets/`)
- `public/` - Public assets copied to build (icons, etc.)
- `.wxt/` - Auto-generated WXT files (don't modify)
- `.output/` - Build output directory

### Data Model

Core TypeScript interfaces defined in [lib/types.ts](lib/types.ts):

**Subscription**:
- `id`: string - Unique identifier
- `name`: string - Display name (e.g., "Apartments TLV")
- `createdAt`: number - Unix timestamp

**Group**:
- `id`: string - Facebook group ID
- `url`: string - Full Facebook group URL
- `name`: string - Group display name
- `subscriptionIds`: string[] - Array of subscription IDs (supports multi-subscription in data model)
- `addedAt`: number - Unix timestamp
- `lastScrapedAt`: number | null - Last scrape timestamp
- `enabled`: boolean - Whether scraping is enabled

**Post**:
- `id`: string - Facebook post ID
- `groupId`: string - Reference to Group
- `authorName`: string - Post author
- `contentHtml`: string - HTML content (preserves formatting/links)
- `timestamp`: number - Post creation time
- `scrapedAt`: number - When post was scraped
- `seen`: boolean - User has marked as seen
- `url`: string - Direct link to Facebook post

### Storage Architecture

**Storage Backend**: chrome.storage.local (not sync - posts are too large)

**Storage Module** ([lib/storage.ts](lib/storage.ts)):
- CRUD operations for subscriptions, groups, and posts
- Automatic post deduplication by ID
- Type-safe wrappers around chrome.storage.local API

**Storage Schema**:
```typescript
{
  subscriptions: Subscription[],
  groups: Group[],
  posts: Post[]
}
```

### Extension Messaging

**Message Protocol** (defined in [lib/types.ts](lib/types.ts)):

Content Script → Background:
- `SCRAPE_POSTS` - Send scraped posts for storage
- `GET_CURRENT_GROUP` - Query if current page's group is tracked
- `ADD_GROUP_TO_SUBSCRIPTION` - Add/update group assignment

### Scraper Module

**File**: [lib/scraper.ts](lib/scraper.ts)

**Purpose**: Extract post data from Facebook group DOM

**Extraction Strategy**:
- Identify post containers via DOM selectors
- Extract post ID from data attributes
- Extract author name, timestamp, content HTML
- Construct post URL from group + post ID
- Handle Facebook's dynamic content loading
- Graceful error handling if selectors change

**Scraping Trigger**:
- **Current**: Automatic when visiting Facebook group page
- **Future**: Background periodic scraping via chrome.alarms API

### UI Framework

**Styling**: Tailwind CSS v4
**Components**: shadcn/ui for polished UI components
**Testing**: Vitest + @testing-library/react

### TypeScript Configuration

The project extends `.wxt/tsconfig.json` with custom options:
- `allowImportingTsExtensions: true` - Import `.ts`/`.tsx` files directly
- `jsx: "react-jsx"` - Use React 17+ JSX transform

### Path Aliases

- `@/` maps to root directory (e.g., `@/lib/types.ts`)

## Development Workflow

1. **Starting Development**: Use `pnpm dev` for Chrome or `pnpm dev:firefox` for Firefox
2. **Loading Extension**:
   - Chrome: Load unpacked extension from `.output/chrome-mv3/`
   - Firefox: Load temporary extension from `.output/firefox-mv2/`
3. **Hot Reload**: Changes to content scripts and popup are automatically reloaded
4. **Type Checking**: Run `pnpm compile` to verify TypeScript before committing
5. **Testing**: Run `pnpm test` for watch mode, `pnpm test:run` for CI

## Testing Strategy

**Framework**: Vitest (fast, Vite-native, great TypeScript support)

**Libraries**:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Custom matchers
- `jsdom` - DOM environment for tests

**TDD Workflow**:
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
4. Repeat

**Test Files**:
- `lib/*.test.ts` - Unit tests for storage, scraper, utilities
- `entrypoints/*.test.ts(x)` - Integration tests for entry points
- `test/setup.ts` - Global test setup and chrome API mocks

**Running Tests**:
- `pnpm test` - Watch mode
- `pnpm test:run` - Run once (CI)
- `pnpm test:ui` - Interactive UI

## Browser Extension Concepts

**Manifest Type**: The HTML meta tag `<meta name="manifest.type" content="browser_action" />` in popup/index.html tells WXT which manifest key to use.

**Cross-Browser Compatibility**: WXT handles differences between Chrome (Manifest V3) and Firefox (Manifest V2/V3). Test both browsers when making changes.

**Content Script Matching**: The `matches` array in [entrypoints/content.ts](entrypoints/content.ts) determines which pages the script runs on.

**Message Passing**: Content scripts and background scripts communicate via `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`.

## Configuration Files

- [wxt.config.ts](wxt.config.ts) - WXT configuration (modules, build settings)
- [vitest.config.ts](vitest.config.ts) - Test configuration
- [tsconfig.json](tsconfig.json) - TypeScript compiler options
- [package.json](package.json) - Dependencies and scripts

## Migration Path

**Current Implementation**: Automatic scraping when visiting Facebook group pages

**Future Enhancement**: Background periodic scraping
- Add chrome.alarms API in background script
- Reuse same scraper module
- Trigger scraping via programmatic content script injection
- **Migration Effort**: Low - scraper stays the same, just change trigger
