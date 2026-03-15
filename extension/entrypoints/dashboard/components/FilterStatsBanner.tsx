interface FilterStatsBannerProps {
	totalPosts: number;
	filteredPosts: number;
	positiveKeywordCount: number;
	negativeKeywordCount: number;
	className?: string;
}

export function FilterStatsBanner(props: FilterStatsBannerProps) {
	const {
		totalPosts,
		filteredPosts,
		positiveKeywordCount,
		negativeKeywordCount,
		className = "",
	} = props;

	const hasFilters = positiveKeywordCount > 0 || negativeKeywordCount > 0;
	const removedCount = totalPosts - filteredPosts;

	if (!hasFilters) {
		return null;
	}

	const filterSummary = [];
	if (positiveKeywordCount > 0) {
		filterSummary.push(
			`${positiveKeywordCount} include filter${positiveKeywordCount !== 1 ? "s" : ""}`,
		);
	}
	if (negativeKeywordCount > 0) {
		filterSummary.push(
			`${negativeKeywordCount} exclude filter${negativeKeywordCount !== 1 ? "s" : ""}`,
		);
	}

	return (
		<output
			className={`flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm ${className}`}
			aria-live="polite"
		>
			<span className="text-blue-800">
				Showing {filteredPosts} of {totalPosts} posts
				{removedCount > 0 && (
					<span className="text-blue-600 ml-1">
						({removedCount} filtered out)
					</span>
				)}
			</span>
			<span className="text-blue-600">{filterSummary.join(", ")}</span>
		</output>
	);
}
