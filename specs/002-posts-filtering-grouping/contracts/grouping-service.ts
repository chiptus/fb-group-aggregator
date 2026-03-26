/**
 * Grouping Service Contract
 *
 * Defines the public API for grouping posts by text similarity.
 * Uses Strategy pattern to support multiple grouping algorithms.
 */

import type { Post } from '@/lib/types';
import type { PostGroup, GroupingResult } from '@/lib/grouping/types';

/**
 * Grouping Strategy Interface
 *
 * Contract that all grouping algorithms must implement.
 * Allows swapping between exact match, fuzzy match, etc.
 */
export interface IGroupingStrategy {
  /** Human-readable name of strategy (e.g., "exact-match", "fuzzy-match") */
  readonly name: string;

  /**
   * Group posts by similarity
   *
   * @param posts - Array of posts to group
   * @returns GroupingResult with groups, ungrouped posts, and stats
   *
   * @performance Must complete in <500ms for 10,000 posts
   *
   * @example
   * ```typescript
   * class ExactMatchStrategy implements IGroupingStrategy {
   *   name = 'exact-match';
   *
   *   group(posts: Post[]): GroupingResult {
   *     // Implementation
   *   }
   * }
   * ```
   */
  group(posts: Post[]): GroupingResult;
}

/**
 * Text Normalizer Function Type
 *
 * Converts raw HTML content to normalized text for comparison.
 */
export type TextNormalizer = (html: string) => string;

/**
 * Grouping Service Interface
 *
 * Orchestrates grouping operations using strategy pattern.
 */
export interface IGroupingService {
  /**
   * Current grouping strategy
   */
  readonly strategy: IGroupingStrategy;

  /**
   * Change grouping strategy at runtime
   *
   * @param strategy - New strategy to use
   *
   * @example
   * ```typescript
   * service.setStrategy(new FuzzyMatchStrategy());
   * ```
   */
  setStrategy(strategy: IGroupingStrategy): void;

  /**
   * Group posts using current strategy
   *
   * @param posts - Array of posts to group
   * @returns GroupingResult
   *
   * @example
   * ```typescript
   * const result = service.groupPosts(allPosts);
   * console.log(`Created ${result.totalGroups} groups`);
   * ```
   */
  groupPosts(posts: Post[]): GroupingResult;

  /**
   * Get posts belonging to a specific group
   *
   * @param groupId - Group identifier
   * @param allPosts - Full posts array
   * @param groupingResult - Result from groupPosts()
   * @returns Array of posts in the group
   *
   * @example
   * ```typescript
   * const postsInGroup = service.getPostsByGroup('grp_123', allPosts, result);
   * ```
   */
  getPostsByGroup(
    groupId: string,
    allPosts: Post[],
    groupingResult: GroupingResult
  ): Post[];

  /**
   * Get groups sorted by size (largest first)
   *
   * @param groupingResult - Result from groupPosts()
   * @returns Array of groups sorted by post count descending
   *
   * @example
   * ```typescript
   * const topGroups = service.getGroupsSorted(result).slice(0, 10);
   * ```
   */
  getGroupsSorted(groupingResult: GroupingResult): PostGroup[];

  /**
   * Calculate grouping statistics
   *
   * @param groupingResult - Result from groupPosts()
   * @returns Statistics object for UI display
   */
  getGroupingStats(groupingResult: GroupingResult): GroupingStats;
}

/**
 * Grouping Statistics
 *
 * Metadata about grouping operation for UI display
 */
export interface GroupingStats {
  /** Total number of groups created */
  totalGroups: number;

  /** Total posts assigned to groups */
  totalPostsGrouped: number;

  /** Posts not assigned to any group */
  ungroupedCount: number;

  /** Average posts per group */
  averageGroupSize: number;

  /** Largest group size */
  maxGroupSize: number;

  /** List reduction percentage (how much shorter the list becomes) */
  reductionPercentage: number;

  /** Strategy name used */
  strategyUsed: string;
}

/**
 * Exact Match Strategy Options
 */
export interface ExactMatchOptions {
  /** Text normalizer function (default: normalizeContent) */
  normalizer?: TextNormalizer;

  /** Minimum content length to include in grouping (default: 10) */
  minContentLength?: number;
}

/**
 * Fuzzy Match Strategy Options (Future)
 */
export interface FuzzyMatchOptions {
  /** Similarity threshold 0-1 (default: 0.8 for 80% similarity) */
  similarityThreshold?: number;

  /** Text normalizer function */
  normalizer?: TextNormalizer;

  /** Minimum content length to include */
  minContentLength?: number;

  /** Algorithm to use: 'levenshtein' | 'jaro-winkler' | 'cosine' */
  algorithm?: 'levenshtein' | 'jaro-winkler' | 'cosine';
}
