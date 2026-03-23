import type { UseQueryResult } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FilterSettings } from '@/lib/filters/types';
import { usePosts } from '@/lib/hooks/storage/usePosts';
import type { Post } from '@/lib/types';
import { useFilteredPosts } from './useFilteredPosts';
import { useFilters } from './useFilters';

// Mock dependencies
vi.mock('@/lib/hooks/storage/usePosts');
vi.mock('./useFilters');

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

const defaultFilters: FilterSettings = {
  positiveKeywords: [],
  negativeKeywords: [],
  caseSensitive: false,
  searchFields: ['contentHtml', 'authorName'],
};

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

function mockPostsQuery(data: Post[] | undefined, isPending = false) {
  vi.mocked(usePosts).mockReturnValue({
    data,
    isSuccess: !isPending && data !== undefined,
    isPending,
    isError: false,
    error: null,
  } as UseQueryResult<Post[], Error>);
}

function mockFiltersQuery(data: FilterSettings | undefined, isPending = false) {
  vi.mocked(useFilters).mockReturnValue({
    data,
    isSuccess: !isPending && data !== undefined,
    isPending,
    isError: false,
    error: null,
  } as UseQueryResult<FilterSettings, Error>);
}

describe('useFilteredPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all posts when no filters are active', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery(defaultFilters);

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(mockPosts);
    expect(result.current.stats).toEqual({
      totalPosts: 3,
      filteredPosts: 3,
      removedPosts: 0,
      efficiency: 100,
    });
  });

  it('should filter posts by positive keywords', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery({
      positiveKeywords: ['apartment'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toHaveLength(2); // Posts 1 and 2
    expect(result.current.data?.map((p: Post) => p.id)).toEqual(
      expect.arrayContaining(['1', '2'])
    );
    expect(result.current.stats?.filteredPosts).toBe(2);
  });

  it('should filter posts by negative keywords', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery({
      positiveKeywords: [],
      negativeKeywords: ['sold'],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toHaveLength(2); // Posts 1 and 3 (not 2)
    expect(result.current.data?.map((p: Post) => p.id)).not.toContain('2');
  });

  it('should apply negative precedence when both positive and negative filters match', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery({
      positiveKeywords: ['apartment'],
      negativeKeywords: ['sold'],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    // Only post 1 should match (has "apartment" but not "sold")
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('1');
  });

  it('should handle loading state', () => {
    mockPostsQuery(undefined, true);
    mockFiltersQuery(undefined, true);

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle empty posts array', () => {
    mockPostsQuery([]);
    mockFiltersQuery(defaultFilters);

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.stats?.totalPosts).toBe(0);
  });

  it('should calculate stats correctly', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery({
      positiveKeywords: ['apartment'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats).toEqual({
      totalPosts: 3,
      filteredPosts: 2,
      removedPosts: 1,
      efficiency: expect.closeTo(66.67, 0.01),
    });
  });

  it('should return empty array when no posts match filters', () => {
    mockPostsQuery(mockPosts);
    mockFiltersQuery({
      positiveKeywords: ['nonexistent'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    const { result } = renderHook(() => useFilteredPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.stats?.filteredPosts).toBe(0);
    expect(result.current.stats?.efficiency).toBe(0);
  });
});
