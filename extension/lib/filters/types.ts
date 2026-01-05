import { z } from "zod";

export const FilterSettingsSchema = z.object({
	positiveKeywords: z.array(z.string().min(1).max(100)).default([]),
	negativeKeywords: z.array(z.string().min(1).max(100)).default([]),
	caseSensitive: z.boolean().default(false),
	searchFields: z
		.array(z.enum(["contentHtml", "authorName"]))
		.default(["contentHtml", "authorName"]),
});

export type FilterSettings = z.infer<typeof FilterSettingsSchema>;
