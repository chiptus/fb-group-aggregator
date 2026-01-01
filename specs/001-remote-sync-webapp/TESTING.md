# Testing Guide for User Story 1: View Posts on Web Application

This guide covers how to run both automated and manual tests for the remote sync and web application feature.

## Automated Integration Test (T072)

### Prerequisites

1. **Start the PostgreSQL database**:
   ```bash
   cd server
   docker compose up -d
   ```

2. **Run database migrations** (if not already done):
   ```bash
   cd server
   pnpm db:push
   ```

### Running the Integration Test

The integration test verifies the complete sync flow: register → upload → retrieve.

```bash
cd server
pnpm test:run sync-flow
```

### What the Integration Test Covers

- **User Registration**: Creates a user and generates an API key
- **Data Upload**:
  - Creates 2 subscriptions
  - Creates 2 groups with subscription mappings
  - Uploads 2 posts
- **Data Retrieval**:
  - Verifies subscriptions are returned correctly
  - Verifies groups are returned with proper subscription IDs
  - Verifies posts are returned with correct content
- **Deduplication**: Tests that duplicate posts are updated, not duplicated
- **Data Isolation**: Verifies that different users cannot see each other's data

### Expected Result

All 3 test cases should pass:
- ✓ should complete full sync flow: register → upload → retrieve
- ✓ should handle duplicate posts correctly
- ✓ should isolate data between different users

---

## Manual Tests (T073-T076)

These tests verify the end-to-end user experience across the extension and web application.

### Setup for Manual Tests

1. **Start the backend server**:
   ```bash
   cd server
   docker compose up -d  # Start database
   pnpm db:push          # Run migrations
   pnpm dev              # Start server on http://localhost:3000
   ```

2. **Start the web application**:
   ```bash
   cd webapp
   pnpm dev              # Start on http://localhost:5173
   ```

3. **Load the extension**:
   ```bash
   cd extension
   pnpm dev              # Build extension
   ```
   - Chrome: Load unpacked extension from `extension/.output/chrome-mv3/`
   - Firefox: Load temporary extension from `extension/.output/firefox-mv2/`

### T073: Scrape Posts and Sync to Web App

**Goal**: Verify that posts scraped in the extension appear in the web application.

**Steps**:

1. **Register and get API key**:
   - Open extension popup
   - Click "Register" or similar button to get API key
   - Copy the API key shown

2. **Configure extension**:
   - Paste API key into extension settings
   - Save settings

