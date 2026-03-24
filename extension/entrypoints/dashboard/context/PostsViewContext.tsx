import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import {
  DEFAULT_FILTER_SETTINGS,
  type FilterSettings,
  type KeywordType,
} from '@/lib/filters/types';
import { useMarkAllPostsSeen } from '@/lib/hooks/storage/usePosts';
import type { Group, Post, Subscription } from '@/lib/types';
import { useFilteredPosts } from '../hooks/useFilteredPosts';
import { usePostsData } from '../hooks/usePostsData';
import { useSubscriptionUnseenCounts } from '../hooks/useSubscriptionUnseenCounts';

interface PostsViewContextValue {
  // Server data
  subscriptions: Subscription[];
  totalPostCount: number;
  filters: FilterSettings;
  isLoading: boolean;
  error: unknown;

  // Server actions
  setPostSeen: (postId: string, seen: boolean) => void;
  togglePostStarred: (postId: string, currentStarred: boolean) => void;
  removeKeyword: (keyword: string, type: KeywordType) => void;
  getGroupById: (id: string) => Group | undefined;

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

  const getGroupById = useCallback(
    (id: string) => groupsMap.get(id),
    [groupsMap]
  );

  const { filteredPosts, unseenCount, starredCount } = useFilteredPosts({
    posts,
    groups,
    selectedSubscriptionId,
    searchQuery,
    filters,
    showOnlyUnseen,
    showOnlyStarred,
  });

  const subscriptionUnseenCounts = useSubscriptionUnseenCounts({
    posts,
    groups,
    subscriptions,
    filters,
  });

  const hasActiveFilters =
    filters.positiveKeywords.length > 0 || filters.negativeKeywords.length > 0;
  const activeFilterCount =
    filters.positiveKeywords.length + filters.negativeKeywords.length;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setShowOnlyUnseen(true);
    setShowOnlyStarred(false);
    setShowFilterPanel(false);
    saveFiltersMutation.mutate(DEFAULT_FILTER_SETTINGS);
  }, [saveFiltersMutation]);

  const markAllSeen = useCallback(() => {
    markAllPostsSeen.mutate(
      filteredPosts.filter((p) => !p.seen).map((p) => p.id)
    );
  }, [markAllPostsSeen, filteredPosts]);

  const value: PostsViewContextValue = {
    subscriptions,
    totalPostCount: posts.length,
    filters,
    isLoading,
    error,
    setPostSeen,
    togglePostStarred,
    removeKeyword,
    getGroupById,
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
