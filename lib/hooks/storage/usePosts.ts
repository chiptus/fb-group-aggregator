import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import type { Post } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function usePosts() {
	return useQuery({
		queryKey: queryKeys.posts,
		queryFn: () => storage.listPosts(),
	});
}

export function useMarkPostSeen() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ postId, seen }: { postId: string; seen: boolean }) =>
			storage.markPostAsSeen(postId, seen),
		onMutate: async ({ postId, seen }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.posts });

			// Snapshot the previous value
			const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts);

			// Optimistically update to the new value
			queryClient.setQueryData<Post[]>(queryKeys.posts, (old) =>
				old?.map((p) => (p.id === postId ? { ...p, seen } : p)),
			);

			// Return context with the snapshot
			return { previousPosts };
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousPosts) {
				queryClient.setQueryData(queryKeys.posts, context.previousPosts);
			}
		},
		onSettled: () => {
			// Refetch after mutation
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}
