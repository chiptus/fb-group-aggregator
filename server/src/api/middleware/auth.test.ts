import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { createTestUser } from '../../../tests/helpers.js';
import { authenticateRequest } from './auth.js';

describe('Authentication Middleware', () => {
  let server: FastifyInstance;
  let testApiKey: string;

  beforeEach(async () => {
    server = await createServer();
    const user = await createTestUser();
    testApiKey = user.apiKey;
  });

  describe('authenticateRequest', () => {
    it('should accept valid API key from Bearer token', async () => {
      server.get('/test', {
        onRequest: [authenticateRequest],
      }, async (request) => {
        return { userId: request.user.id };
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('userId');
    });

    it('should reject request without Authorization header', async () => {
      server.get('/test', {
        onRequest: [authenticateRequest],
      }, async () => {
        return { success: true };
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          code: 'MISSING_API_KEY',
          message: expect.stringContaining('API key'),
        },
      });
    });

    it('should reject request with invalid API key format', async () => {
      server.get('/test', {
        onRequest: [authenticateRequest],
      }, async () => {
        return { success: true };
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        headers: {
          authorization: 'InvalidFormat',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          code: 'INVALID_API_KEY',
        },
      });
    });

    it('should reject request with non-existent API key', async () => {
      server.get('/test', {
        onRequest: [authenticateRequest],
      }, async () => {
        return { success: true };
      });

      const fakeApiKey = 'a'.repeat(64);
      const response = await server.inject({
        method: 'GET',
        url: '/test',
        headers: {
          authorization: `Bearer ${fakeApiKey}`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          code: 'INVALID_API_KEY',
        },
      });
    });

    it('should attach user object to request', async () => {
      server.get('/test', {
        onRequest: [authenticateRequest],
      }, async (request) => {
        return {
          userId: request.user.id,
          apiKey: request.user.apiKey,
        };
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.userId).toBeTruthy();
      expect(body.apiKey).toBe(testApiKey);
    });
  });
});
