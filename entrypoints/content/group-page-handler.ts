import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { debounce } from "@/lib/debounce";
import { createLogger } from "@/lib/logger";
import { extractGroupInfo, scrapeGroupPosts } from "@/lib/scraper";
import { getExistingPostIdsForGroup } from "@/lib/storage/posts";

const logger = createLogger("content");
const debouncedScrape = debounce(scrapeAndSend, 2000);

/**
 * Initialize scraping for a group page
 */
export function initializeGroupPageScraping(
	ctx: ContentScriptContext,
	groupId: string,
) {
	// Initial scrape on page load
	// Wait a bit for Facebook to render content
	setTimeout(() => {
		debouncedScrape(groupId);
	}, 1000);

	// Scrape on scroll (Facebook lazy-loads posts)
	function handleScroll() {
		if (isNearBottom()) {
			debouncedScrape(groupId);
		}
	}

	ctx.addEventListener(window, "scroll", handleScroll, { passive: true });

	// Listen for messages from background script
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.type === "TRIGGER_SCRAPE") {
			logger.info("TRIGGER_SCRAPE received, starting scrape", { groupId });
			scrapeAndSend(groupId).then(() => {
				sendResponse({ success: true });
			});
			return true; // Keep channel open for async response
		}

		// NEW: Handle autonomous scroll-and-scrape sequence
		if (message.type === "START_SCROLL_AND_SCRAPE") {
			logger.info("START_SCROLL_AND_SCRAPE received", {
				groupId,
				config: message.payload,
			});

			performScrollAndScrapeSequence(groupId, message.payload)
				.then(() => {
					sendResponse({ success: true });
				})
				.catch((error) => {
					logger.error("Scroll-and-scrape sequence failed", {
						groupId,
						error: error instanceof Error ? error.message : String(error),
					});
					sendResponse({ success: false, error: error.message });
				});

			return true; // Keep channel open for async response
		}
	});

	logger.info("Group page scraping initialized", { groupId });
}

/**
 * Scrapes posts from the current page and sends to background script
 */
