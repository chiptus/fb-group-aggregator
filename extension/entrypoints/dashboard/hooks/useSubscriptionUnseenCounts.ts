import { useMemo } from 'react';
import { filterPosts } from '@/lib/filters/filterPosts';
import type { FilterSettings } from '@/lib/filters/types';
import type { Group, Post, Subscription } from '@/lib/types';

interface SubscriptionUnseenCountsParams {
  posts: Post[];
  groups: Group[];
  subscriptions: Subscription[];
  filters: FilterSettings;
}

export function useSubscriptionUnseenCounts({
  posts,
  groups,
  subscriptions,
  filters,
}: SubscriptionUnseenCountsParams): Map<string, number> {
  return useMemo(() => {
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
}
