import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/types";
import { filterPosts } from "./filterPosts";
import type { FilterSettings } from "./types";

/**
 * Performance tests for filterPosts
 * Target: <500ms for 5000 posts (SC-001)
 */

function createMockPost(id: number): Post {
	return {
		id: `post-${id}`,
		groupId: `group-${id % 10}`,
		authorName: `Author ${id}`,
		contentHtml: `<p>This is post ${id} about apartments for rent in TLV. Looking for 2BR. Contact me!</p>`,
		timestamp: undefined,
		scrapedAt: Date.now() - id * 1000,
		seen: id % 3 === 0,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: id % 5 === 0,
	};
}

function createMockPosts(count: number): Post[] {
	return Array.from({ length: count }, (_, i) => createMockPost(i));
}

describe("filterPosts performance", () => {
	describe("SC-001: Filter updates <500ms with 5000 posts", () => {
		const posts5000 = createMockPosts(5000);

		it("should filter 5000 posts with positive keywords in <500ms", () => {
			const filters: FilterSettings = {
				positiveKeywords: ["apartment", "rent"],
				negativeKeywords: [],
				caseSensitive: false,
				searchFields: ["contentHtml", "authorName"],
			};

			const start = performance.now();
			const result = filterPosts(posts5000, filters);
			const duration = performance.now() - start;

			console.log(
				`Filter 5000 posts (positive keywords): ${duration.toFixed(2)}ms`,
			);
			expect(duration).toBeLessThan(500);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should filter 5000 posts with negative keywords in <500ms", () => {
			const filters: FilterSettings = {
				positiveKeywords: [],
				negativeKeywords: ["sold", "rented"],
				caseSensitive: false,
				searchFields: ["contentHtml", "authorName"],
			};

			const start = performance.now();
			const result = filterPosts(posts5000, filters);
			const duration = performance.now() - start;

			console.log(
				`Filter 5000 posts (negative keywords): ${duration.toFixed(2)}ms`,
			);
			expect(duration).toBeLessThan(500);
			expect(result.length).toBe(5000); // None match "sold" or "rented"
		});

		it("should filter 5000 posts with both positive and negative keywords in <500ms", () => {
			const filters: FilterSettings = {
				positiveKeywords: ["apartment", "2BR"],
				negativeKeywords: ["sold", "rented"],
				caseSensitive: false,
				searchFields: ["contentHtml", "authorName"],
			};

			const start = performance.now();
			const result = filterPosts(posts5000, filters);
			const duration = performance.now() - start;

			console.log(
				`Filter 5000 posts (both keywords): ${duration.toFixed(2)}ms`,
			);
			expect(duration).toBeLessThan(500);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should filter 5000 posts with empty filters (show all) in <500ms", () => {
			const filters: FilterSettings = {
				positiveKeywords: [],
				negativeKeywords: [],
				caseSensitive: false,
				searchFields: ["contentHtml", "authorName"],
			};

			const start = performance.now();
			const result = filterPosts(posts5000, filters);
			const duration = performance.now() - start;

			console.log(`Filter 5000 posts (no filters): ${duration.toFixed(2)}ms`);
			expect(duration).toBeLessThan(500);
			expect(result.length).toBe(5000);
		});
	});

	describe("scaling performance", () => {
		it("should scale linearly with post count", () => {
			const filters: FilterSettings = {
				positiveKeywords: ["apartment"],
				negativeKeywords: ["sold"],
				caseSensitive: false,
				searchFields: ["contentHtml", "authorName"],
			};

			const sizes = [1000, 2000, 5000, 10000];
			const results: { size: number; duration: number }[] = [];

			for (const size of sizes) {
				const posts = createMockPosts(size);
				const start = performance.now();
				filterPosts(posts, filters);
				const duration = performance.now() - start;
				results.push({ size, duration });
			}

			console.log("\nScaling results:");
			for (const r of results) {
				console.log(
					`  ${r.size} posts: ${r.duration.toFixed(2)}ms (${((r.duration / r.size) * 1000).toFixed(3)}ms per 1000 posts)`,
				);
			}

			// Verify linear scaling (10k should be ~2x 5k, not 4x)
			const ratio10kTo5k = results[3].duration / results[2].duration;
			expect(ratio10kTo5k).toBeLessThan(3); // Should be close to 2x

			// Verify 10k still under 1 second
			expect(results[3].duration).toBeLessThan(1000);
		});
	});
});
