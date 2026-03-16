import { describe, expect, it } from "vitest";
import {
	type GroupingResult,
	GroupingResultSchema,
	type PostGroup,
	PostGroupSchema,
} from "./types";

describe("PostGroup Schema", () => {
	it("should validate a valid PostGroup", () => {
		const validGroup: PostGroup = {
			id: "grp_abc123",
			normalizedContent: "looking for 2br apartment in tlv",
			postIds: ["post1", "post2", "post3"],
			firstSeenAt: 1704067200000,
			count: 3,
			seenCount: 1,
			isExpanded: false,
		};

		const result = PostGroupSchema.safeParse(validGroup);
		expect(result.success).toBe(true);
	});

	it("should reject PostGroup with empty normalizedContent", () => {
		const invalidGroup = {
			id: "grp_abc123",
			normalizedContent: "",
			postIds: ["post1"],
			firstSeenAt: 1704067200000,
			count: 1,
			seenCount: 0,
			isExpanded: false,
		};

		const result = PostGroupSchema.safeParse(invalidGroup);
		expect(result.success).toBe(false);
	});

	it("should reject PostGroup with content less than 10 chars", () => {
		const invalidGroup = {
			id: "grp_abc123",
			normalizedContent: "short",
			postIds: ["post1"],
			firstSeenAt: 1704067200000,
			count: 1,
			seenCount: 0,
			isExpanded: false,
		};

		const result = PostGroupSchema.safeParse(invalidGroup);
		expect(result.success).toBe(false);
	});

	it("should reject PostGroup with empty postIds array", () => {
		const invalidGroup = {
			id: "grp_abc123",
			normalizedContent: "looking for apartment",
			postIds: [],
			firstSeenAt: 1704067200000,
			count: 0,
			seenCount: 0,
			isExpanded: false,
		};

		const result = PostGroupSchema.safeParse(invalidGroup);
		expect(result.success).toBe(false);
	});

	it("should default isExpanded to false", () => {
		const groupWithoutExpanded = {
			id: "grp_abc123",
			normalizedContent: "looking for 2br apartment",
			postIds: ["post1"],
			firstSeenAt: 1704067200000,
			count: 1,
			seenCount: 0,
		};

		const result = PostGroupSchema.safeParse(groupWithoutExpanded);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isExpanded).toBe(false);
		}
	});
});

describe("GroupingResult Schema", () => {
	it("should validate a valid GroupingResult", () => {
		const validResult: GroupingResult = {
			groups: [
				{
					id: "grp_abc123",
					normalizedContent: "looking for apartment",
					postIds: ["post1", "post2"],
					firstSeenAt: 1704067200000,
					count: 2,
					seenCount: 0,
					isExpanded: false,
				},
			],
			ungroupedPostIds: ["post3", "post4"],
			totalGroups: 1,
			totalPostsGrouped: 2,
			strategyUsed: "exact-match",
		};

		const result = GroupingResultSchema.safeParse(validResult);
		expect(result.success).toBe(true);
	});

	it("should allow empty groups array", () => {
		const emptyResult: GroupingResult = {
			groups: [],
			ungroupedPostIds: ["post1", "post2"],
			totalGroups: 0,
			totalPostsGrouped: 0,
			strategyUsed: "exact-match",
		};

		const result = GroupingResultSchema.safeParse(emptyResult);
		expect(result.success).toBe(true);
	});

	it("should require strategyUsed field", () => {
		const missingStrategy = {
			groups: [],
			ungroupedPostIds: [],
			totalGroups: 0,
			totalPostsGrouped: 0,
		};

		const result = GroupingResultSchema.safeParse(missingStrategy);
		expect(result.success).toBe(false);
	});
});
