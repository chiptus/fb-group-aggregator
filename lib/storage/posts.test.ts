import { beforeEach, describe, expect, it } from "vitest";
import type { Group, Post } from "../types";
import {
	createPosts,
	deleteOldPosts,
	listPosts,
	listPostsBySubscription,
	markPostAsSeen,
	togglePostStarred,
} from "./posts";

describe("Storage - Posts", () => {
	beforeEach(async () => {
		await chrome.storage.local.clear();
	});

	it("should create new posts", async () => {
		const newPosts = [
			{
				id: "1",
				groupId: "group-1",
				authorName: "John Doe",
				contentHtml: "<p>Test post</p>",
				timestamp: Date.now(),
				url: "https://facebook.com/posts/1",
			},
			{
				id: "2",
				groupId: "group-1",
				authorName: "Jane Doe",
				contentHtml: "<p>Another post</p>",
				timestamp: Date.now(),
				url: "https://facebook.com/posts/2",
			},
		];

		await createPosts(newPosts);

		const posts = await listPosts();
		expect(posts).toHaveLength(2);
		expect(posts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					...newPosts[0],
					scrapedAt: expect.any(Number),
					seen: false,
					starred: false,
				}),
				expect.objectContaining({
					...newPosts[1],
					scrapedAt: expect.any(Number),
					seen: false,
					starred: false,
				}),
			]),
		);
	});

	it("should deduplicate posts by ID", async () => {
		const existingPost: Post = {
			id: "1",
			groupId: "group-1",
			authorName: "John Doe",
			contentHtml: "<p>Test post</p>",
			timestamp: Date.now(),
			scrapedAt: Date.now(),
			seen: false,
			starred: false,
			url: "https://facebook.com/posts/1",
		};

		await chrome.storage.local.set({ posts: [existingPost] });

		const newPosts = [
			{
				id: "1", // Duplicate
				groupId: "group-1",
				authorName: "John Doe Updated",
				contentHtml: "<p>Updated content</p>",
				timestamp: Date.now(),
				url: "https://facebook.com/posts/1",
			},
			{
				id: "2", // New
				groupId: "group-1",
				authorName: "Jane Doe",
				contentHtml: "<p>Another post</p>",
				timestamp: Date.now(),
				url: "https://facebook.com/posts/2",
			},
		];

		await createPosts(newPosts);

		const posts = await listPosts();
		expect(posts).toHaveLength(2); // Should have 2 posts total (1 existing, 1 new)
		expect(posts.find((p: Post) => p.id === "1")).toEqual(existingPost); // Existing should remain unchanged
		expect(posts.find((p: Post) => p.id === "2")).toBeDefined(); // New post should be added
	});

	it("should list all posts", async () => {
		const mockPosts: Post[] = [
			{
				id: "1",
				groupId: "group-1",
				authorName: "John Doe",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/posts/1",
			},
		];

		await chrome.storage.local.set({ posts: mockPosts });

		const posts = await listPosts();

		expect(posts).toEqual(mockPosts);
	});

	it("should list posts by subscription", async () => {
		const mockGroups: Group[] = [
			{
				id: "group-1",
				url: "https://facebook.com/groups/1",
				name: "Group 1",
				subscriptionIds: ["sub-1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
			{
				id: "group-2",
				url: "https://facebook.com/groups/2",
				name: "Group 2",
				subscriptionIds: ["sub-2"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
		];

		const mockPosts: Post[] = [
			{
				id: "1",
				groupId: "group-1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/posts/1",
			},
			{
				id: "2",
				groupId: "group-2",
				authorName: "Jane",
				contentHtml: "<p>Test 2</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/posts/2",
			},
		];

		await chrome.storage.local.set({
			groups: mockGroups,
			posts: mockPosts,
		});

		const posts = await listPostsBySubscription("sub-1");

		expect(posts).toEqual([mockPosts[0]]);
		expect(posts).toHaveLength(1);
	});

	it("should mark post as seen", async () => {
		const mockPosts: Post[] = [
			{
				id: "1",
				groupId: "group-1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/posts/1",
			},
		];

		await chrome.storage.local.set({ posts: mockPosts });

		await markPostAsSeen("1", true);

		const posts = await listPosts();
		expect(posts).toEqual([
			{
				...mockPosts[0],
				seen: true,
			},
		]);
	});

	it("should toggle post starred status", async () => {
		const mockPosts: Post[] = [
			{
				id: "1",
				groupId: "group-1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/posts/1",
			},
		];

		await chrome.storage.local.set({ posts: mockPosts });

		await togglePostStarred("1", true);

		const posts = await listPosts();
		expect(posts).toEqual([
			{
				...mockPosts[0],
				starred: true,
			},
		]);
	});

	it("should delete old posts", async () => {
		const now = Date.now();
		const oldPost: Post = {
			id: "100",
			groupId: "group-1",
			authorName: "John",
			contentHtml: "<p>Old</p>",
			timestamp: now - 40 * 24 * 60 * 60 * 1000, // 40 days ago
			scrapedAt: now - 40 * 24 * 60 * 60 * 1000,
			seen: true,
			starred: false,
			url: "https://facebook.com/posts/old",
		};

		const recentPost: Post = {
			id: "200",
			groupId: "group-1",
			authorName: "Jane",
			contentHtml: "<p>Recent</p>",
			timestamp: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
			scrapedAt: now - 10 * 24 * 60 * 60 * 1000,
			seen: false,
			starred: false,
			url: "https://facebook.com/posts/recent",
		};

		await chrome.storage.local.set({
			posts: [oldPost, recentPost],
		});

		await deleteOldPosts(30); // Delete posts older than 30 days

		const posts = await listPosts();
		expect(posts).toEqual([recentPost]);
	});
});
