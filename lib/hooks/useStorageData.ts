import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import type { Group, Post, Subscription } from "@/lib/types";

// Query keys
export const queryKeys = {
	subscriptions: ["subscriptions"] as const,
	groups: ["groups"] as const,
	posts: ["posts"] as const,
};

// Data fetching hooks
export function useSubscriptions() {
	return useQuery({
		queryKey: queryKeys.subscriptions,
		queryFn: () => storage.listSubscriptions(),
	});
}

export function useGroups() {
	return useQuery({
		queryKey: queryKeys.groups,
		queryFn: () => storage.listGroups(),
	});
}

export function usePosts() {
	return useQuery({
		queryKey: queryKeys.posts,
		queryFn: () => storage.listPosts(),
	});
}

// Subscription mutations
export function useCreateSubscription() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => storage.createSubscription(name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
		},
	});
}

export function useUpdateSubscription() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Subscription>;
		}) => storage.updateSubscription(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
		},
	});
}

export function useDeleteSubscription() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => storage.deleteSubscription(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
		},
	});
}

// Group mutations
export function useUpdateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, updates }: { id: string; updates: Partial<Group> }) =>
			storage.updateGroup(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups });
		},
	});
}

export function useDeleteGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => storage.deleteGroup(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups });
		},
	});
}

// Post mutations
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
