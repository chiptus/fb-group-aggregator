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

// Group discovery type (for groups list scanning)
export type GroupDiscovery = {
	id: string;
	name: string;
	url: string;
};

// Extension messaging types
export type ExtensionMessage =
	| {
			type: "SCRAPE_POSTS";
			payload: {
				groupId: string;
				groupInfo: { name: string; url: string };
				posts: Omit<Post, "scrapedAt" | "seen">[];
			};
	  }
	| { type: "GET_CURRENT_GROUP" }
	| {
			type: "ADD_GROUP_TO_SUBSCRIPTION";
			group: Omit<Group, "addedAt" | "lastScrapedAt">;
	  }
	| {
			type: "SCRAPE_GROUPS_LIST";
			payload: {
				groups: GroupDiscovery[];
				totalCount: number;
			};
	  }
	| {
			type: "SCRAPE_SUBSCRIPTION";
			payload: { subscriptionId: string };
	  }
	| { type: "OPEN_GROUPS_SCANNER" };

// Response types
export type ScrapePostsResponse = {
	success: boolean;
	count?: number;
	error?: string;
};

export type ScrapeGroupsListResponse = {
	success: boolean;
	newGroupsCount?: number;
	updatedGroupsCount?: number;
	error?: string;
};

export type ScrapeSubscriptionResponse = {
	success: boolean;
	progress?: {
		current: number;
		total: number;
		currentGroup?: string;
	};
	error?: string;
};

// Logging types
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogSource = "background" | "content" | "popup" | "dashboard";

export const LogEntrySchema = z.object({
	id: z.string(),
	timestamp: z.number(),
	level: z.enum(["debug", "info", "warn", "error"]),
	source: z.enum(["background", "content", "popup", "dashboard"]),
	message: z.string(),
	context: z.record(z.string(), z.unknown()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;
