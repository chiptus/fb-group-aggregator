import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClearLogs, useLogs } from '@/lib/hooks/storage/useLogs';
import type { LogLevel, LogSource } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { LogEntryRow } from './LogEntryRow';

export function LogViewer() {
  const logsQuery = useLogs();
  const clearLogsMutation = useClearLogs();

  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
      return true;
    });
  }, [logs, levelFilter, sourceFilter]);

  function handleClearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
      clearLogsMutation.mutate();
    }
  }

  if (logsQuery.isLoading) {
    return <LoadingSpinner />;
  }

  if (logsQuery.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Failed to load logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="level-filter" className="text-sm font-medium">
                Level:
              </label>
              <select
                id="level-filter"
                value={levelFilter}
                onChange={(e) =>
                  setLevelFilter(e.target.value as LogLevel | 'all')
                }
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="source-filter" className="text-sm font-medium">
                Source:
              </label>
              <select
                id="source-filter"
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as LogSource | 'all')
                }
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="background">Background</option>
                <option value="content">Content</option>
                <option value="popup">Popup</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleClearLogs}
              disabled={clearLogsMutation.isPending || logs.length === 0}
              variant="destructive"
            >
              Clear Logs
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            Total: <strong>{logs.length}</strong>
          </span>
          <span>
            Filtered: <strong>{filteredLogs.length}</strong>
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs to display
          </div>
        ) : (
          <div className="space-y-2 font-mono text-sm">
            {filteredLogs.map((log) => (
              <LogEntryRow key={log.id} log={log} />
            ))}
            {autoScroll && <div id="log-bottom" />}
          </div>
        )}
      </div>
    </div>
  );
}
