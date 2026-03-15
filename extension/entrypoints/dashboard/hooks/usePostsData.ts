import { useCallback, useMemo } from "react";
import type { FilterSettings } from "@/lib/filters/types";
import { useFilters, useSaveFilters } from "@/lib/hooks/filters/useFilters";
import { useGroups } from "@/lib/hooks/storage/useGroups";
import {
	useMarkPostSeen,
	usePosts,
	useTogglePostStarred,
} from "@/lib/hooks/storage/usePosts";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";

const DEFAULT_FILTERS: FilterSettings = {
	positiveKeywords: [],
	negativeKeywords: [],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

export { DEFAULT_FILTERS };

export function usePostsData() {
	const markPostSeenMutation = useMarkPostSeen();
	const togglePostStarredMutation = useTogglePostStarred();

	const subscriptionsQuery = useSubscriptions();
	const groupsQuery = useGroups();
	const postsQuery = usePosts();
	const filtersQuery = useFilters();
	const saveFiltersMutation = useSaveFilters();

	const filters = filtersQuery.data ?? DEFAULT_FILTERS;
	const isLoading =
		subscriptionsQuery.isLoading ||
		groupsQuery.isLoading ||
		postsQuery.isLoading;
	const error =
		subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

	const subscriptions = subscriptionsQuery.data ?? [];
	const groups = groupsQuery.data ?? [];
	const posts = postsQuery.data ?? [];

	const groupsMap = useMemo(
		() => new Map(groups.map((g) => [g.id, g])),
		[groups],
	);

	const setPostSeen = useCallback(
		(postId: string, seen: boolean) => {
			markPostSeenMutation.mutate({ postId, seen });
		},
		[markPostSeenMutation],
	);

	const togglePostStarred = useCallback(
		(postId: string, currentStarred: boolean) => {
			togglePostStarredMutation.mutate({ postId, starred: !currentStarred });
		},
		[togglePostStarredMutation],
	);

	const removeKeyword = useCallback(
		(keyword: string, type: "positive" | "negative") => {
			saveFiltersMutation.mutate({
				...filters,
				positiveKeywords:
					type === "positive"
						? filters.positiveKeywords.filter((k) => k !== keyword)
						: filters.positiveKeywords,
				negativeKeywords:
					type === "negative"
						? filters.negativeKeywords.filter((k) => k !== keyword)
						: filters.negativeKeywords,
			});
		},
		[filters, saveFiltersMutation],
	);

	return {
		subscriptions,
		groups,
		posts,
		groupsMap,
		filters,
		saveFiltersMutation,
		setPostSeen,
		isLoading,
		error,
		togglePostStarred,
		removeKeyword,
	};
}
