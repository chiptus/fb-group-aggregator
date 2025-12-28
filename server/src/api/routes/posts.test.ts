import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { createTestUser, cleanDatabase } from '../../../tests/helpers.js';

describe('Posts API', () => {
  let server: FastifyInstance;
  let testApiKey: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();
    server = await createServer();
    const user = await createTestUser();
    testApiKey = user.apiKey;
    userId = user.id;

    // Create test group for posts
    await server.inject({
      method: 'POST',
      url: '/api/sync/groups',
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
      payload: {
        groups: [{
          id: 'group456',
          name: 'Test Group',
          url: 'https://facebook.com/groups/group456/',
          enabled: true,
          subscriptionIds: [],
          addedAt: Date.now(),
          lastScrapedAt: null,
        }],
      },
    });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /api/sync/posts', () => {
    it('should accept batch post upload with valid data', async () => {
      const posts = [
        {
          id: 'post123',
          groupId: 'group456',
          authorName: 'John Doe',
          contentHtml: '<p>Test post</p>',
          timestamp: undefined,
          scrapedAt: Date.now(),
          seen: false,
          url: 'https://facebook.com/groups/group456/posts/post123/',
        },
        {
          id: 'post124',
          groupId: 'group456',
          authorName: 'Jane Smith',
          contentHtml: '<p>Another post</p>',
          timestamp: 1703001234567,
          scrapedAt: Date.now(),
          seen: true,
          url: 'https://facebook.com/groups/group456/posts/post124/',
        },
      ];

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { posts },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body).toHaveProperty('synced');
      expect(body).toHaveProperty('conflicts');
      expect(body).toHaveProperty('errors');

      expect(body.synced).toBe(2);
      expect(body.conflicts).toBe(0);
      expect(body.errors).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        payload: { posts: [] },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate request body schema', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { invalid: 'data' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle duplicate posts with deduplication', async () => {
      const post = {
        id: 'duplicate123',
        groupId: 'group456',
        authorName: 'John Doe',
        contentHtml: '<p>Original content</p>',
        timestamp: undefined,
        scrapedAt: Date.now(),
        seen: false,
        url: 'https://facebook.com/groups/group456/posts/duplicate123/',
      };

      // Upload first time
      await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { posts: [post] },
      });

      // Upload duplicate
      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { posts: [{ ...post, contentHtml: '<p>Updated content</p>' }] },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Should report conflict handled
      expect(body.conflicts).toBeGreaterThan(0);
    });

    it('should enforce maximum batch size of 1000 posts', async () => {
      const largeBatch = Array.from({ length: 1001 }, (_, i) => ({
        id: `post${i}`,
        groupId: 'group456',
        authorName: 'Test User',
        contentHtml: '<p>Test</p>',
        timestamp: undefined,
        scrapedAt: Date.now(),
        seen: false,
        url: `https://facebook.com/groups/group456/posts/post${i}/`,
      }));

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { posts: largeBatch },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.message).toContain('1000');
    });
  });

  describe('GET /api/sync/posts', () => {
    beforeEach(async () => {
      // Create test posts
      const posts = Array.from({ length: 150 }, (_, i) => ({
        id: `post${i}`,
        groupId: 'group456',
        authorName: 'Test User',
        contentHtml: `<p>Post ${i}</p>`,
        timestamp: undefined,
        scrapedAt: Date.now() - i * 1000,
        seen: i % 2 === 0,
        url: `https://facebook.com/groups/group456/posts/post${i}/`,
      }));

      await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { posts },
      });
    });

    it('should retrieve posts with pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/posts?limit=50&offset=0',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body).toHaveProperty('posts');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('limit');
      expect(body).toHaveProperty('offset');

      expect(body.posts).toHaveLength(50);
      expect(body.total).toBe(150);
      expect(body.limit).toBe(50);
      expect(body.offset).toBe(0);
    });

    it('should default to limit=100', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.posts).toHaveLength(100);
      expect(body.limit).toBe(100);
    });

    it('should support since parameter for incremental sync', async () => {
      const sinceTimestamp = Date.now() - 50000; // 50 seconds ago

      const response = await server.inject({
        method: 'GET',
        url: `/api/sync/posts?since=${sinceTimestamp}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Should return posts scraped after the timestamp
      expect(body.posts.length).toBeLessThan(150);
      body.posts.forEach((post: any) => {
        expect(post.scrapedAt).toBeGreaterThanOrEqual(sinceTimestamp);
      });
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/posts',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should only return posts belonging to authenticated user', async () => {
      // Create another user and their posts
      const otherUser = await createTestUser();
      await server.inject({
        method: 'POST',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${otherUser.apiKey}`,
        },
        payload: {
          posts: [{
            id: 'otherpost',
            groupId: 'group999',
            authorName: 'Other User',
            contentHtml: '<p>Other post</p>',
            timestamp: undefined,
            scrapedAt: Date.now(),
            seen: false,
            url: 'https://facebook.com/groups/group999/posts/otherpost/',
          }],
        },
      });

      // Query with first user's API key
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/posts',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Should not include other user's posts
      expect(body.posts.every((p: any) => p.id !== 'otherpost')).toBe(true);
    });

    it('should sort posts by scrapedAt DESC (newest first)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/posts?limit=10',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Check posts are sorted by scrapedAt descending
      for (let i = 0; i < body.posts.length - 1; i++) {
        expect(body.posts[i].scrapedAt).toBeGreaterThanOrEqual(body.posts[i + 1].scrapedAt);
      }
    });
  });
});
