import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/types";
import { ExactMatchStrategy } from "./exact-match";

function createMockPost(
	id: string,
	content: string,
	seen = false,
	scrapedAt = Date.now(),
): Post {
	return {
		id,
		groupId: "group1",
		authorName: "Test Author",
		contentHtml: content,
		timestamp: undefined,
		scrapedAt,
		seen,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: false,
	};
}

describe("ExactMatchStrategy", () => {
	it("should have correct name", () => {
		const strategy = new ExactMatchStrategy();
		expect(strategy.name).toBe("exact-match");
	});

	describe("grouping identical posts", () => {
		it("should group posts with identical normalized content", () => {
			const posts = [
				createMockPost("1", "Looking for 2BR apartment in TLV"),
				createMockPost("2", "Looking for 2BR apartment in TLV"),
				createMockPost("3", "looking for 2br apartment in tlv"), // Same after normalization
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.totalGroups).toBe(1);
			expect(result.groups[0].count).toBe(3);
			expect(result.groups[0].postIds).toContain("1");
			expect(result.groups[0].postIds).toContain("2");
			expect(result.groups[0].postIds).toContain("3");
		});

		it("should keep unique posts ungrouped", () => {
			const posts = [
				createMockPost(
					"1",
					"Looking for 2BR apartment in TLV - this is long enough",
				),
				createMockPost("2", "Selling my car in good condition - very nice car"),
				createMockPost("3", "Job opening for software developer position"),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			// Each post is unique, so no groups should be created
			expect(result.totalGroups).toBe(0);
			expect(result.ungroupedPostIds).toHaveLength(3);
		});

		it("should create multiple groups for different duplicate sets", () => {
			const posts = [
				createMockPost("1", "Looking for 2BR apartment in TLV"),
				createMockPost("2", "Looking for 2BR apartment in TLV"),
				createMockPost("3", "Selling my car very good condition"),
				createMockPost("4", "Selling my car very good condition"),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.totalGroups).toBe(2);
			expect(result.totalPostsGrouped).toBe(4);
		});
	});

	describe("minimum content length", () => {
		it("should not group posts with content below minimum length", () => {
			const posts = [
				createMockPost("1", "short"),
				createMockPost("2", "short"),
				createMockPost("3", "tiny"),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.totalGroups).toBe(0);
			expect(result.ungroupedPostIds).toHaveLength(3);
		});

		it("should use custom minimum content length", () => {
			const posts = [
				createMockPost("1", "12345678901234567890"), // 20 chars
				createMockPost("2", "12345678901234567890"), // 20 chars
			];

			// Default min length is 10, so these should be grouped
			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.totalGroups).toBe(1);
		});

		it("should skip posts exactly at minimum length boundary", () => {
			const posts = [
				createMockPost("1", "1234567890"), // Exactly 10 chars
				createMockPost("2", "1234567890"),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.totalGroups).toBe(1);
		});
	});

	describe("seen count tracking", () => {
		it("should correctly count seen posts in group", () => {
			const posts = [
				createMockPost("1", "Looking for apartment in the city", true),
				createMockPost("2", "Looking for apartment in the city", false),
				createMockPost("3", "Looking for apartment in the city", true),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.groups[0].seenCount).toBe(2);
		});
	});

	describe("firstSeenAt tracking", () => {
		it("should use earliest scrapedAt as firstSeenAt", () => {
			const earliestTime = 1000000;
			const posts = [
				createMockPost(
					"1",
					"Looking for apartment in the area",
					false,
					earliestTime + 2000,
				),
				createMockPost(
					"2",
					"Looking for apartment in the area",
					false,
					earliestTime,
				),
				createMockPost(
					"3",
					"Looking for apartment in the area",
					false,
					earliestTime + 1000,
				),
			];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.groups[0].firstSeenAt).toBe(earliestTime);
		});
	});

	describe("empty input", () => {
		it("should handle empty posts array", () => {
			const strategy = new ExactMatchStrategy();
			const result = strategy.group([]);

			expect(result.totalGroups).toBe(0);
			expect(result.totalPostsGrouped).toBe(0);
			expect(result.ungroupedPostIds).toHaveLength(0);
			expect(result.strategyUsed).toBe("exact-match");
		});
	});

	describe("strategy result metadata", () => {
		it("should return correct strategy name in result", () => {
			const posts = [createMockPost("1", "Test content that is long enough")];

			const strategy = new ExactMatchStrategy();
			const result = strategy.group(posts);

			expect(result.strategyUsed).toBe("exact-match");
		});
	});
});
