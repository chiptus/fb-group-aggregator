/**
 * Filtering Service Contract
 *
 * Defines the public API for filtering posts by keywords.
 * Implementations must follow these type signatures.
 */

import type { Post } from '@/lib/types';
import type { FilterSettings } from '@/lib/filters/types';

/**
 * Filter Service Interface
 *
 * Responsible for applying positive/negative keyword filters to posts.
 */
export interface IFilterService {
  /**
   * Filter posts based on filter settings
   *
   * @param posts - Array of posts to filter
   * @param settings - Filter configuration (positive/negative keywords)
   * @returns Filtered array of posts
   *
   * @performance Must complete in <500ms for 5000 posts
   *
   * @example
   * ```typescript
   * const service = new FilterService();
   * const filtered = service.filterPosts(allPosts, {
   *   positiveKeywords: ['apartment', '2br'],
   *   negativeKeywords: ['sold'],
   *   caseSensitive: false,
   *   searchFields: ['contentHtml', 'authorName'],
   * });
   * ```
   */
  filterPosts(posts: Post[], settings: FilterSettings): Post[];

  /**
   * Check if a single post matches filter criteria
   *
   * @param post - Post to check
   * @param settings - Filter configuration
   * @returns True if post passes filter, false otherwise
   *
   * @example
   * ```typescript
   * const matches = service.matchesFilter(post, filterSettings);
   * if (matches) {
   *   // Display post
   * }
   * ```
   */
  matchesFilter(post: Post, settings: FilterSettings): boolean;

  /**
   * Parse search query into positive/negative keywords
   *
   * Supports syntax: "apartment 2br -sold -rented"
   * - Words without prefix = positive keywords
   * - Words with '-' prefix = negative keywords
   *
   * @param query - Raw search string from user input
   * @returns Object with include/exclude arrays
   *
   * @example
   * ```typescript
   * const parsed = service.parseSearchQuery("apartment 2br -sold");
   * // Returns: { include: ['apartment', '2br'], exclude: ['sold'] }
   * ```
   */
  parseSearchQuery(query: string): { include: string[]; exclude: string[] };
}

/**
 * Filter Statistics
 *
 * Metadata about filtering operation for UI display
 */
export interface FilterStats {
  /** Total posts before filtering */
  totalPosts: number;

  /** Posts after filtering */
  filteredPosts: number;

  /** Posts removed by filter */
  removedPosts: number;

  /** Filter efficiency (% of posts retained) */
  efficiency: number;

  /** Active positive keywords */
  activePositiveKeywords: string[];

  /** Active negative keywords */
  activeNegativeKeywords: number;
}

/**
 * Default filter settings (no filtering)
 */
export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  positiveKeywords: [],
  negativeKeywords: [],
  caseSensitive: false,
  searchFields: ['contentHtml', 'authorName'],
};
