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

export function useScanGroupsList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			// Open groups list page tab
			await chrome.tabs.create({
				url: "https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added",
			});
			// Note: Actual scraping happens via content script
			// This just triggers the navigation
		},
		onSuccess: () => {
			// Invalidate groups query to refresh UI when scraping completes
			queryClient.invalidateQueries({ queryKey: queryKeys.groups });
		},
	});
}

export function useBulkUpdateGroups() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			groupIds,
			updates,
		}: {
			groupIds: string[];
			updates: Partial<Group>;
		}) => storage.bulkUpdateGroups(groupIds, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups });
		},
	});
}

export function useBulkDeleteGroups() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (groupIds: string[]) => storage.bulkDeleteGroups(groupIds),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups });
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

export function useScrapeSubscription() {
	return useMutation({
		mutationFn: async (subscriptionId: string) => {
			return await chrome.runtime.sendMessage({
				type: "SCRAPE_SUBSCRIPTION",
				payload: { subscriptionId },
			});
		},
	});
}
