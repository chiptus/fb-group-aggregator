import { Button } from '@/components/ui/button';
import type { JobStatus, ScrapeJob } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { GroupResultsList } from './GroupResultsList';
import { JobLogsSection } from './JobLogsSection';

export const STATUS_BADGES: Record<JobStatus, string> = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

function formatDuration(
  startedAt: number | null,
  endTime: number = Date.now()
) {
  if (!startedAt) return 'Not started';
  const durationMs = endTime - startedAt;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export interface JobCardProps {
  job: ScrapeJob;
  isExpanded: boolean;
  showLogs: boolean;
  onToggleExpand: (jobId: string) => void;
  onToggleLogs: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onResume: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

export function JobCard({
  job,
  isExpanded,
  showLogs,
  onToggleExpand,
  onToggleLogs,
  onCancel,
  onResume,
  onDelete,
}: JobCardProps) {
  const progressPercentage =
    job.totalGroups > 0
      ? Math.round((job.currentGroupIndex / job.totalGroups) * 100)
      : 0;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold text-white uppercase ${STATUS_BADGES[job.status]}`}
            >
              {job.status}
            </span>
            <span className="text-sm text-gray-600">
              {formatDateTime(job.createdAt)}
            </span>
            <span className="text-sm text-gray-600">
              Duration:{' '}
              {job.startedAt
                ? formatDuration(job.startedAt, job.completedAt || undefined)
                : 'Not started'}
            </span>
          </div>
          {(job.status === 'running' || job.status === 'paused') && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">
                  Progress: {job.currentGroupIndex} / {job.totalGroups} groups
                </span>
                <span className="text-gray-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>{' '}
              <span className="font-medium">{job.totalGroups}</span>
            </div>
            <div>
              <span className="text-gray-600">Success:</span>{' '}
              <span className="font-medium text-green-600">
                {job.successCount}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>{' '}
              <span className="font-medium text-red-600">
                {job.failedCount}
              </span>
            </div>
          </div>
          {job.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Error:</strong> {job.error}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {job.status === 'running' && (
            <Button
              type="button"
              onClick={() => onCancel(job.id)}
              variant="destructive"
            >
              Cancel
            </Button>
          )}
          {(job.status === 'paused' || job.status === 'failed') && (
            <Button
              onClick={() => onResume(job.id)}
              variant="primary"
              size="sm"
            >
              Resume
            </Button>
          )}
          {(job.status === 'completed' ||
            job.status === 'failed' ||
            job.status === 'cancelled') && (
            <Button
              onClick={() => onDelete(job.id)}
              variant="destructive"
              size="sm"
            >
              Delete
            </Button>
          )}
          <Button
            onClick={() => onToggleExpand(job.id)}
            variant="secondary"
            size="sm"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
          <GroupResultsList groupResults={job.groupResults} />
          <JobLogsSection
            jobId={job.id}
            showLogs={showLogs}
            onToggleLogs={onToggleLogs}
          />
        </div>
      )}
    </div>
  );
}
