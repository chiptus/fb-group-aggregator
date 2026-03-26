# Quickstart Guide: Posts Filtering and Grouping

**Feature**: Posts Filtering and Grouping Enhancements
**Date**: 2026-01-02
**Audience**: Developers implementing this feature

## Overview

This guide provides a quick-start tutorial for implementing and using the filtering and grouping features. Follow these examples to integrate the feature into the dashboard.

---

## Installation

### 1. Install Dependencies

```bash
cd extension
pnpm add @tanstack/react-virtual
```

### 2. Verify Existing Dependencies

These should already be installed:
- `@tanstack/react-query` (5.90+)
- `zod` (4.1+)
- `react` (19+)

---

## Quick Start: Filtering

### Step 1: Use the Filters Hook

```typescript
// extension/entrypoints/dashboard/components/PostFeed.tsx
import { useFilters } from '@/lib/hooks/filters/useFilters';
import { useFilteredPosts } from '@/lib/hooks/filters/useFilteredPosts';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/filters/types';

function PostFeed() {
  // Get filter settings
  const filtersQuery = useFilters();
  const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;

  // Get filtered posts
  const filteredPostsQuery = useFilteredPosts();
  const posts = filteredPostsQuery.data ?? [];

  return (
    <div>
      {/* Filter stats */}
      {filteredPostsQuery.stats && (
        <p>
          Showing {filteredPostsQuery.stats.filteredPosts} of{' '}
          {filteredPostsQuery.stats.totalPosts} posts
        </p>
      )}

      {/* Post list */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Step 2: Add Filter Controls

```typescript
// extension/entrypoints/dashboard/components/FilterControls.tsx
import { useFilters } from '@/lib/hooks/filters/useFilters';
import { useState } from 'react';

