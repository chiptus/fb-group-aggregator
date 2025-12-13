import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { debounce } from "@/lib/debounce";
import { extractGroupInfo, scrapeGroupPosts } from "@/lib/scraper";

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
			scrapeAndSend(groupId).then(() => {
				sendResponse({ success: true });
			});
			return true; // Keep channel open for async response
		}
	});

	console.log("[FB Aggregator] Group page scraping initialized");
}

/**
 * Scrapes posts from the current page and sends to background script
 */
async function scrapeAndSend(groupId: string) {
	try {
		console.log("[FB Aggregator] Scraping posts...");

		// Scrape posts from page
		const posts = scrapeGroupPosts(groupId);

		if (posts.length === 0) {
			console.log("[FB Aggregator] No posts found");
			return;
		}

		console.log(`[FB Aggregator] Found ${posts.length} posts`);

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
			console.log(
				`[FB Aggregator] Successfully saved ${response.count} new posts`,
			);
		} else {
			console.error("[FB Aggregator] Failed to save posts:", response.error);
		}
	} catch (error) {
		console.error("[FB Aggregator] Scraping error:", error);
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
