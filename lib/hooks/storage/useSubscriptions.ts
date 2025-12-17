import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createSubscription,
	deleteSubscription,
	listSubscriptions,
	updateSubscription,
} from "@/lib/storage/subscriptions";
import type { Subscription } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useSubscriptions() {
	return useQuery({
		queryKey: queryKeys.subscriptions,
		queryFn: () => listSubscriptions(),
	});
}

export function useCreateSubscription() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => createSubscription(name),
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
		}) => updateSubscription(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
		},
	});
}

export function useDeleteSubscription() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteSubscription(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
		},
	});
}
