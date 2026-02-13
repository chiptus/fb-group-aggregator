import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

// Types
export interface Subscription {
  id: string;
  name: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  url: string;
  subscriptionIds: string[];
  enabled: boolean;
  addedAt: number;
  lastScrapedAt: number | null;
}

export interface Post {
  id: string;
  groupId: string;
  authorName: string;
  contentHtml: string;
  scrapedAt: number;
  seen: boolean;
  starred: boolean;
  url: string;
}

// API Response Types
interface GetSubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
}

interface GetGroupsResponse {
  groups: Group[];
  total: number;
}

interface GetPostsResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
}

// Hooks for fetching data
export function useSubscriptions() {
  return useQuery<GetSubscriptionsResponse>({
    queryKey: ['subscriptions'],
    queryFn: () => apiClient.get('/api/sync/subscriptions'),
  });
}

export function useGroups() {
  return useQuery<GetGroupsResponse>({
    queryKey: ['groups'],
    queryFn: () => apiClient.get('/api/sync/groups'),
  });
}

export function usePosts(options?: { limit?: number; offset?: number; since?: number }) {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.since) params.set('since', options.since.toString());

  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<GetPostsResponse>({
    queryKey: ['posts', options],
    queryFn: () => apiClient.get(`/api/sync/posts${query}`),
  });
}

// Mutation hooks
export function useTogglePostSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, seen }: { postId: string; seen: boolean }) =>
      apiClient.patch(`/api/posts/${postId}`, { seen }),
    onSuccess: () => {
      // Invalidate posts query to refetch data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useTogglePostStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, starred }: { postId: string; starred: boolean }) =>
      apiClient.patch(`/api/posts/${postId}`, { starred }),
    onSuccess: () => {
      // Invalidate posts query to refetch data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
