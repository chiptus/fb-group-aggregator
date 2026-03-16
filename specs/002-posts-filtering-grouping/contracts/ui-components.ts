/**
 * UI Components Contract
 *
 * Defines props interfaces for React components in the filtering and grouping feature.
 * All components follow project conventions:
 * - Named function declarations
 * - Non-destructured props
 * - Focused, single-responsibility components (<150 lines)
 */

import type { Post } from '@/lib/types';
import type { FilterSettings } from '@/lib/filters/types';
import type { PostGroup } from '@/lib/grouping/types';

/**
 * Filter Controls Component Props
 *
 * UI for managing positive/negative keyword filters
 */
export interface FilterControlsProps {
  /** Current filter settings */
  filters: FilterSettings;

  /** Callback when filters change */
  onChange: (filters: FilterSettings) => void;

  /** Whether controls are disabled (e.g., during loading) */
  disabled?: boolean;

  /** CSS class name */
  className?: string;
}

/**
 * FilterControls Component Contract
 *
 * Provides input fields for positive/negative keywords
 * with add/remove functionality
 *
 * @example
 * ```typescript
 * function DashboardFilters() {
 *   const filtersQuery = useFilters();
 *   const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;
 *
 *   function handleChange(newFilters: FilterSettings) {
 *     filtersQuery.mutate(newFilters);
 *   }
 *
 *   return <FilterControls filters={filters} onChange={handleChange} />;
 * }
 * ```
 */
export declare function FilterControls(props: FilterControlsProps): JSX.Element;

/**
 * Filter Chips Component Props
 *
 * Displays active filters as dismissible chips
 */
export interface FilterChipsProps {
  /** Positive keywords to display */
  positiveKeywords: string[];

  /** Negative keywords to display */
  negativeKeywords: string[];

  /** Callback when keyword is removed */
  onRemove: (keyword: string, isNegative: boolean) => void;

  /** Callback when "Clear All" is clicked */
  onClearAll: () => void;

  /** CSS class name */
  className?: string;
}

/**
 * FilterChips Component Contract
 *
 * Shows active filters as chips with remove buttons
 * Provides "Clear All" button when filters are active
 *
 * @example
 * ```typescript
 * function ActiveFilters() {
 *   const filtersQuery = useFilters();
 *   const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;
 *
 *   function handleRemove(keyword: string, isNegative: boolean) {
 *     if (isNegative) {
 *       filtersQuery.removeNegativeKeyword(keyword);
 *     } else {
 *       filtersQuery.removePositiveKeyword(keyword);
 *     }
 *   }
 *
 *   return (
 *     <FilterChips
 *       positiveKeywords={filters.positiveKeywords}
 *       negativeKeywords={filters.negativeKeywords}
 *       onRemove={handleRemove}
 *       onClearAll={filtersQuery.clear}
 *     />
 *   );
 * }
 * ```
 */
export declare function FilterChips(props: FilterChipsProps): JSX.Element;

/**
 * Virtual Post List Component Props
 *
 * Virtualized scrolling list for posts
 */
export interface VirtualPostListProps {
  /** Posts to display (after filtering/grouping) */
  posts: Post[];

  /** Height of the scrollable container in pixels */
  height: number;

  /** Estimated height of each post card in pixels */
  estimateSize?: number;

  /** Number of items to render outside visible area (default: 5) */
  overscan?: number;

  /** Callback to render individual post */
  renderPost: (post: Post, index: number) => JSX.Element;

  /** CSS class name */
  className?: string;
}

/**
 * VirtualPostList Component Contract
 *
 * Renders large lists of posts efficiently using virtualization
 * Only renders visible items + buffer
 *
 * @example
 * ```typescript
 * function PostFeed() {
 *   const filteredPostsQuery = useFilteredPosts();
 *   const posts = filteredPostsQuery.data ?? [];
 *
 *   function renderPost(post: Post) {
 *     return <PostCard post={post} />;
 *   }
 *
 *   return (
 *     <VirtualPostList
 *       posts={posts}
 *       height={600}
 *       estimateSize={200}
 *       renderPost={renderPost}
 *     />
 *   );
 * }
 * ```
 */
