import { describe, it, expect, beforeEach } from 'vitest';
import type { Subscription, Group, Post } from './types';
import {
  createSubscription,
  listSubscriptions,
  deleteSubscription,
  createGroup,
  listGroups,
  updateGroup,
  deleteGroup,
  findGroupByUrl,
  createPosts,
  listPosts,
  listPostsBySubscription,
  markPostAsSeen,
  deleteOldPosts,
} from './storage';

describe('Storage - Subscriptions', () => {
  beforeEach(async () => {
    // Clear storage before each test using WXT's polyfilled API
    await chrome.storage.local.clear();
  });

  it('should create a new subscription', async () => {
    const subscription = await createSubscription('Test Subscription');

    expect(subscription).toMatchObject({
      name: 'Test Subscription',
      id: expect.any(String),
      createdAt: expect.any(Number),
    });

    const stored = await listSubscriptions();
    expect(stored).toEqual([subscription]);
  });

  it('should list all subscriptions', async () => {
    const mockSubscriptions: Subscription[] = [
      { id: '1', name: 'Sub 1', createdAt: Date.now() },
      { id: '2', name: 'Sub 2', createdAt: Date.now() },
    ];

    // Use WXT's polyfilled storage API
    await chrome.storage.local.set({ subscriptions: mockSubscriptions });

    const subscriptions = await listSubscriptions();

    expect(subscriptions).toEqual(mockSubscriptions);
  });

  it('should handle empty subscriptions list', async () => {
    const subscriptions = await listSubscriptions();

    expect(subscriptions).toEqual([]);
  });

  it('should delete a subscription', async () => {
    const mockSubscriptions: Subscription[] = [
      { id: '1', name: 'Sub 1', createdAt: Date.now() },
      { id: '2', name: 'Sub 2', createdAt: Date.now() },
    ];

    await chrome.storage.local.set({ subscriptions: mockSubscriptions });

    await deleteSubscription('1');

    const result = await listSubscriptions();
    expect(result).toEqual([mockSubscriptions[1]]);
  });
});

describe('Storage - Groups', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  it('should create a new group', async () => {
    const groupData = {
      id: 'group-123',
      url: 'https://www.facebook.com/groups/test',
      name: 'Test Group',
      subscriptionIds: ['sub-1'],
      enabled: true,
    };

    const group = await createGroup(groupData);

    expect(group).toMatchObject({
      ...groupData,
      addedAt: expect.any(Number),
      lastScrapedAt: null,
    });

    const stored = await listGroups();
    expect(stored).toEqual([group]);
  });

  it('should list all groups', async () => {
    const mockGroups: Group[] = [
      {
        id: '1',
        url: 'https://facebook.com/groups/1',
        name: 'Group 1',
        subscriptionIds: ['sub-1'],
        addedAt: Date.now(),
        lastScrapedAt: null,
        enabled: true,
      },
    ];

    await chrome.storage.local.set({ groups: mockGroups });

    const groups = await listGroups();

    expect(groups).toEqual(mockGroups);
  });

  it('should update a group', async () => {
    const mockGroup: Group = {
      id: '1',
      url: 'https://facebook.com/groups/1',
      name: 'Group 1',
      subscriptionIds: ['sub-1'],
      addedAt: Date.now(),
      lastScrapedAt: null,
      enabled: true,
    };

    await chrome.storage.local.set({ groups: [mockGroup] });

    await updateGroup('1', { enabled: false, lastScrapedAt: 123456 });

    const groups = await listGroups();
    expect(groups).toEqual([
      {
        ...mockGroup,
        enabled: false,
        lastScrapedAt: 123456,
      },
    ]);
  });

  it('should delete a group', async () => {
    const mockGroups: Group[] = [
      {
        id: '1',
        url: 'https://facebook.com/groups/1',
        name: 'Group 1',
        subscriptionIds: ['sub-1'],
        addedAt: Date.now(),
        lastScrapedAt: null,
        enabled: true,
      },
      {
        id: '2',
        url: 'https://facebook.com/groups/2',
        name: 'Group 2',
        subscriptionIds: ['sub-1'],
        addedAt: Date.now(),
        lastScrapedAt: null,
        enabled: true,
      },
    ];

    await chrome.storage.local.set({ groups: mockGroups });

    await deleteGroup('1');

    const groups = await listGroups();
    expect(groups).toEqual([mockGroups[1]]);
  });

  it('should find group by URL', async () => {
    const mockGroup: Group = {
      id: '1',
      url: 'https://www.facebook.com/groups/test',
      name: 'Group 1',
      subscriptionIds: ['sub-1'],
      addedAt: Date.now(),
      lastScrapedAt: null,
      enabled: true,
    };

    await chrome.storage.local.set({ groups: [mockGroup] });

    const found = await findGroupByUrl('https://www.facebook.com/groups/test');

    expect(found).toEqual(mockGroup);
  });

  it('should return undefined when group not found by URL', async () => {
    const found = await findGroupByUrl('https://www.facebook.com/groups/nonexistent');

    expect(found).toBeUndefined();
  });
});

