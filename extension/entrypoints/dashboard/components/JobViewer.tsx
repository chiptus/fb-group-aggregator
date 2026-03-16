import { useMemo, useState } from 'react';
import {
  useCancelJob,
  useDeleteJob,
  useJobs,
  useResumeJob,
  useStartJob,
} from '@/lib/hooks/storage/useJobs';
import { LoadingSpinner } from './LoadingSpinner';
import { JobCard } from './JobCard';
import { JobViewerHeader } from './JobViewerHeader';

export function JobViewer() {
	const jobsQuery = useJobs();
	const startJobMutation = useStartJob();
	const cancelJobMutation = useCancelJob();
	const resumeJobMutation = useResumeJob();
	const deleteJobMutation = useDeleteJob();

	const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
	const [showLogsForJob, setShowLogsForJob] = useState<string | null>(null);

  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);

  const { activeJob, completedJobs } = useMemo(() => {
    const active = jobs.find(
      (j) => j.status === 'running' || j.status === 'paused'
    );
    const completed = jobs
      .filter(
        (j) =>
          j.status === 'completed' ||
          j.status === 'failed' ||
          j.status === 'cancelled'
      )
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 3);
    return { activeJob: active, completedJobs: completed };
  }, [jobs]);

	function handleStartJob() {
		startJobMutation.mutate(undefined, {
			onSuccess: (data) => {
				setExpandedJobId(data.jobId);
			},
			onError: (error) => {
				alert(`Failed to start job: ${error.message}`);
			},
		});
	}

	function handleCancelJob(jobId: string) {
		if (confirm("Are you sure you want to cancel this job?")) {
			cancelJobMutation.mutate(jobId, {
				onError: (error) => {
					alert(`Failed to cancel job: ${error.message}`);
				},
			});
		}
	}

	function handleResumeJob(jobId: string) {
		resumeJobMutation.mutate(jobId, {
			onError: (error) => {
				alert(`Failed to resume job: ${error.message}`);
			},
		});
	}

  function handleDeleteJob(jobId: string) {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJobMutation.mutate(jobId, {
        onSuccess: () => {
          if (expandedJobId === jobId) setExpandedJobId(null);
          if (showLogsForJob === jobId) setShowLogsForJob(null);
        },
      });
    }
  }

	function toggleJobExpand(jobId: string) {
		setExpandedJobId((current) => (current === jobId ? null : jobId));
	}

	function toggleJobLogs(jobId: string) {
		setShowLogsForJob((current) => (current === jobId ? null : jobId));
	}

	if (jobsQuery.isLoading) {
		return <LoadingSpinner />;
	}

	if (jobsQuery.error) {
		return (
			<div className="p-4 bg-red-50 border border-red-200 rounded">
				<p className="text-red-700">Failed to load jobs</p>
			</div>
		);
	}

  return (
    <div className="space-y-6">
      <JobViewerHeader
        hasActiveJob={!!activeJob}
        isPending={startJobMutation.isPending}
        isCancelling={cancelJobMutation.isPending}
        onStartJob={handleStartJob}
      />
      {activeJob && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Current Job
            </h3>
          </div>
          <JobCard
            job={activeJob}
            isExpanded={expandedJobId === activeJob.id}
            showLogs={showLogsForJob === activeJob.id}
            onToggleExpand={toggleJobExpand}
            onToggleLogs={toggleJobLogs}
            onCancel={handleCancelJob}
            onResume={handleResumeJob}
            onDelete={handleDeleteJob}
          />
        </div>
      )}
      {completedJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Jobs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {completedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                showLogs={showLogsForJob === job.id}
                onToggleExpand={toggleJobExpand}
                onToggleLogs={toggleJobLogs}
                onCancel={handleCancelJob}
                onResume={handleResumeJob}
                onDelete={handleDeleteJob}
              />
            ))}
          </div>
        </div>
      )}
      {!activeJob && completedJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No jobs yet</p>
          <p className="text-sm text-gray-500">
            Click "Start New Job" to begin scraping all enabled groups
          </p>
        </div>
      )}
    </div>
  );
}
