import { z } from 'zod';

/**
 * Represents a collection of posts with identical normalized text content.
 */
export const PostGroupSchema = z.object({
  /** Unique identifier for the group (hash of normalizedContent) */
  id: z.string(),

  /** Normalized version of post text used for grouping (10-10000 chars) */
  normalizedContent: z.string().min(10).max(10000),

  /** Array of Post IDs belonging to this group (at least 1) */
  postIds: z.array(z.string()).min(1),

  /** Timestamp when first post in group was scraped */
  firstSeenAt: z.number().int().positive(),

  /** Total number of posts in the group */
  count: z.number().int().positive(),
});

export type PostGroup = z.infer<typeof PostGroupSchema>;

/**
 * Container for the output of a grouping operation.
 */
export const GroupingResultSchema = z.object({
  /** Array of post groups */
  groups: z.array(PostGroupSchema),

  /** Posts that don't belong to any group (too short, unique, or errors) */
  ungroupedPostIds: z.array(z.string()),

  /** Count of groups created */
  totalGroups: z.number().int().nonnegative(),

  /** Count of posts assigned to groups */
  totalPostsGrouped: z.number().int().nonnegative(),

  /** Name of grouping strategy applied */
  strategyUsed: z.string(),
});

export type GroupingResult = z.infer<typeof GroupingResultSchema>;

/**
 * Grouping statistics for UI display
 */
export interface GroupingStats {
  totalGroups: number;
  totalPostsGrouped: number;
  ungroupedCount: number;
  averageGroupSize: number;
  maxGroupSize: number;
  reductionPercentage: number;
  strategyUsed: string;
}