describe('Storage - Posts', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  it('should create new posts', async () => {
    const newPosts = [
      {
        id: 'post-1',
        groupId: 'group-1',
        authorName: 'John Doe',
        contentHtml: '<p>Test post</p>',
        timestamp: Date.now(),
        url: 'https://facebook.com/posts/1',
      },
      {
        id: 'post-2',
        groupId: 'group-1',
        authorName: 'Jane Doe',
        contentHtml: '<p>Another post</p>',
        timestamp: Date.now(),
        url: 'https://facebook.com/posts/2',
      },
    ];

    await createPosts(newPosts);

    const posts = await listPosts();
    expect(posts).toHaveLength(2);
    expect(posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...newPosts[0],
          scrapedAt: expect.any(Number),
          seen: false,
        }),
        expect.objectContaining({
          ...newPosts[1],
          scrapedAt: expect.any(Number),
          seen: false,
        }),
      ])
    );
  });

  it('should deduplicate posts by ID', async () => {
    const existingPost: Post = {
      id: 'post-1',
      groupId: 'group-1',
      authorName: 'John Doe',
      contentHtml: '<p>Test post</p>',
      timestamp: Date.now(),
      scrapedAt: Date.now(),
      seen: false,
      url: 'https://facebook.com/posts/1',
    };

    await chrome.storage.local.set({ posts: [existingPost] });

    const newPosts = [
      {
        id: 'post-1', // Duplicate
        groupId: 'group-1',
        authorName: 'John Doe Updated',
        contentHtml: '<p>Updated content</p>',
        timestamp: Date.now(),
        url: 'https://facebook.com/posts/1',
      },
      {
        id: 'post-2', // New
        groupId: 'group-1',
        authorName: 'Jane Doe',
        contentHtml: '<p>Another post</p>',
        timestamp: Date.now(),
        url: 'https://facebook.com/posts/2',
      },
    ];

    await createPosts(newPosts);

    const posts = await listPosts();
    expect(posts).toHaveLength(2); // Should have 2 posts total (1 existing, 1 new)
    expect(posts.find((p: Post) => p.id === 'post-1')).toEqual(existingPost); // Existing should remain unchanged
    expect(posts.find((p: Post) => p.id === 'post-2')).toBeDefined(); // New post should be added
  });

  it('should list all posts', async () => {
    const mockPosts: Post[] = [
      {
        id: 'post-1',
        groupId: 'group-1',
        authorName: 'John Doe',
        contentHtml: '<p>Test</p>',
        timestamp: Date.now(),
        scrapedAt: Date.now(),
        seen: false,
        url: 'https://facebook.com/posts/1',
      },
    ];

    await chrome.storage.local.set({ posts: mockPosts });

    const posts = await listPosts();

    expect(posts).toEqual(mockPosts);
  });

  it('should list posts by subscription', async () => {
    const mockGroups: Group[] = [
      {
        id: 'group-1',
        url: 'https://facebook.com/groups/1',
        name: 'Group 1',
        subscriptionIds: ['sub-1'],
        addedAt: Date.now(),
        lastScrapedAt: null,
        enabled: true,
      },
      {
        id: 'group-2',
        url: 'https://facebook.com/groups/2',
        name: 'Group 2',
        subscriptionIds: ['sub-2'],
        addedAt: Date.now(),
        lastScrapedAt: null,
        enabled: true,
      },
    ];

    const mockPosts: Post[] = [
      {
        id: 'post-1',
        groupId: 'group-1',
        authorName: 'John',
        contentHtml: '<p>Test</p>',
        timestamp: Date.now(),
        scrapedAt: Date.now(),
        seen: false,
        url: 'https://facebook.com/posts/1',
      },
      {
        id: 'post-2',
        groupId: 'group-2',
        authorName: 'Jane',
        contentHtml: '<p>Test 2</p>',
        timestamp: Date.now(),
        scrapedAt: Date.now(),
        seen: false,
        url: 'https://facebook.com/posts/2',
      },
    ];

    await chrome.storage.local.set({
      groups: mockGroups,
      posts: mockPosts,
    });

    const posts = await listPostsBySubscription('sub-1');

    expect(posts).toEqual([mockPosts[0]]);
    expect(posts).toHaveLength(1);
  });

  it('should mark post as seen', async () => {
    const mockPosts: Post[] = [
      {
        id: 'post-1',
        groupId: 'group-1',
        authorName: 'John',
        contentHtml: '<p>Test</p>',
        timestamp: Date.now(),
        scrapedAt: Date.now(),
        seen: false,
        url: 'https://facebook.com/posts/1',
      },
    ];

    await chrome.storage.local.set({ posts: mockPosts });

    await markPostAsSeen('post-1', true);

    const posts = await listPosts();
    expect(posts).toEqual([
      {
        ...mockPosts[0],
        seen: true,
      },
    ]);
  });

  it('should delete old posts', async () => {
    const now = Date.now();
    const oldPost: Post = {
      id: 'post-old',
      groupId: 'group-1',
      authorName: 'John',
      contentHtml: '<p>Old</p>',
      timestamp: now - 40 * 24 * 60 * 60 * 1000, // 40 days ago
      scrapedAt: now - 40 * 24 * 60 * 60 * 1000,
      seen: true,
      url: 'https://facebook.com/posts/old',
    };

    const recentPost: Post = {
      id: 'post-recent',
      groupId: 'group-1',
      authorName: 'Jane',
      contentHtml: '<p>Recent</p>',
      timestamp: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      scrapedAt: now - 10 * 24 * 60 * 60 * 1000,
      seen: false,
      url: 'https://facebook.com/posts/recent',
    };

    await chrome.storage.local.set({
      posts: [oldPost, recentPost],
    });

    await deleteOldPosts(30); // Delete posts older than 30 days

    const posts = await listPosts();
    expect(posts).toEqual([recentPost]);
  });
});
