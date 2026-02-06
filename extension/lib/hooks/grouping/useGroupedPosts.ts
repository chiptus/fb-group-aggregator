import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PostGroupingService } from "@/lib/grouping/service";
import { ExactMatchStrategy } from "@/lib/grouping/strategies/exact-match";
import type { Post } from "@/lib/types";

export function useGroupedPosts(posts: Post[]) {
	const [expansionState, setExpansionState] = useState<Map<string, boolean>>(
		() => new Map(),
	);

	// Create service with exact-match strategy
	const service = useMemo(() => {
		return new PostGroupingService(new ExactMatchStrategy());
	}, []);

	// Query for grouped posts data
	const query = useQuery({
		queryKey: ["groupedPosts", posts.map((p) => p.id).join(",")],
		queryFn: () => service.groupPosts(posts),
		staleTime: 0,
	});

	function toggleExpanded(groupId: string) {
		setExpansionState((prev) => {
			const next = new Map(prev);
			const current = next.get(groupId) ?? false;
			next.set(groupId, !current);
			return next;
		});
	}

	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error,
		service,
		expansionState,
		toggleExpanded,
	};
}
