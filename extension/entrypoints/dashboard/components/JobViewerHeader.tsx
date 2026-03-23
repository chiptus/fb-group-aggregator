import { Button } from '@/components/ui/button';

interface JobViewerHeaderProps {
  hasActiveJob: boolean;
  isPending: boolean;
  isCancelling: boolean;
  onStartJob: () => void;
}

export function JobViewerHeader({
  hasActiveJob,
  isPending,
  isCancelling,
  onStartJob,
}: JobViewerHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Scraping Jobs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage background scraping jobs for all enabled groups
          </p>
        </div>
        <Button
          onClick={onStartJob}
          disabled={isPending || hasActiveJob || isCancelling}
          variant="primary"
          className="px-6 font-medium"
        >
          {isPending ? 'Starting...' : 'Start New Job'}
        </Button>
      </div>
    </div>
  );
}
