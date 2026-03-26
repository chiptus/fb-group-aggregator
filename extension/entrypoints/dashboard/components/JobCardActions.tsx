import { Button } from '@/components/ui/button';
import type { ScrapeJob } from '@/lib/types';

interface JobCardActionsProps {
  jobId: string;
  status: ScrapeJob['status'];
  isExpanded: boolean;
  onToggleExpand: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onResume: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

export function JobCardActions({
  jobId,
  status,
  isExpanded,
  onToggleExpand,
  onCancel,
  onResume,
  onDelete,
}: JobCardActionsProps) {
  return (
    <div className="flex gap-2 ml-4">
      {status === 'running' && (
        <Button
          type="button"
          onClick={() => onCancel(jobId)}
          variant="destructive"
        >
          Cancel
        </Button>
      )}
      {(status === 'paused' || status === 'failed') && (
        <Button onClick={() => onResume(jobId)} variant="primary" size="sm">
          Resume
        </Button>
      )}
      {(status === 'completed' ||
        status === 'failed' ||
        status === 'cancelled') && (
        <Button onClick={() => onDelete(jobId)} variant="destructive" size="sm">
          Delete
        </Button>
      )}
      <Button
        onClick={() => onToggleExpand(jobId)}
        variant="secondary"
        size="sm"
      >
        {isExpanded ? 'Hide Details' : 'Show Details'}
      </Button>
    </div>
  );
}
