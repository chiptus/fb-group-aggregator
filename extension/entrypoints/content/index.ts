import { isGroupsListPage } from "@/lib/groups-list-scraper";
import { initializeGroupPageScraping } from "./group-page-handler";
import { initializeGroupsListScraping } from "./groups-list-handler";

export default defineContentScript({
	matches: ["*://*.facebook.com/*"],

	main(ctx) {
		// Check if we're on the groups list page FIRST (before group page check)
		if (isGroupsListPage()) {
			console.log("[FB Aggregator] Detected groups list page");
			initializeGroupsListScraping(ctx);
			return;
		}

		// Only run on Facebook group pages (exclude joins, feed, discover, etc.)
		const groupIdMatch = window.location.href.match(
			/facebook\.com\/groups\/([^/?]+)(?:\/|$)/,
		);
		if (!groupIdMatch) {
			console.log("[FB Aggregator] Not a group page, skipping");
			return; // Not a group page
		}

		const groupId = groupIdMatch[1];

		// Additional check: skip special group pages
		if (groupId === "joins" || groupId === "feed" || groupId === "discover") {
			console.log("[FB Aggregator] Special groups page, skipping");
			return;
		}

		console.log("[FB Aggregator] Detected group:", groupId);
		initializeGroupPageScraping(ctx, groupId);
	},
});
