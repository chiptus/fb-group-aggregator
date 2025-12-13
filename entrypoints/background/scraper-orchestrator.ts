import { getGroupsBySubscription } from "@/lib/storage";

/**
 * Orchestrates batch scraping of all groups in a subscription
 * Opens each group page sequentially, scrolls to load content, and scrapes posts
 */
export async function scrapeSubscription(subscriptionId: string): Promise<{
	success: boolean;
	scrapedCount: number;
	failedGroups: Array<{ groupId: string; error: string }>;
}> {
	console.log(
		`[Scraper Orchestrator] Starting batch scrape for subscription ${subscriptionId}`,
	);

	// Get all enabled groups for this subscription
	const allGroups = await getGroupsBySubscription(subscriptionId);
	const enabledGroups = allGroups.filter((g) => g.enabled);

	if (enabledGroups.length === 0) {
		console.log("[Scraper Orchestrator] No enabled groups found");
		return { success: true, scrapedCount: 0, failedGroups: [] };
	}

	console.log(
		`[Scraper Orchestrator] Found ${enabledGroups.length} enabled groups to scrape`,
	);

	let scrapedCount = 0;
	const failedGroups: Array<{ groupId: string; error: string }> = [];

	// Scrape each group sequentially
	for (let i = 0; i < enabledGroups.length; i++) {
		const group = enabledGroups[i];
		console.log(
			`[Scraper Orchestrator] Scraping group ${i + 1}/${enabledGroups.length}: ${group.name} (${group.id})`,
		);

		try {
			await scrapeGroupWithScrolling(group.id, group.url, group.name);
			scrapedCount++;
			console.log(`[Scraper Orchestrator] Successfully scraped ${group.name}`);

			// Add delay between groups (rate limiting)
			if (i < enabledGroups.length - 1) {
				console.log("[Scraper Orchestrator] Waiting 3s before next group...");
				await delay(3000);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`[Scraper Orchestrator] Failed to scrape ${group.name}:`,
				errorMessage,
			);
			failedGroups.push({
				groupId: group.id,
				error: errorMessage,
			});
			// Continue to next group even if one fails
		}
	}

	console.log(
		`[Scraper Orchestrator] Batch scrape complete: ${scrapedCount} succeeded, ${failedGroups.length} failed`,
	);

	return {
		success: true,
		scrapedCount,
		failedGroups,
	};
}

/**
 * Opens a group page, scrolls twice to load content, then scrapes posts
 */
async function scrapeGroupWithScrolling(
	groupId: string,
	groupUrl: string,
	groupName: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		let tabId: number | undefined;
		let scrollCount = 0;
		const targetScrolls = 2;
		const scrollInterval = 4000; // 4 seconds between scrolls
		const timeoutDuration = 30000; // 30 second timeout per group

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
					console.log(
						`[Scraper Orchestrator] Page loaded for ${groupName}, starting scroll sequence`,
					);

					// Function to perform scrolls
					const performScroll = () => {
						if (scrollCount >= targetScrolls) {
							// Scrolling complete, wait a bit then trigger scrape
							console.log(
								`[Scraper Orchestrator] Scroll complete for ${groupName}, waiting for content to load...`,
							);
							setTimeout(() => {
								// Send message to content script to trigger scraping
								if (tabId) {
									chrome.tabs
										.sendMessage(tabId, { type: "TRIGGER_SCRAPE" })
										.then(() => {
											console.log(
												`[Scraper Orchestrator] Scrape triggered for ${groupName}`,
											);
											// Wait for scraping to complete
											setTimeout(() => {
												if (tabId) {
													chrome.tabs.remove(tabId).catch(console.error);
												}
												clearTimeout(timeout);
												resolve();
											}, 3000); // Wait 3s for scraping to complete
										})
										.catch((error) => {
											if (tabId) {
												chrome.tabs.remove(tabId).catch(console.error);
											}
											clearTimeout(timeout);
											reject(error);
										});
								}
							}, 2000); // Wait 2s after last scroll
							return;
						}

						// Perform scroll
						scrollCount++;
						console.log(
							`[Scraper Orchestrator] Scroll ${scrollCount}/${targetScrolls} for ${groupName}`,
						);

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
									console.error("Error scrolling:", error);
									// Continue anyway
									setTimeout(performScroll, scrollInterval);
								});
						}
					};

					// Start first scroll after a small delay
					setTimeout(performScroll, 2000);
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
