import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { createTestUser, cleanDatabase } from '../../../tests/helpers.js';

describe('Subscriptions API', () => {
  let server: FastifyInstance;
  let testApiKey: string;

  beforeEach(async () => {
    await cleanDatabase();
    server = await createServer();
    const user = await createTestUser();
    testApiKey = user.apiKey;
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /api/sync/subscriptions', () => {
    it('should accept batch subscription upload', async () => {
      const subscriptions = [
        {
          id: 'sub1',
          name: 'Apartments TLV',
          createdAt: Date.now(),
        },
        {
          id: 'sub2',
          name: 'Jobs Tech',
          createdAt: Date.now(),
        },
      ];

      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/subscriptions',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { subscriptions },
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
        url: '/api/sync/subscriptions',
        payload: { subscriptions: [] },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle duplicate subscriptions with last-write-wins', async () => {
      const sub = {
        id: 'sub1',
        name: 'Original Name',
        createdAt: Date.now(),
      };

      // Upload first time
      await server.inject({
        method: 'POST',
        url: '/api/sync/subscriptions',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { subscriptions: [sub] },
      });

      // Upload duplicate with new name
      const response = await server.inject({
        method: 'POST',
        url: '/api/sync/subscriptions',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
        payload: { subscriptions: [{ ...sub, name: 'Updated Name' }] },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.conflicts).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sync/subscriptions', () => {
    beforeEach(async () => {
      // Create test subscriptions
      const subscriptions = [
        { id: 'sub1', name: 'Apartments', createdAt: Date.now() - 3000 },
        { id: 'sub2', name: 'Jobs', createdAt: Date.now() - 2000 },
        { id: 'sub3', name: 'Events', createdAt: Date.now() - 1000 },
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

    it('should retrieve all subscriptions', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/subscriptions',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body).toHaveProperty('subscriptions');
      expect(body).toHaveProperty('total');

      expect(body.subscriptions).toHaveLength(3);
      expect(body.total).toBe(3);

      // Check structure
      body.subscriptions.forEach((sub: any) => {
        expect(sub).toHaveProperty('id');
        expect(sub).toHaveProperty('name');
        expect(sub).toHaveProperty('createdAt');
        expect(sub).toHaveProperty('updatedAt');
        expect(sub).toHaveProperty('deletedAt');
      });
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/subscriptions',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should only return non-deleted subscriptions', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/sync/subscriptions',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // All subscriptions should have deletedAt = null
      body.subscriptions.forEach((sub: any) => {
        expect(sub.deletedAt).toBeNull();
      });
    });
  });
});