function FilterControls() {
  const filtersQuery = useFilters();
  const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;

  const [newKeyword, setNewKeyword] = useState('');

  function handleAddPositive() {
    if (newKeyword.trim()) {
      filtersQuery.addPositiveKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  }

  function handleAddNegative() {
    if (newKeyword.trim()) {
      filtersQuery.addNegativeKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  }

  return (
    <div className="space-y-4">
      {/* Keyword input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Enter keyword..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleAddPositive}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Include
        </button>
        <button
          onClick={handleAddNegative}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Exclude
        </button>
      </div>

      {/* Active filters */}
      <div className="flex flex-wrap gap-2">
        {filters.positiveKeywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-2"
          >
            {keyword}
            <button
              onClick={() => filtersQuery.removePositiveKeyword(keyword)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </span>
        ))}
        {filters.negativeKeywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full flex items-center gap-2"
          >
            -{keyword}
            <button
              onClick={() => filtersQuery.removeNegativeKeyword(keyword)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Clear all button */}
      {(filters.positiveKeywords.length > 0 || filters.negativeKeywords.length > 0) && (
        <button
          onClick={filtersQuery.clear}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
```

---

## Quick Start: Virtualized Scrolling

### Step 3: Add Virtual Scrolling

```typescript
// extension/entrypoints/dashboard/components/VirtualPostList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { Post } from '@/lib/types';

interface VirtualPostListProps {
  posts: Post[];
  renderPost: (post: Post) => JSX.Element;
}

function VirtualPostList(props: VirtualPostListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: props.posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimate PostCard height
    overscan: 5, // Render 5 items outside viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const post = props.posts[virtualItem.index];
          return (
            <div
              key={post.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {props.renderPost(post)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 4: Use Virtual List in PostFeed

```typescript
function PostFeed() {
  const filteredPostsQuery = useFilteredPosts();
  const posts = filteredPostsQuery.data ?? [];

  function renderPost(post: Post) {
    return <PostCard post={post} />;
  }

  return (
    <div>
      <FilterControls />
      <VirtualPostList posts={posts} renderPost={renderPost} />
    </div>
  );
}
```

---

## Quick Start: Post Grouping

### Step 5: Group Posts

```typescript
// extension/entrypoints/dashboard/components/GroupedPostList.tsx
import { useGroupedPosts } from '@/lib/hooks/grouping/useGroupedPosts';
import { usePosts } from '@/lib/hooks/useStorageData';

function GroupedPostList() {
  // Get all posts
  const postsQuery = usePosts();
  const posts = postsQuery.data ?? [];

  // Group posts
  const groupingQuery = useGroupedPosts(posts);
  const result = groupingQuery.data;

  if (groupingQuery.isLoading) {
    return <div>Grouping posts...</div>;
  }

  if (!result) {
    return <div>No groups found</div>;
  }

  // Get groups sorted by size
  const groups = groupingQuery.service.getGroupsSorted(result);

  // Filter to show only groups with 2+ posts
  const meaningfulGroups = groups.filter((g) => g.count >= 2);

  return (
    <div>
      {/* Stats */}
      <p>
        Found {meaningfulGroups.length} groups with{' '}
        {result.totalPostsGrouped} duplicate posts
      </p>

      {/* Groups */}
      {meaningfulGroups.map((group) => {
        const postsInGroup = groupingQuery.service.getPostsByGroup(
          group.id,
          posts,
          result
        );
        const isExpanded = groupingQuery.expansionState.get(group.id) ?? false;

        return (
          <div key={group.id} className="border rounded p-4 mb-4">
            {/* Group header */}
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={() => groupingQuery.toggleExpanded(group.id)}
                className="text-left flex-1"
              >
                <strong>{group.count} duplicate posts</strong>
                <p className="text-sm text-gray-600">
                  {group.normalizedContent.substring(0, 100)}...
                </p>
              </button>
              <button
                onClick={() => groupingQuery.markGroupSeen(group.id)}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Mark as Seen
              </button>
            </div>

            {/* Expanded posts */}
            {isExpanded && (
              <div className="space-y-2 mt-4">
                {postsInGroup.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Quick Start: Debounced Search

### Step 6: Add Debounced Search Input

```typescript
// extension/entrypoints/dashboard/components/SearchBar.tsx
import { useState, useEffect } from 'react';
import { useFilters } from '@/lib/hooks/filters/useFilters';

function SearchBar() {
  const filtersQuery = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Parse and apply filters when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      // Parse: "apartment 2br -sold" → { include: ['apartment', '2br'], exclude: ['sold'] }
      const tokens = debouncedQuery.toLowerCase().split(/\s+/);
      const positiveKeywords = tokens.filter((t) => !t.startsWith('-'));
      const negativeKeywords = tokens
        .filter((t) => t.startsWith('-'))
        .map((t) => t.slice(1));

      filtersQuery.mutate({
        positiveKeywords,
        negativeKeywords,
        caseSensitive: false,
        searchFields: ['contentHtml', 'authorName'],
      });
    } else {
      // Clear filters when search is empty
      filtersQuery.clear();
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search posts... (use -keyword to exclude)"
      className="w-full px-4 py-2 border rounded"
    />
  );
}
```

---

## Testing Examples

### Unit Test: Filter Logic

```typescript
// extension/lib/filters/filterPosts.test.ts
import { describe, it, expect } from 'vitest';
import { filterPosts } from './filterPosts';
import type { Post } from '@/lib/types';

describe('filterPosts', () => {
  const mockPosts: Post[] = [
    {
      id: '1',
      contentHtml: 'Looking for 2BR apartment in TLV',
      authorName: 'John',
      // ... other fields
    },
    {
      id: '2',
      contentHtml: 'Apartment for rent - already sold',
      authorName: 'Jane',
      // ... other fields
    },
  ];

  it('should filter by positive keywords', () => {
    const result = filterPosts(mockPosts, {
      positiveKeywords: ['apartment'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    expect(result).toHaveLength(2);
  });

  it('should exclude by negative keywords', () => {
    const result = filterPosts(mockPosts, {
      positiveKeywords: ['apartment'],
      negativeKeywords: ['sold'],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle case-insensitive matching', () => {
    const result = filterPosts(mockPosts, {
      positiveKeywords: ['APARTMENT'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    expect(result).toHaveLength(2);
  });
});
```

### Component Test: FilterControls

```typescript
// extension/entrypoints/dashboard/components/FilterControls.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterControls } from './FilterControls';

describe('FilterControls', () => {
  it('should add positive keyword', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterControls
        filters={{
          positiveKeywords: [],
          negativeKeywords: [],
          caseSensitive: false,
          searchFields: ['contentHtml'],
        }}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText(/enter keyword/i);
    const includeButton = screen.getByText(/include/i);

    await user.type(input, 'apartment');
    await user.click(includeButton);

    expect(onChange).toHaveBeenCalledWith({
      positiveKeywords: ['apartment'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });
  });
});
```

---

## Performance Optimization Tips

### 1. Memoize Filtered Results

```typescript
import { useMemo } from 'react';

const filteredPosts = useMemo(() => {
  return filterPosts(posts, filters);
}, [posts, filters]);
```

### 2. Use Set for Fast Lookups

```typescript
// ❌ Slow: O(n) lookup
const groupIds = groups.map((g) => g.id);
const filtered = posts.filter((p) => groupIds.includes(p.groupId));

// ✅ Fast: O(1) lookup
const groupIdsSet = new Set(groups.map((g) => g.id));
const filtered = posts.filter((p) => groupIdsSet.has(p.groupId));
```

### 3. Debounce Text Input Only

```typescript
// ✅ Debounce search input
const debouncedSearch = useDebounce(searchQuery, 300);

// ✅ Instant response for checkboxes
<input type="checkbox" onChange={handleChange} />
```

---

## Common Pitfalls

### ❌ Destructuring React Query Results

```typescript
// DON'T DO THIS
const { data: posts = [] } = usePosts();
```

### ✅ Use Dot Notation

```typescript
// DO THIS
const postsQuery = usePosts();
const posts = postsQuery.data ?? [];
```

### ❌ Arrow Functions for Event Handlers

```typescript
// DON'T DO THIS
const handleClick = (id: string) => { /* ... */ };
```

### ✅ Named Function Declarations

```typescript
// DO THIS
function handleClick(id: string) {
  /* ... */
}
```

---

## Next Steps

1. **Read `data-model.md`** to understand entity structure
2. **Review `contracts/`** to see all available APIs
3. **Write tests first** (TDD - see constitution)
4. **Implement services** (lib/filters/, lib/grouping/)
5. **Build UI components** (FilterControls, VirtualPostList, etc.)
6. **Integrate into dashboard** (PostsTab.tsx)

---

## Resources

- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zod Validation Docs](https://zod.dev)
- [Project CLAUDE.md](../../CLAUDE.md)
- [Project Constitution](../../.specify/memory/constitution.md)

---

## Support

For questions or issues:
1. Check `research.md` for technical decisions
2. Review `plan.md` for architecture overview
3. Consult existing hooks in `lib/hooks/useStorageData.ts` for patterns
