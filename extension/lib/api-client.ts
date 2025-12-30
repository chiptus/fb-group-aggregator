import type { Group, Post, Subscription } from "./types";

/**
 * API Client Configuration
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_KEY_STORAGE_KEY = "sync:apiKey";

/**
 * API Response Types
 */
export type RegisterResponse = {
	apiKey: string;
	userId: string;
	createdAt: string;
};

export type SyncResponse = {
	synced: number;
	conflicts: number;
	errors: Array<{
		subscriptionId?: string;
		groupId?: string;
		postId?: string;
		error: string;
	}>;
};

export type GetSubscriptionsResponse = {
	subscriptions: Subscription[];
	total: number;
};

export type GetGroupsResponse = {
	groups: Group[];
	total: number;
};

export type GetPostsResponse = {
	posts: Post[];
	total: number;
	limit: number;
	offset: number;
};

/**
 * API Client Error
 */
export class ApiClientError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public code?: string,
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

/**
 * HTTP Request Helper
 */
async function request<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const apiKey = await getApiKey();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...((options.headers as Record<string, string>) || {}),
	};

	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			error: { code: "UNKNOWN_ERROR", message: "Request failed" },
		}));
		throw new ApiClientError(
			error.error?.message || "Request failed",
			response.status,
			error.error?.code,
		);
	}

	return response.json();
}

/**
 * API Key Management
 */
export async function getApiKey(): Promise<string | null> {
	const result = await browser.storage.local.get(API_KEY_STORAGE_KEY);
	return (result[API_KEY_STORAGE_KEY] as string | undefined) || null;
}

export async function setApiKey(apiKey: string): Promise<void> {
	await browser.storage.local.set({ [API_KEY_STORAGE_KEY]: apiKey });
}

export async function clearApiKey(): Promise<void> {
	await browser.storage.local.remove(API_KEY_STORAGE_KEY);
}

export async function hasApiKey(): Promise<boolean> {
	const apiKey = await getApiKey();
	return !!apiKey;
}

/**
 * Authentication API
 */
export async function register(): Promise<RegisterResponse> {
	const response = await request<RegisterResponse>("/api/auth/register", {
		method: "POST",
	});

	// Automatically store the API key
	await setApiKey(response.apiKey);

	return response;
}

/**
 * Subscriptions Sync API
 */
export async function syncSubscriptions(
	subscriptions: Subscription[],
): Promise<SyncResponse> {
	return request<SyncResponse>("/api/sync/subscriptions", {
		method: "POST",
		body: JSON.stringify({ subscriptions }),
	});
}

export async function getSubscriptions(): Promise<GetSubscriptionsResponse> {
	return request<GetSubscriptionsResponse>("/api/sync/subscriptions", {
		method: "GET",
	});
}

/**
 * Groups Sync API
 */
export async function syncGroups(groups: Group[]): Promise<SyncResponse> {
	return request<SyncResponse>("/api/sync/groups", {
		method: "POST",
		body: JSON.stringify({ groups }),
	});
}

export async function getGroups(): Promise<GetGroupsResponse> {
	return request<GetGroupsResponse>("/api/sync/groups", {
		method: "GET",
	});
}

/**
 * Posts Sync API
 */
export async function syncPosts(posts: Post[]): Promise<SyncResponse> {
	return request<SyncResponse>("/api/sync/posts", {
		method: "POST",
		body: JSON.stringify({ posts }),
	});
}

export async function getPosts(
	options: { limit?: number; offset?: number; since?: number } = {},
): Promise<GetPostsResponse> {
	const params = new URLSearchParams();
	if (options.limit) params.set("limit", options.limit.toString());
	if (options.offset) params.set("offset", options.offset.toString());
	if (options.since) params.set("since", options.since.toString());

	const query = params.toString() ? `?${params.toString()}` : "";
	return request<GetPostsResponse>(`/api/sync/posts${query}`, {
		method: "GET",
	});
}

/**
 * Full Sync - Push all local data to server
 */
export async function pushAllData(data: {
	subscriptions: Subscription[];
	groups: Group[];
	posts: Post[];
}): Promise<{
	subscriptions: SyncResponse;
	groups: SyncResponse;
	posts: SyncResponse;
}> {
	const [subscriptions, groups, posts] = await Promise.all([
		syncSubscriptions(data.subscriptions),
		syncGroups(data.groups),
		syncPosts(data.posts),
	]);

	return { subscriptions, groups, posts };
}

/**
 * Full Sync - Pull all data from server
 */
export async function pullAllData(): Promise<{
	subscriptions: Subscription[];
	groups: Group[];
	posts: Post[];
}> {
	const [subsResponse, groupsResponse, postsResponse] = await Promise.all([
		getSubscriptions(),
		getGroups(),
		getPosts({ limit: 1000 }), // TODO: Handle pagination
	]);

	return {
		subscriptions: subsResponse.subscriptions,
		groups: groupsResponse.groups,
		posts: postsResponse.posts,
	};
}
