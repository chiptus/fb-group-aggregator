import { useMemo, useState } from 'react';
import { PostGroupingService } from '@/lib/grouping/service';
import { ExactMatchStrategy } from '@/lib/grouping/strategies/exact-match';
import type { Post } from '@/lib/types';

export function useGroupedPosts(posts: Post[]) {
  const [expansionState, setExpansionState] = useState<Map<string, boolean>>(
    () => new Map()
  );

  // Create service with exact-match strategy
  const service = useMemo(() => {
    return new PostGroupingService(new ExactMatchStrategy());
  }, []);

  // Group posts synchronously
  const data = useMemo(() => service.groupPosts(posts), [service, posts]);

  function toggleExpanded(groupId: string) {
    setExpansionState((prev) => {
      const next = new Map(prev);
      const current = next.get(groupId) ?? false;
      next.set(groupId, !current);
      return next;
    });
  }

  return {
    data,
    service,
    expansionState,
    toggleExpanded,
  };
}
