import { z } from "zod";
import {
	type Group,
	GroupSchema,
	type Post,
	PostSchema,
	type Subscription,
	SubscriptionSchema,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
	SUBSCRIPTIONS: "subscriptions",
	GROUPS: "groups",
	POSTS: "posts",
} as const;

/**
 * Subscriptions
 */

export async function createSubscription(name: string): Promise<Subscription> {
	const subscription: Subscription = {
		id: crypto.randomUUID(),
		name,
		createdAt: Date.now(),
	};

	const result = await chrome.storage.local.get(STORAGE_KEYS.SUBSCRIPTIONS);
	const subscriptions = (result.subscriptions as Subscription[]) || [];
	subscriptions.push(subscription);
	await chrome.storage.local.set({ subscriptions });

	return subscription;
}

export async function listSubscriptions(): Promise<Subscription[]> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.SUBSCRIPTIONS);
	const data = result.subscriptions || [];
	return z.array(SubscriptionSchema).parse(data);
}

export async function deleteSubscription(id: string): Promise<void> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.SUBSCRIPTIONS);
	const data = result.subscriptions || [];
	const subscriptions = z.array(SubscriptionSchema).parse(data);
	const filtered = subscriptions.filter((s: Subscription) => s.id !== id);
	await chrome.storage.local.set({ subscriptions: filtered });
}

/**
 * Groups
 */

export async function createGroup(
	groupData: Omit<Group, "addedAt" | "lastScrapedAt">,
): Promise<Group> {
	const group: Group = {
		...groupData,
		addedAt: Date.now(),
		lastScrapedAt: null,
	};

	const result = await chrome.storage.local.get(STORAGE_KEYS.GROUPS);
	const groups = (result.groups as Group[]) || [];
	groups.push(group);
	await chrome.storage.local.set({ groups });

	return group;
}

export async function listGroups(): Promise<Group[]> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.GROUPS);
	const data = result.groups || [];
	return z.array(GroupSchema).parse(data);
}

export async function updateGroup(
	id: string,
	updates: Partial<Omit<Group, "id" | "addedAt">>,
): Promise<void> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.GROUPS);
	const data = result.groups || [];
	const groups = z.array(GroupSchema).parse(data);
	const updatedGroups = groups.map((g: Group) =>
		g.id === id ? { ...g, ...updates } : g,
	);
	await chrome.storage.local.set({ groups: updatedGroups });
}

export async function deleteGroup(id: string): Promise<void> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.GROUPS);
	const data = result.groups || [];
	const groups = z.array(GroupSchema).parse(data);
	const filtered = groups.filter((g: Group) => g.id !== id);
	await chrome.storage.local.set({ groups: filtered });
}

export async function findGroupByUrl(url: string): Promise<Group | undefined> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.GROUPS);
	const data = result.groups || [];
	const groups = z.array(GroupSchema).parse(data);
	return groups.find((g: Group) => g.url === url);
}

/**
 * Posts
 */

export async function createPosts(
	newPosts: Omit<Post, "scrapedAt" | "seen">[],
): Promise<void> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.POSTS);
	const data = result.posts || [];
	const posts = z.array(PostSchema).parse(data);

	// Deduplicate: only add posts that don't already exist
	const existingIds = new Set(posts.map((p: Post) => p.id));
	const postsToAdd = newPosts
		.filter((p) => !existingIds.has(p.id))
		.map((p) => ({
			...p,
			scrapedAt: Date.now(),
			seen: false,
		}));

	const allPosts = [...posts, ...postsToAdd];
	await chrome.storage.local.set({ posts: allPosts });
}

export async function listPosts(): Promise<Post[]> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.POSTS);
	const data = result.posts || [];
	return z.array(PostSchema).parse(data);
}

export async function listPostsBySubscription(
	subscriptionId: string,
): Promise<Post[]> {
	const result = await chrome.storage.local.get([
		STORAGE_KEYS.GROUPS,
		STORAGE_KEYS.POSTS,
	]);
	const groupsData = result.groups || [];
	const postsData = result.posts || [];

	const groups = z.array(GroupSchema).parse(groupsData);
	const posts = z.array(PostSchema).parse(postsData);

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
	const result = await chrome.storage.local.get(STORAGE_KEYS.POSTS);
	const data = result.posts || [];
	const posts = z.array(PostSchema).parse(data);
	const updatedPosts = posts.map((p: Post) =>
		p.id === postId ? { ...p, seen } : p,
	);
	await chrome.storage.local.set({ posts: updatedPosts });
}

export async function deleteOldPosts(daysOld: number): Promise<void> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.POSTS);
	const data = result.posts || [];
	const posts = z.array(PostSchema).parse(data);
	const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
	const recentPosts = posts.filter((p: Post) => p.timestamp >= cutoffTime);
	await chrome.storage.local.set({ posts: recentPosts });
}
