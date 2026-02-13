import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure API key
 */
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function registerAuthRoutes(server: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user and generate an API key
   */
  server.post('/api/auth/register', async (request, reply) => {
    // Generate API key
    const apiKey = generateApiKey();

    // Create user
    const [user] = await db.insert(users).values({
      apiKey,
    }).returning();

    return reply.status(201).send({
      apiKey: user.apiKey,
      userId: user.id,
      createdAt: user.createdAt.toISOString(),
    });
  });
}
