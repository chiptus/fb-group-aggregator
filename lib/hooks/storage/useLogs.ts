import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearLogs, listLogs, listLogsByJob } from "@/lib/storage/logs";
import { queryKeys } from "./queryKeys";

interface UseLogsOptions {
	jobId?: string;
}

export function useLogs(options?: UseLogsOptions) {
	const { jobId } = options || {};

	return useQuery({
		queryKey: jobId ? [...queryKeys.logs, jobId] : queryKeys.logs,
		queryFn: () => (jobId ? listLogsByJob(jobId) : listLogs()),
		refetchInterval: 2000, // Refetch every 2 seconds to show new logs
	});
}

export function useClearLogs() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => clearLogs(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.logs });
		},
	});
}
