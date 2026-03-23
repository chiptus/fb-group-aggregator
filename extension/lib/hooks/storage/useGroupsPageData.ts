import { useMemo } from 'react';
import { useGroups } from '@/lib/hooks/storage/useGroups';
import { useSubscriptions } from '@/lib/hooks/storage/useSubscriptions';

interface GroupsPageDataParams {
  filterSubscriptionId: string | null;
  searchQuery: string;
}

export function useGroupsPageData({
  filterSubscriptionId,
  searchQuery,
}: GroupsPageDataParams) {
  const groupsQuery = useGroups();
  const subscriptionsQuery = useSubscriptions();

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const subscriptions = useMemo(
    () => subscriptionsQuery.data ?? [],
    [subscriptionsQuery.data]
  );
  const isLoading = groupsQuery.isLoading || subscriptionsQuery.isLoading;

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (filterSubscriptionId) {
      result = result.filter((g) =>
        filterSubscriptionId === 'unassigned'
          ? g.subscriptionIds.length === 0
          : g.subscriptionIds.includes(filterSubscriptionId)
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }
    return result;
  }, [groups, filterSubscriptionId, searchQuery]);

  const stats = useMemo(() => {
    const total = groups.length;
    const unassigned = groups.filter(
      (g) => g.subscriptionIds.length === 0
    ).length;
    const enabled = groups.filter((g) => g.enabled).length;
    return { total, unassigned, enabled };
  }, [groups]);

  return { subscriptions, isLoading, filteredGroups, stats };
}
