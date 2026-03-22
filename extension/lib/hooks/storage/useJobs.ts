import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listJobs } from '@/lib/storage/jobs';
import { queryKeys } from './queryKeys';
import { z } from 'zod';

interface UseJobsOptions {
  jobId?: string;
  refetchInterval?: number;
}

export function useJobs(options?: UseJobsOptions) {
  const { jobId, refetchInterval = 2000 } = options || {};

  return useQuery({
    queryKey: jobId ? [...queryKeys.jobs, jobId] : queryKeys.jobs,
    queryFn: async () => {
      const jobs = await listJobs();
      if (jobId) {
        const job = jobs.find((j) => j.id === jobId);
        return job ? [job] : [];
      }
      return jobs;
    },
    refetchInterval,
  });
}

export function useStartJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ jobId: string }> => {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'START_JOB',
      });
      const parsed = jobResponseSchema.parse(response);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Failed to start job');
      }
      if (!parsed.jobId) {
        throw new Error('No jobId in response');
      }
      return { jobId: parsed.jobId };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'CANCEL_JOB',
        payload: { jobId },
      });
      const parsed = jobResponseSchema.parse(response);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Failed to cancel job');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'RESUME_JOB',
        payload: { jobId },
      });
      const parsed = jobResponseSchema.parse(response);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Failed to resume job');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'DELETE_JOB',
        payload: { jobId },
      });
      const parsed = jobResponseSchema.parse(response);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Failed to delete job');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

/**
 * Schema for job operation response
 */
const jobResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string().optional(),
  error: z.string().optional(),
});
