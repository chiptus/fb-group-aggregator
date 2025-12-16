import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useGroups,
	useScrapeSubscription,
} from "@/lib/hooks/storage/useGroups";
import { useMarkPostSeen, usePosts } from "@/lib/hooks/storage/usePosts";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import { GroupsPage } from "./components/GroupsPage";
import { JobViewer } from "./components/JobViewer";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { LogViewer } from "./components/LogViewer";
import { PostCard } from "./components/PostCard";
import { SearchBar } from "./components/SearchBar";
import { SubscriptionSidebar } from "./components/SubscriptionSidebar";

type DashboardTab = "posts" | "groups" | "jobs" | "logs";

function App() {
	const [activeTab, setActiveTab] = useState<DashboardTab>("posts");
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch data using react-query
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	// Mutations
	const markPostSeen = useMarkPostSeen();
	const scrapeSubscription = useScrapeSubscription();

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

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold mb-2">FB Group Aggregator</h1>
					{activeTab === "posts" && (
						<>
							<p className="text-sm text-gray-600" aria-live="polite">
								{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""}
							</p>
							{selectedSubscriptionId && (
								<Button
									onClick={() =>
										scrapeSubscription.mutate(selectedSubscriptionId)
									}
									disabled={scrapeSubscription.isPending}
									variant="default"
									className="mt-2 bg-green-600 hover:bg-green-700 active:bg-green-800"
								>
									{scrapeSubscription.isPending
										? "Scraping..."
										: `Scrape ${subscriptions.find((s) => s.id === selectedSubscriptionId)?.name || "Subscription"}`}
								</Button>
							)}
						</>
					)}

					{/* Tab Navigation */}
					<div className="flex gap-4 mt-4 border-b border-gray-200">
						<Button
							onClick={() => setActiveTab("posts")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "posts"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "posts" ? "page" : undefined}
						>
							Posts
						</Button>
						<Button
							onClick={() => setActiveTab("groups")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "groups"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "groups" ? "page" : undefined}
						>
							Groups
						</Button>
						<Button
							onClick={() => setActiveTab("jobs")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "jobs"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "jobs" ? "page" : undefined}
						>
							Jobs
						</Button>
						<Button
							onClick={() => setActiveTab("logs")}
							variant="ghost"
							size="sm"
							className={`rounded-none border-b-2 transition-colors ${
								activeTab === "logs"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-600 hover:text-gray-800 hover:bg-transparent"
							}`}
							aria-current={activeTab === "logs" ? "page" : undefined}
						>
							Logs
						</Button>
					</div>
				</div>
			</header>

			{activeTab === "posts" && (
				<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
					<SubscriptionSidebar
						subscriptions={subscriptions}
						selectedSubscriptionId={selectedSubscriptionId}
						onSelectSubscription={setSelectedSubscriptionId}
					/>

					<main className="flex-1">
						<SearchBar value={searchQuery} onChange={setSearchQuery} />

						{filteredPosts.length === 0 ? (
							<div className="block bg-white rounded-lg shadow p-8 text-center">
								<p className="text-gray-600">No posts found</p>
							</div>
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
			)}

			{activeTab === "groups" && (
				<div className="max-w-7xl mx-auto px-4 py-6">
					<GroupsPage />
				</div>
			)}

			{activeTab === "jobs" && (
				<div className="max-w-7xl mx-auto px-4 py-6">
					<JobViewer />
				</div>
			)}

			{activeTab === "logs" && (
				<div
					className="max-w-7xl mx-auto px-4 py-6"
					style={{ height: "calc(100vh - 200px)" }}
				>
					<LogViewer />
				</div>
			)}
		</div>
	);
}

export default App;
