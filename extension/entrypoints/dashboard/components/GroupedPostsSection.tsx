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

  if (groupingResult.isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span>Grouping posts...</span>
      </div>
    );
  }

  if (!groupingResult.data) return null;

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
