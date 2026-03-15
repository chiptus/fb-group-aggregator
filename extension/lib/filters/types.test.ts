import { describe, expect, it } from "vitest";
import { FilterSettingsSchema } from "./types";

describe("FilterSettings Zod Schema", () => {
	it("should validate correct FilterSettings", () => {
		const validSettings = {
			positiveKeywords: ["apartment", "2br"],
			negativeKeywords: ["sold"],
			caseSensitive: false,
			searchFields: ["contentHtml", "authorName"] as const,
		};

		const result = FilterSettingsSchema.safeParse(validSettings);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validSettings);
		}
	});

	it("should use default values for missing fields", () => {
		const minimalSettings = {};

		const result = FilterSettingsSchema.safeParse(minimalSettings);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.positiveKeywords).toEqual([]);
			expect(result.data.negativeKeywords).toEqual([]);
			expect(result.data.caseSensitive).toBe(false);
			expect(result.data.searchFields).toEqual(["contentHtml", "authorName"]);
		}
	});

	it("should reject keywords exceeding max length", () => {
		const invalidSettings = {
			positiveKeywords: ["a".repeat(101)], // Exceeds 100 char limit
		};

		const result = FilterSettingsSchema.safeParse(invalidSettings);
		expect(result.success).toBe(false);
	});

	it("should reject keywords below min length", () => {
		const invalidSettings = {
			positiveKeywords: [""], // Below 1 char minimum
		};

		const result = FilterSettingsSchema.safeParse(invalidSettings);
		expect(result.success).toBe(false);
	});

	it("should reject invalid searchFields values", () => {
		const invalidSettings = {
			searchFields: ["invalidField"],
		};

		const result = FilterSettingsSchema.safeParse(invalidSettings);
		expect(result.success).toBe(false);
	});

	it("should accept valid searchFields combinations", () => {
		const testCases = [
			{
				searchFields: ["contentHtml"] as const,
			},
			{ searchFields: ["authorName"] as const },
			{ searchFields: ["contentHtml", "authorName"] as const },
		];

		for (const testCase of testCases) {
			const result = FilterSettingsSchema.safeParse(testCase);
			expect(result.success).toBe(true);
		}
	});
});
