import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storage } from 'wxt/utils/storage';
import {
  DEFAULT_FILTER_SETTINGS,
  type FilterSettings,
  FilterSettingsSchema,
} from '@/lib/filters/types';

const FILTER_SETTINGS_KEY = 'local:filterSettings' as const;

export function useFilters() {
  return useQuery({
    queryKey: [FILTER_SETTINGS_KEY],
    queryFn: async (): Promise<FilterSettings> => {
      const stored = await storage.getItem<FilterSettings>(FILTER_SETTINGS_KEY);

      if (!stored) {
        return DEFAULT_FILTER_SETTINGS;
      }

      // Validate with Zod schema
      const result = FilterSettingsSchema.safeParse(stored);
      return result.success ? result.data : DEFAULT_FILTER_SETTINGS;
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
      void queryClient.invalidateQueries({ queryKey: [FILTER_SETTINGS_KEY] });
    },
  });
}