3. **Add a Facebook group**:
   - Visit a Facebook group page (e.g., https://www.facebook.com/groups/[group-id])
   - Extension should detect the group
   - Create a subscription (e.g., "Tech Jobs")
   - Add the group to the subscription

4. **Scrape posts**:
   - Refresh the Facebook group page
   - Extension should automatically scrape posts
   - Check extension popup to see scraped post count

5. **Manual sync**:
   - Open extension popup
   - Click "Sync Now" button
   - Wait for sync to complete (status should show "Last synced: just now")

6. **Verify in web app**:
   - Open http://localhost:5173
   - Enter the API key when prompted
   - Navigate to home page
   - Verify that posts appear in the feed
   - Verify that post content, author names, and timestamps are correct

**Expected Result**:
- ✓ Posts scraped in extension appear in web app
- ✓ Post content matches what's on Facebook
- ✓ Author names are displayed correctly
- ✓ Relative timestamps show (e.g., "2 hours ago")

---

### T074: Filter Posts by Subscription

**Goal**: Verify that subscription filtering works correctly in the web application.

**Prerequisites**: Complete T073 with at least 2 subscriptions and multiple posts.

**Steps**:

1. **Create multiple subscriptions** (if not already done):
   - Subscription 1: "Tech Jobs"
   - Subscription 2: "Apartments"

2. **Add groups to different subscriptions**:
   - Add React Jobs group to "Tech Jobs"
   - Add TLV Housing group to "Apartments"

3. **Scrape posts from both groups** and sync

4. **Test filtering in web app**:
   - Open web app at http://localhost:5173
   - Click "All" in subscription filter → all posts should appear
   - Click "Tech Jobs" → only posts from React Jobs group should appear
   - Click "Apartments" → only posts from TLV Housing group should appear
   - Switch back to "All" → all posts should appear again

**Expected Result**:
- ✓ "All" shows posts from all groups
- ✓ Selecting a subscription shows only posts from groups in that subscription
- ✓ Switching between filters updates the post list correctly
- ✓ Post count changes appropriately when filtering

---

### T075: Search Posts

**Goal**: Verify that post search functionality works correctly.

**Prerequisites**: Complete T073 with multiple posts containing different content.

**Steps**:

1. **Test search by content**:
   - In web app, enter "React" in search box
   - Verify only posts containing "React" in content appear
   - Clear search → all posts should appear again

2. **Test search by author**:
   - Enter an author name in search box
   - Verify only posts by that author appear
   - Clear search → all posts should appear again

3. **Test case-insensitive search**:
   - Enter "REACT" (uppercase) in search box
   - Verify posts containing "react" (lowercase) still appear

4. **Test search with no results**:
   - Enter "xyz123nonexistent" in search box
   - Verify "No posts found" message appears
   - Verify "Try adjusting your search query" hint is shown

5. **Test search combined with filter**:
   - Select a subscription filter (e.g., "Tech Jobs")
   - Enter search query (e.g., "developer")
   - Verify results are filtered by BOTH subscription AND search query

**Expected Result**:
- ✓ Search finds posts by content (case-insensitive)
- ✓ Search finds posts by author name (case-insensitive)
- ✓ Empty results show helpful message
- ✓ Search works in combination with subscription filter
- ✓ Clearing search restores full post list

---

### T076: Verify Offline Message

**Goal**: Verify that the web app handles network failures gracefully.

**Steps**:

1. **Test with server stopped**:
   - Stop the backend server: `Ctrl+C` in server terminal
   - Open web app (or refresh if already open)
   - Enter API key
   - Verify error message appears: "Error loading data"
   - Verify user-friendly error is shown (not raw error details)

2. **Test with server restarted**:
   - Restart backend server: `cd server && pnpm dev`
   - Refresh web app
   - Verify posts load correctly

3. **Test initial load without network** (optional):
   - Disconnect from internet
   - Open web app
   - Verify connection error is shown gracefully
   - Reconnect to internet
   - Refresh → verify posts load

**Expected Result**:
- ✓ Server down shows "Error loading data" message
- ✓ Error message is user-friendly (not technical stack trace)
- ✓ App doesn't crash or show blank page
- ✓ Refreshing after server restart works correctly

---

## Test Completion Checklist

- [x] T072: Integration test written and ready to run
- [ ] T073: Manual test - scrape and sync completed
- [ ] T074: Manual test - filter posts completed
- [ ] T075: Manual test - search posts completed
- [ ] T076: Manual test - offline message completed

---

## Troubleshooting

### Database Connection Errors

If you see `ECONNREFUSED ::1:5432` or similar:
```bash
cd server
docker compose up -d
pnpm db:push
```

### Extension Not Scraping

- Check that you're on a Facebook group page (not a profile or page)
- Check browser console for errors (F12 → Console tab)
- Verify extension is enabled in browser extensions page

### Web App Not Loading Data

- Verify backend server is running on http://localhost:3000
- Check that API key is correct
- Open browser DevTools → Network tab to see API requests
- Check for CORS errors in console

### Posts Not Syncing

- Verify API key is configured in extension
- Check sync status in extension popup
- Look for sync errors in extension console (popup → right-click → Inspect)
- Verify backend server logs for sync requests

---

## Success Criteria

All tests (automated + manual) should pass, demonstrating:

1. ✅ Users can register and get an API key
2. ✅ Extension can sync subscriptions, groups, and posts to backend
3. ✅ Web app can retrieve and display synced data
4. ✅ Subscription filtering works correctly
5. ✅ Search functionality works as expected
6. ✅ Error handling is graceful and user-friendly
7. ✅ Data is properly isolated between users
8. ✅ Duplicate posts are handled correctly
