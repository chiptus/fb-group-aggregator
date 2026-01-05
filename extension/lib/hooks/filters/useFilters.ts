import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FilterSettings } from "@/lib/filters/types";

const FILTER_SETTINGS_KEY = "filter-settings";

export function useFilters() {
	return useQuery({
		queryKey: [FILTER_SETTINGS_KEY],
		queryFn: async (): Promise<FilterSettings> => {
			// TODO: Implement loading from storage
			throw new Error("Not implemented");
		},
	});
}

export function useSaveFilters() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: FilterSettings): Promise<void> => {
			// TODO: Implement saving to storage
			throw new Error("Not implemented");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [FILTER_SETTINGS_KEY] });
		},
	});
}
