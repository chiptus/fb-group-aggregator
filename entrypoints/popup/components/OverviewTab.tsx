import { useMemo } from "react";
import {
	useGroups,
	usePosts,
	useSubscriptions,
} from "@/lib/hooks/useStorageData";

export function OverviewTab() {
	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();

	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	function handleOpenDashboard() {
		chrome.tabs.create({ url: "/dashboard.html" });
	}

	return (
		<div className="p-4 space-y-4">
			<button
				type="button"
				onClick={handleOpenDashboard}
				className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium"
			>
				Open Dashboard
			</button>

			<div className="grid grid-cols-3 gap-2">
				<div className="bg-gray-100 p-3 rounded text-center">
					<div className="text-2xl font-bold text-blue-600">
						{subscriptions.length}
					</div>
					<div className="text-xs text-gray-600 mt-1">Subscriptions</div>
				</div>
				<div className="bg-gray-100 p-3 rounded text-center">
					<div className="text-2xl font-bold text-blue-600">
						{groups.length}
					</div>
					<div className="text-xs text-gray-600 mt-1">Groups</div>
				</div>
				<div className="bg-gray-100 p-3 rounded text-center">
					<div className="text-2xl font-bold text-blue-600">{posts.length}</div>
					<div className="text-xs text-gray-600 mt-1">Total Posts</div>
				</div>
			</div>
		</div>
	);
}
