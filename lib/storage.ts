import { storage } from "wxt/utils/storage";
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
	SUBSCRIPTIONS: "local:subscriptions",
	GROUPS: "local:groups",
	POSTS: "local:posts",
	LOGS: "local:logs",
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

	const subscriptions =
		(await storage.getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS)) || [];
	subscriptions.push(subscription);
	await storage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);

	return subscription;
}

export async function listSubscriptions(): Promise<Subscription[]> {
	const data =
		(await storage.getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS)) || [];
	return z.array(SubscriptionSchema).parse(data);
}

export async function updateSubscription(
	id: string,
	updates: Partial<Omit<Subscription, "id" | "createdAt">>,
): Promise<Subscription> {
	const data =
		(await storage.getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS)) || [];
	const subscriptions = z.array(SubscriptionSchema).parse(data);
	const index = subscriptions.findIndex((s: Subscription) => s.id === id);

	if (index === -1) {
		throw new Error(`Subscription with id ${id} not found`);
	}

	const updated = { ...subscriptions[index], ...updates };
	subscriptions[index] = updated;
	await storage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);

	return updated;
}

export async function deleteSubscription(id: string): Promise<void> {
	const data =
		(await storage.getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS)) || [];
	const subscriptions = z.array(SubscriptionSchema).parse(data);
	const filtered = subscriptions.filter((s: Subscription) => s.id !== id);
	await storage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, filtered);
}

/**
 * Groups
 */

export async function createGroup(
	groupData: Omit<Group, "addedAt" | "lastScrapedAt">,
): Promise<Group> {
	const groups = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];

	// Check for duplicates before adding
	const existingGroup = groups.find((g) => g.id === groupData.id);
	if (existingGroup) {
		console.warn(
			`[Storage] Group ${groupData.id} already exists, returning existing group`,
		);
		return existingGroup;
	}

	const group: Group = {
		...groupData,
		addedAt: Date.now(),
		lastScrapedAt: null,
	};

	groups.push(group);
	await storage.setItem(STORAGE_KEYS.GROUPS, groups);

	return group;
}

export async function listGroups(): Promise<Group[]> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	return z.array(GroupSchema).parse(data);
}

export async function updateGroup(
	id: string,
	updates: Partial<Omit<Group, "id" | "addedAt">>,
): Promise<Group> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);
	const index = groups.findIndex((g: Group) => g.id === id);

	if (index === -1) {
		throw new Error(`Group with id ${id} not found`);
	}

	const updated = { ...groups[index], ...updates };
	groups[index] = updated;
	await storage.setItem(STORAGE_KEYS.GROUPS, groups);

	return updated;
}

export async function deleteGroup(id: string): Promise<void> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);
	const filtered = groups.filter((g: Group) => g.id !== id);
	await storage.setItem(STORAGE_KEYS.GROUPS, filtered);
}

export async function findGroupByUrl(url: string): Promise<Group | undefined> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);
	return groups.find((g: Group) => g.url === url);
}

export async function getGroupsBySubscription(
	subscriptionId: string,
): Promise<Group[]> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);
	return groups.filter((g: Group) =>
		g.subscriptionIds.includes(subscriptionId),
	);
}

export async function bulkUpdateGroups(
	groupIds: string[],
	updates: Partial<Omit<Group, "id" | "addedAt">>,
): Promise<void> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);

	const updatedGroups = groups.map((g: Group) =>
		groupIds.includes(g.id) ? { ...g, ...updates } : g,
	);

	await storage.setItem(STORAGE_KEYS.GROUPS, updatedGroups);
}

export async function bulkDeleteGroups(groupIds: string[]): Promise<void> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);
	const filtered = groups.filter((g: Group) => !groupIds.includes(g.id));
	await storage.setItem(STORAGE_KEYS.GROUPS, filtered);

	// Also delete posts from these groups
	const postsData = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];
	const posts = z.array(PostSchema).parse(postsData);
	const filteredPosts = posts.filter(
		(p: Post) => !groupIds.includes(p.groupId),
	);
	await storage.setItem(STORAGE_KEYS.POSTS, filteredPosts);
}

/**
 * Posts
 */

export async function createPosts(
	newPosts: Omit<Post, "scrapedAt" | "seen">[],
): Promise<number> {
	const data = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];
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
	await storage.setItem(STORAGE_KEYS.POSTS, allPosts);

	return postsToAdd.length;
}

export async function listPosts(): Promise<Post[]> {
	const data = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];
	return z.array(PostSchema).parse(data);
}

export async function listPostsBySubscription(
	subscriptionId: string,
): Promise<Post[]> {
	const groupsData =
		(await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const postsData = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];

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
	const data = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];
	const posts = z.array(PostSchema).parse(data);
	const updatedPosts = posts.map((p: Post) =>
		p.id === postId ? { ...p, seen } : p,
	);
	await storage.setItem(STORAGE_KEYS.POSTS, updatedPosts);
}

export async function deleteOldPosts(daysOld: number): Promise<void> {
	const data = (await storage.getItem<Post[]>(STORAGE_KEYS.POSTS)) || [];
	const posts = z.array(PostSchema).parse(data);
	const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
	const recentPosts = posts.filter((p: Post) => p.timestamp >= cutoffTime);
	await storage.setItem(STORAGE_KEYS.POSTS, recentPosts);
}

/**
 * Groups - Helper Functions
 */

export async function getAllEnabledGroups(): Promise<
	Array<{ id: string; name: string }>
> {
	const data = (await storage.getItem<Group[]>(STORAGE_KEYS.GROUPS)) || [];
	const groups = z.array(GroupSchema).parse(data);

	// Get enabled groups and deduplicate by group ID
	const enabledGroups = groups.filter((g: Group) => g.enabled);
	const uniqueGroups = Array.from(
		new Map(
			enabledGroups.map((g) => [g.id, { id: g.id, name: g.name }]),
		).values(),
	);

	return uniqueGroups;
}

/**
 * Re-exports from modular storage files
 */

export {
	cleanupOldJobs,
	createJob,
	deleteJob,
	getActiveJob,
	getJob,
	listJobs,
	updateJob,
} from "./storage/jobs";

export {
	clearLogs,
	createLog,
	listLogs,
	listLogsByJob,
} from "./storage/logs";
