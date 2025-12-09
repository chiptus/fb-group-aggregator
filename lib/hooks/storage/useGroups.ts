import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import type { Group } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useGroups() {
	return useQuery({
		queryKey: queryKeys.groups,
		queryFn: () => storage.listGroups(),
	});
}

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
