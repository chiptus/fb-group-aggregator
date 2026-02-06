import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/types";
import { PostGroupingService } from "./service";
import { ExactMatchStrategy } from "./strategies/exact-match";

function createMockPost(id: string, content: string, seen = false): Post {
	return {
		id,
		groupId: "group1",
		authorName: "Test Author",
		contentHtml: content,
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: false,
	};
}

describe("PostGroupingService", () => {
	describe("constructor", () => {
		it("should initialize with default ExactMatchStrategy", () => {
			const service = new PostGroupingService();
			expect(service.strategy.name).toBe("exact-match");
		});

		it("should accept custom strategy", () => {
			const customStrategy = new ExactMatchStrategy({ minContentLength: 20 });
			const service = new PostGroupingService(customStrategy);
			expect(service.strategy).toBe(customStrategy);
		});
	});

	describe("setStrategy", () => {
		it("should allow changing strategy at runtime", () => {
			const service = new PostGroupingService();
			const newStrategy = new ExactMatchStrategy({ minContentLength: 15 });

			service.setStrategy(newStrategy);

			expect(service.strategy).toBe(newStrategy);
		});
	});

	describe("groupPosts", () => {
		it("should delegate to current strategy", () => {
			const posts = [
				createMockPost("1", "Looking for apartment in the city"),
				createMockPost("2", "Looking for apartment in the city"),
			];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);

			expect(result.totalGroups).toBe(1);
			expect(result.strategyUsed).toBe("exact-match");
		});
	});

	describe("getPostsByGroup", () => {
		it("should return posts belonging to specified group", () => {
			const posts = [
				createMockPost("1", "Looking for apartment in the city"),
				createMockPost("2", "Looking for apartment in the city"),
				createMockPost("3", "Selling my car in good condition"),
			];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);

			const groupId = result.groups[0].id;
			const postsInGroup = service.getPostsByGroup(groupId, posts, result);

			expect(postsInGroup).toHaveLength(2);
			expect(postsInGroup.map((p) => p.id)).toContain("1");
			expect(postsInGroup.map((p) => p.id)).toContain("2");
		});

		it("should return empty array for non-existent group", () => {
			const posts = [createMockPost("1", "Some long content here")];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);

			const postsInGroup = service.getPostsByGroup(
				"non-existent",
				posts,
				result,
			);

			expect(postsInGroup).toHaveLength(0);
		});
	});

	describe("getGroupsSorted", () => {
		it("should return groups sorted by count (largest first)", () => {
			const posts = [
				// Group 1: 3 posts
				createMockPost("1", "Looking for apartment in the city"),
				createMockPost("2", "Looking for apartment in the city"),
				createMockPost("3", "Looking for apartment in the city"),
				// Group 2: 2 posts
				createMockPost("4", "Selling my car in good condition"),
				createMockPost("5", "Selling my car in good condition"),
			];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);
			const sortedGroups = service.getGroupsSorted(result);

			expect(sortedGroups[0].count).toBe(3);
			expect(sortedGroups[1].count).toBe(2);
		});

		it("should return empty array for no groups", () => {
			const service = new PostGroupingService();
			const result = service.groupPosts([]);
			const sortedGroups = service.getGroupsSorted(result);

			expect(sortedGroups).toHaveLength(0);
		});
	});

	describe("getGroupingStats", () => {
		it("should calculate correct statistics", () => {
			const posts = [
				// Group 1: 3 posts
				createMockPost("1", "Looking for apartment in the city"),
				createMockPost("2", "Looking for apartment in the city"),
				createMockPost("3", "Looking for apartment in the city"),
				// Group 2: 2 posts
				createMockPost("4", "Selling my car in good condition"),
				createMockPost("5", "Selling my car in good condition"),
				// Ungrouped: 1 post
				createMockPost("6", "Unique post that stands alone here"),
			];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);
			const stats = service.getGroupingStats(result);

			expect(stats.totalGroups).toBe(2);
			expect(stats.totalPostsGrouped).toBe(5);
			expect(stats.ungroupedCount).toBe(1);
			expect(stats.averageGroupSize).toBe(2.5);
			expect(stats.maxGroupSize).toBe(3);
			expect(stats.strategyUsed).toBe("exact-match");
		});

		it("should calculate reduction percentage correctly", () => {
			const posts = [
				createMockPost("1", "Duplicate content for testing purposes"),
				createMockPost("2", "Duplicate content for testing purposes"),
				createMockPost("3", "Duplicate content for testing purposes"),
				createMockPost("4", "Duplicate content for testing purposes"),
			];

			const service = new PostGroupingService();
			const result = service.groupPosts(posts);
			const stats = service.getGroupingStats(result);

			// 4 posts grouped into 1 group = 75% reduction
			// (original 4 items - 1 group) / original 4 items = 75%
			expect(stats.reductionPercentage).toBe(75);
		});

		it("should handle zero posts", () => {
			const service = new PostGroupingService();
			const result = service.groupPosts([]);
			const stats = service.getGroupingStats(result);

			expect(stats.totalGroups).toBe(0);
			expect(stats.averageGroupSize).toBe(0);
			expect(stats.maxGroupSize).toBe(0);
			expect(stats.reductionPercentage).toBe(0);
		});
	});
});
