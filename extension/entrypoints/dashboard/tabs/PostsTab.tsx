import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { filterPosts } from "@/lib/filters/filterPosts";
import type { FilterSettings } from "@/lib/filters/types";
import type { PostGroupingService } from "@/lib/grouping/service";
import type { GroupingResult } from "@/lib/grouping/types";
import { useFilters, useSaveFilters } from "@/lib/hooks/filters/useFilters";
import { useGroupedPosts } from "@/lib/hooks/grouping/useGroupedPosts";
import { useGroups } from "@/lib/hooks/storage/useGroups";
import {
	useMarkPostSeen,
	usePosts,
	useTogglePostStarred,
} from "@/lib/hooks/storage/usePosts";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import type { Group, Post } from "@/lib/types";
import { FilterChips } from "../components/FilterChips";
import { FilterControls } from "../components/FilterControls";
import { FilterStatsBanner } from "../components/FilterStatsBanner";
import { GroupingStatsBanner } from "../components/GroupingStatsBanner";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PostCard } from "../components/PostCard";
import { PostGroup } from "../components/PostGroup";
import { SearchBar } from "../components/SearchBar";
import { SubscriptionSidebar } from "../components/SubscriptionSidebar";
import { VirtualPostList } from "../components/VirtualPostList";

const DEFAULT_FILTERS: FilterSettings = {
	positiveKeywords: [],
	negativeKeywords: [],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

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

function GroupedPostsView({
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
				return (
					<PostGroup
						key={group.id}
						group={group}
						posts={groupPosts}
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
			{/* Render ungrouped posts individually */}
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

export function PostsTab() {
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlyUnseen, setShowOnlyUnseen] = useState(true);
	const [showOnlyStarred, setShowOnlyStarred] = useState(false);
	const [showFilterPanel, setShowFilterPanel] = useState(false);
	const [enableGrouping, setEnableGrouping] = useState(false);
	const markPostSeen = useMarkPostSeen();
	const togglePostStarred = useTogglePostStarred();

	// Fetch data using react-query
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	// Keyword filters
	const filtersQuery = useFilters();
	const saveFiltersMutation = useSaveFilters();
	const filters = filtersQuery.data ?? DEFAULT_FILTERS;

	// Combined loading state
	const isLoading =
		subscriptionsQuery.isLoading ||
		groupsQuery.isLoading ||
		postsQuery.isLoading;

	// Combined error state
	const error =
		subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	// Memoize Set of group IDs for subscription (T023: Set-based lookups for O(1) performance)
	const subscriptionGroupIds = useMemo(() => {
		if (!selectedSubscriptionId) return null;
		return new Set(
			groups
				.filter((g) => g.subscriptionIds.includes(selectedSubscriptionId))
				.map((g) => g.id),
		);
	}, [groups, selectedSubscriptionId]);

	const filteredPosts = useMemo(() => {
		let result = posts;

		// Filter by subscription using Set for O(1) lookup
		if (subscriptionGroupIds) {
			result = result.filter((p) => subscriptionGroupIds.has(p.groupId));
		}

		// Filter by search query (text search)
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.contentHtml.toLowerCase().includes(query) ||
					p.authorName.toLowerCase().includes(query),
			);
		}

		// Apply keyword filters (positive/negative keywords)
		const hasKeywordFilters =
			filters.positiveKeywords.length > 0 ||
			filters.negativeKeywords.length > 0;
		if (hasKeywordFilters) {
			result = filterPosts(result, filters);
		}

		// Filter by seen status
		if (showOnlyUnseen) {
			result = result.filter((p) => !p.seen);
		}

		// Filter by starred status
		if (showOnlyStarred) {
			result = result.filter((p) => p.starred);
		}

		// Sort by post ID (newest first) - create new array to avoid mutation
		// Using BigInt because Facebook post IDs exceed JavaScript's safe integer range
		return [...result].sort((a, b) => {
			try {
				const idA = BigInt(a.id);
				const idB = BigInt(b.id);
				return idB > idA ? 1 : idB < idA ? -1 : 0;
			} catch {
				// Fallback for non-numeric IDs (e.g., in tests)
				return b.id.localeCompare(a.id);
			}
		});
	}, [
		posts,
		subscriptionGroupIds,
		searchQuery,
		filters,
		showOnlyUnseen,
		showOnlyStarred,
	]);

	// Grouping hook - only group when enabled
	const groupingResult = useGroupedPosts(enableGrouping ? filteredPosts : []);

	// Calculate unseen post count
	const unseenCount = useMemo(
		() => filteredPosts.filter((p) => !p.seen).length,
		[filteredPosts],
	);

	// Calculate starred post count
	const starredCount = useMemo(
		() => filteredPosts.filter((p) => p.starred).length,
		[filteredPosts],
	);

	// Create groups Map for O(1) lookups in renderPost
	const groupsMap = useMemo(() => {
		return new Map(groups.map((g) => [g.id, g]));
	}, [groups]);

	// Memoized handlers for virtualized list
	const handleToggleSeen = useCallback(
		(postId: string, currentSeen: boolean) => {
			markPostSeen.mutate({ postId, seen: !currentSeen });
		},
		[markPostSeen],
	);

	const handleToggleStarred = useCallback(
		(postId: string, currentStarred: boolean) => {
			togglePostStarred.mutate({ postId, starred: !currentStarred });
		},
		[togglePostStarred],
	);

	const handleRemoveKeyword = useCallback(
		(keyword: string, type: "positive" | "negative") => {
			const updatedFilters: FilterSettings = {
				...filters,
				positiveKeywords:
					type === "positive"
						? filters.positiveKeywords.filter((k) => k !== keyword)
						: filters.positiveKeywords,
				negativeKeywords:
					type === "negative"
						? filters.negativeKeywords.filter((k) => k !== keyword)
						: filters.negativeKeywords,
			};
			saveFiltersMutation.mutate(updatedFilters);
		},
		[filters, saveFiltersMutation],
	);

	// Handler for marking all posts in a group as seen
	const handleMarkGroupSeen = useCallback(
		(postIds: string[]) => {
			for (const postId of postIds) {
				markPostSeen.mutate({ postId, seen: true });
			}
		},
		[markPostSeen],
	);

	// Render function for virtualized list
	const renderPost = useCallback(
		(post: Post) => {
			const group = groupsMap.get(post.groupId);
			return (
				<div className="pb-4">
					<PostCard
						post={post}
						group={group}
						onToggleSeen={handleToggleSeen}
						onToggleStarred={handleToggleStarred}
					/>
				</div>
			);
		},
		[groupsMap, handleToggleSeen, handleToggleStarred],
	);

	if (isLoading) {
		return <LoadingSpinner />;
	}

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
		<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
			<SubscriptionSidebar
				subscriptions={subscriptions}
				selectedSubscriptionId={selectedSubscriptionId}
				onSelectSubscription={setSelectedSubscriptionId}
			/>

			<main className="flex-1">
				<SearchBar value={searchQuery} onChange={setSearchQuery} />

				{/* Filter toggle button */}
				<div className="mb-4">
					<button
						type="button"
						onClick={() => setShowFilterPanel(!showFilterPanel)}
						className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
					>
						{showFilterPanel ? "Hide" : "Show"} keyword filters
						{hasActiveFilters && (
							<span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
								{filters.positiveKeywords.length +
									filters.negativeKeywords.length}
							</span>
						)}
					</button>
				</div>

				{/* Filter controls panel */}
				{showFilterPanel && (
					<div className="mb-4">
						<FilterControls />
					</div>
				)}

				{/* Active filter chips */}
				{hasActiveFilters && (
					<div className="mb-4">
						<FilterChips
							filters={filters}
							onRemoveKeyword={handleRemoveKeyword}
						/>
					</div>
				)}

				{/* Filter stats banner */}
				{hasActiveFilters && (
					<FilterStatsBanner
						totalPosts={posts.length}
						filteredPosts={filteredPosts.length}
						positiveKeywordCount={filters.positiveKeywords.length}
						negativeKeywordCount={filters.negativeKeywords.length}
						className="mb-4"
					/>
				)}

				<div className="flex items-center justify-between mb-4">
					<p className="text-sm text-gray-600" aria-live="polite">
						{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""} •{" "}
						{starredCount} starred post{starredCount !== 1 ? "s" : ""}
					</p>
					<div className="flex gap-4">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={showOnlyUnseen}
								onChange={(e) => setShowOnlyUnseen(e.target.checked)}
								className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span>Show only unseen</span>
						</label>
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={showOnlyStarred}
								onChange={(e) => setShowOnlyStarred(e.target.checked)}
								className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span>Show only starred</span>
						</label>
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={enableGrouping}
								onChange={(e) => setEnableGrouping(e.target.checked)}
								className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span>Group similar posts</span>
						</label>
					</div>
				</div>

				{/* Grouping stats banner */}
				{enableGrouping && groupingResult.data && (
					<GroupingStatsBanner
						totalGroups={groupingResult.data.totalGroups}
						totalPostsGrouped={groupingResult.data.totalPostsGrouped}
						reductionPercentage={
							groupingResult.service.getGroupingStats(groupingResult.data)
								.reductionPercentage
						}
						className="mb-4"
					/>
				)}

				{filteredPosts.length === 0 ? (
					<div className="block bg-white rounded-lg shadow p-8 text-center">
						<p className="text-gray-600">No posts found</p>
					</div>
				) : enableGrouping && groupingResult.data ? (
					<GroupedPostsView
						groupingData={groupingResult.data}
						filteredPosts={filteredPosts}
						service={groupingResult.service}
						expansionState={groupingResult.expansionState}
						onToggleExpanded={groupingResult.toggleExpanded}
						onMarkGroupSeen={handleMarkGroupSeen}
						groupsMap={groupsMap}
						onToggleSeen={handleToggleSeen}
						onToggleStarred={handleToggleStarred}
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
			</main>
		</div>
	);
}
