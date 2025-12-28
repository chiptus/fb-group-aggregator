import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { createTestUser, cleanDatabase } from '../../../tests/helpers.js';

describe('Groups API', () => {
  let server: FastifyInstance;
  let testApiKey: string;

  beforeEach(async () => {
    await cleanDatabase();
    server = await createServer();
    const user = await createTestUser();
    testApiKey = user.apiKey;

    // Create test subscriptions for group assignment
    const subscriptions = [
      { id: 'sub1', name: 'Apartments', createdAt: Date.now() },
      { id: 'sub2', name: 'Jobs', createdAt: Date.now() },
    ];

    await server.inject({
      method: 'POST',
      url: '/api/sync/subscriptions',
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
      payload: { subscriptions },
    });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /api/sync/groups', () => {
    it('should accept batch group upload with subscription assignments', async () => {
      const groups = [
        {
          id: 'group1',
          name: 'Tel Aviv Apartments',
          url: 'https://facebook.com/groups/group1/',
          enabled: true,
          subscriptionIds: ['sub1'],
          addedAt: Date.now(),
          lastScrapedAt: Date.now(),
        },
        {
          id: 'group2',
          name: 'Tech Jobs IL',
          url: 'https://facebook.com/groups/group2/',
          enabled: false,
          subscriptionIds: ['sub2'],
          addedAt: Date.now(),
          lastScrapedAt: null,
        },
      ];

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { groups },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.synced).toBe(2);
      expect(body.conflicts).toBe(0);
      expect(body.errors).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/groups',
        payload: { groups: [] },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle groups assigned to multiple subscriptions', async () => {
      const groups = [
        {
          id: 'group1',
          name: 'Multi-purpose Group',
          url: 'https://facebook.com/groups/group1/',
          enabled: true,
          subscriptionIds: ['sub1', 'sub2'],
          addedAt: Date.now(),
          lastScrapedAt: Date.now(),
        },
      ];

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { groups },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().synced).toBe(1);
    });

    it('should validate subscription IDs exist', async () => {
      const groups = [
        {
          id: 'group1',
          name: 'Test Group',
          url: 'https://facebook.com/groups/group1/',
          enabled: true,
          subscriptionIds: ['nonexistent-sub'],
          addedAt: Date.now(),
          lastScrapedAt: Date.now(),
        },
      ];

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { groups },
      });

      expect(response.statusCode).toBe(207); // Partial success
      const body = response.json();

      expect(body.errors.length).toBeGreaterThan(0);
      expect(body.errors[0].error).toContain('subscription');
    });
  });

  describe('GET /api/sync/groups', () => {
    beforeEach(async () => {
      // Create test groups
      const groups = [
        {
          id: 'group1',
          name: 'TLV Apartments',
          url: 'https://facebook.com/groups/group1/',
          enabled: true,
          subscriptionIds: ['sub1'],
          addedAt: Date.now(),
          lastScrapedAt: Date.now(),
        },
        {
          id: 'group2',
          name: 'Tech Jobs',
          url: 'https://facebook.com/groups/group2/',
          enabled: false,
          subscriptionIds: ['sub2'],
          addedAt: Date.now(),
          lastScrapedAt: null,
        },
        {
          id: 'group3',
          name: 'Multi Group',
          url: 'https://facebook.com/groups/group3/',
          enabled: true,
          subscriptionIds: ['sub1', 'sub2'],
          addedAt: Date.now(),
          lastScrapedAt: Date.now(),
        },
      ];

      await server.inject({
        method: 'POST',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { groups },
      });
    });

    it('should retrieve all groups with subscription IDs', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body).toHaveProperty('groups');
      expect(body).toHaveProperty('total');

      expect(body.groups).toHaveLength(3);
      expect(body.total).toBe(3);

      // Check structure
      body.groups.forEach((group: any) => {
        expect(group).toHaveProperty('id');
        expect(group).toHaveProperty('name');
        expect(group).toHaveProperty('url');
        expect(group).toHaveProperty('enabled');
        expect(group).toHaveProperty('subscriptionIds');
        expect(group).toHaveProperty('addedAt');
        expect(group).toHaveProperty('lastScrapedAt');
        expect(group).toHaveProperty('updatedAt');
        expect(group).toHaveProperty('deletedAt');

        // subscriptionIds should be an array
        expect(Array.isArray(group.subscriptionIds)).toBe(true);
      });
    });

    it('should resolve subscription IDs from junction table', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Find the multi-subscription group
      const multiGroup = body.groups.find((g: any) => g.id === 'group3');
      expect(multiGroup.subscriptionIds).toEqual(expect.arrayContaining(['sub1', 'sub2']));
      expect(multiGroup.subscriptionIds).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/groups',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should only return non-deleted groups', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/groups',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // All groups should have deletedAt = null
      body.groups.forEach((group: any) => {
        expect(group.deletedAt).toBeNull();
      });
    });
  });
});
