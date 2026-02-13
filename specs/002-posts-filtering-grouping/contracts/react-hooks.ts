/**
 * React Hooks Contract
 *
 * Defines the public API for React hooks used in the filtering and grouping feature.
 * All hooks follow React Query patterns (non-destructured, named functions).
 */

import type { Post } from '@/lib/types';
import type { FilterSettings } from '@/lib/filters/types';
import type { GroupingResult } from '@/lib/grouping/types';
import type { IGroupingService } from './grouping-service';

/**
 * Filter Hook Return Type
 *
 * State and actions for managing filter settings
 */
export interface UseFiltersReturn {
  /** Current filter settings */
  data: FilterSettings | undefined;

  /** Whether filters are being loaded from storage */
  isLoading: boolean;

  /** Error loading filters */
  error: Error | null;

  /** Update filter settings */
  mutate: (settings: FilterSettings) => void;

  /** Async update filter settings (returns promise) */
  mutateAsync: (settings: FilterSettings) => Promise<void>;

  /** Whether update is in progress */
  isPending: boolean;

  /** Clear all filters (reset to defaults) */
  clear: () => void;

  /** Add a positive keyword */
  addPositiveKeyword: (keyword: string) => void;

  /** Remove a positive keyword */
  removePositiveKeyword: (keyword: string) => void;

  /** Add a negative keyword */
  addNegativeKeyword: (keyword: string) => void;

  /** Remove a negative keyword */
  removeNegativeKeyword: (keyword: string) => void;
}

/**
 * useFilters Hook Contract
 *
 * Manages filter settings state with chrome.storage.local persistence
 *
 * @returns UseFiltersReturn object
 *
 * @example
 * ```typescript
 * function FilterControls() {
 *   const filtersQuery = useFilters();
 *   const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;
 *
 *   function handleAddKeyword(keyword: string) {
 *     filtersQuery.addPositiveKeyword(keyword);
 *   }
 *
 *   return <input onChange={(e) => handleAddKeyword(e.target.value)} />;
 * }
 * ```
 */
export declare function useFilters(): UseFiltersReturn;

/**
 * Filtered Posts Hook Return Type
 *
 * Posts filtered by current filter settings
 */
export interface UseFilteredPostsReturn {
  /** Filtered posts array */
  data: Post[] | undefined;

  /** Whether filtering is in progress */
  isLoading: boolean;

  /** Error during filtering */
  error: Error | null;

  /** Stats about filtering operation */
  stats: {
    totalPosts: number;
    filteredPosts: number;
    removedPosts: number;
    efficiency: number;
  } | undefined;
}

/**
 * useFilteredPosts Hook Contract
 *
 * Combines posts from storage with current filter settings
 * Returns filtered posts array with memoization
 *
 * @param subscriptionId - Optional subscription filter
 * @param showOnlyUnseen - Whether to show only unseen posts
 * @param showOnlyStarred - Whether to show only starred posts
 * @returns UseFilteredPostsReturn object
 *
 * @example
 * ```typescript
 * function PostFeed() {
 *   const filteredPostsQuery = useFilteredPosts('sub-123', false, false);
 *   const posts = filteredPostsQuery.data ?? [];
 *
 *   return (
 *     <div>
 *       {filteredPostsQuery.stats && (
 *         <p>Showing {filteredPostsQuery.stats.filteredPosts} of {filteredPostsQuery.stats.totalPosts} posts</p>
 *       )}
 *       {posts.map(post => <PostCard key={post.id} post={post} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useFilteredPosts(
  subscriptionId?: string,
  showOnlyUnseen?: boolean,
  showOnlyStarred?: boolean
): UseFilteredPostsReturn;

/**
 * Grouped Posts Hook Return Type
 *
 * Posts grouped by similarity with expansion state
 */
export interface UseGroupedPostsReturn {
  /** Grouping result with groups and stats */
  data: GroupingResult | undefined;

  /** Whether grouping is in progress */
  isLoading: boolean;

  /** Error during grouping */
  error: Error | null;

  /** Grouping service instance */
  service: IGroupingService;

  /** Toggle group expansion state */
  toggleExpanded: (groupId: string) => void;

  /** Mark all posts in group as seen */
  markGroupSeen: (groupId: string) => Promise<void>;

  /** Expansion state map (groupId -> isExpanded) */
  expansionState: Map<string, boolean>;
}

/**
 * useGroupedPosts Hook Contract
 *
 * Groups posts by text similarity with UI state management
 *
 * @param posts - Posts to group
 * @returns UseGroupedPostsReturn object
 *
 * @example
 * ```typescript
 * function GroupedPostList() {
 *   const postsQuery = usePosts();
 *   const posts = postsQuery.data ?? [];
 *
 *   const groupingQuery = useGroupedPosts(posts);
 *   const result = groupingQuery.data;
 *
 *   if (!result) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>{result.totalGroups} groups found</p>
 *       {groupingQuery.service.getGroupsSorted(result).map(group => (
 *         <PostGroup
 *           key={group.id}
 *           group={group}
 *           isExpanded={groupingQuery.expansionState.get(group.id) ?? false}
 *           onToggle={() => groupingQuery.toggleExpanded(group.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useGroupedPosts(posts: Post[]): UseGroupedPostsReturn;

/**
 * Debounced Value Hook Return Type
 *
 * Generic hook for debouncing any value (used for search input)
 */
export interface UseDebouncedValueReturn<T> {
  /** Debounced value */
  value: T;

  /** Whether debounce is currently pending */
  isPending: boolean;
}

/**
 * useDebounce Hook Contract
 *
 * Debounces a value change by specified delay
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * ```typescript
 * function SearchBar() {
 *   const [searchQuery, setSearchQuery] = useState("");
 *   const debouncedQuery = useDebounce(searchQuery, 300);
 *
 *   // debouncedQuery updates 300ms after user stops typing
 *   const filteredPostsQuery = useFilteredPosts(undefined, undefined, undefined, debouncedQuery);
 * }
 * ```
 */
export declare function useDebounce<T>(value: T, delay?: number): T;
