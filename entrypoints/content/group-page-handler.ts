import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { debounce } from "@/lib/debounce";
import { createLogger } from "@/lib/logger";
import { extractGroupInfo, scrapeGroupPosts } from "@/lib/scraper";

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
	});

	logger.info("Group page scraping initialized", { groupId });
}

/**
 * Scrapes posts from the current page and sends to background script
 */
async function scrapeAndSend(groupId: string) {
	try {
		logger.debug("Scraping posts", { groupId });

		// Scrape posts from page
		const posts = scrapeGroupPosts(groupId);

		if (posts.length === 0) {
			logger.debug("No posts found", { groupId });
			return;
		}

		logger.info("Found posts", { groupId, postCount: posts.length });

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
