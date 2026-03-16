import type { Post } from "@/lib/types";
import type { GroupingStrategy } from "./strategies/base";
import { ExactMatchStrategy } from "./strategies/exact-match";
import type { GroupingResult, GroupingStats, PostGroup } from "./types";

/**
 * Orchestrates grouping operations using strategy pattern.
 */
export class PostGroupingService {
	private _strategy: GroupingStrategy;

	constructor(strategy?: GroupingStrategy) {
		this._strategy = strategy ?? new ExactMatchStrategy();
	}

	/**
	 * Current grouping strategy
	 */
	get strategy(): GroupingStrategy {
		return this._strategy;
	}

	/**
	 * Change grouping strategy at runtime
	 */
	setStrategy(strategy: GroupingStrategy): void {
		this._strategy = strategy;
	}

	/**
	 * Group posts using current strategy
	 */
	groupPosts(posts: Post[]): GroupingResult {
		return this._strategy.group(posts);
	}

	/**
	 * Get posts belonging to a specific group
	 */
	getPostsByGroup(
		groupId: string,
		allPosts: Post[],
		groupingResult: GroupingResult,
	): Post[] {
		const group = groupingResult.groups.find((g) => g.id === groupId);
		if (!group) return [];

		const postIdSet = new Set(group.postIds);
		return allPosts.filter((p) => postIdSet.has(p.id));
	}

	/**
	 * Get groups sorted by size (largest first)
	 */
	getGroupsSorted(groupingResult: GroupingResult): PostGroup[] {
		return [...groupingResult.groups].sort((a, b) => b.count - a.count);
	}

	/**
	 * Calculate grouping statistics
	 */
	getGroupingStats(groupingResult: GroupingResult): GroupingStats {
		const { groups, ungroupedPostIds, totalPostsGrouped, strategyUsed } =
			groupingResult;

		const totalItems = totalPostsGrouped + ungroupedPostIds.length;
		const maxGroupSize =
			groups.length > 0 ? Math.max(...groups.map((g) => g.count)) : 0;

		// Reduction: (original items - resulting items) / original items
		// E.g., 4 posts grouped into 1 = 75% reduction
		const resultingItems = groups.length + ungroupedPostIds.length;
		const reductionPercentage =
			totalItems > 0
				? Math.round(((totalItems - resultingItems) / totalItems) * 100)
				: 0;

		return {
			totalGroups: groups.length,
			totalPostsGrouped,
			ungroupedCount: ungroupedPostIds.length,
			averageGroupSize:
				groups.length > 0 ? totalPostsGrouped / groups.length : 0,
			maxGroupSize,
			reductionPercentage,
			strategyUsed,
		};
	}
}
