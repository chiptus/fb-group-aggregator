import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPosts,
  markAllPostsAsSeen,
  markPostAsSeen,
  togglePostStarred,
} from '@/lib/storage/posts';
import type { Post } from '@/lib/types';
import { queryKeys } from './queryKeys';

export function usePosts() {
  return useQuery({
    queryKey: queryKeys.posts,
    queryFn: () => listPosts(),
  });
}

export function useMarkPostSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, seen }: { postId: string; seen: boolean }) =>
      markPostAsSeen(postId, seen),
    onMutate: async ({ postId, seen }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts);

      // Optimistically update to the new value
      queryClient.setQueryData<Post[]>(queryKeys.posts, (old) =>
        old?.map((p) => (p.id === postId ? { ...p, seen } : p))
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useMarkAllPostsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postIds: string[]) => markAllPostsAsSeen(postIds),
    onMutate: async (postIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts });
      const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts);
      const seenSet = new Set(postIds);
      queryClient.setQueryData<Post[]>(queryKeys.posts, (old) =>
        old?.map((p) => (seenSet.has(p.id) ? { ...p, seen: true } : p))
      );
      return { previousPosts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKeys.posts, context.previousPosts);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useTogglePostStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, starred }: { postId: string; starred: boolean }) =>
      togglePostStarred(postId, starred),
    onMutate: async ({ postId, starred }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts);

      // Optimistically update to the new value
      queryClient.setQueryData<Post[]>(queryKeys.posts, (old) =>
        old?.map((p) => (p.id === postId ? { ...p, starred } : p))
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}
