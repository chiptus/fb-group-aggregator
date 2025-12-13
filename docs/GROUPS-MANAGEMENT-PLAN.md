# Groups Management Feature - Implementation Progress

**Started**: 2025-12-13
**Status**: In Progress
**Goal**: Add comprehensive group management to dashboard with bulk operations and Facebook groups list scanning

---

## Feature Overview

### Requirements
1. **Scan Facebook Groups List**: Automatically discover all groups user has joined
2. **Groups Management Page**: Centralized dashboard page for managing groups
3. **Bulk Operations**: Select multiple groups and assign to subscriptions
4. **Scrape Subscription**: Trigger batch scraping for all groups in a subscription

### Key Technical Decisions
- **Scraping Strategy**: Open tabs method (safest, mimics human behavior)
- **Facebook Groups URL**: `https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added`
- **Early Stop Optimization**: Groups are ordered "recently joined first", so can stop when reaching existing group
- **UI Location**: Dashboard (not popup) with tab navigation

---

## Implementation Status

### ✅ Phase 1: Content Script & Backend (COMPLETED)

#### 1.1 Message Types Extended
**File**: [lib/types.ts](../lib/types.ts)
- ✅ Added `GroupDiscovery` type
- ✅ Added `SCRAPE_GROUPS_LIST` message type
- ✅ Added `SCRAPE_SUBSCRIPTION` message type
- ✅ Added `ScrapeGroupsListResponse` type
- ✅ Added `ScrapeSubscriptionResponse` type

#### 1.2 Groups List Scraper Created
**File**: [lib/groups-list-scraper.ts](../lib/groups-list-scraper.ts) (NEW)
- ✅ `scrapeGroupsList()` - Extract groups from Facebook list page
- ✅ `extractTotalGroupCount()` - Parse "All groups you've joined (X)"
- ✅ Multi-strategy extraction with fallbacks
- ✅ `isGroupsListPage()` - Detect if on groups list page
- ✅ `isNearBottom()` - Scroll detection for lazy loading

#### 1.3 Content Script Extended
**File**: [entrypoints/content/index.ts](../entrypoints/content/index.ts)
- ✅ Detect groups list page vs group page
- ✅ `initializeGroupsListScraping()` - Setup for groups list page
- ✅ `scrapeAndSendGroupsList()` - Scrape and send groups to background
- ✅ Early stop optimization with `scrapedGroupIds` Set
- ✅ Scroll-triggered scraping for lazy loading

#### 1.4 Background Handler Extended
**File**: [entrypoints/background/background-handler.ts](../entrypoints/background/background-handler.ts)
- ✅ `handleScrapeGroupsList()` - Process discovered groups
- ✅ Auto-create new groups with `enabled: true`, `subscriptionIds: []`
- ✅ Update existing groups (name, URL if changed)
- ✅ Return counts of new vs updated groups

---

### ✅ Phase 5: Storage Layer (COMPLETED)

**File**: [lib/storage.ts](../lib/storage.ts)
- ✅ `getGroupsBySubscription()` - Filter groups by subscription ID
- ✅ `bulkUpdateGroups()` - Update multiple groups at once
- ✅ `bulkDeleteGroups()` - Delete multiple groups + cascade delete posts

---

### ✅ Phase 4: React Query Hooks (COMPLETED)

**File**: [lib/hooks/storage/useGroups.ts](../lib/hooks/storage/useGroups.ts)
- ✅ `useScanGroupsList()` - Trigger opening groups list page
- ✅ `useBulkUpdateGroups()` - Bulk update mutation
- ✅ `useBulkDeleteGroups()` - Bulk delete mutation
- ✅ `useScrapeSubscription()` - Trigger batch scraping for subscription

---

### ✅ Phase 3: Dashboard Navigation (COMPLETED)

**File**: [entrypoints/dashboard/App.tsx](../entrypoints/dashboard/App.tsx)
- ✅ Added tab navigation (Posts | Groups)
- ✅ Tab switching logic
- ✅ Conditional rendering for Posts vs Groups view

---

### 🚧 Phase 3: GroupsPage Component (IN PROGRESS)

**Next Steps**:
1. Create `GroupsPage.tsx` component
2. Create sub-components:
   - `GroupsPageHeader.tsx` - Scan button + stats
   - `GroupsTable.tsx` - Table view with checkboxes
   - `BulkActionsBar.tsx` - Bulk operations UI
   - `GroupRow.tsx` - Individual group row

**Features to Implement**:
- Scan My Groups button
- Groups list with selection checkboxes
- Bulk assign to subscription
- Bulk enable/disable
- Bulk delete
- Individual group actions
- Search/filter functionality
- Sorting (by name, last scraped, subscription)

---

### ⏳ Phase 2: Batch Scraping (PENDING)

#### 2.1 Tab Orchestrator Module
**File**: `entrypoints/background/scraper-orchestrator.ts` (NOT CREATED YET)

