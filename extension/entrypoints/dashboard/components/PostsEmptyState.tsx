import { usePostsView } from "../context/PostsViewContext";

export function PostsEmptyState() {
	const {
		hasActiveFilters,
		searchQuery,
		showOnlyUnseen,
		showOnlyStarred,
		selectedSubscriptionId,
		filters,
		clearFilters,
	} = usePostsView();

	const hasAnyFilter =
		hasActiveFilters ||
		searchQuery ||
		showOnlyUnseen ||
		showOnlyStarred ||
		selectedSubscriptionId;

	return (
		<div className="block bg-white rounded-lg shadow p-8 text-center space-y-4">
			<p className="text-gray-600">
				{hasAnyFilter
					? "No posts match your current filters"
					: "No posts found"}
			</p>
			{(hasActiveFilters ||
				searchQuery ||
				showOnlyUnseen ||
				showOnlyStarred) && (
				<>
					<div className="text-sm text-gray-500 space-y-1">
						{searchQuery && <p>Search: "{searchQuery}"</p>}
						{hasActiveFilters && filters.positiveKeywords.length > 0 && (
							<p>Include: {filters.positiveKeywords.join(", ")}</p>
						)}
						{hasActiveFilters && filters.negativeKeywords.length > 0 && (
							<p>Exclude: {filters.negativeKeywords.join(", ")}</p>
						)}
						{showOnlyUnseen && <p>Showing only unseen posts</p>}
						{showOnlyStarred && <p>Showing only starred posts</p>}
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="text-blue-600 hover:text-blue-800 text-sm underline"
					>
						Clear all filters
					</button>
				</>
			)}
		</div>
	);
}
