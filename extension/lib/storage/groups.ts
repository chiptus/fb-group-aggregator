import { storage } from "wxt/utils/storage";
import { z } from "zod";
import { type Group, GroupSchema, type Post, PostSchema } from "../types";
import { GROUPS_STORAGE_KEY, POSTS_STORAGE_KEY } from "./keys";
import { listPosts } from "./posts";

export async function createGroup(
	groupData: Omit<Group, "addedAt" | "lastScrapedAt">,
): Promise<Group> {
	const groups = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});

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
	await storage.setItem(GROUPS_STORAGE_KEY, groups);

	return group;
}

export async function listGroups(): Promise<Group[]> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	return z.array(GroupSchema).parse(data);
}

export async function updateGroup(
	id: string,
	updates: Partial<Omit<Group, "id" | "addedAt">>,
): Promise<Group> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);
	const index = groups.findIndex((g: Group) => g.id === id);

	if (index === -1) {
		throw new Error(`Group with id ${id} not found`);
	}

	const updated = { ...groups[index], ...updates };
	groups[index] = updated;
	await storage.setItem(GROUPS_STORAGE_KEY, groups);

	return updated;
}

export async function deleteGroup(id: string): Promise<void> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);
	const filtered = groups.filter((g: Group) => g.id !== id);
	await storage.setItem(GROUPS_STORAGE_KEY, filtered);
}

export async function findGroupByUrl(url: string): Promise<Group | undefined> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);
	return groups.find((g: Group) => g.url === url);
}

export async function getGroupsBySubscription(
	subscriptionId: string,
): Promise<Group[]> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);
	return groups.filter((g: Group) =>
		g.subscriptionIds.includes(subscriptionId),
	);
}

export async function bulkUpdateGroups(
	groupIds: string[],
	updates: Partial<Omit<Group, "id" | "addedAt">>,
): Promise<void> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);

	const updatedGroups = groups.map((g: Group) =>
		groupIds.includes(g.id) ? { ...g, ...updates } : g,
	);

	await storage.setItem(GROUPS_STORAGE_KEY, updatedGroups);
}

export async function bulkDeleteGroups(groupIds: string[]): Promise<void> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
	const groups = z.array(GroupSchema).parse(data);
	const filtered = groups.filter((g: Group) => !groupIds.includes(g.id));
	await storage.setItem(GROUPS_STORAGE_KEY, filtered);

	// Also delete posts from these groups
	const postsData = await listPosts();
	const posts = z.array(PostSchema).parse(postsData);
	const filteredPosts = posts.filter(
		(p: Post) => !groupIds.includes(p.groupId),
	);
	await storage.setItem(POSTS_STORAGE_KEY, filteredPosts);
}

export async function getAllEnabledGroups(): Promise<
	Array<{ id: string; name: string }>
> {
	const data = await storage.getItem<Group[]>(GROUPS_STORAGE_KEY, {
		fallback: [],
	});
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
