import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { filterPosts } from '@/lib/filters/filterPosts';
import type { FilterSettings } from '@/lib/filters/types';
import { useMarkAllPostsSeen } from '@/lib/hooks/storage/usePosts';
import type { Group, Post, Subscription } from '@/lib/types';
import { useFilteredPosts } from '../hooks/useFilteredPosts';
import { DEFAULT_FILTER_SETTINGS, usePostsData } from '../hooks/usePostsData';

interface PostsViewContextValue {
  // Server data
  subscriptions: Subscription[];
  groups: Group[];
  posts: Post[];
  groupsMap: Map<string, Group>;
  filters: FilterSettings;
  isLoading: boolean;
  error: unknown;

  // Server actions
  setPostSeen: (postId: string, seen: boolean) => void;
  togglePostStarred: (postId: string, currentStarred: boolean) => void;
  removeKeyword: (keyword: string, type: 'positive' | 'negative') => void;

  // View state
  selectedSubscriptionId: string | null;
  searchQuery: string;
  showOnlyUnseen: boolean;
  showOnlyStarred: boolean;
  showFilterPanel: boolean;

  // View state setters
  setSelectedSubscriptionId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowOnlyUnseen: (value: boolean) => void;
  setShowOnlyStarred: (value: boolean) => void;
  setShowFilterPanel: (value: boolean) => void;

  // Derived data
  filteredPosts: Post[];
  unseenCount: number;
  starredCount: number;
  subscriptionUnseenCounts: Map<string, number>;
  hasActiveFilters: boolean;
  activeFilterCount: number;

  // Compound actions
  clearFilters: () => void;
  markAllSeen: () => void;
}

const PostsViewContext = createContext<PostsViewContextValue | null>(null);

export function usePostsView(): PostsViewContextValue {
  const ctx = useContext(PostsViewContext);
  if (!ctx) {
    throw new Error('usePostsView must be used within PostsViewProvider');
  }
  return ctx;
}

export function PostsViewProvider({ children }: { children: ReactNode }) {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnseen, setShowOnlyUnseen] = useState(true);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const {
    subscriptions,
    groups,
    posts,
    groupsMap,
    filters,
    saveFiltersMutation,
    setPostSeen,
    isLoading,
    error,
    togglePostStarred,
    removeKeyword,
  } = usePostsData();

  const markAllPostsSeen = useMarkAllPostsSeen();

  const { filteredPosts, unseenCount, starredCount } = useFilteredPosts({
    posts,
    groups,
    selectedSubscriptionId,
    searchQuery,
    filters,
    showOnlyUnseen,
    showOnlyStarred,
  });

  const subscriptionUnseenCounts = useMemo(() => {
    const hasKeywordFilters =
      filters.positiveKeywords.length > 0 ||
      filters.negativeKeywords.length > 0;
    const keywordFilteredPosts = hasKeywordFilters
      ? filterPosts(posts, filters)
      : posts;

    const counts = new Map<string, number>();
    counts.set('__all__', keywordFilteredPosts.filter((p) => !p.seen).length);
    for (const sub of subscriptions) {
      const subGroupIds = new Set(
        groups
          .filter((g) => g.subscriptionIds.includes(sub.id))
          .map((g) => g.id)
      );
      counts.set(
        sub.id,
        keywordFilteredPosts.filter(
          (p) => subGroupIds.has(p.groupId) && !p.seen
        ).length
      );
    }
    return counts;
  }, [subscriptions, groups, posts, filters]);

  const hasActiveFilters =
    filters.positiveKeywords.length > 0 || filters.negativeKeywords.length > 0;
  const activeFilterCount =
    filters.positiveKeywords.length + filters.negativeKeywords.length;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setShowOnlyUnseen(false);
    setShowOnlyStarred(false);
    saveFiltersMutation.mutate(DEFAULT_FILTER_SETTINGS);
  }, [saveFiltersMutation]);

  const markAllSeen = useCallback(() => {
    markAllPostsSeen.mutate(
      filteredPosts.filter((p) => !p.seen).map((p) => p.id)
    );
  }, [markAllPostsSeen, filteredPosts]);

  const value: PostsViewContextValue = {
    subscriptions,
    groups,
    posts,
    groupsMap,
    filters,
    isLoading,
    error,
    setPostSeen,
    togglePostStarred,
    removeKeyword,
    selectedSubscriptionId,
    searchQuery,
    showOnlyUnseen,
    showOnlyStarred,
    showFilterPanel,
    setSelectedSubscriptionId,
    setSearchQuery,
    setShowOnlyUnseen,
    setShowOnlyStarred,
    setShowFilterPanel,
    filteredPosts,
    unseenCount,
    starredCount,
    subscriptionUnseenCounts,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
    markAllSeen,
  };

  return (
    <PostsViewContext.Provider value={value}>
      {children}
    </PostsViewContext.Provider>
  );
}
