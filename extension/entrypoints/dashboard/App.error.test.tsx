import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as groupsStorage from '@/lib/storage/groups';
import * as postsStorage from '@/lib/storage/posts';
import * as subscriptionsStorage from '@/lib/storage/subscriptions';
import type { Group, Post, Subscription } from '@/lib/types';
import { renderWithQuery } from '@/test/test-utils';
import App from './App';

vi.mock('./components/VirtualPostList', () => ({
  VirtualPostList: ({
    posts,
    renderPost,
  }: {
    posts: Post[];
    renderPost: (post: Post, index: number) => ReactNode;
  }) => <div>{posts.map((post, index) => renderPost(post, index))}</div>,
}));

vi.mock('@/lib/storage/subscriptions', () => ({
  listSubscriptions: vi.fn(),
}));
vi.mock('@/lib/storage/groups', () => ({
  listGroups: vi.fn(),
}));
vi.mock('@/lib/storage/posts', () => ({
  listPosts: vi.fn(),
  markPostAsSeen: vi.fn(),
  togglePostStarred: vi.fn(),
}));

const mockSubscriptions: Subscription[] = [
  { id: 'sub1', name: 'Tech Jobs', createdAt: Date.now() },
];

const mockGroups: Group[] = [
  {
    id: 'group1',
    name: 'React Jobs',
    url: 'https://facebook.com/groups/react-jobs',
    subscriptionIds: ['sub1'],
    addedAt: Date.now(),
    lastScrapedAt: Date.now(),
    enabled: true,
  },
];

const mockPosts: Post[] = [
  {
    id: '345678901234567',
    groupId: 'group1',
    authorName: 'John Doe',
    contentHtml: 'Senior React Developer needed',
    timestamp: Date.now() - 1000,
    scrapedAt: Date.now(),
    seen: false,
    starred: false,
    url: 'https://facebook.com/groups/react-jobs/posts/345678901234567',
  },
  {
    id: '234567890123456',
    groupId: 'group1',
    authorName: 'Jane Smith',
    contentHtml: '3BR apartment in TLV',
    timestamp: Date.now() - 2000,
    scrapedAt: Date.now(),
    seen: false,
    starred: false,
    url: 'https://facebook.com/groups/react-jobs/posts/234567890123456',
  },
  {
    id: '123456789012345',
    groupId: 'group1',
    authorName: 'Bob Wilson',
    contentHtml: 'Junior Frontend opening',
    timestamp: Date.now() - 3000,
    scrapedAt: Date.now(),
    seen: true,
    starred: false,
    url: 'https://facebook.com/groups/react-jobs/posts/123456789012345',
  },
];

describe('Dashboard App - edge cases and errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscriptionsStorage.listSubscriptions).mockResolvedValue(
      mockSubscriptions
    );
    vi.mocked(groupsStorage.listGroups).mockResolvedValue(mockGroups);
    vi.mocked(postsStorage.listPosts).mockResolvedValue(mockPosts);
  });

  it('should handle empty state when no posts exist', async () => {
    vi.mocked(postsStorage.listPosts).mockResolvedValue([]);
    renderWithQuery(<App />);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument();
    });
  });

  it('should sort posts by ID (newest first)', async () => {
    const user = userEvent.setup();
    renderWithQuery(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /unseen/i })
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /unseen/i }));

    await waitFor(() => {
      const posts = screen.getAllByRole('article');
      expect(posts[0]).toHaveTextContent(/Senior React Developer needed/);
      expect(posts[2]).toHaveTextContent(/Junior Frontend opening/);
    });
  });

  it('should display error message when loading posts fails', async () => {
    vi.mocked(postsStorage.listPosts).mockRejectedValue(
      new Error('Failed to load posts')
    );

    renderWithQuery(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
    });

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
  });

  it('should display error message when loading subscriptions fails', async () => {
    vi.mocked(subscriptionsStorage.listSubscriptions).mockRejectedValue(
      new Error('Failed to load subscriptions')
    );

    renderWithQuery(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
    });
  });

  it('should display error message when loading groups fails', async () => {
    vi.mocked(groupsStorage.listGroups).mockRejectedValue(
      new Error('Failed to load groups')
    );

    renderWithQuery(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
    });
  });

  it('should show reload button when error occurs', async () => {
    vi.mocked(postsStorage.listPosts).mockRejectedValue(
      new Error('Failed to load posts')
    );

    renderWithQuery(<App />);

    await waitFor(() => {
      const reloadButton = screen.getByRole('button', { name: /retry/i });
      expect(reloadButton).toBeInTheDocument();
    });
  });

  it('should reload page when clicking reload button', async () => {
    const reloadFn = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadFn },
      writable: true,
    });

    vi.mocked(postsStorage.listPosts).mockRejectedValue(
      new Error('Failed to load posts')
    );

    const user = userEvent.setup();
    renderWithQuery(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
    });

    const reloadButton = screen.getByRole('button', { name: /retry/i });
    await user.click(reloadButton);

    expect(reloadFn).toHaveBeenCalled();
  });
});
