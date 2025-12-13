import { isGroupsListPage } from "@/lib/groups-list-scraper";
import { initializeGroupPageScraping } from "./group-page-handler";
import { initializeGroupsListScraping } from "./groups-list-handler";

export default defineContentScript({
	matches: ["*://*.facebook.com/*"],

	main(ctx) {
		// Check if we're on the groups list page
		if (isGroupsListPage()) {
			console.log("[FB Aggregator] Detected groups list page");
			initializeGroupsListScraping(ctx);
			return;
		}

		// Only run on Facebook group pages
		const groupIdMatch = window.location.href.match(
			/facebook\.com\/groups\/([^/]+)/,
		);
		if (!groupIdMatch) {
			console.log("not injected");
			return; // Not a group page
		}

		const groupId = groupIdMatch[1];
		console.log("[FB Aggregator] Detected group:", groupId);
		initializeGroupPageScraping(ctx, groupId);
	},
});
