import { useMemo, useState } from "react";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PostCard } from "./components/PostCard";
import { SearchBar } from "./components/SearchBar";
import { SubscriptionSidebar } from "./components/SubscriptionSidebar";
import {
	useGroups,
	useMarkPostSeen,
	usePosts,
	useSubscriptions,
} from "./hooks/useDashboardData";

function App() {
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch data using react-query
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	// Mutation for marking posts as seen
	const markPostSeen = useMarkPostSeen();

	// Extract data with defaults
	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	// Combined loading state
	const isLoading =
		subscriptionsQuery.isLoading ||
		groupsQuery.isLoading ||
		postsQuery.isLoading;

	// Combined error state
	const error =
		subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

	// Filter posts by subscription and search query
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

		// Sort by timestamp (newest first) - create new array to avoid mutation
		return [...result].sort((a, b) => b.timestamp - a.timestamp);
	}, [posts, groups, selectedSubscriptionId, searchQuery]);

	// Calculate unseen post count
	const unseenCount = useMemo(
		() => filteredPosts.filter((p) => !p.seen).length,
		[filteredPosts],
	);

	// Handle marking post as seen/unseen
	function handleToggleSeen(postId: string, currentSeen: boolean) {
		markPostSeen.mutate({ postId, seen: !currentSeen });
	}

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return (
			<ErrorDisplay
				message="Failed to load posts. Please refresh the page or check your extension storage."
				onRetry={() => window.location.reload()}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold">FB Group Aggregator</h1>
					<p className="text-sm text-gray-600" aria-live="polite">
						{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""}
					</p>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
				<SubscriptionSidebar
					subscriptions={subscriptions}
					selectedSubscriptionId={selectedSubscriptionId}
					onSelectSubscription={setSelectedSubscriptionId}
				/>

				<main className="flex-1">
					<SearchBar value={searchQuery} onChange={setSearchQuery} />

					{filteredPosts.length === 0 ? (
						<output className="block bg-white rounded-lg shadow p-8 text-center">
							<p className="text-gray-600">No posts found</p>
						</output>
					) : (
						<div
							className="space-y-4"
							role="feed"
							aria-label="Facebook group posts"
						>
							{filteredPosts.map((post) => {
								const group = groups.find((g) => g.id === post.groupId);
								return (
									<PostCard
										key={post.id}
										post={post}
										group={group}
										onToggleSeen={handleToggleSeen}
									/>
								);
							})}
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

export default App;
