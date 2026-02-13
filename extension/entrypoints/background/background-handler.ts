import { createLogger } from "@/lib/logger";
import { deleteJob, getJob } from "@/lib/storage/jobs";
import type { ExtensionMessage, ScrapePostsResponse } from "@/lib/types";
import { handleScrapeGroupsList } from "./handle-scrape-groups-list";
import { handleScrapePosts } from "./handle-scrape-posts";
import { cancelJob, resumeJob, startJob } from "./job-manager";
import { scrapeSubscription } from "./scraper-orchestrator";

const logger = createLogger("background");

/**
 * Message listener for runtime messages
 * Exported for testing
 */
export function messageListener(
	message: ExtensionMessage,
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response: ScrapePostsResponse | unknown) => void,
): boolean {
	console.log("[Background] Received message:", message.type);

	if (message.type === "SCRAPE_POSTS") {
		handleScrapePosts(message.payload)
			.then(sendResponse)
			.catch((error) => {
				logger.error("Error handling SCRAPE_POSTS", {
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		// Return true to indicate we'll send response asynchronously
		return true;
	}

	if (message.type === "SCRAPE_GROUPS_LIST") {
		handleScrapeGroupsList(message.payload)
			.then(sendResponse)
			.catch((error) => {
				logger.error("Error handling SCRAPE_GROUPS_LIST", {
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "SCRAPE_SUBSCRIPTION") {
		scrapeSubscription(message.payload.subscriptionId)
			.then(sendResponse)
			.catch((error) => {
				logger.error("Error handling SCRAPE_SUBSCRIPTION", {
					subscriptionId: message.payload.subscriptionId,
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "START_JOB") {
		startJob()
			.then((result) => sendResponse({ success: true, jobId: result.jobId }))
			.catch((error) => {
				logger.error("Error starting job", {
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "CANCEL_JOB") {
		cancelJob(message.payload.jobId)
			.then(() => sendResponse({ success: true }))
			.catch((error) => {
				logger.error("Error cancelling job", {
					jobId: message.payload.jobId,
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "RESUME_JOB") {
		resumeJob(message.payload.jobId)
			.then(() => sendResponse({ success: true }))
			.catch((error) => {
				logger.error("Error resuming job", {
					jobId: message.payload.jobId,
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "GET_JOB") {
		getJob(message.payload.jobId)
			.then((job) => sendResponse({ success: true, job }))
			.catch((error) => {
				logger.error("Error getting job", {
					jobId: message.payload.jobId,
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "DELETE_JOB") {
		deleteJob(message.payload.jobId)
			.then(() => sendResponse({ success: true }))
			.catch((error) => {
				logger.error("Error deleting job", {
					jobId: message.payload.jobId,
					error: error instanceof Error ? error.message : String(error),
				});
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	if (message.type === "SCROLL_AND_SCRAPE_PROGRESS") {
		logger.debug("Scroll-and-scrape progress received", {
			scroll: `${message.payload.scrollNumber}/${message.payload.totalScrolls}`,
			postsThisScrape: message.payload.postsFoundThisScrape,
		});
		// No response needed
		return false;
	}

	if (message.type === "SCROLL_AND_SCRAPE_COMPLETE") {
		logger.info("Scroll-and-scrape complete received", {
			totalPosts: message.payload.totalPostsScraped,
			scrolls: message.payload.scrollsCompleted,
			success: message.payload.success,
		});
		// No response needed
		return false;
	}

	return false;
}

export { handleScrapeGroupsList } from "./handle-scrape-groups-list";
// Re-export handlers for testing
export { handleScrapePosts } from "./handle-scrape-posts";
