import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import type { Subscription } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useSubscriptions() {
	return useQuery({
		queryKey: queryKeys.subscriptions,
		queryFn: () => storage.listSubscriptions(),
	});
}

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
