import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import { queryKeys } from "./queryKeys";

interface UseLogsOptions {
	jobId?: string;
}

export function useLogs(options?: UseLogsOptions) {
	const { jobId } = options || {};

	return useQuery({
		queryKey: jobId ? [...queryKeys.logs, jobId] : queryKeys.logs,
		queryFn: () => (jobId ? storage.listLogsByJob(jobId) : storage.listLogs()),
		refetchInterval: 2000, // Refetch every 2 seconds to show new logs
	});
}

export function useClearLogs() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => storage.clearLogs(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.logs });
		},
	});
}
