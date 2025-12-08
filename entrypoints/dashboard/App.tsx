import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import {
	listGroups,
	listPosts,
	listSubscriptions,
	markPostAsSeen,
} from "@/lib/storage";
import type { Group, Post, Subscription } from "@/lib/types";

function App() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [posts, setPosts] = useState<Post[]>([]);
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Load data on mount
	useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				const [subs, grps, psts] = await Promise.all([
					listSubscriptions(),
					listGroups(),
					listPosts(),
				]);
				if (isMounted) {
					setSubscriptions(subs);
					setGroups(grps);
					setPosts(psts);
					setError(null);
				}
			} catch (err) {
				console.error("Failed to load data:", err);
				if (isMounted) {
					setError(
						"Failed to load posts. Please refresh the page or check your extension storage.",
					);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};
		loadData();

		return () => {
			isMounted = false;
		};
	}, []);

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
	const handleToggleSeen = async (postId: string, currentSeen: boolean) => {
		try {
			await markPostAsSeen(postId, !currentSeen);
			setPosts((prev) =>
				prev.map((p) => (p.id === postId ? { ...p, seen: !currentSeen } : p)),
			);
		} catch (error) {
			console.error("Failed to update post:", error);
		}
	};

	// Handle opening Facebook post
	const handleOpenPost = (url: string) => {
		window.open(url, "_blank");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-lg">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-lg text-red-600 mb-4">{error}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Reload Page
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold">FB Group Aggregator</h1>
					<p className="text-sm text-gray-600" aria-live="polite">
						{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""}
					</p>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
				{/* Sidebar - Subscriptions */}
				<nav className="w-64 flex-shrink-0" aria-label="Subscription filters">
					<div className="bg-white rounded-lg shadow p-4">
						<h2 className="font-semibold mb-3">Subscriptions</h2>
						<div className="space-y-1">
							<button
								type="button"
								onClick={() => setSelectedSubscriptionId(null)}
								aria-pressed={selectedSubscriptionId === null}
								aria-label="Show all posts from all subscriptions"
								className={`w-full text-left px-3 py-2 rounded ${
									selectedSubscriptionId === null
										? "bg-blue-100 text-blue-900"
										: "hover:bg-gray-100"
								}`}
							>
								All Posts
							</button>
							{subscriptions.map((sub) => (
								<button
									key={sub.id}
									type="button"
									onClick={() => setSelectedSubscriptionId(sub.id)}
									aria-pressed={selectedSubscriptionId === sub.id}
									aria-label={`Filter posts by ${sub.name} subscription`}
									className={`w-full text-left px-3 py-2 rounded ${
										selectedSubscriptionId === sub.id
											? "bg-blue-100 text-blue-900"
											: "hover:bg-gray-100"
									}`}
								>
									{sub.name}
								</button>
							))}
						</div>
					</div>
				</nav>

				{/* Main content - Posts */}
				<main className="flex-1">
					{/* Search */}
					<div className="mb-4">
						<label htmlFor="search-posts" className="sr-only">
							Search posts by content or author
						</label>
						<input
							id="search-posts"
							type="search"
							placeholder="Search posts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							aria-label="Search posts by content or author"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Posts list */}
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
									<article
										key={post.id}
										className="bg-white rounded-lg shadow p-6"
									>
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="font-semibold text-gray-900">
													{post.authorName}
												</h3>
												<p className="text-sm text-gray-500">
													{group && (
														<span className="text-blue-600">
															{group.name} •{" "}
														</span>
													)}
													{new Date(post.timestamp).toLocaleString()}
												</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleToggleSeen(post.id, post.seen)}
													aria-label={
														post.seen
															? `Mark post from ${post.authorName} as unseen`
															: `Mark post from ${post.authorName} as seen`
													}
													className="text-sm text-blue-600 hover:text-blue-800"
												>
													{post.seen ? "Mark as unseen" : "Mark as seen"}
												</button>
											</div>
										</div>
										<div
											className="prose max-w-none mb-3"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
											dangerouslySetInnerHTML={{
												__html: DOMPurify.sanitize(post.contentHtml),
											}}
										/>
										<button
											type="button"
											onClick={() => handleOpenPost(post.url)}
											aria-label={`Open post from ${post.authorName} on Facebook in new tab`}
											className="text-sm text-blue-600 hover:text-blue-800"
										>
											Open on Facebook
										</button>
									</article>
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
