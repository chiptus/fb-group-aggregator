import { createLogger } from "@/lib/logger";
import { getGroupsBySubscription } from "@/lib/storage/groups";
import type { ExtensionMessage } from "@/lib/types";

const logger = createLogger("background");

/**
 * Orchestrates batch scraping of all groups in a subscription
 * Opens each group page sequentially, scrolls to load content, and scrapes posts
 */
export async function scrapeSubscription(subscriptionId: string): Promise<{
	success: boolean;
	scrapedCount: number;
	failedGroups: Array<{ groupId: string; error: string }>;
}> {
	logger.info("Starting batch scrape for subscription", { subscriptionId });

	// Get all enabled groups for this subscription
	const allGroups = await getGroupsBySubscription(subscriptionId);
	const enabledGroups = allGroups.filter((g) => g.enabled);

	if (enabledGroups.length === 0) {
		logger.info("No enabled groups found", { subscriptionId });
		return { success: true, scrapedCount: 0, failedGroups: [] };
	}

	logger.info("Found enabled groups to scrape", {
		subscriptionId,
		count: enabledGroups.length,
	});

	let scrapedCount = 0;
	const failedGroups: Array<{ groupId: string; error: string }> = [];

	// Scrape each group sequentially
	for (let i = 0; i < enabledGroups.length; i++) {
		const group = enabledGroups[i];
		logger.info("Scraping group", {
			progress: `${i + 1}/${enabledGroups.length}`,
			groupName: group.name,
			groupId: group.id,
		});

		try {
			await scrapeGroupWithScrolling(group.id, group.url, group.name);
			scrapedCount++;
			logger.info("Successfully scraped group", {
				groupName: group.name,
				groupId: group.id,
			});

			// Add delay between groups (rate limiting)
			if (i < enabledGroups.length - 1) {
				logger.debug("Waiting before next group", { delayMs: 3000 });
				await delay(3000);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			logger.error("Failed to scrape group", {
				groupName: group.name,
				groupId: group.id,
				error: errorMessage,
			});
			failedGroups.push({
				groupId: group.id,
				error: errorMessage,
			});
			// Continue to next group even if one fails
		}
	}

	logger.info("Batch scrape complete", {
		subscriptionId,
		succeeded: scrapedCount,
		failed: failedGroups.length,
	});

	return {
		success: true,
		scrapedCount,
		failedGroups,
	};
}

/**
 * Opens a group page and initiates autonomous scroll-and-scrape sequence
 * The content script controls the scroll-scrape loop autonomously
 */
export async function scrapeGroupWithScrolling(
	groupId: string,
	groupUrl: string,
	groupName: string,
	jobId?: string,
): Promise<{ postsScraped: number }> {
	return new Promise((resolve, reject) => {
		let tabId: number | undefined;
		const timeoutDuration = 120000; // 2 minute timeout

		const logContext = jobId
			? { groupId, groupName, jobId }
			: { groupId, groupName };

		// Create timeout to prevent hanging
		const timeout = setTimeout(() => {
			if (tabId) {
				chrome.tabs.remove(tabId).catch(console.error);
			}
			reject(new Error(`Timeout after ${timeoutDuration}ms`));
		}, timeoutDuration);

		// Track progress
		let totalPostsScraped = 0;

		chrome.runtime.onMessage.addListener(progressListener);

		// Create tab
		chrome.tabs.create(
			{ url: `${groupUrl}?sorting_setting=CHRONOLOGICAL`, active: false },
			(tab) => {
				if (!tab?.id) {
					clearTimeout(timeout);
					chrome.runtime.onMessage.removeListener(progressListener);
					reject(new Error("Failed to create tab"));
					return;
				}

				tabId = tab.id;

				// Wait for page to load
				const loadListener = (
					tabIdUpdated: number,
					changeInfo: { status?: string },
				) => {
					if (tabIdUpdated !== tabId) return;

					if (changeInfo.status === "complete") {
						chrome.tabs.onUpdated.removeListener(loadListener);

						logger.debug(
							"Page loaded, sending START_SCROLL_AND_SCRAPE",
							logContext,
						);

						// Wait a bit for page to fully render, then send start message
						setTimeout(() => {
							if (!tabId) return;

							chrome.tabs
								.sendMessage(tabId, {
									type: "START_SCROLL_AND_SCRAPE",
									payload: {
										scrollCount: 10,
										scrollInterval: 3000, // 3s wait after scroll
										scrapeWaitTime: 2000, // 2s wait after scrape
									},
								})
								.catch((error) => {
									logger.error("Failed to send START_SCROLL_AND_SCRAPE", {
										...logContext,
										error:
											error instanceof Error ? error.message : String(error),
									});
									chrome.runtime.onMessage.removeListener(progressListener);
									clearTimeout(timeout);
									if (tabId) {
										chrome.tabs.remove(tabId).catch(console.error);
									}
									reject(error);
								});
						}, 3000); // 3s initial wait for page render
					}
				};

				chrome.tabs.onUpdated.addListener(loadListener);
			},
		);

		// Listen for progress updates from content script
		function progressListener(
			message: ExtensionMessage,
			sender: chrome.runtime.MessageSender,
		) {
			// Only listen to messages from our tab
			if (sender.tab?.id !== tabId) return;

			if (message.type === "SCROLL_AND_SCRAPE_PROGRESS") {
				logger.debug("Scroll-and-scrape progress", {
					...logContext,
					scroll: `${message.payload.scrollNumber}/${message.payload.totalScrolls}`,
					postsThisScrape: message.payload.postsFoundThisScrape,
				});
			}

			if (message.type === "SCROLL_AND_SCRAPE_COMPLETE") {
				logger.info("Scroll-and-scrape complete", {
					...logContext,
					totalPosts: message.payload.totalPostsScraped,
					scrolls: message.payload.scrollsCompleted,
				});

				totalPostsScraped = message.payload.totalPostsScraped;

				// Clean up
				chrome.runtime.onMessage.removeListener(progressListener);
				clearTimeout(timeout);

				// Close tab
				if (tabId) {
					chrome.tabs.remove(tabId).catch(console.error);
				}

				resolve({ postsScraped: totalPostsScraped });
			}
		}
	});
}

/**
 * Simple promise-based delay
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
