import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { posts } from '../../db/schema.js';
import { authenticateRequest } from '../middleware/auth.js';
import { eq, and, isNull, desc, gte, count } from 'drizzle-orm';

// Validation schemas
const postSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().min(1),
  authorName: z.string().min(1),
  contentHtml: z.string(),
  timestamp: z.number().optional(),
  scrapedAt: z.number(),
  seen: z.boolean(),
  url: z.string().url(),
});

const syncPostsSchema = z.object({
  posts: z.array(postSchema).max(1000, 'Maximum 1000 posts per request'),
});

export function registerPostRoutes(server: FastifyInstance) {
  /**
   * POST /api/sync/posts
   * Batch upload posts with deduplication
   */
  server.post('/api/sync/posts', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    // Validate request body
    const validation = syncPostsSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
    }

    const { posts: incomingPosts } = validation.data;
    const userId = request.user.id;

    let synced = 0;
    let conflicts = 0;
    const errors: Array<{ postId: string; error: string }> = [];

    // Process each post
    for (const post of incomingPosts) {
      try {
        // Check if post exists
        const [existingPost] = await db
          .select()
          .from(posts)
          .where(and(
            eq(posts.id, post.id),
            eq(posts.userId, userId)
          ))
          .limit(1);

        if (existingPost) {
          // Update existing post (merge seen status)
          await db
            .update(posts)
            .set({
              seen: existingPost.seen || post.seen, // Union: if seen on any device, mark seen
              updatedAt: new Date(),
            })
            .where(eq(posts.id, post.id));

          conflicts++;
        } else {
          // Insert new post
          await db.insert(posts).values({
            ...post,
            userId,
            timestamp: post.timestamp ?? null,
          });

          synced++;
        }
      } catch (error) {
        errors.push({
          postId: post.id,
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
   * GET /api/sync/posts
   * Retrieve posts with pagination and incremental sync support
   */
  server.get('/api/sync/posts', {
    onRequest: [authenticateRequest],
  }, async (request, reply) => {
    const userId = request.user.id;

    // Parse query parameters
    const querySchema = z.object({
      limit: z.coerce.number().min(1).max(1000).default(100),
      offset: z.coerce.number().min(0).default(0),
      since: z.coerce.number().optional(),
    });

    const validation = querySchema.safeParse(request.query);
    if (!validation.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
    }

    const { limit, offset, since } = validation.data;

    // Build query
    const conditions = [
      eq(posts.userId, userId),
      isNull(posts.deletedAt),
    ];

    // Add since filter for incremental sync
    if (since) {
      conditions.push(gte(posts.scrapedAt, since));
    }

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(...conditions));

    // Get posts
    const postResults = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.scrapedAt))
      .limit(limit)
      .offset(offset);

    return reply.status(200).send({
      posts: postResults.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt?.toISOString() || null,
      })),
      total: countResult?.count || 0,
      limit,
      offset,
    });
  });
}