**TODO**:
- `scrapeSubscription()` - Main orchestration function
- Sequential tab opening with delays
- Wait for scrape completion
- Progress tracking and reporting
- Error handling per group
- Timeout handling

#### 2.2 Background Handler Extension
**File**: [entrypoints/background/background-handler.ts](../entrypoints/background/background-handler.ts)

**TODO**:
- Add `SCRAPE_SUBSCRIPTION` message handler
- Integrate with tab orchestrator
- Send progress updates to UI

---

### ⏳ Phase 6: Remove Popup Groups Tab (PENDING)

**Files to DELETE**:
- `entrypoints/popup/components/GroupsTab.tsx`
- `entrypoints/popup/components/GroupItem.tsx`
- `entrypoints/popup/components/GroupToggle.tsx`
- `entrypoints/popup/components/GroupAssignSubscription.tsx`

**Files to MODIFY**:
- [entrypoints/popup/App.tsx](../entrypoints/popup/App.tsx)
  - Remove Groups tab
  - Update `Tab` type to only "overview" | "subscriptions"
- [entrypoints/popup/components/TabNavigation.tsx](../entrypoints/popup/components/TabNavigation.tsx)
  - Remove Groups tab option

---

### ⏳ Phase 7: Testing (PENDING)

#### Unit Tests to Create:
- `lib/groups-list-scraper.test.ts` - Test group extraction logic
- `entrypoints/background/scraper-orchestrator.test.ts` - Test tab orchestration

#### Integration Tests to Update:
- `entrypoints/background/background-handler.test.ts`
  - Add tests for `SCRAPE_GROUPS_LIST` handling
  - Add tests for `SCRAPE_SUBSCRIPTION` handling

#### Component Tests to Create:
- `entrypoints/dashboard/components/GroupsPage.test.tsx`
- `entrypoints/dashboard/components/GroupsTable.test.tsx`
- `entrypoints/dashboard/components/BulkActionsBar.test.tsx`

---

## Next Session Checklist

1. **Create GroupsPage Component**:
   - Start with basic layout and header
   - Add groups table with checkbox selection
   - Implement bulk actions bar

2. **Create Tab Orchestrator**:
   - Implement sequential tab opening
   - Add progress tracking
   - Handle errors gracefully

3. **Remove Popup Groups Tab**:
   - Delete old components
   - Update popup navigation

4. **Add Tests**:
   - Test new scraper functions
   - Test background handlers
   - Test UI components

5. **Type Check & Build**:
   - Run `pnpm compile`
   - Run `pnpm test:run`
   - Fix any errors

---

## Files Modified So Far

### Created (5 files):
1. `lib/groups-list-scraper.ts` - Groups list scraping logic
2. `docs/GROUPS-MANAGEMENT-PLAN.md` - This plan document

### Modified (6 files):
1. `lib/types.ts` - Added message types
2. `entrypoints/content/index.ts` - Groups list detection & scraping
3. `entrypoints/background/background-handler.ts` - Groups list handler
4. `lib/storage.ts` - Bulk operations
5. `lib/hooks/storage/useGroups.ts` - New React Query hooks
6. `entrypoints/dashboard/App.tsx` - Tab navigation

### Still To Create (7 files):
1. `entrypoints/background/scraper-orchestrator.ts`
2. `entrypoints/dashboard/components/GroupsPage.tsx`
3. `entrypoints/dashboard/components/GroupsPageHeader.tsx`
4. `entrypoints/dashboard/components/GroupsTable.tsx`
5. `entrypoints/dashboard/components/BulkActionsBar.tsx`
6. `entrypoints/dashboard/components/GroupRow.tsx`
7. `entrypoints/dashboard/components/ScrapeProgressModal.tsx` (optional)

---

## Testing Strategy

### Manual Testing Steps:
1. Open `facebook.com/groups/joins/` and verify groups are scraped
2. Check that groups appear in dashboard Groups tab
3. Test bulk selection and assignment
4. Test "Scrape Subscription" feature
5. Verify posts view still works

### Automated Testing:
- Unit tests for scraping logic
- Integration tests for message handlers
- Component tests for UI
- E2E test for full flow (optional)

---

## Known Issues & Edge Cases

1. **Facebook DOM Changes**: Selectors may break if Facebook updates their UI
2. **Large Group Lists** (320+ groups): Need to ensure scroll detection works
3. **Rate Limiting**: Add 3-5 second delays between group scrapes
4. **Removed Groups**: Decide whether to delete or mark as unavailable
5. **Concurrent Scraping**: Prevent multiple scrape jobs running simultaneously

---

## Success Criteria

- [x] User can click "Scan My Groups" to discover all Facebook groups
- [ ] Groups persist and display in dashboard Groups page
- [ ] User can bulk select and assign groups to subscriptions
- [ ] User can trigger batch scraping for a subscription
- [ ] Progress is visible during scraping operations
- [ ] Popup Groups Tab is removed
- [ ] All existing features still work
- [ ] Type check passes
- [ ] All tests pass
