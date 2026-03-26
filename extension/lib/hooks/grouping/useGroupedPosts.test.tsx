import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/lib/types';
import { useGroupedPosts } from './useGroupedPosts';

function createMockPost(id: string, content: string, seen = false): Post {
  return {
    id,
    groupId: 'group1',
    authorName: 'Test Author',
    contentHtml: content,
    timestamp: undefined,
    scrapedAt: Date.now(),
    seen,
    url: `https://facebook.com/groups/test/posts/${id}`,
    starred: false,
  };
}

describe('useGroupedPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return grouped posts data', () => {
    const posts = [
      createMockPost('1', 'Looking for apartment in the city'),
      createMockPost('2', 'Looking for apartment in the city'),
      createMockPost('3', 'Selling my car in good condition'),
    ];

    const { result } = renderHook(() => useGroupedPosts(posts));

    expect(result.current.data).toBeDefined();
    expect(result.current.data.totalGroups).toBe(1);
  });

  it('should provide service instance', () => {
    const posts = [createMockPost('1', 'Some content here is long')];

    const { result } = renderHook(() => useGroupedPosts(posts));

    expect(result.current.service).toBeDefined();
    expect(result.current.service.strategy.name).toBe('exact-match');
  });

  it('should manage expansion state', () => {
    const posts = [
      createMockPost('1', 'Looking for apartment in the city'),
      createMockPost('2', 'Looking for apartment in the city'),
    ];

    const { result } = renderHook(() => useGroupedPosts(posts));

    expect(result.current.data).toBeDefined();

    const groupId = result.current.data.groups[0]?.id;
    expect(groupId).toBeDefined();

    // Initially collapsed
    expect(result.current.expansionState.get(groupId)).toBeUndefined();

    // Toggle expansion
    act(() => {
      result.current.toggleExpanded(groupId);
    });

    expect(result.current.expansionState.get(groupId)).toBe(true);

    // Toggle again to collapse
    act(() => {
      result.current.toggleExpanded(groupId);
    });

    expect(result.current.expansionState.get(groupId)).toBe(false);
  });

  it('should handle empty posts array', () => {
    const { result } = renderHook(() => useGroupedPosts([]));

    expect(result.current.data).toBeDefined();
    expect(result.current.data.totalGroups).toBe(0);
    expect(result.current.data.groups).toHaveLength(0);
  });

  it('should update when posts change', () => {
    const initialPosts = [
      createMockPost('1', 'Looking for apartment in the city'),
      createMockPost('2', 'Looking for apartment in the city'),
    ];

    const { result, rerender } = renderHook(
      (props: { posts: Post[] }) => useGroupedPosts(props.posts),
      {
        initialProps: { posts: initialPosts },
      }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data.totalGroups).toBe(1);

    // Add more posts with same content
    const updatedPosts = [
      ...initialPosts,
      createMockPost('3', 'Looking for apartment in the city'),
    ];

    rerender({ posts: updatedPosts });

    expect(result.current.data.groups[0]?.count).toBe(3);
  });
});
