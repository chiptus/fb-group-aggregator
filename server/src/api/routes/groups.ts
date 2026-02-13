import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { groups, subscriptions, groupSubscriptions } from '../../db/schema.js';
import { authenticateRequest } from '../middleware/auth.js';
import { eq, and, isNull } from 'drizzle-orm';

// Validation schemas
const groupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(500),
  url: z.string().url(),
  enabled: z.boolean(),
  subscriptionIds: z.array(z.string()),
  addedAt: z.number(),
  lastScrapedAt: z.number().nullable(),
});

const syncGroupsSchema = z.object({
  groups: z.array(groupSchema),
});

export function registerGroupRoutes(server: FastifyInstance) {
  /**
   * POST /api/sync/groups
   * Batch upload groups with subscription assignments
   */
  server.post('/api/sync/groups', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    // Validate request body
    const validation = syncGroupsSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
    }

    const { groups: incomingGroups } = validation.data;
    const userId = request.user.id;

    let synced = 0;
    let conflicts = 0;
    const errors: Array<{ groupId: string; error: string }> = [];

    // Process each group
    for (const group of incomingGroups) {
      try {
        // Validate that all subscription IDs exist and belong to user
        if (group.subscriptionIds.length > 0) {
          const validSubs = await db
            .select()
            .from(subscriptions)
            .where(and(
              eq(subscriptions.userId, userId),
              isNull(subscriptions.deletedAt)
            ));

          const validSubIds = new Set(validSubs.map(s => s.id));
          const invalidSubs = group.subscriptionIds.filter(id => !validSubIds.has(id));

          if (invalidSubs.length > 0) {
            errors.push({
              groupId: group.id,
              error: `Invalid subscription IDs: ${invalidSubs.join(', ')}`,
            });
            continue;
          }
        }

        // Check if group exists
        const [existingGroup] = await db
          .select()
          .from(groups)
          .where(and(
            eq(groups.id, group.id),
            eq(groups.userId, userId)
          ))
          .limit(1);

        if (existingGroup) {
          // Update existing group
          await db
            .update(groups)
            .set({
              name: group.name,
              url: group.url,
              enabled: group.enabled,
              addedAt: group.addedAt,
              lastScrapedAt: group.lastScrapedAt,
              updatedAt: new Date(),
            })
            .where(eq(groups.id, group.id));

          // Delete existing assignments
          await db
            .delete(groupSubscriptions)
            .where(eq(groupSubscriptions.groupId, group.id));

          conflicts++;
        } else {
          // Insert new group
          await db.insert(groups).values({
            id: group.id,
            userId,
            name: group.name,
            url: group.url,
            enabled: group.enabled,
            addedAt: group.addedAt,
            lastScrapedAt: group.lastScrapedAt,
          });

          synced++;
        }

        // Create subscription assignments
        if (group.subscriptionIds.length > 0) {
          await db.insert(groupSubscriptions).values(
            group.subscriptionIds.map(subId => ({
              groupId: group.id,
              subscriptionId: subId,
            }))
          );
        }
      } catch (error) {
        errors.push({
          groupId: group.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const statusCode = errors.length > 0 && synced === 0 ? 207 : 200;
    return reply.status(statusCode).send({
      synced,
      conflicts,
      errors,
    });
  });

  /**
   * GET /api/sync/groups
   * Retrieve all groups with resolved subscription IDs
   */
  server.get('/api/sync/groups', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    const userId = request.user.id;

    // Get all non-deleted groups
    const groupResults = await db
      .select()
      .from(groups)
      .where(and(
        eq(groups.userId, userId),
        isNull(groups.deletedAt)
      ));

    // For each group, get subscription IDs from junction table
    const groupsWithSubs = await Promise.all(
      groupResults.map(async (group) => {
        const assignments = await db
          .select()
          .from(groupSubscriptions)
          .where(eq(groupSubscriptions.groupId, group.id));

        return {
          ...group,
          subscriptionIds: assignments.map(a => a.subscriptionId),
          updatedAt: group.updatedAt.toISOString(),
          deletedAt: group.deletedAt?.toISOString() || null,
        };
      })
    );

    return reply.status(200).send({
      groups: groupsWithSubs,
      total: groupsWithSubs.length,
    });
  });
}
