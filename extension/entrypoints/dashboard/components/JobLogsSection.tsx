import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useLogs } from '@/lib/hooks/storage/useLogs';
import { LoadingSpinner } from './LoadingSpinner';

interface JobLogsSectionProps {
  jobId: string;
  showLogs: boolean;
  onToggleLogs: (jobId: string) => void;
}

export function JobLogsSection({
  jobId,
  showLogs,
  onToggleLogs,
}: JobLogsSectionProps) {
  const logsQuery = useLogs(showLogs ? { jobId } : undefined);
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  return (
    <div>
      <Button onClick={() => onToggleLogs(jobId)} variant="secondary" size="sm">
        {showLogs ? 'Hide Logs' : 'Show Logs'}
      </Button>
      {showLogs && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-medium mb-3">Job Logs</h4>
          {logsQuery.isLoading ? (
            <div className="text-center py-4">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs for this job</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-semibold uppercase ${
                        log.level === 'error'
                          ? 'bg-red-500 text-white'
                          : log.level === 'warn'
                            ? 'bg-yellow-500 text-white'
                            : log.level === 'info'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                  {log.context && Object.keys(log.context).length > 0 && (
                    <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
