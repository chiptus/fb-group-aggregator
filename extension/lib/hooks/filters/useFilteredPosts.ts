import { useMemo } from "react";
import { filterPosts } from "@/lib/filters/filterPosts";
import { usePosts } from "@/lib/hooks/storage/usePosts";
import type { Post } from "@/lib/types";
import { useFilters } from "./useFilters";

export interface FilterStats {
	totalPosts: number;
	filteredPosts: number;
	removedPosts: number;
	efficiency: number;
}

export interface UseFilteredPostsResult {
	data: Post[] | undefined;
	stats: FilterStats | undefined;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
}

export function useFilteredPosts(): UseFilteredPostsResult {
	const postsQuery = usePosts();
	const filtersQuery = useFilters();

	const filteredData = useMemo(() => {
		if (!postsQuery.data || !filtersQuery.data) {
			return undefined;
		}

		return filterPosts(postsQuery.data, filtersQuery.data);
	}, [postsQuery.data, filtersQuery.data]);

	const stats = useMemo((): FilterStats | undefined => {
		if (!postsQuery.data || !filteredData) {
			return undefined;
		}

		const totalPosts = postsQuery.data.length;
		const filteredPosts = filteredData.length;
		const removedPosts = totalPosts - filteredPosts;
		const efficiency =
			totalPosts === 0 ? 0 : (filteredPosts / totalPosts) * 100;

		return {
			totalPosts,
			filteredPosts,
			removedPosts,
			efficiency,
		};
	}, [postsQuery.data, filteredData]);

	return {
		data: filteredData,
		stats,
		isLoading: postsQuery.isPending || filtersQuery.isPending,
		isError: postsQuery.isError || filtersQuery.isError,
		error: postsQuery.error || filtersQuery.error,
	};
}
