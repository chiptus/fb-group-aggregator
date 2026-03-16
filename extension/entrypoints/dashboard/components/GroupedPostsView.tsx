import type { PostGroupingService } from "@/lib/grouping/service";
import type { GroupingResult } from "@/lib/grouping/types";
import type { Group, Post } from "@/lib/types";
import { PostCard } from "./PostCard";
import { PostGroup } from "./PostGroup";

interface GroupedPostsViewProps {
	groupingData: GroupingResult;
	filteredPosts: Post[];
	service: PostGroupingService;
	expansionState: Map<string, boolean>;
	onToggleExpanded: (groupId: string) => void;
	onMarkGroupSeen: (postIds: string[]) => void;
	groupsMap: Map<string, Group>;
	onToggleSeen: (postId: string, currentSeen: boolean) => void;
	onToggleStarred: (postId: string, currentStarred: boolean) => void;
}

export function GroupedPostsView({
	groupingData,
	filteredPosts,
	service,
	expansionState,
	onToggleExpanded,
	onMarkGroupSeen,
	groupsMap,
	onToggleSeen,
	onToggleStarred,
}: GroupedPostsViewProps) {
	return (
		<div className="space-y-4">
			{groupingData.groups.map((group) => {
				const groupPosts = service.getPostsByGroup(
					group.id,
					filteredPosts,
					groupingData,
				);
				if (groupPosts.length === 0) return null;
				const representativePost = groupPosts[0];
				return (
					<PostGroup
						key={group.id}
						group={group}
						posts={groupPosts}
						representativePost={representativePost}
						groupsMap={groupsMap}
						isExpanded={expansionState.get(group.id) ?? false}
						onToggle={() => onToggleExpanded(group.id)}
						onMarkSeen={() => onMarkGroupSeen(group.postIds)}
						renderPost={(post) => {
							const fbGroup = groupsMap.get(post.groupId);
							return (
								<PostCard
									post={post}
									group={fbGroup}
									onToggleSeen={onToggleSeen}
									onToggleStarred={onToggleStarred}
								/>
							);
						}}
					/>
				);
			})}
			{groupingData.ungroupedPostIds.length > 0 && (
				<div className="mt-6">
					<h3 className="text-sm font-medium text-gray-700 mb-3">
						Ungrouped Posts ({groupingData.ungroupedPostIds.length})
					</h3>
					<div className="space-y-4">
						{filteredPosts
							.filter((p) => groupingData.ungroupedPostIds.includes(p.id))
							.map((post) => {
								const fbGroup = groupsMap.get(post.groupId);
								return (
									<PostCard
										key={post.id}
										post={post}
										group={fbGroup}
										onToggleSeen={onToggleSeen}
										onToggleStarred={onToggleStarred}
									/>
								);
							})}
					</div>
				</div>
			)}
		</div>
	);
}
