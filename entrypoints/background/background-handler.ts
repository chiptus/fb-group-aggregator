import {
	createGroup,
	createPosts,
	listGroups,
	listPosts,
	updateGroup,
} from "@/lib/storage";
import type { ExtensionMessage, ScrapePostsResponse } from "@/lib/types";

/**
 * Message listener for runtime messages
 * Exported for testing
 */
export function messageListener(
	message: ExtensionMessage,
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response: ScrapePostsResponse | unknown) => void,
): boolean {
	if (message.type === "SCRAPE_POSTS") {
		handleScrapePosts(message.payload)
			.then(sendResponse)
			.catch((error) => {
				console.error("Error handling SCRAPE_POSTS:", error);
				sendResponse({
					success: false,
					error: error.message || "Unknown error",
				});
			});

		// Return true to indicate we'll send response asynchronously
		return true;
	}

	return false;
}

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

		console.log(
			`[Background] Saved ${newPostsCount} new posts from group ${groupId}`,
		);

		return {
			success: true,
			count: newPostsCount,
		};
	} catch (error) {
		console.error("[Background] Error in handleScrapePosts:", error);
		throw error;
	}
}
