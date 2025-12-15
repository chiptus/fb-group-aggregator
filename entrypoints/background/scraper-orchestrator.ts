import { createLogger } from "@/lib/logger";
import { getGroupsBySubscription } from "@/lib/storage";

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
 * Opens a group page, scrolls twice to load content, then scrapes posts
 */
export async function scrapeGroupWithScrolling(
	groupId: string,
	groupUrl: string,
	groupName: string,
	jobId?: string,
): Promise<{ postsScraped: number }> {
	return new Promise((resolve, reject) => {
		let tabId: number | undefined;
		let scrollCount = 0;
		const targetScrolls = 2;
		const scrollInterval = 5000; // 5 seconds between scrolls (increased for FB to load)
		const timeoutDuration = 45000; // 45 second timeout per group (increased)

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

		// Create tab
		chrome.tabs.create({ url: groupUrl, active: false }, (tab) => {
			if (!tab?.id) {
				clearTimeout(timeout);
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

					// Start scrolling after page loads
					logger.debug("Page loaded, starting scroll sequence", logContext);

					// Function to perform scrolls
					const performScroll = () => {
						if (scrollCount >= targetScrolls) {
							// Scrolling complete, wait a bit then trigger scrape
							logger.debug(
								"Scroll complete, waiting for content to load",
								logContext,
							);
							setTimeout(() => {
								// Send message to content script to trigger scraping
								if (tabId) {
									chrome.tabs
										.sendMessage(tabId, { type: "TRIGGER_SCRAPE" })
										.then(() => {
											logger.debug("Scrape triggered", logContext);
											// Wait for scraping to complete
											setTimeout(() => {
												if (tabId) {
													chrome.tabs.remove(tabId).catch(console.error);
												}
												clearTimeout(timeout);
												resolve({ postsScraped: 0 });
											}, 5000); // Wait 5s for scraping to complete (increased)
										})
										.catch((error) => {
											if (tabId) {
												chrome.tabs.remove(tabId).catch(console.error);
											}
											clearTimeout(timeout);
											reject(error);
										});
								}
							}, 4000); // Wait 4s after last scroll for Facebook to load posts (increased)
							return;
						}

						// Perform scroll
						scrollCount++;
						logger.debug("Performing scroll", {
							...logContext,
							scroll: `${scrollCount}/${targetScrolls}`,
						});

						if (tabId) {
							chrome.scripting
								.executeScript({
									target: { tabId },
									func: () => {
										window.scrollTo({
											top: document.documentElement.scrollHeight,
											behavior: "smooth",
										});
									},
								})
								.then(() => {
									// Schedule next scroll
									setTimeout(performScroll, scrollInterval);
								})
								.catch((error) => {
									logger.warn("Error scrolling, continuing anyway", {
										...logContext,
										error:
											error instanceof Error ? error.message : String(error),
									});
									// Continue anyway
									setTimeout(performScroll, scrollInterval);
								});
						}
					};

					// Start first scroll after initial page render
					setTimeout(performScroll, 3000);
				}
			};

			chrome.tabs.onUpdated.addListener(loadListener);
		});
	});
}

/**
 * Simple promise-based delay
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
