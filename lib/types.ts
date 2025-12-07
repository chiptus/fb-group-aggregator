import { z } from "zod";

// Zod schemas for runtime validation
export const SubscriptionSchema = z.object({
	id: z.string(),
	name: z.string(),
	createdAt: z.number(),
});

export const GroupSchema = z.object({
	id: z.string(),
	url: z.string(),
	name: z.string(),
	subscriptionIds: z.array(z.string()),
	addedAt: z.number(),
	lastScrapedAt: z.number().nullable(),
	enabled: z.boolean(),
});

export const PostSchema = z.object({
	id: z.string(),
	groupId: z.string(),
	authorName: z.string(),
	contentHtml: z.string(),
	timestamp: z.number(),
	scrapedAt: z.number(),
	seen: z.boolean(),
	url: z.string(),
});

// TypeScript types inferred from Zod schemas
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Post = z.infer<typeof PostSchema>;

// Extension messaging types
export type ExtensionMessage =
	| { type: "SCRAPE_POSTS"; posts: Omit<Post, "scrapedAt" | "seen">[] }
	| { type: "GET_CURRENT_GROUP" }
	| {
			type: "ADD_GROUP_TO_SUBSCRIPTION";
			group: Omit<Group, "addedAt" | "lastScrapedAt">;
	  };