export declare function VirtualPostList(props: VirtualPostListProps): JSX.Element;

/**
 * Post Group Component Props
 *
 * Displays a group of similar posts with expand/collapse
 */
export interface PostGroupProps {
  /** Post group to display */
  group: PostGroup;

  /** Posts belonging to this group */
  posts: Post[];

  /** Whether group is expanded */
  isExpanded: boolean;

  /** Callback when expand/collapse is toggled */
  onToggle: () => void;

  /** Callback when "Mark as Seen" is clicked */
  onMarkSeen: () => void;

  /** Render function for individual posts within group */
  renderPost: (post: Post) => JSX.Element;

  /** CSS class name */
  className?: string;
}

/**
 * PostGroup Component Contract
 *
 * Shows grouped posts with count indicator
 * Expandable to show individual posts
 * Provides "Mark all as seen" action
 *
 * @example
 * ```typescript
 * function GroupedPostList() {
 *   const groupingQuery = useGroupedPosts(posts);
 *   const result = groupingQuery.data;
 *
 *   return result?.groups.map(group => (
 *     <PostGroup
 *       key={group.id}
 *       group={group}
 *       posts={groupingQuery.service.getPostsByGroup(group.id, allPosts, result)}
 *       isExpanded={groupingQuery.expansionState.get(group.id) ?? false}
 *       onToggle={() => groupingQuery.toggleExpanded(group.id)}
 *       onMarkSeen={() => groupingQuery.markGroupSeen(group.id)}
 *       renderPost={(post) => <PostCard post={post} />}
 *     />
 *   ));
 * }
 * ```
 */
export declare function PostGroup(props: PostGroupProps): JSX.Element;

/**
 * Filter Stats Banner Component Props
 *
 * Displays statistics about active filters
 */
export interface FilterStatsBannerProps {
  /** Total posts before filtering */
  totalPosts: number;

  /** Posts after filtering */
  filteredPosts: number;

  /** Number of active positive keywords */
  positiveKeywordCount: number;

  /** Number of active negative keywords */
  negativeKeywordCount: number;

  /** CSS class name */
  className?: string;
}

/**
 * FilterStatsBanner Component Contract
 *
 * Shows summary of filtering operation
 * Example: "Showing 45 of 200 posts (2 positive filters, 1 negative filter)"
 *
 * @example
 * ```typescript
 * function PostFeedHeader() {
 *   const filteredPostsQuery = useFilteredPosts();
 *   const stats = filteredPostsQuery.stats;
 *
 *   if (!stats) return null;
 *
 *   return (
 *     <FilterStatsBanner
 *       totalPosts={stats.totalPosts}
 *       filteredPosts={stats.filteredPosts}
 *       positiveKeywordCount={filters.positiveKeywords.length}
 *       negativeKeywordCount={filters.negativeKeywords.length}
 *     />
 *   );
 * }
 * ```
 */
export declare function FilterStatsBanner(props: FilterStatsBannerProps): JSX.Element;

/**
 * Grouping Stats Banner Component Props
 *
 * Displays statistics about post grouping
 */
export interface GroupingStatsBannerProps {
  /** Total groups created */
  totalGroups: number;

  /** Total posts grouped */
  totalPostsGrouped: number;

  /** List reduction percentage */
  reductionPercentage: number;

  /** CSS class name */
  className?: string;
}

/**
 * GroupingStatsBanner Component Contract
 *
 * Shows summary of grouping operation
 * Example: "Grouped 120 posts into 15 groups (30% reduction)"
 *
 * @example
 * ```typescript
 * function GroupedPostHeader() {
 *   const groupingQuery = useGroupedPosts(posts);
 *   const stats = groupingQuery.service.getGroupingStats(groupingQuery.data);
 *
 *   return (
 *     <GroupingStatsBanner
 *       totalGroups={stats.totalGroups}
 *       totalPostsGrouped={stats.totalPostsGrouped}
 *       reductionPercentage={stats.reductionPercentage}
 *     />
 *   );
 * }
 * ```
 */
export declare function GroupingStatsBanner(props: GroupingStatsBannerProps): JSX.Element;
