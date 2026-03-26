import type { ScrapeJob } from '@/lib/types';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { JobCardActions } from './JobCardActions';
import { STATUS_BADGES } from './JobCard';

interface JobCardHeaderProps {
  job: ScrapeJob;
  isExpanded: boolean;
  onToggleExpand: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onResume: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

export function JobCardHeader({
  job,
  isExpanded,
  onToggleExpand,
  onCancel,
  onResume,
  onDelete,
}: JobCardHeaderProps) {
  const progressPercentage =
    job.totalGroups > 0
      ? Math.round((job.currentGroupIndex / job.totalGroups) * 100)
      : 0;

  return (
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
            <span className="font-medium text-red-600">{job.failedCount}</span>
          </div>
        </div>
        {job.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error:</strong> {job.error}
          </div>
        )}
      </div>
      <JobCardActions
        jobId={job.id}
        status={job.status}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onCancel={onCancel}
        onResume={onResume}
        onDelete={onDelete}
      />
    </div>
  );
}
