import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/filters/types';
import type { Post } from '@/lib/types';
import { useFilteredPosts } from './useFilteredPosts';

const mockPosts: Post[] = [
  {
    id: '1',
    groupId: 'g1',
    authorName: 'John Doe',
    contentHtml: '<p>Looking for apartment</p>',
    timestamp: undefined,
    scrapedAt: Date.now(),
    seen: false,
    starred: false,
    url: 'https://facebook.com/post/1',
  },
  {
    id: '2',
    groupId: 'g1',
    authorName: 'Jane Smith',
    contentHtml: '<p>Apartment sold</p>',
    timestamp: undefined,
    scrapedAt: Date.now(),
    seen: false,
    starred: false,
    url: 'https://facebook.com/post/2',
  },
  {
    id: '3',
    groupId: 'g2',
    authorName: 'Bob Johnson',
    contentHtml: '<p>House for sale</p>',
    timestamp: undefined,
    scrapedAt: Date.now(),
    seen: true,
    starred: false,
    url: 'https://facebook.com/post/3',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFilteredPosts', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('should return all posts when no filters are active', async () => {
    await fakeBrowser.storage.local.set({
      posts: mockPosts,
      filterSettings: DEFAULT_FILTER_SETTINGS,
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual(mockPosts);
    expect(result.current.stats).toEqual({
      totalPosts: 3,
      filteredPosts: 3,
      removedPosts: 0,
      efficiency: 100,
    });
  });

  it('should pass posts and filters through filterPosts', async () => {
    await fakeBrowser.storage.local.set({
      posts: mockPosts,
      filterSettings: {
        positiveKeywords: ['apartment'],
        negativeKeywords: ['sold'],
        caseSensitive: false,
        searchFields: ['contentHtml'],
      },
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    // Post 1: has "apartment", no "sold" → included
    // Post 2: has "apartment" and "sold" → excluded (negative precedence)
    // Post 3: neither → excluded
    expect(result.current.data?.map((p: Post) => p.id)).toEqual(['1']);
  });

  it('should handle loading state', () => {
    // Storage is empty and unflushed — both queries start pending
    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle empty posts array', async () => {
    await fakeBrowser.storage.local.set({
      posts: [],
      filterSettings: DEFAULT_FILTER_SETTINGS,
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual([]);
    expect(result.current.stats?.totalPosts).toBe(0);
  });

  it('should calculate stats correctly', async () => {
    await fakeBrowser.storage.local.set({
      posts: mockPosts,
      filterSettings: {
        positiveKeywords: ['apartment'],
        negativeKeywords: [],
        caseSensitive: false,
        searchFields: ['contentHtml'],
      },
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.stats).toEqual({
      totalPosts: 3,
      filteredPosts: 2,
      removedPosts: 1,
      efficiency: expect.closeTo(66.67, 0.01),
    });
  });

  it('should return empty array when no posts match filters', async () => {
    await fakeBrowser.storage.local.set({
      posts: mockPosts,
      filterSettings: {
        positiveKeywords: ['nonexistent'],
        negativeKeywords: [],
        caseSensitive: false,
        searchFields: ['contentHtml'],
      },
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual([]);
    expect(result.current.stats?.filteredPosts).toBe(0);
    expect(result.current.stats?.efficiency).toBe(0);
  });
});
