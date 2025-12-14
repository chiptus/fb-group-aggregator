import { createLogger } from "@/lib/logger";
import {
	createGroup,
	createPosts,
	listGroups,
	listPosts,
	updateGroup,
} from "@/lib/storage";
import type { ScrapePostsResponse } from "@/lib/types";

const logger = createLogger("background");

/**
 * Handles SCRAPE_POSTS message from content script
 * - Auto-registers group if it doesn't exist
 * - Updates group's lastScrapedAt timestamp
 * - Saves posts (with automatic deduplication)
 */
export async function handleScrapePosts(payload: {
	groupId: string;
	groupInfo: { name: string; url: string };
	posts: Array<{
		id: string;
		groupId: string;
		authorName: string;
		contentHtml: string;
		timestamp: number;
		url: string;
	}>;
}): Promise<ScrapePostsResponse> {
	const { groupId, groupInfo, posts } = payload;

	try {
		// Check if group exists
		const groups = await listGroups();
		const existingGroup = groups.find((g) => g.id === groupId);

		const now = Date.now();

		if (existingGroup) {
			// Update lastScrapedAt for existing group
			await updateGroup(groupId, {
				lastScrapedAt: now,
			});
		} else {
			// Auto-register new group with current scrape time
			logger.info("Auto-registering new group", {
				groupId,
				groupName: groupInfo.name,
			});
			await createGroup({
				id: groupId,
				name: groupInfo.name,
				url: groupInfo.url,
				subscriptionIds: [],
				enabled: true,
			});
			// Update with lastScrapedAt since we just scraped it
			await updateGroup(groupId, {
				lastScrapedAt: now,
			});
		}

		// Count posts before saving
		const postsBefore = await listPosts();
		const existingPostIds = new Set(postsBefore.map((p) => p.id));

		// Save posts (createPosts handles deduplication)
		await createPosts(posts);

		// Calculate how many NEW posts were added
		const newPostsCount = posts.filter(
			(p) => !existingPostIds.has(p.id),
		).length;

		logger.info("Saved posts from group", {
			groupId,
			groupName: groupInfo.name,
			totalPostsReceived: posts.length,
			newPostsSaved: newPostsCount,
			duplicatesSkipped: posts.length - newPostsCount,
		});

		return {
			success: true,
			count: newPostsCount,
		};
	} catch (error) {
		logger.error("Error in handleScrapePosts", {
			groupId,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}
