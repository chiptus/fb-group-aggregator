import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type Group, type Post, PostSchema } from "../types";
import { listGroups } from "./groups";
import { POSTS_STORAGE_KEY } from "./keys";

export async function createPosts(
	newPosts: Omit<Post, "scrapedAt" | "seen" | "starred">[],
): Promise<number> {
	const posts = await listPosts();

	// Deduplicate: only add posts that don't already exist
	const existingIds = new Set(posts.map((p: Post) => p.id));
	const postsToAdd = newPosts
		.filter((p) => !existingIds.has(p.id))
		.map((p) => ({
			...p,
			scrapedAt: Date.now(),
			seen: false,
			starred: false,
		}));

	const allPosts = [...posts, ...postsToAdd];
	await storage.setItem(POSTS_STORAGE_KEY, allPosts);

	return postsToAdd.length;
}

export async function listPosts(): Promise<Post[]> {
	const data = await storage.getItem<Post[]>(POSTS_STORAGE_KEY, {
		fallback: [],
	});
	return z.array(PostSchema).parse(data);
}

export async function listPostsBySubscription(
	subscriptionId: string,
): Promise<Post[]> {
	const groups = await listGroups();
	const posts = await listPosts();

	// Find all groups that belong to this subscription
	const groupIds = groups
		.filter((g: Group) => g.subscriptionIds.includes(subscriptionId))
		.map((g: Group) => g.id);

	// Filter posts by these group IDs
	return posts.filter((p: Post) => groupIds.includes(p.groupId));
}

export async function markPostAsSeen(
	postId: string,
	seen: boolean,
): Promise<void> {
	const posts = await listPosts();
	const updatedPosts = posts.map((p: Post) =>
		p.id === postId ? { ...p, seen } : p,
	);
	await storage.setItem(POSTS_STORAGE_KEY, updatedPosts);
}

export async function togglePostStarred(
	postId: string,
	starred: boolean,
): Promise<void> {
	const posts = await listPosts();
	const updatedPosts = posts.map((p: Post) =>
		p.id === postId ? { ...p, starred } : p,
	);
	await storage.setItem(POSTS_STORAGE_KEY, updatedPosts);
}

export async function deleteOldPosts(daysOld: number): Promise<void> {
	const posts = await listPosts();
	const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
	const recentPosts = posts.filter((p: Post) => p.scrapedAt >= cutoffTime);
	await storage.setItem(POSTS_STORAGE_KEY, recentPosts);
}

export async function getExistingPostIdsForGroup(
	groupId: string,
): Promise<Set<string>> {
	const posts = await listPosts();
	const postIds = posts
		.filter((p: Post) => p.groupId === groupId)
		.map((p: Post) => p.id);
	return new Set(postIds);
}

// Removed: getLatestPostTimestampForGroup
// Timestamp extraction is no longer supported (Facebook obfuscates timestamps)
// Use post ID for ordering and scrapedAt for age-based operations
