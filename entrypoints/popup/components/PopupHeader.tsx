import { useMemo } from "react";
import { usePosts } from "@/lib/hooks/useStorageData";

export function PopupHeader() {
	const postsQuery = usePosts();
	const posts = postsQuery.data ?? [];

	const unseenCount = useMemo(() => {
		return posts.filter((post) => !post.seen).length;
	}, [posts]);

	const displayCount = postsQuery.isLoading ? "-" : unseenCount.toString();

	return (
		<div className="bg-blue-600 text-white p-4">
			<h1 className="text-xl font-bold">FB Group Aggregator</h1>
			<div className="mt-2 flex items-center gap-2">
				<span className="text-sm">Unseen posts:</span>
				<span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
					{displayCount}
				</span>
			</div>
			{postsQuery.error && (
				<p className="text-xs text-red-200 mt-1">Error loading posts</p>
			)}
		</div>
	);
}
