import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type Post, PostSchema } from "../types";

const STORAGE_KEY = "local:posts" as const;

export async function getExistingPostIdsForGroup(
	groupId: string,
): Promise<Set<string>> {
	const data = (await storage.getItem<Post[]>(STORAGE_KEY)) || [];
	const posts = z.array(PostSchema).parse(data);
	const postIds = posts
		.filter((p: Post) => p.groupId === groupId)
		.map((p: Post) => p.id);
	return new Set(postIds);
}

export async function getLatestPostTimestampForGroup(
	groupId: string,
): Promise<number | null> {
	const data = (await storage.getItem<Post[]>(STORAGE_KEY)) || [];
	const posts = z.array(PostSchema).parse(data);
	const groupPosts = posts.filter((p: Post) => p.groupId === groupId);

	if (groupPosts.length === 0) {
		return null;
	}

	// Find the most recent post timestamp
	return Math.max(...groupPosts.map((p: Post) => p.timestamp));
}
