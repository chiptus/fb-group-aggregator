import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { subscriptions } from '../../db/schema.js';
import { authenticateRequest } from '../middleware/auth.js';
import { eq, and, isNull } from 'drizzle-orm';

// Validation schemas
const subscriptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  createdAt: z.number(),
});

const syncSubscriptionsSchema = z.object({
  subscriptions: z.array(subscriptionSchema),
});

export function registerSubscriptionRoutes(server: FastifyInstance) {
  /**
   * POST /api/sync/subscriptions
   * Batch upload subscriptions with last-write-wins
   */
  server.post('/api/sync/subscriptions', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    // Validate request body
    const validation = syncSubscriptionsSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
    }

    const { subscriptions: incomingSubs } = validation.data;
    const userId = request.user.id;

    let synced = 0;
    let conflicts = 0;
    const errors: Array<{ subscriptionId: string; error: string }> = [];

    // Process each subscription
    for (const sub of incomingSubs) {
      try {
        // Check if subscription exists
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(and(
            eq(subscriptions.id, sub.id),
            eq(subscriptions.userId, userId)
          ))
          .limit(1);

        if (existingSub) {
          // Update existing subscription (last-write-wins)
          await db
            .update(subscriptions)
            .set({
              name: sub.name,
              createdAt: sub.createdAt,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          conflicts++;
        } else {
          // Insert new subscription
          await db.insert(subscriptions).values({
            ...sub,
            userId,
          });

          synced++;
        }
      } catch (error) {
        errors.push({
          subscriptionId: sub.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return reply.status(200).send({
      synced,
      conflicts,
      errors,
    });
  });

  /**
   * GET /api/sync/subscriptions
   * Retrieve all subscriptions for the user
   */
  server.get('/api/sync/subscriptions', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    const userId = request.user.id;

    // Get all non-deleted subscriptions
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        isNull(subscriptions.deletedAt)
      ));

    return reply.status(200).send({
      subscriptions: subs.map(s => ({
        ...s,
        updatedAt: s.updatedAt.toISOString(),
        deletedAt: s.deletedAt?.toISOString() || null,
      })),
      total: subs.length,
    });
  });
}
