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
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [posts, setPosts] = useState<Post[]>([]);
	const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Load data on mount
	useEffect(() => {
		const loadData = async () => {
			try {
				const [subs, grps, psts] = await Promise.all([
					listSubscriptions(),
					listGroups(),
					listPosts(),
				]);
				setSubscriptions(subs);
				setGroups(grps);
				setPosts(psts);
			} catch (error) {
				console.error("Failed to load data:", error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
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

		// Sort by timestamp (newest first)
		return result.sort((a, b) => b.timestamp - a.timestamp);
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

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<h1 className="text-2xl font-bold">FB Group Aggregator</h1>
					<p className="text-sm text-gray-600">
						{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""}
					</p>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
				{/* Sidebar - Subscriptions */}
				<aside className="w-64 flex-shrink-0">
					<div className="bg-white rounded-lg shadow p-4">
						<h2 className="font-semibold mb-3">Subscriptions</h2>
						<div className="space-y-1">
							<button
								type="button"
								onClick={() => setSelectedSubscriptionId(null)}
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
				</aside>

				{/* Main content - Posts */}
				<main className="flex-1">
					{/* Search */}
					<div className="mb-4">
						<input
							type="text"
							placeholder="Search posts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Posts list */}
					{filteredPosts.length === 0 ? (
						<div className="bg-white rounded-lg shadow p-8 text-center">
							<p className="text-gray-600">No posts found</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredPosts.map((post) => (
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
												{new Date(post.timestamp).toLocaleString()}
											</p>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => handleToggleSeen(post.id, post.seen)}
												className="text-sm text-blue-600 hover:text-blue-800"
											>
												{post.seen ? "Mark as unseen" : "Mark as seen"}
											</button>
										</div>
									</div>
									<div
										className="prose max-w-none mb-3"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from Facebook posts
										dangerouslySetInnerHTML={{ __html: post.contentHtml }}
									/>
									<button
										type="button"
										onClick={() => handleOpenPost(post.url)}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										Open on Facebook
									</button>
								</article>
							))}
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

export default App;
