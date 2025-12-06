# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension built with WXT (Web Extension Tools) and React. The project uses TypeScript and is configured for cross-browser compatibility (Chrome and Firefox).

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
   - Handles extension lifecycle, browser events, and cross-tab communication
   - Uses `defineBackground()` from WXT

2. **Content Script** ([entrypoints/content.ts](entrypoints/content.ts))

   - Injected into web pages matching URL patterns (currently `*://*.google.com/*`)
   - Has DOM access but isolated JavaScript environment
   - Can communicate with background script via messaging
   - Uses `defineContentScript()` with `matches` array for URL patterns

3. **Popup UI** ([entrypoints/popup/](entrypoints/popup/))
   - React application for the extension's popup interface
   - Standard React app structure: [index.html](entrypoints/popup/index.html), [main.tsx](entrypoints/popup/main.tsx), [App.tsx](entrypoints/popup/App.tsx)
   - Uses React 19 with StrictMode
   - Vite handles bundling and HMR

### Directory Structure

- `entrypoints/` - Extension entry points (background, content, popup)
- `assets/` - Static assets like images (imported via `@/assets/`)
- `public/` - Public assets copied to build (icons, etc.)
- `.wxt/` - Auto-generated WXT files (don't modify)
- `.output/` - Build output directory

### TypeScript Configuration

The project extends `.wxt/tsconfig.json` with custom options:

- `allowImportingTsExtensions: true` - Import `.ts`/`.tsx` files directly
- `jsx: "react-jsx"` - Use React 17+ JSX transform

### Path Aliases

- `@/` maps to root directory (e.g., `@/assets/react.svg`)

## Development Workflow

1. **Starting Development**: Use `pnpm dev` for Chrome or `pnpm dev:firefox` for Firefox
2. **Loading Extension**:
   - Chrome: Load unpacked extension from `.output/chrome-mv3/`
   - Firefox: Load temporary extension from `.output/firefox-mv2/`
3. **Hot Reload**: Changes to content scripts and popup are automatically reloaded
4. **Type Checking**: Run `pnpm compile` to verify TypeScript before committing

## Browser Extension Concepts

**Manifest Type**: The HTML meta tag `<meta name="manifest.type" content="browser_action" />` in popup/index.html tells WXT which manifest key to use.

**Cross-Browser Compatibility**: WXT handles differences between Chrome (Manifest V3) and Firefox (Manifest V2/V3). Test both browsers when making changes.

**Content Script Matching**: Modify the `matches` array in content.ts to change which pages the script runs on.

## Configuration Files

- [wxt.config.ts](wxt.config.ts) - WXT configuration (modules, build settings)
- [tsconfig.json](tsconfig.json) - TypeScript compiler options
- [package.json](package.json) - Dependencies and scripts

Project Overview Section:
Purpose: Aggregate Facebook group posts into custom subscription-based feeds
Key features: scraping, subscriptions, dashboard, mark as seen
Architecture Section Updates:
Document 4 entry points (not 3): background, content, popup, dashboard
Content script: runs on _://www.facebook.com/groups/_ and _://facebook.com/groups/_
Dashboard: full-page React app for viewing posts (not another popup)
New Sections to Add:
Data Model: Document Subscription, Group, Post interfaces
Storage Architecture: chrome.storage.local schema, storage.ts API
Extension Messaging: Message types between content → background
Scraper Module: lib/scraper.ts for Facebook DOM extraction
UI Framework: Tailwind CSS + shadcn/ui setup
Scraping Strategy: Current (automatic on visit) vs Future (background periodic with chrome.alarms)
Directory Structure Updates:
Add lib/ - Shared modules (types, storage, scraper, utils)
Add entrypoints/dashboard/ - Dashboard React app
Add entrypoints/dashboard/components/ - Dashboard components
