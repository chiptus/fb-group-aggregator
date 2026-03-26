import type { JobStatus, ScrapeJob } from '@/lib/types';
import { GroupResultsList } from './GroupResultsList';
import { JobCardHeader } from './JobCardHeader';
import { JobLogsSection } from './JobLogsSection';

export const STATUS_BADGES: Record<JobStatus, string> = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

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
  return (
    <div className="p-6">
      <JobCardHeader
        job={job}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onCancel={onCancel}
        onResume={onResume}
        onDelete={onDelete}
      />
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
