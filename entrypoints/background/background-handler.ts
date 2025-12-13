import type { ExtensionMessage, ScrapePostsResponse } from "@/lib/types";
import { handleScrapeGroupsList } from "./handle-scrape-groups-list";
import { handleScrapePosts } from "./handle-scrape-posts";
import { scrapeSubscription } from "./scraper-orchestrator";

/**
 * Message listener for runtime messages
 * Exported for testing
 */
export function messageListener(
	message: ExtensionMessage,
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response: ScrapePostsResponse | unknown) => void,
): boolean {
	if (message.type === "SCRAPE_POSTS") {
		handleScrapePosts(message.payload)
			.then(sendResponse)
			.catch((error) => {
				console.error("Error handling SCRAPE_POSTS:", error);
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
				console.error("Error handling SCRAPE_GROUPS_LIST:", error);
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
				console.error("Error handling SCRAPE_SUBSCRIPTION:", error);
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		return true;
	}

	return false;
}

export { handleScrapeGroupsList } from "./handle-scrape-groups-list";
// Re-export handlers for testing
export { handleScrapePosts } from "./handle-scrape-posts";
