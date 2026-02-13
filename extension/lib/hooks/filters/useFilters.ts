import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storage } from "wxt/utils/storage";
import { type FilterSettings, FilterSettingsSchema } from "@/lib/filters/types";

const FILTER_SETTINGS_KEY = "local:filterSettings" as const;

const defaultFilters: FilterSettings = {
	positiveKeywords: [],
	negativeKeywords: [],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

export function useFilters() {
	return useQuery({
		queryKey: [FILTER_SETTINGS_KEY],
		queryFn: async (): Promise<FilterSettings> => {
			const stored = await storage.getItem<FilterSettings>(FILTER_SETTINGS_KEY);

			if (!stored) {
				return defaultFilters;
			}

			// Validate with Zod schema
			const result = FilterSettingsSchema.safeParse(stored);
			return result.success ? result.data : defaultFilters;
		},
	});
}

export function useSaveFilters() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: FilterSettings): Promise<void> => {
			// Validate before saving
			const validated = FilterSettingsSchema.parse(settings);
			await storage.setItem(FILTER_SETTINGS_KEY, validated);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [FILTER_SETTINGS_KEY] });
		},
	});
}
