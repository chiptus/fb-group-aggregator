import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Fastify request type to include user
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      apiKey: string;
      createdAt: Date;
      lastSyncAt: Date | null;
    };
  }
}

/**
 * Authentication middleware for API key validation
 * Expects: Authorization: Bearer <api_key>
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  // Check for Authorization header
  if (!authHeader) {
    return reply.status(401).send({
      error: {
        code: 'MISSING_API_KEY',
        message: 'Authorization header with API key is required',
      },
    });
  }

  // Extract Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return reply.status(401).send({
      error: {
        code: 'INVALID_API_KEY',
        message: 'Authorization header must be in format: Bearer <api_key>',
      },
    });
  }

  const apiKey = parts[1];

  // Validate API key format (64 hex characters)
  if (!/^[a-f0-9]{64}$/.test(apiKey)) {
    return reply.status(401).send({
      error: {
        code: 'INVALID_API_KEY',
        message: 'API key format is invalid',
      },
    });
  }

  // Look up user by API key
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKey, apiKey))
    .limit(1);

  if (!user) {
    return reply.status(401).send({
      error: {
        code: 'INVALID_API_KEY',
        message: 'API key is not valid',
      },
    });
  }

  // Attach user to request
  request.user = user;
}
