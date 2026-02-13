import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/types";
import { PostGroupingService } from "./service";
import { ExactMatchStrategy } from "./strategies/exact-match";

/**
 * Performance tests for post grouping
 * Target: Grouping should complete in reasonable time for large datasets
 */

function createMockPost(id: number, contentVariant: number): Post {
	// Create some duplicate content patterns
	const contents = [
		"Looking for 2BR apartment in TLV area. Budget 5000 NIS.",
		"Selling iPhone 14 Pro, like new condition. Price negotiable.",
		"Job opportunity: Senior React Developer needed at startup.",
		"Room available for rent in shared apartment. Girls only.",
		"Lost cat near Dizengoff Center. Orange tabby. Please help!",
	];

	return {
		id: `post-${id}`,
		groupId: `group-${id % 10}`,
		authorName: `Author ${id}`,
		contentHtml: `<p>${contents[contentVariant % contents.length]}</p>`,
		timestamp: undefined,
		scrapedAt: Date.now() - id * 1000,
		seen: id % 3 === 0,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: id % 5 === 0,
	};
}

function createMockPostsWithDuplicates(
	count: number,
	duplicateRatio: number,
): Post[] {
	const uniqueCount = Math.floor(count * (1 - duplicateRatio));
	const posts: Post[] = [];

	for (let i = 0; i < count; i++) {
		// First uniqueCount posts get unique content variants, rest are duplicates
		const contentVariant = i < uniqueCount ? i : i % uniqueCount;
		posts.push(createMockPost(i, contentVariant));
	}

	return posts;
}

describe("PostGroupingService performance", () => {
	const service = new PostGroupingService(new ExactMatchStrategy());

	describe("grouping performance with duplicates", () => {
		it("should group 1000 posts with 30% duplicates in <500ms", () => {
			const posts = createMockPostsWithDuplicates(1000, 0.3);

			const start = performance.now();
			const result = service.groupPosts(posts);
			const duration = performance.now() - start;

			console.log(
				`Group 1000 posts (30% duplicates): ${duration.toFixed(2)}ms`,
			);
			console.log(
				`  Groups: ${result.totalGroups}, Grouped posts: ${result.totalPostsGrouped}`,
			);

			expect(duration).toBeLessThan(500);
			expect(result.totalGroups).toBeGreaterThan(0);
		});

		it("should group 5000 posts with 30% duplicates in <1000ms", () => {
			const posts = createMockPostsWithDuplicates(5000, 0.3);

			const start = performance.now();
			const result = service.groupPosts(posts);
			const duration = performance.now() - start;

			console.log(
				`Group 5000 posts (30% duplicates): ${duration.toFixed(2)}ms`,
			);
			console.log(
				`  Groups: ${result.totalGroups}, Grouped posts: ${result.totalPostsGrouped}`,
			);

			expect(duration).toBeLessThan(1000);
			expect(result.totalGroups).toBeGreaterThan(0);
		});

		it("should group 10000 posts with 50% duplicates in <2000ms", () => {
			const posts = createMockPostsWithDuplicates(10000, 0.5);

			const start = performance.now();
			const result = service.groupPosts(posts);
			const duration = performance.now() - start;

			console.log(
				`Group 10000 posts (50% duplicates): ${duration.toFixed(2)}ms`,
			);
			console.log(
				`  Groups: ${result.totalGroups}, Grouped posts: ${result.totalPostsGrouped}`,
			);

			expect(duration).toBeLessThan(2000);
			expect(result.totalGroups).toBeGreaterThan(0);
		});
	});

	describe("SC-007: 30% list reduction with similar posts", () => {
		it("should achieve at least 30% reduction when 40%+ posts are duplicates", () => {
			// Create posts where 50% are duplicates
			const posts = createMockPostsWithDuplicates(1000, 0.5);

			const result = service.groupPosts(posts);
			const stats = service.getGroupingStats(result);

			console.log(`\nGrouping efficiency:`);
			console.log(`  Total posts: 1000`);
			console.log(`  Groups: ${stats.totalGroups}`);
			console.log(`  Ungrouped: ${stats.ungroupedCount}`);
			console.log(`  Reduction: ${stats.reductionPercentage}%`);

			// With 50% duplicates, we should get at least 30% reduction
			expect(stats.reductionPercentage).toBeGreaterThanOrEqual(30);
		});
	});

	describe("helper methods performance", () => {
		it("should getGroupsSorted in <10ms for 100 groups", () => {
			const posts = createMockPostsWithDuplicates(1000, 0.3);
			const result = service.groupPosts(posts);

			const start = performance.now();
			const sorted = service.getGroupsSorted(result);
			const duration = performance.now() - start;

			console.log(
				`Sort ${result.totalGroups} groups: ${duration.toFixed(2)}ms`,
			);
			expect(duration).toBeLessThan(10);
			expect(sorted.length).toBe(result.totalGroups);
		});

		it("should getPostsByGroup in <5ms", () => {
			const posts = createMockPostsWithDuplicates(1000, 0.3);
			const result = service.groupPosts(posts);
			const groups = service.getGroupsSorted(result);

			if (groups.length === 0) {
				console.log("No groups to test");
				return;
			}

			const start = performance.now();
			const groupPosts = service.getPostsByGroup(groups[0].id, posts, result);
			const duration = performance.now() - start;

			console.log(
				`Get posts for group: ${duration.toFixed(2)}ms (${groupPosts.length} posts)`,
			);
			expect(duration).toBeLessThan(5);
		});
	});
});
