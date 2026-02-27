import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMarkAllPostsSeen } from "@/lib/hooks/storage/usePosts";
import type { Post } from "@/lib/types";
import { GroupedPostsSection } from "../components/GroupedPostsSection";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PostCard } from "../components/PostCard";
import { PostsEmptyState } from "../components/PostsEmptyState";
import { PostsFilterBar } from "../components/PostsFilterBar";
import { PostsListControls } from "../components/PostsListControls";
import { SearchBar } from "../components/SearchBar";
import { SubscriptionSidebar } from "../components/SubscriptionSidebar";
import { VirtualPostList } from "../components/VirtualPostList";
import { useFilteredPosts } from "../hooks/useFilteredPosts";
import { DEFAULT_FILTERS, usePostsData } from "../hooks/usePostsData";

export function PostsTab() {
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlyUnseen, setShowOnlyUnseen] = useState(true);
	const [showOnlyStarred, setShowOnlyStarred] = useState(false);
	const [showFilterPanel, setShowFilterPanel] = useState(false);
	const [enableGrouping, setEnableGrouping] = useState(false);

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
		const counts = new Map<string, number>();
		counts.set("__all__", posts.filter((p) => !p.seen).length);
		for (const sub of subscriptions) {
			const subGroupIds = new Set(
				groups
					.filter((g) => g.subscriptionIds.includes(sub.id))
					.map((g) => g.id),
			);
			counts.set(
				sub.id,
				posts.filter((p) => subGroupIds.has(p.groupId) && !p.seen).length,
			);
		}
		return counts;
	}, [subscriptions, groups, posts]);

	const renderPost = useCallback(
		(post: Post) => {
			const group = groupsMap.get(post.groupId);
			return (
				<div className="pb-4">
					<PostCard
						post={post}
						group={group}
						onToggleSeen={(postId, currentSeen) =>
							setPostSeen(postId, !currentSeen)
						}
						onToggleStarred={togglePostStarred}
					/>
				</div>
			);
		},
		[groupsMap, setPostSeen, togglePostStarred],
	);

	if (isLoading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-64 space-y-4">
				<p className="text-red-600">
					Failed to load posts. Please refresh the page or check your extension
					storage.
				</p>
				<Button onClick={() => window.location.reload()} variant="primary">
					Retry
				</Button>
			</div>
		);
	}

	const hasActiveFilters =
		filters.positiveKeywords.length > 0 || filters.negativeKeywords.length > 0;

	return (
		<div className="max-w-7xl mx-auto px-4 py-6">
			<SearchBar value={searchQuery} onChange={setSearchQuery} />

			<SubscriptionSidebar
				subscriptions={subscriptions}
				selectedSubscriptionId={selectedSubscriptionId}
				onSelectSubscription={setSelectedSubscriptionId}
				unseenCounts={subscriptionUnseenCounts}
			/>

			<PostsListControls
				unseenCount={unseenCount}
				starredCount={starredCount}
				showOnlyUnseen={showOnlyUnseen}
				onToggleShowOnlyUnseen={setShowOnlyUnseen}
				showOnlyStarred={showOnlyStarred}
				onToggleShowOnlyStarred={setShowOnlyStarred}
				enableGrouping={enableGrouping}
				onToggleEnableGrouping={setEnableGrouping}
				showFilterPanel={showFilterPanel}
				onToggleFilterPanel={() => setShowFilterPanel(!showFilterPanel)}
				activeFilterCount={
					filters.positiveKeywords.length + filters.negativeKeywords.length
				}
				onMarkAllSeen={() =>
					markAllPostsSeen.mutate(
						filteredPosts.filter((p) => !p.seen).map((p) => p.id),
					)
				}
			/>

			<PostsFilterBar
				showFilterPanel={showFilterPanel}
				hasActiveFilters={hasActiveFilters}
				filters={filters}
				onRemoveKeyword={removeKeyword}
				totalPosts={posts.length}
				filteredPostsCount={filteredPosts.length}
			/>

			{filteredPosts.length === 0 ? (
				<PostsEmptyState
					hasActiveFilters={hasActiveFilters}
					searchQuery={searchQuery}
					showOnlyUnseen={showOnlyUnseen}
					showOnlyStarred={showOnlyStarred}
					selectedSubscriptionId={selectedSubscriptionId}
					filters={filters}
					onClearFilters={() => {
						setSearchQuery("");
						setShowOnlyUnseen(false);
						setShowOnlyStarred(false);
						saveFiltersMutation.mutate(DEFAULT_FILTERS);
					}}
				/>
			) : enableGrouping ? (
				<GroupedPostsSection
					filteredPosts={filteredPosts}
					groupsMap={groupsMap}
					onSetSeen={setPostSeen}
					onToggleStarred={togglePostStarred}
				/>
			) : (
				<VirtualPostList
					posts={filteredPosts}
					height={600}
					estimateSize={200}
					overscan={5}
					renderPost={renderPost}
				/>
			)}
		</div>
	);
}
