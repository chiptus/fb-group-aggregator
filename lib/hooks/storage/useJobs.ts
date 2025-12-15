import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listJobs } from "@/lib/storage";
import { queryKeys } from "./queryKeys";

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
			const response = await chrome.runtime.sendMessage({ type: "START_JOB" });
			if (!response.success) {
				throw new Error(response.error || "Failed to start job");
			}
			return { jobId: response.jobId };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
		},
	});
}

export function useCancelJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (jobId: string): Promise<void> => {
			const response = await chrome.runtime.sendMessage({
				type: "CANCEL_JOB",
				payload: { jobId },
			});
			if (!response.success) {
				throw new Error(response.error || "Failed to cancel job");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
		},
	});
}

export function useResumeJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (jobId: string): Promise<void> => {
			const response = await chrome.runtime.sendMessage({
				type: "RESUME_JOB",
				payload: { jobId },
			});
			if (!response.success) {
				throw new Error(response.error || "Failed to resume job");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
		},
	});
}

export function useDeleteJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (jobId: string): Promise<void> => {
			const response = await chrome.runtime.sendMessage({
				type: "DELETE_JOB",
				payload: { jobId },
			});
			if (!response.success) {
				throw new Error(response.error || "Failed to delete job");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
		},
	});
}
