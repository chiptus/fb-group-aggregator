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
	id: z.string().refine(
		(val) => {
			try {
				BigInt(val);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Post ID must be a valid BigInt string" },
	),
	groupId: z.string(),
	authorName: z.string(),
	contentHtml: z.string(),
	timestamp: z.number().optional(),
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
	| { type: "OPEN_GROUPS_SCANNER" }
	| {
			type: "START_SCROLL_AND_SCRAPE";
			payload: {
				scrollCount: number;
				scrollInterval: number;
				scrapeWaitTime: number;
			};
	  }
	| {
			type: "SCROLL_AND_SCRAPE_PROGRESS";
			payload: {
				scrollNumber: number;
				totalScrolls: number;
				postsFoundThisScrape: number;
			};
	  }
	| {
			type: "SCROLL_AND_SCRAPE_COMPLETE";
			payload: {
				totalPostsScraped: number;
				scrollsCompleted: number;
				success: boolean;
			};
	  }
	| { type: "TRIGGER_SCRAPE" }
	| { type: "START_JOB" }
	| {
			type: "CANCEL_JOB";
			payload: { jobId: string };
	  }
	| {
			type: "RESUME_JOB";
			payload: { jobId: string };
	  }
	| {
			type: "GET_JOB";
			payload: { jobId: string };
	  }
	| {
			type: "DELETE_JOB";
			payload: { jobId: string };
	  };

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

export type StartJobResponse = {
	success: boolean;
	jobId?: string;
	error?: string;
};

export type JobActionResponse = {
	success: boolean;
	error?: string;
};

export type GetJobResponse = {
	success: boolean;
	job?: ScrapeJob;
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
	jobId: z.string().optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// Job types
export type JobStatus =
	| "pending"
	| "running"
	| "paused"
	| "completed"
	| "failed"
	| "cancelled";

export type JobGroupResult = {
	groupId: string;
	groupName: string;
	status: "pending" | "success" | "failed" | "skipped";
	postsScraped?: number;
	error?: string;
	startedAt?: number;
	completedAt?: number;
};

export const ScrapeJobSchema = z.object({
	id: z.string(),
	type: z.literal("scrape_all_groups"),
	status: z.enum([
		"pending",
		"running",
		"paused",
		"completed",
		"failed",
		"cancelled",
	]),
	createdAt: z.number(),
	startedAt: z.number().nullable(),
	completedAt: z.number().nullable(),
	totalGroups: z.number(),
	currentGroupIndex: z.number(),
	groupResults: z.array(
		z.object({
			groupId: z.string(),
			groupName: z.string(),
			status: z.enum(["pending", "success", "failed", "skipped"]),
			postsScraped: z.number().optional(),
			error: z.string().optional(),
			startedAt: z.number().optional(),
			completedAt: z.number().optional(),
		}),
	),
	successCount: z.number(),
	failedCount: z.number(),
	error: z.string().optional(),
});

export type ScrapeJob = z.infer<typeof ScrapeJobSchema>;
