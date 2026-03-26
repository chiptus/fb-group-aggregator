import { useCallback } from 'react';
import { useGroupedPosts } from '@/lib/hooks/grouping/useGroupedPosts';
import { useMarkAllPostsSeen } from '@/lib/hooks/storage/usePosts';
import type { Group, Post } from '@/lib/types';
import { GroupedPostsView } from './GroupedPostsView';
import { GroupingStatsBanner } from './GroupingStatsBanner';

interface GroupedPostsSectionProps {
  filteredPosts: Post[];
  groupsMap: Map<string, Group>;
  onSetSeen: (postId: string, seen: boolean) => void;
  onToggleStarred: (postId: string, currentStarred: boolean) => void;
}

export function GroupedPostsSection({
  filteredPosts,
  groupsMap,
  onSetSeen,
  onToggleStarred,
}: GroupedPostsSectionProps) {
  const groupingResult = useGroupedPosts(filteredPosts);
  const markAllPostsSeen = useMarkAllPostsSeen();

  const handleMarkGroupSeen = useCallback(
    (postIds: string[]) => {
      markAllPostsSeen.mutate(postIds);
    },
    [markAllPostsSeen]
  );

  return (
    <>
      <GroupingStatsBanner
        totalGroups={groupingResult.data.totalGroups}
        totalPostsGrouped={groupingResult.data.totalPostsGrouped}
        reductionPercentage={
          groupingResult.service.getGroupingStats(groupingResult.data)
            .reductionPercentage
        }
        className="mb-4"
      />
      <GroupedPostsView
        groupingData={groupingResult.data}
        filteredPosts={filteredPosts}
        service={groupingResult.service}
        expansionState={groupingResult.expansionState}
        onToggleExpanded={groupingResult.toggleExpanded}
        onMarkGroupSeen={handleMarkGroupSeen}
        groupsMap={groupsMap}
        onToggleSeen={(postId, currentSeen) => onSetSeen(postId, !currentSeen)}
        onToggleStarred={onToggleStarred}
      />
    </>
  );
}
