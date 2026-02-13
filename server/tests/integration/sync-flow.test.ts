import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/api/server.js";
import { cleanDatabase } from "../helpers.js";

interface Subscription {
	id: string;
	name: string;
	createdAt: string;
}

interface Group {
	id: string;
	name: string;
	url: string;
	subscriptionIds: string[];
	enabled: boolean;
	addedAt: string;
	lastScrapedAt: string | null;
}

interface Post {
	id: string;
	groupId: string;
	authorName: string;
	contentHtml: string;
	scrapedAt: string;
	seen: boolean;
	starred: boolean;
	url: string;
}

describe("Integration: Complete Sync Flow", () => {
	let server: FastifyInstance;
	let apiKey: string;

	beforeEach(async () => {
		await cleanDatabase();
		server = await createServer();

		// Register a user to get API key
		const registerResponse = await server.inject({
			method: "POST",
			url: "/api/auth/register",
		});

		expect(registerResponse.statusCode).toBe(201);
		const registerBody = registerResponse.json();
		apiKey = registerBody.apiKey;
	});

	afterEach(async () => {
		await server.close();
	});

	it("should complete full sync flow: register → upload → retrieve", async () => {
		// Step 1: Create subscriptions
		const subscriptionsData = [
			{ id: "sub-1", name: "Tech Jobs", createdAt: Date.now() },
			{ id: "sub-2", name: "Apartments TLV", createdAt: Date.now() },
		];

		const createSubResponse = await server.inject({
			method: "POST",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				subscriptions: subscriptionsData,
			},
		});

		expect(createSubResponse.statusCode).toBe(200);
		const createSubBody = createSubResponse.json();
		expect(createSubBody.synced).toBe(2);
		expect(createSubBody.conflicts).toBe(0);

		// Step 2: Create groups
		const groupsData = [
			{
				id: "group-1",
				name: "React Jobs",
				url: "https://facebook.com/groups/react-jobs",
				subscriptionIds: ["sub-1"],
				enabled: true,
				addedAt: Date.now(),
				lastScrapedAt: Date.now(),
			},
			{
				id: "group-2",
				name: "TLV Housing",
				url: "https://facebook.com/groups/tlv-housing",
				subscriptionIds: ["sub-2"],
				enabled: true,
				addedAt: Date.now(),
				lastScrapedAt: null,
			},
		];

		const createGroupsResponse = await server.inject({
			method: "POST",
			url: "/api/sync/groups",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				groups: groupsData,
			},
		});

		expect(createGroupsResponse.statusCode).toBe(200);
		const createGroupsBody = createGroupsResponse.json();
		expect(createGroupsBody.synced).toBe(2);
		expect(createGroupsBody.conflicts).toBe(0);

		// Step 3: Upload posts
		const postsData = [
			{
				id: "post-1",
				groupId: "group-1",
				authorName: "John Doe",
				contentHtml: "<p>Looking for React developers</p>",
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/groups/react-jobs/posts/post-1",
			},
			{
				id: "post-2",
				groupId: "group-2",
				authorName: "Jane Smith",
				contentHtml: "<p>2BR apartment for rent in TLV</p>",
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/groups/tlv-housing/posts/post-2",
			},
		];

		const uploadPostsResponse = await server.inject({
			method: "POST",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				posts: postsData,
			},
		});

		expect(uploadPostsResponse.statusCode).toBe(200);
		const uploadPostsBody = uploadPostsResponse.json();
		expect(uploadPostsBody.synced).toBe(2);
		expect(uploadPostsBody.conflicts).toBe(0);

		// Step 4: Retrieve subscriptions
		const getSubsResponse = await server.inject({
			method: "GET",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		expect(getSubsResponse.statusCode).toBe(200);
		const getSubsBody = getSubsResponse.json();
		expect(getSubsBody.subscriptions).toHaveLength(2);
		expect(getSubsBody.total).toBe(2);

		const retrievedSub1 = getSubsBody.subscriptions.find(
			(s: Subscription) => s.id === "sub-1",
		);
		expect(retrievedSub1).toBeDefined();
		expect(retrievedSub1.name).toBe("Tech Jobs");

		// Step 5: Retrieve groups
		const getGroupsResponse = await server.inject({
			method: "GET",
			url: "/api/sync/groups",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		expect(getGroupsResponse.statusCode).toBe(200);
		const getGroupsBody = getGroupsResponse.json();
		expect(getGroupsBody.groups).toHaveLength(2);
		expect(getGroupsBody.total).toBe(2);

		const retrievedGroup1 = getGroupsBody.groups.find(
			(g: Group) => g.id === "group-1",
		);
		expect(retrievedGroup1).toBeDefined();
		expect(retrievedGroup1.name).toBe("React Jobs");
		expect(retrievedGroup1.subscriptionIds).toEqual(["sub-1"]);

		// Step 6: Retrieve posts
		const getPostsResponse = await server.inject({
			method: "GET",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		expect(getPostsResponse.statusCode).toBe(200);
		const getPostsBody = getPostsResponse.json();
		expect(getPostsBody.posts).toHaveLength(2);
		expect(getPostsBody.total).toBe(2);

		const retrievedPost1 = getPostsBody.posts.find(
			(p: Post) => p.id === "post-1",
		);
		expect(retrievedPost1).toBeDefined();
		expect(retrievedPost1.authorName).toBe("John Doe");
		expect(retrievedPost1.contentHtml).toBe(
			"<p>Looking for React developers</p>",
		);
		expect(retrievedPost1.groupId).toBe("group-1");
		expect(retrievedPost1.seen).toBe(false);
		expect(retrievedPost1.starred).toBe(false);
	});

	it("should merge seen status correctly for duplicate posts", async () => {
		// Create subscription and group first
		await server.inject({
			method: "POST",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				subscriptions: [{ id: "sub-1", name: "Test", createdAt: Date.now() }],
			},
		});

		await server.inject({
			method: "POST",
			url: "/api/sync/groups",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				groups: [
					{
						id: "group-1",
						name: "Test Group",
						url: "https://facebook.com/groups/test",
						subscriptionIds: ["sub-1"],
						enabled: true,
						addedAt: Date.now(),
						lastScrapedAt: null,
					},
				],
			},
		});

		// Upload post first time (seen: false, starred: false)
		const postsData = [
			{
				id: "post-dup-1",
				groupId: "group-1",
				authorName: "John Doe",
				contentHtml: "<p>Test post</p>",
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/groups/react-jobs/posts/post-dup-1",
			},
		];

		const firstUpload = await server.inject({
			method: "POST",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				posts: postsData,
			},
		});

		expect(firstUpload.statusCode).toBe(200);
		const firstBody = firstUpload.json();
		expect(firstBody.synced).toBe(1);
		expect(firstBody.conflicts).toBe(0);

		// Upload same post again with seen: true
		postsData[0].seen = true;
		postsData[0].scrapedAt = Date.now();

		const secondUpload = await server.inject({
			method: "POST",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				posts: postsData,
			},
		});

		expect(secondUpload.statusCode).toBe(200);
		const secondBody = secondUpload.json();
		expect(secondBody.synced).toBe(0);
		expect(secondBody.conflicts).toBe(1);

		// Verify post has seen: true (union of false || true = true)
		const getPosts = await server.inject({
			method: "GET",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		const getPostsBody = getPosts.json();
		expect(getPostsBody.total).toBe(1);
		expect(getPostsBody.posts[0].seen).toBe(true);

		// Upload same post again with seen: false
		postsData[0].seen = false;

		const thirdUpload = await server.inject({
			method: "POST",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				posts: postsData,
			},
		});

		expect(thirdUpload.statusCode).toBe(200);

		// Verify post still has seen: true (union of true || false = true)
		const getPostsAgain = await server.inject({
			method: "GET",
			url: "/api/sync/posts",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		const getPostsAgainBody = getPostsAgain.json();
		expect(getPostsAgainBody.posts[0].seen).toBe(true);
	});

	it("should isolate data between different users", async () => {
		// Register second user
		const register2Response = await server.inject({
			method: "POST",
			url: "/api/auth/register",
		});

		const register2Body = register2Response.json();
		const apiKey2 = register2Body.apiKey;

		// User 1 uploads data
		await server.inject({
			method: "POST",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
			payload: {
				subscriptions: [
					{ id: "sub-user1", name: "User 1 Sub", createdAt: Date.now() },
				],
			},
		});

		// User 2 uploads different data
		await server.inject({
			method: "POST",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey2}`,
			},
			payload: {
				subscriptions: [
					{ id: "sub-user2", name: "User 2 Sub", createdAt: Date.now() },
				],
			},
		});

		// User 1 retrieves subscriptions
		const user1Subs = await server.inject({
			method: "GET",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey}`,
			},
		});

		const user1SubsBody = user1Subs.json();
		expect(user1SubsBody.subscriptions).toHaveLength(1);
		expect(user1SubsBody.subscriptions[0].name).toBe("User 1 Sub");

		// User 2 retrieves subscriptions
		const user2Subs = await server.inject({
			method: "GET",
			url: "/api/sync/subscriptions",
			headers: {
				authorization: `Bearer ${apiKey2}`,
			},
		});

		const user2SubsBody = user2Subs.json();
		expect(user2SubsBody.subscriptions).toHaveLength(1);
		expect(user2SubsBody.subscriptions[0].name).toBe("User 2 Sub");
	});
});
