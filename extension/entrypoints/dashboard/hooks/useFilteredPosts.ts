import { useMemo } from "react";
import { filterPosts } from "@/lib/filters/filterPosts";
import type { FilterSettings } from "@/lib/filters/types";
import type { Group, Post } from "@/lib/types";

interface UseFilteredPostsOptions {
	posts: Post[];
	groups: Group[];
	selectedSubscriptionId: string | null;
	searchQuery: string;
	filters: FilterSettings;
	showOnlyUnseen: boolean;
	showOnlyStarred: boolean;
}

export function useFilteredPosts({
	posts,
	groups,
	selectedSubscriptionId,
	searchQuery,
	filters,
	showOnlyUnseen,
	showOnlyStarred,
}: UseFilteredPostsOptions) {
	const subscriptionGroupIds = useMemo(() => {
		if (!selectedSubscriptionId) return null;
		return new Set(
			groups
				.filter((g) => g.subscriptionIds.includes(selectedSubscriptionId))
				.map((g) => g.id),
		);
	}, [groups, selectedSubscriptionId]);

	const filteredPosts = useMemo(() => {
		let result = posts;
		if (subscriptionGroupIds) {
			result = result.filter((p) => subscriptionGroupIds.has(p.groupId));
		}
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.contentHtml.toLowerCase().includes(query) ||
					p.authorName.toLowerCase().includes(query),
			);
		}
		const hasKeywordFilters =
			filters.positiveKeywords.length > 0 ||
			filters.negativeKeywords.length > 0;
		if (hasKeywordFilters) {
			result = filterPosts(result, filters);
		}
		if (showOnlyUnseen) {
			result = result.filter((p) => !p.seen);
		}
		if (showOnlyStarred) {
			result = result.filter((p) => p.starred);
		}
		// Sort by post ID (newest first) - using BigInt because Facebook post IDs exceed JS safe integer range
		return [...result].sort((a, b) => {
			try {
				const idA = BigInt(a.id);
				const idB = BigInt(b.id);
				return idB > idA ? 1 : idB < idA ? -1 : 0;
			} catch {
				return b.id.localeCompare(a.id);
			}
		});
	}, [
		posts,
		subscriptionGroupIds,
		searchQuery,
		filters,
		showOnlyUnseen,
		showOnlyStarred,
	]);

	const unseenCount = useMemo(
		() => filteredPosts.filter((p) => !p.seen).length,
		[filteredPosts],
	);

	const starredCount = useMemo(
		() => filteredPosts.filter((p) => p.starred).length,
		[filteredPosts],
	);

	return { filteredPosts, unseenCount, starredCount };
}
