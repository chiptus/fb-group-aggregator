import { createLogger } from "@/lib/logger";
import {
	cleanupOldJobs,
	createJob,
	getActiveJob,
	getAllEnabledGroups,
	getJob,
	listGroups,
	updateJob,
} from "@/lib/storage";
import type { ScrapeJob } from "@/lib/types";
import { scrapeGroupWithScrolling } from "./scraper-orchestrator";

// todo - need to make there's one job running at the same time

const logger = createLogger("background");

let isCancelling = false;

export async function startJob(): Promise<{ jobId: string }> {
	const activeJob = await getActiveJob();
	if (activeJob) {
		throw new Error(`Job ${activeJob.id} is already ${activeJob.status}`);
	}

	const groups = await getAllEnabledGroups();

	if (groups.length === 0) {
		throw new Error("No enabled groups to scrape");
	}

	const job = await createJob(groups);
	logger.info("Created scrape job", {
		jobId: job.id,
		totalGroups: job.totalGroups,
	});

	executeJob(job.id).catch((err) => {
		logger.error("Job execution failed", {
			jobId: job.id,
			error: err instanceof Error ? err.message : String(err),
		});
	});

	return { jobId: job.id };
}

export async function resumeJob(jobId: string): Promise<void> {
	const job = await getJob(jobId);

	if (!job) {
		throw new Error(`Job ${jobId} not found`);
	}

	if (job.status !== "paused" && job.status !== "failed") {
		throw new Error(`Cannot resume job with status: ${job.status}`);
	}

	await updateJob(jobId, { status: "running" });
	logger.info("Resuming job", {
		jobId,
		currentIndex: job.currentGroupIndex,
	});

	executeJob(jobId).catch((err) => {
		logger.error("Job resume failed", {
			jobId,
			error: err instanceof Error ? err.message : String(err),
		});
	});
}

export async function cancelJob(jobId: string): Promise<void> {
	const job = await getJob(jobId);

	if (!job) {
		throw new Error(`Job ${jobId} not found`);
	}

	if (job.status !== "running") {
		throw new Error(`Cannot cancel job with status: ${job.status}`);
	}

	logger.info("Cancelling job", { jobId });
	isCancelling = true;

	await updateJob(jobId, {
		status: "cancelled",
		completedAt: Date.now(),
	});
}

// TODO: break into smaller files
async function executeJob(jobId: string): Promise<void> {
	// currentJobId = jobId;
	isCancelling = false;

	try {
		let job = await getJob(jobId);
		if (!job) {
			throw new Error(`Job ${jobId} not found`);
		}

		if (job.status === "pending") {
			job = await updateJob(jobId, {
				status: "running",
				startedAt: Date.now(),
			});
		}

		logger.info("Executing job", {
			jobId,
			totalGroups: job.totalGroups,
			startFrom: job.currentGroupIndex,
		});

		for (let i = job.currentGroupIndex; i < job.groupResults.length; i++) {
			if (isCancelling) {
				logger.info("Job cancelled by user", { jobId });
				return;
			}

			const groupResult = job.groupResults[i];

			if (
				groupResult.status === "success" ||
				groupResult.status === "skipped"
			) {
				continue;
			}

			logger.info("Scraping group", {
				jobId,
				progress: `${i + 1}/${job.totalGroups}`,
				groupName: groupResult.groupName,
				groupId: groupResult.groupId,
			});

			const updatedGroupResults = [...job.groupResults];
			updatedGroupResults[i] = {
				...groupResult,
				status: "pending",
				startedAt: Date.now(),
			};

			await updateJob(jobId, {
				currentGroupIndex: i,
				groupResults: updatedGroupResults,
			});

			const groups = await listGroups();
			const group = groups.find((g) => g.id === groupResult.groupId);

			if (!group) {
				logger.warn("Group not found, marking as skipped", {
					groupId: groupResult.groupId,
					jobId,
				});

				updatedGroupResults[i] = {
					...groupResult,
					status: "skipped",
					error: "Group not found",
					completedAt: Date.now(),
				};

				await updateJob(jobId, { groupResults: updatedGroupResults });
				continue;
			}

			try {
				const result = await scrapeGroupWithScrolling(
					group.id,
					group.url,
					group.name,
					jobId,
				);

				updatedGroupResults[i] = {
					...groupResult,
					status: "success",
					postsScraped: result.postsScraped || 0,
					completedAt: Date.now(),
				};

				const newSuccessCount = (job.successCount || 0) + 1;

				await updateJob(jobId, {
					groupResults: updatedGroupResults,
					successCount: newSuccessCount,
				});

				logger.info("Successfully scraped group", {
					jobId,
					groupName: group.name,
					postsScraped: result.postsScraped,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				logger.error("Failed to scrape group", {
					jobId,
					groupName: group.name,
					error: errorMessage,
				});

				updatedGroupResults[i] = {
					...groupResult,
					status: "failed",
					error: errorMessage,
					completedAt: Date.now(),
				};

				const newFailedCount = (job.failedCount || 0) + 1;

				await updateJob(jobId, {
					groupResults: updatedGroupResults,
					failedCount: newFailedCount,
				});
			}

			const refreshedJob = await getJob(jobId);
			if (refreshedJob) {
				job = refreshedJob;
			}

			if (i < job.groupResults.length - 1) {
				logger.debug("Waiting before next group", { delayMs: 3000, jobId });
				await delay(3000);
			}
		}

		await updateJob(jobId, {
			status: "completed",
			completedAt: Date.now(),
		});

		logger.info("Job completed", {
			jobId,
			succeeded: job.successCount,
			failed: job.failedCount,
		});

		await cleanupOldJobs();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		logger.error("Job execution error", { jobId, error: errorMessage });

		await updateJob(jobId, {
			status: "failed",
			completedAt: Date.now(),
			error: errorMessage,
		});
	} finally {
		// currentJobId = null;
		isCancelling = false;
	}
}

export async function resumeInterruptedJobs(): Promise<void> {
	const activeJob = await getActiveJob();

	if (activeJob && activeJob.status === "running") {
		logger.info("Resuming interrupted job after restart", {
			jobId: activeJob.id,
		});

		executeJob(activeJob.id).catch((err) => {
			logger.error("Failed to resume interrupted job", {
				jobId: activeJob.id,
				error: err instanceof Error ? err.message : String(err),
			});
		});
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
