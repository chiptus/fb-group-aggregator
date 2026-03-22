import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkDeleteGroups,
  bulkUpdateGroups,
  deleteGroup,
  listGroups,
  updateGroup,
} from '@/lib/storage/groups';
import type { Group } from '@/lib/types';
import { queryKeys } from './queryKeys';
import { z } from 'zod';

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => listGroups(),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Group> }) =>
      updateGroup(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useScanGroupsList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Open groups list page tab
      await chrome.tabs.create({
        url: 'https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added',
      });
      // Note: Actual scraping happens via content script
      // This just triggers the navigation
    },
    onSuccess: () => {
      // Invalidate groups query to refresh UI when scraping completes
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups });
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
    }) => bulkUpdateGroups(groupIds, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useBulkDeleteGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupIds: string[]) => bulkDeleteGroups(groupIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useScrapeSubscription() {
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'SCRAPE_SUBSCRIPTION',
        payload: { subscriptionId },
      });
      return scrapeSubscriptionResponseSchema.parse(response);
    },
  });
}

/**
 * Schema for scrape subscription response
 */
const scrapeSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  scrapedCount: z.number(),
  failedGroups: z.array(
    z.object({
      groupId: z.string(),
      error: z.string(),
    })
  ),
});
