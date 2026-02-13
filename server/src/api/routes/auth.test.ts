import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { cleanDatabase } from '../../../tests/helpers.js';

describe('POST /api/auth/register', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    await cleanDatabase();
    server = await createServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('should register a new user and return API key', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();

    expect(body).toHaveProperty('apiKey');
    expect(body).toHaveProperty('userId');
    expect(body).toHaveProperty('createdAt');

    // Validate API key format (64 hex characters)
    expect(body.apiKey).toMatch(/^[a-f0-9]{64}$/);

    // Validate userId format (UUID)
    expect(body.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    // Validate createdAt is an ISO timestamp
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
  });

  it('should create unique API keys for different users', async () => {
    const response1 = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
    });

    const response2 = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
    });

    expect(response1.statusCode).toBe(201);
    expect(response2.statusCode).toBe(201);

    const body1 = response1.json();
    const body2 = response2.json();

    // API keys should be different
    expect(body1.apiKey).not.toBe(body2.apiKey);

    // User IDs should be different
    expect(body1.userId).not.toBe(body2.userId);
  });

  it('should handle anonymous registration (no request body required)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {},
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('apiKey');
  });
});
