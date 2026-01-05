import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/types";
import { filterPosts } from "./filterPosts";
import type { FilterSettings } from "./types";

const mockPosts: Post[] = [
	{
		id: "1",
		groupId: "g1",
		authorName: "John Doe",
		contentHtml: "<p>Looking for 2BR apartment in TLV</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		starred: false,
		url: "https://facebook.com/post/1",
	},
	{
		id: "2",
		groupId: "g1",
		authorName: "Jane Smith",
		contentHtml: "<p>Apartment for rent - already sold</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		starred: false,
		url: "https://facebook.com/post/2",
	},
	{
		id: "3",
		groupId: "g2",
		authorName: "Bob Johnson",
		contentHtml: "<p>House for sale in suburbs</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: true,
		starred: false,
		url: "https://facebook.com/post/3",
	},
	{
		id: "4",
		groupId: "g2",
		authorName: "Alice Williams",
		contentHtml: "<p>APARTMENT listing - great location!</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		starred: false,
		url: "https://facebook.com/post/4",
	},
];

describe("filterPosts - Positive Keywords", () => {
	it("should filter posts by single positive keyword in contentHtml", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["apartment"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(3); // Posts 1, 2, 4 contain "apartment"
		expect(result.map((p: Post) => p.id)).toEqual(
			expect.arrayContaining(["1", "2", "4"]),
		);
	});

	it("should filter posts by multiple positive keywords (ANY match)", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["apartment", "house"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(4); // All posts contain "apartment" or "house"
	});

	it("should search in author name when specified in searchFields", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["john"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["authorName"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(2); // Posts 1 (John Doe) and 3 (Bob Johnson)
		expect(result.map((p: Post) => p.id)).toEqual(
			expect.arrayContaining(["1", "3"]),
		);
	});

	it("should search in both contentHtml and authorName", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["alice"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml", "authorName"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(1); // Post 4 (Alice Williams)
		expect(result[0].id).toBe("4");
	});
});

describe("filterPosts - Negative Keywords", () => {
	it("should exclude posts with negative keywords", () => {
		const settings: FilterSettings = {
			positiveKeywords: [],
			negativeKeywords: ["sold"],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(3); // All except post 2 (contains "sold")
		expect(result.map((p: Post) => p.id)).not.toContain("2");
	});

	it("should exclude posts matching ANY negative keyword", () => {
		const settings: FilterSettings = {
			positiveKeywords: [],
			negativeKeywords: ["sold", "house"],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(2); // Posts 1 and 4 (no "sold" or "house")
		expect(result.map((p: Post) => p.id)).toEqual(
			expect.arrayContaining(["1", "4"]),
		);
	});
});

describe("filterPosts - Both Positive and Negative Keywords (Negative Precedence)", () => {
	it("should hide posts matching negative keywords even if they match positive keywords", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["apartment"],
			negativeKeywords: ["sold"],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		// Posts 1 and 4 have "apartment" but not "sold"
		// Post 2 has both "apartment" and "sold" - should be excluded (negative precedence)
		expect(result).toHaveLength(2);
		expect(result.map((p: Post) => p.id)).toEqual(
			expect.arrayContaining(["1", "4"]),
		);
		expect(result.map((p: Post) => p.id)).not.toContain("2");
	});

	it("should apply negative precedence rule correctly", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["rent", "sale"],
			negativeKeywords: ["sold"],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		// Post 2: has "rent" (positive) and "sold" (negative) - excluded
		// Post 3: has "sale" (positive) but no "sold" - included
		expect(result.map((p: Post) => p.id)).toContain("3");
		expect(result.map((p: Post) => p.id)).not.toContain("2");
	});
});

describe("filterPosts - Case Sensitivity", () => {
	it("should perform case-insensitive matching by default", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["APARTMENT"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(3); // Should match "apartment", "Apartment", etc.
	});

	it("should perform case-sensitive matching when enabled", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["APARTMENT"],
			negativeKeywords: [],
			caseSensitive: true,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(1); // Only post 4 has "APARTMENT" in uppercase
		expect(result[0].id).toBe("4");
	});
});

describe("filterPosts - Empty Filters (Show All Posts)", () => {
	it("should return all posts when no positive keywords", () => {
		const settings: FilterSettings = {
			positiveKeywords: [],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toHaveLength(mockPosts.length);
		expect(result).toEqual(mockPosts);
	});

	it("should return all posts when both keyword arrays are empty", () => {
		const settings: FilterSettings = {
			positiveKeywords: [],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml", "authorName"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toBe(mockPosts); // Should return original array without filtering
	});
});

describe("filterPosts - Edge Cases", () => {
	it("should handle empty posts array", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["apartment"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts([], settings);

		expect(result).toEqual([]);
	});

	it("should handle special characters and emojis in keywords", () => {
		const postsWithEmojis: Post[] = [
			{
				id: "5",
				groupId: "g3",
				authorName: "Test User",
				contentHtml: "<p>Great place! 🏠 Available now</p>",
				timestamp: undefined,
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/post/5",
			},
		];

		const settings: FilterSettings = {
			positiveKeywords: ["🏠"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(postsWithEmojis, settings);

		expect(result).toHaveLength(1);
	});

	it("should return empty array when no posts match filters", () => {
		const settings: FilterSettings = {
			positiveKeywords: ["nonexistent"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		const result = filterPosts(mockPosts, settings);

		expect(result).toEqual([]);
	});
});
