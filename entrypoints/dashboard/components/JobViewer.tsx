import { useMemo, useState } from "react";
import {
	useCancelJob,
	useDeleteJob,
	useJobs,
	useResumeJob,
	useStartJob,
} from "@/lib/hooks/storage/useJobs";
import { useLogs } from "@/lib/hooks/storage/useLogs";
import type { JobStatus, ScrapeJob } from "@/lib/types";
import { LoadingSpinner } from "./LoadingSpinner";

const STATUS_COLORS: Record<JobStatus, string> = {
	pending: "bg-gray-100 text-gray-700",
	running: "bg-blue-100 text-blue-700",
	paused: "bg-yellow-100 text-yellow-700",
	completed: "bg-green-100 text-green-700",
	failed: "bg-red-100 text-red-700",
	cancelled: "bg-gray-100 text-gray-700",
};

const STATUS_BADGES: Record<JobStatus, string> = {
	pending: "bg-gray-500",
	running: "bg-blue-500",
	paused: "bg-yellow-500",
	completed: "bg-green-500",
	failed: "bg-red-500",
	cancelled: "bg-gray-500",
};

export function JobViewer() {
	const jobsQuery = useJobs();
	const startJobMutation = useStartJob();
	const cancelJobMutation = useCancelJob();
	const resumeJobMutation = useResumeJob();
	const deleteJobMutation = useDeleteJob();

	const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
	const [showLogsForJob, setShowLogsForJob] = useState<string | null>(null);

	const jobs = jobsQuery.data ?? [];

	// Separate active and completed jobs
	const { activeJob, completedJobs } = useMemo(() => {
		const active = jobs.find(
			(j) => j.status === "running" || j.status === "paused",
		);
		const completed = jobs
			.filter(
				(j) =>
					j.status === "completed" ||
					j.status === "failed" ||
					j.status === "cancelled",
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
			cancelJobMutation.mutate(jobId);
		}
	}

	function handleResumeJob(jobId: string) {
		resumeJobMutation.mutate(jobId);
	}

	function handleDeleteJob(jobId: string) {
		if (confirm("Are you sure you want to delete this job?")) {
			deleteJobMutation.mutate(jobId, {
				onSuccess: () => {
					if (expandedJobId === jobId) {
						setExpandedJobId(null);
					}
					if (showLogsForJob === jobId) {
						setShowLogsForJob(null);
					}
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
			{/* Header with Start Job Button */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl font-semibold">Scraping Jobs</h2>
						<p className="text-sm text-gray-600 mt-1">
							Manage background scraping jobs for all enabled groups
						</p>
					</div>
					<button
						type="button"
						onClick={handleStartJob}
						disabled={
							startJobMutation.isPending ||
							!!activeJob ||
							cancelJobMutation.isPending
						}
						className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
					>
						{startJobMutation.isPending ? "Starting..." : "Start New Job"}
					</button>
				</div>
			</div>

			{/* Active Job Section */}
			{activeJob && (
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<span
								className={`px-2 py-1 rounded text-xs font-semibold text-white uppercase ${STATUS_BADGES[activeJob.status]}`}
							>
								{activeJob.status}
							</span>
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

			{/* Historical Jobs Section */}
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

			{/* Empty State */}
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

interface JobCardProps {
	job: ScrapeJob;
	isExpanded: boolean;
	showLogs: boolean;
	onToggleExpand: (jobId: string) => void;
	onToggleLogs: (jobId: string) => void;
	onCancel: (jobId: string) => void;
	onResume: (jobId: string) => void;
	onDelete: (jobId: string) => void;
}

function JobCard(props: JobCardProps) {
	const {
		job,
		isExpanded,
		showLogs,
		onToggleExpand,
		onToggleLogs,
		onCancel,
		onResume,
		onDelete,
	} = props;

	const logsQuery = useLogs(showLogs ? { jobId: job.id } : undefined);
	const logs = logsQuery.data ?? [];

	const progressPercentage =
		job.totalGroups > 0
			? Math.round((job.currentGroupIndex / job.totalGroups) * 100)
			: 0;

	function formatDuration(
		startedAt: number | null,
		completedAt: number | null,
	) {
		if (!startedAt) return "Not started";
		const end = completedAt || Date.now();
		const durationMs = end - startedAt;
		const minutes = Math.floor(durationMs / 60000);
		const seconds = Math.floor((durationMs % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	}

	function formatTimestamp(timestamp: number) {
		return new Date(timestamp).toLocaleString();
	}

	return (
		<div className="p-6">
			{/* Job Summary */}
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-3">
						<span
							className={`px-2 py-1 rounded text-xs font-semibold text-white uppercase ${STATUS_BADGES[job.status]}`}
						>
							{job.status}
						</span>
						<span className="text-sm text-gray-600">
							{formatTimestamp(job.createdAt)}
						</span>
						<span className="text-sm text-gray-600">
							Duration: {formatDuration(job.startedAt, job.completedAt)}
						</span>
					</div>

					{/* Progress Bar (for running/paused jobs) */}
					{(job.status === "running" || job.status === "paused") && (
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

					{/* Stats */}
					<div className="flex gap-6 text-sm">
						<div>
							<span className="text-gray-600">Total:</span>{" "}
							<span className="font-medium">{job.totalGroups}</span>
						</div>
						<div>
							<span className="text-gray-600">Success:</span>{" "}
							<span className="font-medium text-green-600">
								{job.successCount}
							</span>
						</div>
						<div>
							<span className="text-gray-600">Failed:</span>{" "}
							<span className="font-medium text-red-600">
								{job.failedCount}
							</span>
						</div>
					</div>

					{/* Error Message (if failed) */}
					{job.error && (
						<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
							<strong>Error:</strong> {job.error}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 ml-4">
					{job.status === "running" && (
						<button
							type="button"
							onClick={() => onCancel(job.id)}
							className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
						>
							Cancel
						</button>
					)}
					{(job.status === "paused" || job.status === "failed") && (
						<button
							type="button"
							onClick={() => onResume(job.id)}
							className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
						>
							Resume
						</button>
					)}
					{(job.status === "completed" ||
						job.status === "failed" ||
						job.status === "cancelled") && (
						<button
							type="button"
							onClick={() => onDelete(job.id)}
							className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
						>
							Delete
						</button>
					)}
					<button
						type="button"
						onClick={() => onToggleExpand(job.id)}
						className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
					>
						{isExpanded ? "Hide Details" : "Show Details"}
					</button>
				</div>
			</div>

			{/* Expanded Details */}
			{isExpanded && (
				<div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
					{/* Group Results */}
					<div>
						<h4 className="font-medium mb-3">Group Results</h4>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{job.groupResults.map((result, index) => (
								<div
									key={result.groupId}
									className="flex items-center gap-3 p-3 bg-gray-50 rounded text-sm"
								>
									<span className="text-gray-500 w-8">{index + 1}.</span>
									{result.status === "success" && (
										<span className="text-green-600 text-lg">✓</span>
									)}
									{result.status === "failed" && (
										<span className="text-red-600 text-lg">✗</span>
									)}
									{result.status === "pending" && (
										<span className="text-gray-400 text-lg">⏳</span>
									)}
									{result.status === "skipped" && (
										<span className="text-gray-400 text-lg">⊘</span>
									)}
									<span className="flex-1 font-medium">{result.groupName}</span>
									{result.postsScraped !== undefined && (
										<span className="text-gray-600">
											{result.postsScraped} posts
										</span>
									)}
									{result.error && (
										<span className="text-red-600 text-xs">{result.error}</span>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Logs Toggle */}
					<div>
						<button
							type="button"
							onClick={() => onToggleLogs(job.id)}
							className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
						>
							{showLogs ? "Hide Logs" : "Show Logs"}
						</button>
					</div>

					{/* Logs Section */}
					{showLogs && (
						<div className="border-t border-gray-200 pt-4">
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
														log.level === "error"
															? "bg-red-500 text-white"
															: log.level === "warn"
																? "bg-yellow-500 text-white"
																: log.level === "info"
																	? "bg-blue-500 text-white"
																	: "bg-gray-500 text-white"
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
			)}
		</div>
	);
}
