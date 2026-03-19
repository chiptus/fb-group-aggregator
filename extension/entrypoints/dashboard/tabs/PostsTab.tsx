import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/lib/hooks/storage/useGroups";
import {
	useMarkPostSeen,
	usePosts,
	useTogglePostStarred,
} from "@/lib/hooks/storage/usePosts";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import type { Post } from "@/lib/types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PostCard } from "../components/PostCard";
import { SearchBar } from "../components/SearchBar";
import { SubscriptionSidebar } from "../components/SubscriptionSidebar";
import { VirtualPostList } from "../components/VirtualPostList";

export function PostsTab() {
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlyUnseen, setShowOnlyUnseen] = useState(true);
	const [showOnlyStarred, setShowOnlyStarred] = useState(false);
	const markPostSeen = useMarkPostSeen();
	const togglePostStarred = useTogglePostStarred();

	// Fetch data using react-query
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	// Mutations

	// Combined loading state
	const isLoading =
		subscriptionsQuery.isLoading ||
		groupsQuery.isLoading ||
		postsQuery.isLoading;

	// Combined error state
	const error =
		subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

	// Filter posts by subscription and search query

	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	const filteredPosts = useMemo(() => {
		let result = posts;

		// Filter by subscription
		if (selectedSubscriptionId) {
			const groupsInSubscription = groups
				.filter((g) => g.subscriptionIds.includes(selectedSubscriptionId))
				.map((g) => g.id);
			result = result.filter((p) => groupsInSubscription.includes(p.groupId));
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.contentHtml.toLowerCase().includes(query) ||
					p.authorName.toLowerCase().includes(query),
			);
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
		groups,
		selectedSubscriptionId,
		searchQuery,
		showOnlyUnseen,
		showOnlyStarred,
	]);

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

	const renderPost = useCallback(
		(post: Post) => {
			const group = groups.find((g) => g.id === post.groupId);
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
		[groups, handleToggleSeen, handleToggleStarred],
	);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center justify-center h-64 space-y-4"
			>
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

	return (
		<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
			<SubscriptionSidebar
				subscriptions={subscriptions}
				selectedSubscriptionId={selectedSubscriptionId}
				onSelectSubscription={setSelectedSubscriptionId}
			/>

			<main className="flex-1">
				<SearchBar value={searchQuery} onChange={setSearchQuery} />

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
					</div>
				</div>

				{filteredPosts.length === 0 ? (
					<div className="block bg-white rounded-lg shadow p-8 text-center">
						<p className="text-gray-600">No posts found</p>
					</div>
				) : (
					<VirtualPostList
						posts={filteredPosts}
						height="calc(100vh - 260px)"
						estimateSize={200}
						overscan={5}
						renderPost={renderPost}
					/>
				)}
			</main>
		</div>
	);
}