async function scrapeAndSend(groupId: string) {
	try {
		logger.debug("Scraping posts", { groupId });

		// Fetch existing post IDs for early termination
		const existingPostIds = await getExistingPostIdsForGroup(groupId);

		logger.debug("Scraping with early termination", {
			groupId,
			existingPostCount: existingPostIds.size,
		});

		// Scrape posts from page with early termination based on existing post IDs
		const posts = await scrapeGroupPosts(groupId, {
			existingPostIds,
		});

		if (posts.length === 0) {
			logger.debug("No new posts found", { groupId });
			return;
		}

		logger.info("Found new posts", { groupId, postCount: posts.length });

		// Extract group info
		const groupInfo = extractGroupInfo();

		// Send to background script for storage
		const response = await chrome.runtime.sendMessage({
			type: "SCRAPE_POSTS",
			payload: {
				groupId,
				groupInfo,
				posts,
			},
		});

		if (response.success) {
			logger.info("Successfully saved new posts", {
				groupId,
				savedCount: response.count,
			});
		} else {
			logger.error("Failed to save posts", {
				groupId,
				error: response.error,
			});
		}
	} catch (error) {
		logger.error("Scraping error", {
			groupId,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Check if user has scrolled near the bottom of the page
 */
function isNearBottom(threshold = 3500) {
	const scrollTop = window.scrollY;
	const scrollHeight = document.documentElement.scrollHeight;
	const clientHeight = window.innerHeight;

	return scrollHeight - scrollTop - clientHeight < threshold;
}

/**
 * Performs autonomous scroll-and-scrape sequence
 * Called when background sends START_SCROLL_AND_SCRAPE message
 */
async function performScrollAndScrapeSequence(
	groupId: string,
	config: {
		scrollCount: number;
		scrollInterval: number;
		scrapeWaitTime: number;
	},
): Promise<void> {
	logger.info("Starting autonomous scroll-and-scrape sequence", {
		groupId,
		scrollCount: config.scrollCount,
	});

	const scrapedPostIds = new Set<string>(); // Track unique posts across all scrapes

	// Initial scrape before any scrolling
	const shouldContinue = await scrapeAndSendWithTracking(
		groupId,
		scrapedPostIds,
		0,
		config.scrollCount,
	);

	if (!shouldContinue) {
		logger.info(
			"Early termination on initial scrape - all posts already scraped",
			{
				groupId,
			},
		);

		chrome.runtime.sendMessage({
			type: "SCROLL_AND_SCRAPE_COMPLETE",
			payload: {
				totalPostsScraped: scrapedPostIds.size,
				scrollsCompleted: 0,
				success: true,
			},
		});

		return;
	}

	// Perform scroll-scrape cycles
	let completedScrolls = 0;
	for (let i = 1; i <= config.scrollCount; i++) {
		logger.debug("Scroll cycle", {
			groupId,
			cycle: `${i}/${config.scrollCount}`,
		});

		// Scroll to bottom
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth",
		});

		// Wait for content to load
		await delay(config.scrollInterval);

		// Scrape again
		const continueScrolling = await scrapeAndSendWithTracking(
			groupId,
			scrapedPostIds,
			i,
			config.scrollCount,
		);

		completedScrolls = i;

		// Check if we should stop early
		if (!continueScrolling) {
			logger.info("Early termination triggered - stopping scroll sequence", {
				groupId,
				completedScrolls,
				totalPosts: scrapedPostIds.size,
			});
			break;
		}

		// Wait before next scroll
		if (i < config.scrollCount) {
			await delay(config.scrapeWaitTime);
		}
	}

	// Send completion message
	chrome.runtime.sendMessage({
		type: "SCROLL_AND_SCRAPE_COMPLETE",
		payload: {
			totalPostsScraped: scrapedPostIds.size,
			scrollsCompleted: completedScrolls,
			success: true,
		},
	});

	logger.info("Scroll-and-scrape sequence complete", {
		groupId,
		totalPosts: scrapedPostIds.size,
		scrollsCompleted: completedScrolls,
	});
}

/**
 * Scrapes and sends posts, tracking which posts we've already seen
 * Sends progress updates to background
 */
async function scrapeAndSendWithTracking(
	groupId: string,
	seenPostIds: Set<string>,
	scrollNumber: number,
	totalScrolls: number,
): Promise<boolean> {
	try {
		// Fetch existing post IDs from storage for early termination
		const existingPostIds = await getExistingPostIdsForGroup(groupId);

		// Merge existing post IDs with session-seen IDs
		const allKnownPostIds = new Set([...existingPostIds, ...seenPostIds]);

		// Scrape posts with early termination based on existing post IDs
		const posts = await scrapeGroupPosts(groupId, {
			existingPostIds: allKnownPostIds,
		});

		// If scraper returned 0 posts, we hit the early termination condition
		if (posts.length === 0) {
			logger.info("Early termination triggered - no new posts found", {
				groupId,
				scrollNumber,
			});

			// Send progress update
			chrome.runtime.sendMessage({
				type: "SCROLL_AND_SCRAPE_PROGRESS",
				payload: {
					scrollNumber,
					totalScrolls,
					postsFoundThisScrape: 0,
				},
			});

			return false; // Signal to stop scrolling
		}

		// Filter out posts we've already scraped in this session
		const newPosts = posts.filter((post) => !seenPostIds.has(post.id));

		// Track these posts
		for (const post of newPosts) {
			seenPostIds.add(post.id);
		}

		if (newPosts.length > 0) {
			logger.info("Found new posts", {
				groupId,
				newPosts: newPosts.length,
				totalTracked: seenPostIds.size,
			});

			// Extract group info
			const groupInfo = extractGroupInfo();

			// Send to background for storage
			await chrome.runtime.sendMessage({
				type: "SCRAPE_POSTS",
				payload: {
					groupId,
					groupInfo,
					posts: newPosts,
				},
			});
		}

		// Send progress update
		chrome.runtime.sendMessage({
			type: "SCROLL_AND_SCRAPE_PROGRESS",
			payload: {
				scrollNumber,
				totalScrolls,
				postsFoundThisScrape: newPosts.length,
			},
		});

		return true;
	} catch (error) {
		logger.error("Error in scrape cycle", {
			groupId,
			scrollNumber,
			error: error instanceof Error ? error.message : String(error),
		});
		return true;
	}
}

/**
 * Simple promise-based delay
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
