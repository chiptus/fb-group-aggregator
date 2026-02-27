import type { FilterSettings } from "@/lib/filters/types";
import { FilterChips } from "./FilterChips";
import { FilterControls } from "./FilterControls";
import { FilterStatsBanner } from "./FilterStatsBanner";

interface PostsFilterBarProps {
	showFilterPanel: boolean;
	onToggleFilterPanel: () => void;
	hasActiveFilters: boolean;
	filters: FilterSettings;
	onRemoveKeyword: (keyword: string, type: "positive" | "negative") => void;
	totalPosts: number;
	filteredPostsCount: number;
}

export function PostsFilterBar({
	showFilterPanel,
	onToggleFilterPanel,
	hasActiveFilters,
	filters,
	onRemoveKeyword,
	totalPosts,
	filteredPostsCount,
}: PostsFilterBarProps) {
	return (
		<>
			<div className="mb-4">
				<button
					type="button"
					onClick={onToggleFilterPanel}
					className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
				>
					{showFilterPanel ? "Hide" : "Show"} keyword filters
					{hasActiveFilters && (
						<span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
							{filters.positiveKeywords.length +
								filters.negativeKeywords.length}
						</span>
					)}
				</button>
			</div>

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
