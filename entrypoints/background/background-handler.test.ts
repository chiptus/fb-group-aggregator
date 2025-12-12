import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroup, listGroups, listPosts } from "@/lib/storage";
import type { ExtensionMessage, Post } from "@/lib/types";
import { handleScrapePosts, messageListener } from "./background-handler";

describe.sequential("Background Script - Message Handling", () => {
	beforeEach(async () => {
		// Clear storage before each test
		await chrome.storage.local.clear();
	});

	describe("handleScrapePosts function", () => {
		it("should save new posts to storage", async () => {
			const mockPosts: Omit<Post, "scrapedAt" | "seen">[] = [
				{
					id: "post1",
					groupId: "group1",
					authorName: "John Doe",
					contentHtml: "<p>Test post</p>",
					timestamp: Date.now(),
					url: "https://facebook.com/groups/group1/posts/post1",
				},
			];

			const response = await handleScrapePosts({
				groupId: "group1",
				groupInfo: {
					name: "Test Group",
					url: "https://facebook.com/groups/group1",
				},
				posts: mockPosts,
			});

			expect(response).toMatchObject({
				success: true,
				count: 1,
			});

			// Verify posts were saved
			const savedPosts = await listPosts();
			expect(savedPosts).toHaveLength(1);
			expect(savedPosts[0]).toMatchObject({
				id: "post1",
				groupId: "group1",
				authorName: "John Doe",
				seen: false,
				scrapedAt: expect.any(Number),
			});
		});

		it("should deduplicate posts (not save duplicates)", async () => {
			const mockPost: Omit<Post, "scrapedAt" | "seen"> = {
				id: "post1",
				groupId: "group1",
				authorName: "John Doe",
				contentHtml: "<p>Test post</p>",
				timestamp: Date.now(),
				url: "https://facebook.com/groups/group1/posts/post1",
			};

			const payload = {
				groupId: "group1",
				groupInfo: {
					name: "Test Group",
					url: "https://facebook.com/groups/group1",
				},
				posts: [mockPost],
			};

			// Send same post twice
			const response1 = await handleScrapePosts(payload);
			const response2 = await handleScrapePosts(payload);

			expect(response1).toMatchObject({ success: true, count: 1 });
			expect(response2).toMatchObject({ success: true, count: 0 }); // No new posts

			// Verify only one post exists
			const savedPosts = await listPosts();
			expect(savedPosts).toHaveLength(1);
		});

		it("should auto-register new group if not exists", async () => {
			const response = await handleScrapePosts({
				groupId: "newgroup",
				groupInfo: {
					name: "New Group",
					url: "https://facebook.com/groups/newgroup",
				},
				posts: [],
			});

			expect(response).toMatchObject({ success: true, count: 0 });

			const groups = await listGroups();
			expect(groups).toHaveLength(1);
			expect(groups[0]).toMatchObject({
				id: "newgroup",
				name: "New Group",
				url: "https://facebook.com/groups/newgroup",
				subscriptionIds: [],
				enabled: true,
				lastScrapedAt: expect.any(Number),
			});
		});

		it("should update lastScrapedAt for existing group", async () => {
			// Create group first
			await createGroup({
				id: "group1",
				name: "Test Group",
				url: "https://facebook.com/groups/group1",
				subscriptionIds: [],
				enabled: true,
			});

			const beforeTime = Date.now();

			await handleScrapePosts({
				groupId: "group1",
				groupInfo: {
					name: "Test Group",
					url: "https://facebook.com/groups/group1",
				},
				posts: [],
			});

			const groups = await listGroups();
			expect(groups).toHaveLength(1);
			expect(groups[0].lastScrapedAt).toBeGreaterThanOrEqual(beforeTime);
		});

		it("should not overwrite existing group data when updating", async () => {
			// Create group with subscription
			await createGroup({
				id: "group1",
				name: "Original Name",
				url: "https://facebook.com/groups/group1",
				subscriptionIds: ["sub1"],
				enabled: false, // User disabled it
			});

			await handleScrapePosts({
				groupId: "group1",
				groupInfo: {
					name: "Updated Name",
					url: "https://facebook.com/groups/group1",
				},
				posts: [],
			});

			const groups = await listGroups();
			expect(groups).toHaveLength(1);
			expect(groups[0]).toMatchObject({
				id: "group1",
				name: "Original Name", // Should keep original
				subscriptionIds: ["sub1"], // Should keep subscriptions
				enabled: false, // Should keep user preference
			});
		});

		it("should handle multiple posts from same message", async () => {
			const mockPosts: Omit<Post, "scrapedAt" | "seen">[] = [
				{
					id: "post1",
					groupId: "group1",
					authorName: "John",
					contentHtml: "<p>Post 1</p>",
					timestamp: Date.now(),
					url: "https://facebook.com/groups/group1/posts/post1",
				},
				{
					id: "post2",
					groupId: "group1",
					authorName: "Jane",
					contentHtml: "<p>Post 2</p>",
					timestamp: Date.now(),
					url: "https://facebook.com/groups/group1/posts/post2",
				},
			];

			const response = await handleScrapePosts({
				groupId: "group1",
				groupInfo: {
					name: "Test Group",
					url: "https://facebook.com/groups/group1",
				},
				posts: mockPosts,
			});

			expect(response).toMatchObject({
				success: true,
				count: 2,
			});

			const savedPosts = await listPosts();
			expect(savedPosts).toHaveLength(2);
		});
	});

	describe("Error handling", () => {
		it("should return error response when storage fails", async () => {
			// Mock listGroups to throw error
			vi.spyOn(await import("@/lib/storage"), "listGroups").mockRejectedValue(
				new Error("Storage error"),
			);

			await expect(
				handleScrapePosts({
					groupId: "group1",
					groupInfo: {
						name: "Test Group",
						url: "https://facebook.com/groups/group1",
					},
					posts: [],
				}),
			).rejects.toThrow("Storage error");

			vi.restoreAllMocks();
		});

		it("should handle empty posts array gracefully", async () => {
			const response = await handleScrapePosts({
				groupId: "group1",
				groupInfo: {
					name: "Test Group",
					url: "https://facebook.com/groups/group1",
				},
				posts: [],
			});

			expect(response).toMatchObject({
				success: true,
				count: 0,
			});
		});
	});

	describe("messageListener function", () => {
		it("should handle SCRAPE_POSTS message", async () => {
			const message = {
				type: "SCRAPE_POSTS" as const,
				payload: {
					groupId: "group1",
					groupInfo: {
						name: "Test Group",
						url: "https://facebook.com/groups/group1",
					},
					posts: [],
				},
			};

			const sendResponse = vi.fn();
			const sender = {} as chrome.runtime.MessageSender;

			const shouldAsync = messageListener(message, sender, sendResponse);

			expect(shouldAsync).toBe(true); // Should return true for async response

			// Wait for async handler to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(sendResponse).toHaveBeenCalledWith({
				success: true,
				count: 0,
			});
		});

		it("should return false for unknown message types", () => {
			const message = {
				type: "UNKNOWN_TYPE",
			} as unknown as ExtensionMessage;

			const sendResponse = vi.fn();
			const sender = {} as chrome.runtime.MessageSender;

			const shouldAsync = messageListener(message, sender, sendResponse);

			expect(shouldAsync).toBe(false);
			expect(sendResponse).not.toHaveBeenCalled();
		});
	});
});
