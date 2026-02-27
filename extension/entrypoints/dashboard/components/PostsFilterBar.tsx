import type { FilterSettings } from "@/lib/filters/types";
import { FilterChips } from "./FilterChips";
import { FilterControls } from "./FilterControls";
import { FilterStatsBanner } from "./FilterStatsBanner";

interface PostsFilterBarProps {
	showFilterPanel: boolean;
	hasActiveFilters: boolean;
	filters: FilterSettings;
	onRemoveKeyword: (keyword: string, type: "positive" | "negative") => void;
	totalPosts: number;
	filteredPostsCount: number;
}

export function PostsFilterBar({
	showFilterPanel,
	hasActiveFilters,
	filters,
	onRemoveKeyword,
	totalPosts,
	filteredPostsCount,
}: PostsFilterBarProps) {
	return (
		<>
			{showFilterPanel && (
				<div className="mb-4">
					<FilterControls />
				</div>
			)}

			{hasActiveFilters && (
				<div className="mb-4">
					<FilterChips filters={filters} onRemoveKeyword={onRemoveKeyword} />
				</div>
			)}

			{hasActiveFilters && (
				<FilterStatsBanner
					totalPosts={totalPosts}
					filteredPosts={filteredPostsCount}
					positiveKeywordCount={filters.positiveKeywords.length}
					negativeKeywordCount={filters.negativeKeywords.length}
					className="mb-4"
				/>
			)}
		</>
	);
}
