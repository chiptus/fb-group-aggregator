import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { debounce } from "@/lib/debounce";
import {
	isNearBottom as isNearBottomGroupsList,
	scrapeGroupsList,
} from "@/lib/groups-list-scraper";

const debouncedScrapeGroupsList = debounce(scrapeAndSendGroupsList, 2000);

/**
 * Initialize scraping for the groups list page
 */
export function initializeGroupsListScraping(ctx: ContentScriptContext) {
	// Set to track already-scraped group IDs to enable early stopping
	const scrapedGroupIds = new Set<string>();
	let isAutoScrolling = false;
	let autoScrollAttempts = 0;
	const MAX_AUTO_SCROLL_ATTEMPTS = 100; // Prevent infinite scrolling

	// Initial scrape on page load
	setTimeout(() => {
		debouncedScrapeGroupsList(scrapedGroupIds);
		// Start auto-scrolling after initial scrape
		setTimeout(startAutoScroll, 3000);
	}, 1500); // Slightly longer delay for groups list to render

	// Auto-scroll to load all groups
	function startAutoScroll() {
		if (autoScrollAttempts >= MAX_AUTO_SCROLL_ATTEMPTS) {
			console.log("[FB Aggregator] Max auto-scroll attempts reached, stopping");
			isAutoScrolling = false;
			return;
		}

		if (isAutoScrolling) {
			return; // Already scrolling
		}

		isAutoScrolling = true;
		autoScrollAttempts++;

		// Scroll to bottom
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth",
		});

		// Wait for new content to load, then scrape and continue scrolling
		setTimeout(() => {
			const previousCount = scrapedGroupIds.size;
			debouncedScrapeGroupsList(scrapedGroupIds);

			// Continue scrolling after scraping
			setTimeout(() => {
				const newCount = scrapedGroupIds.size;
				isAutoScrolling = false;

				// If we found new groups, continue scrolling
				if (newCount > previousCount) {
					console.log(
						`[FB Aggregator] Found ${newCount - previousCount} new groups, continuing auto-scroll (${newCount} total)`,
					);
					startAutoScroll();
				} else {
					console.log(
						`[FB Aggregator] No new groups found, auto-scroll complete (${newCount} total groups)`,
					);
				}
			}, 2500); // Wait for scraping to complete
		}, 2000); // Wait for Facebook to load more content
	}

	// Also handle manual scroll (in case auto-scroll is disabled or fails)
	function handleScrollGroupsList() {
		if (isNearBottomGroupsList() && !isAutoScrolling) {
			debouncedScrapeGroupsList(scrapedGroupIds);
		}
	}

	ctx.addEventListener(window, "scroll", handleScrollGroupsList, {
		passive: true,
	});

	console.log(
		"[FB Aggregator] Groups list scraping initialized with auto-scroll",
	);
}

/**
 * Scrapes groups list and sends to background script
 */
async function scrapeAndSendGroupsList(scrapedGroupIds: Set<string>) {
	try {
		console.log("[FB Aggregator] Scraping groups list...");

		// Scrape groups from page
		const { groups, totalCount } = scrapeGroupsList();

		if (groups.length === 0) {
			console.log("[FB Aggregator] No groups found");
			return;
		}

		// Check if we've already seen all these groups (optimization for rescan)
		const newGroups = groups.filter((group) => !scrapedGroupIds.has(group.id));

		if (newGroups.length === 0) {
			console.log("[FB Aggregator] All groups already scraped, stopping early");
			return;
		}

		// Add new group IDs to scraped set
		newGroups.forEach((group) => {
			scrapedGroupIds.add(group.id);
		});

		console.log(
			`[FB Aggregator] Found ${newGroups.length} new groups (${groups.length} total on page, ${totalCount} total count)`,
		);

		// Send to background script for storage
		const response = await chrome.runtime.sendMessage({
			type: "SCRAPE_GROUPS_LIST",
			payload: {
				groups: newGroups,
				totalCount,
			},
		});

		if (response.success) {
			console.log(
				`[FB Aggregator] Successfully processed ${response.newGroupsCount} new groups, ${response.updatedGroupsCount} updated`,
			);
		} else {
			console.error("[FB Aggregator] Failed to save groups:", response.error);
		}
	} catch (error) {
		console.error("[FB Aggregator] Groups list scraping error:", error);
	}
}
