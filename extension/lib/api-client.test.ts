import { fakeBrowser } from "@webext-core/fake-browser";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	ApiClientError,
	clearApiKey,
	getApiKey,
	getGroups,
	getPosts,
	getSubscriptions,
	hasApiKey,
	pullAllData,
	pushAllData,
	register,
	setApiKey,
	syncGroups,
	syncPosts,
	syncSubscriptions,
} from "./api-client";
import type { Group, Post, Subscription } from "./types";

const API_URL = "http://localhost:3000";

// Setup MSW server
const server = setupServer();

describe("API Client", () => {
	beforeAll(() => {
		server.listen();
	});

	afterAll(() => {
		server.close();
	});

	beforeEach(async () => {
		// Reset fake browser storage state
		fakeBrowser.reset();
		// Reset MSW handlers
		server.resetHandlers();
	});

	describe("API Key Management", () => {
		it("should get API key from storage", async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
			const apiKey = await getApiKey();
			expect(apiKey).toBe("test-api-key");
		});

		it("should return null when no API key exists", async () => {
			const apiKey = await getApiKey();
			expect(apiKey).toBeNull();
		});

		it("should set API key in storage", async () => {
			await setApiKey("new-api-key");
			const result = await browser.storage.local.get("sync:apiKey");
			expect(result["sync:apiKey"]).toBe("new-api-key");
		});

		it("should clear API key from storage", async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
			await clearApiKey();
			const result = await browser.storage.local.get("sync:apiKey");
			expect(result["sync:apiKey"]).toBeUndefined();
		});

		it("should check if API key exists", async () => {
			expect(await hasApiKey()).toBe(false);
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
			expect(await hasApiKey()).toBe(true);
		});
	});

	describe("Authentication API", () => {
		it("should register and store API key", async () => {
			const mockResponse = {
				apiKey: "new-api-key-123",
				userId: "user-123",
				createdAt: new Date().toISOString(),
			};

			server.use(
				http.post(`${API_URL}/api/auth/register`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await register();

			expect(response).toEqual(mockResponse);
			const result = await browser.storage.local.get("sync:apiKey");
			expect(result["sync:apiKey"]).toBe("new-api-key-123");
		});
	});

	describe("Subscriptions Sync API", () => {
		beforeEach(async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
		});

		it("should sync subscriptions", async () => {
			const subscriptions: Subscription[] = [
				{ id: "sub1", name: "Test Sub", createdAt: Date.now() },
			];

			const mockResponse = {
				synced: 1,
				conflicts: 0,
				errors: [],
			};

			server.use(
				http.post(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await syncSubscriptions(subscriptions);

			expect(response).toEqual(mockResponse);
		});

		it("should get subscriptions", async () => {
			const mockResponse = {
				subscriptions: [
					{ id: "sub1", name: "Test Sub", createdAt: Date.now() },
				],
				total: 1,
			};

			server.use(
				http.get(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await getSubscriptions();

			expect(response).toEqual(mockResponse);
		});
	});

	describe("Groups Sync API", () => {
		beforeEach(async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
		});

		it("should sync groups", async () => {
			const groups: Group[] = [
				{
					id: "group1",
					url: "https://facebook.com/groups/group1",
					name: "Test Group",
					subscriptionIds: ["sub1"],
					addedAt: Date.now(),
					lastScrapedAt: null,
					enabled: true,
				},
			];

			const mockResponse = {
				synced: 1,
				conflicts: 0,
				errors: [],
			};

			server.use(
				http.post(`${API_URL}/api/sync/groups`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await syncGroups(groups);

			expect(response).toEqual(mockResponse);
		});

		it("should get groups", async () => {
			const mockResponse = {
				groups: [
					{
						id: "group1",
						url: "https://facebook.com/groups/group1",
						name: "Test Group",
						subscriptionIds: ["sub1"],
						addedAt: Date.now(),
						lastScrapedAt: null,
						enabled: true,
					},
				],
				total: 1,
			};

			server.use(
				http.get(`${API_URL}/api/sync/groups`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await getGroups();

			expect(response).toEqual(mockResponse);
		});
	});

	describe("Posts Sync API", () => {
		beforeEach(async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
		});

		it("should sync posts", async () => {
			const posts: Post[] = [
				{
					id: "123456789",
					groupId: "group1",
					authorName: "Test Author",
					contentHtml: "<p>Test post</p>",
					scrapedAt: Date.now(),
					seen: false,
					starred: false,
					url: "https://facebook.com/groups/group1/posts/123456789",
				},
			];

			const mockResponse = {
				synced: 1,
				conflicts: 0,
				errors: [],
			};

			server.use(
				http.post(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await syncPosts(posts);

			expect(response).toEqual(mockResponse);
		});

		it("should get posts with default options", async () => {
			const mockResponse = {
				posts: [],
				total: 0,
				limit: 100,
				offset: 0,
			};

			server.use(
				http.get(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const response = await getPosts();

			expect(response).toEqual(mockResponse);
		});

		it("should get posts with pagination options", async () => {
			const mockResponse = {
				posts: [],
				total: 150,
				limit: 50,
				offset: 0,
			};

			server.use(
				http.get(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			await getPosts({ limit: 50, offset: 0 });
		});

		it("should get posts with since parameter", async () => {
			const mockResponse = {
				posts: [],
				total: 10,
				limit: 100,
				offset: 0,
			};

			server.use(
				http.get(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);

			const since = Date.now() - 3600000; // 1 hour ago
			await getPosts({ since });
		});
	});

	describe("Full Sync Operations", () => {
		beforeEach(async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
		});

		it("should push all data in parallel", async () => {
			const data = {
				subscriptions: [
					{ id: "sub1", name: "Test Sub", createdAt: Date.now() },
				],
				groups: [
					{
						id: "group1",
						url: "https://facebook.com/groups/group1",
						name: "Test Group",
						subscriptionIds: ["sub1"],
						addedAt: Date.now(),
						lastScrapedAt: null,
						enabled: true,
					},
				],
				posts: [
					{
						id: "123456789",
						groupId: "group1",
						authorName: "Test Author",
						contentHtml: "<p>Test post</p>",
						scrapedAt: Date.now(),
						seen: false,
						starred: false,
						url: "https://facebook.com/groups/group1/posts/123456789",
					},
				],
			};

			const mockSyncResponse = { synced: 1, conflicts: 0, errors: [] };

			server.use(
				http.post(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json(mockSyncResponse);
				}),
				http.post(`${API_URL}/api/sync/groups`, () => {
					return HttpResponse.json(mockSyncResponse);
				}),
				http.post(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json(mockSyncResponse);
				}),
			);

			const response = await pushAllData(data);

			expect(response.subscriptions).toEqual(mockSyncResponse);
			expect(response.groups).toEqual(mockSyncResponse);
			expect(response.posts).toEqual(mockSyncResponse);
		});

		it("should pull all data in parallel", async () => {
			server.use(
				http.get(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json({
						subscriptions: [
							{ id: "sub1", name: "Test Sub", createdAt: Date.now() },
						],
						total: 1,
					});
				}),
				http.get(`${API_URL}/api/sync/groups`, () => {
					return HttpResponse.json({
						groups: [
							{
								id: "group1",
								url: "https://facebook.com/groups/group1",
								name: "Test Group",
								subscriptionIds: ["sub1"],
								addedAt: Date.now(),
								lastScrapedAt: null,
								enabled: true,
							},
						],
						total: 1,
					});
				}),
				http.get(`${API_URL}/api/sync/posts`, () => {
					return HttpResponse.json({
						posts: [
							{
								id: "123456789",
								groupId: "group1",
								authorName: "Test Author",
								contentHtml: "<p>Test post</p>",
								scrapedAt: Date.now(),
								seen: false,
								starred: false,
								url: "https://facebook.com/groups/group1/posts/123456789",
							},
						],
						total: 1,
						limit: 1000,
						offset: 0,
					});
				}),
			);

			const response = await pullAllData();

			expect(response.subscriptions).toHaveLength(1);
			expect(response.groups).toHaveLength(1);
			expect(response.posts).toHaveLength(1);
		});
	});

	describe("Error Handling", () => {
		beforeEach(async () => {
			await browser.storage.local.set({ "sync:apiKey": "test-api-key" });
		});

		it("should throw ApiClientError on HTTP error", async () => {
			const errorResponse = {
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request body",
				},
			};

			server.use(
				http.post(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json(errorResponse, { status: 400 });
				}),
			);

			await expect(syncSubscriptions([])).rejects.toThrow(ApiClientError);
			await expect(syncSubscriptions([])).rejects.toThrow(
				"Invalid request body",
			);
		});

		it("should throw ApiClientError on authentication failure", async () => {
			const errorResponse = {
				error: {
					code: "INVALID_API_KEY",
					message: "API key is not valid",
				},
			};

			server.use(
				http.get(`${API_URL}/api/sync/subscriptions`, () => {
					return HttpResponse.json(errorResponse, { status: 401 });
				}),
			);

			await expect(getSubscriptions()).rejects.toThrow(ApiClientError);
		});

		it("should handle malformed error responses", async () => {
			server.use(
				http.get(`${API_URL}/api/sync/subscriptions`, () => {
					return new HttpResponse(null, {
						status: 500,
						statusText: "Internal Server Error",
					});
				}),
			);

			await expect(getSubscriptions()).rejects.toThrow(ApiClientError);
			await expect(getSubscriptions()).rejects.toThrow("Request failed");
		});
	});
});
