import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/lib/types';
import { renderWithQuery } from '@/test/test-utils';
import type { VirtualPostListProps } from './VirtualPostList';
import { VirtualPostList } from './VirtualPostList';

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [
      { index: 0, key: '0', start: 0, size: 200 },
      { index: 1, key: '1', start: 200, size: 200 },
      { index: 2, key: '2', start: 400, size: 200 },
    ],
    getTotalSize: () => 600,
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  })),
}));

function createMockPost(id: string, content = 'Test content'): Post {
  return {
    id,
    groupId: 'group1',
    authorName: 'Test Author',
    contentHtml: content,
    timestamp: undefined,
    scrapedAt: Date.now(),
    seen: false,
    url: `https://facebook.com/groups/test/posts/${id}`,
    starred: false,
  };
}

function createMockPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPost(`post-${i}`, `Content for post ${i}`)
  );
}

describe('VirtualPostList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the scroll container', () => {
    renderComponent();
    expect(screen.getByTestId('virtual-scroll-container')).toBeInTheDocument();
  });

  it('renders posts via renderPost', () => {
    renderComponent({ posts: createMockPosts(3) });
    // Virtualizer mock returns 3 virtual items (indices 0-2)
    expect(screen.getByTestId('post-post-0')).toBeInTheDocument();
    expect(screen.getByTestId('post-post-1')).toBeInTheDocument();
    expect(screen.getByTestId('post-post-2')).toBeInTheDocument();
  });

  it('calls renderPost with the correct post object', () => {
    const posts = createMockPosts(3);
    const renderPost = vi.fn((post: Post) => (
      <div data-testid={`post-${post.id}`}>{post.contentHtml}</div>
    ));
    renderWithQuery(
      <VirtualPostList posts={posts} height={400} renderPost={renderPost} />
    );
    // Virtualizer mock returns items at indices 0-2
    expect(renderPost).toHaveBeenCalledWith(posts[0], 0);
    expect(renderPost).toHaveBeenCalledWith(posts[1], 1);
    expect(renderPost).toHaveBeenCalledWith(posts[2], 2);
  });

  it('handles empty posts array', () => {
    renderComponent({ posts: [] });
    expect(screen.getByTestId('virtual-scroll-container')).toBeInTheDocument();
    // The virtualizer mock always returns 3 items (indices 0-2), but posts[index]
    // is undefined for an empty array, so the component returns null for each item.
    expect(screen.queryByTestId(/^post-/)).not.toBeInTheDocument();
  });

  it('has proper aria attributes on feed container', () => {
    renderComponent();
    expect(screen.getByRole('feed')).toBeInTheDocument();
  });
});

function renderComponent(props?: Partial<VirtualPostListProps>) {
  function defaultRenderPost(post: Post) {
    return <div data-testid={`post-${post.id}`}>{post.contentHtml}</div>;
  }
  return renderWithQuery(
    <VirtualPostList
      posts={createMockPosts(10)}
      height={400}
      renderPost={defaultRenderPost}
      {...props}
    />
  );
}
