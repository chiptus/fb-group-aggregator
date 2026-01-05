import {
	bigint,
	boolean,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// User table
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	apiKey: varchar("api_key", { length: 64 }).unique().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	lastSyncAt: timestamp("last_sync_at"),
});

// Subscription table
export const subscriptions = pgTable("subscriptions", {
	id: varchar("id", { length: 36 }).primaryKey(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

// Group table
export const groups = pgTable("groups", {
	id: varchar("id", { length: 255 }).primaryKey(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	name: varchar("name", { length: 500 }).notNull(),
	url: text("url").notNull(),
	enabled: boolean("enabled").default(false).notNull(),
	addedAt: bigint("added_at", { mode: "number" }).notNull(),
	lastScrapedAt: bigint("last_scraped_at", { mode: "number" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

// GroupSubscription junction table
export const groupSubscriptions = pgTable(
	"group_subscriptions",
	{
		groupId: varchar("group_id", { length: 255 })
			.references(() => groups.id)
			.notNull(),
		subscriptionId: varchar("subscription_id", { length: 36 })
			.references(() => subscriptions.id)
			.notNull(),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.groupId, table.subscriptionId] }),
	}),
);

// Post table
export const posts = pgTable("posts", {
	id: varchar("id", { length: 255 }).primaryKey(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	groupId: varchar("group_id", { length: 255 })
		.references(() => groups.id)
		.notNull(),
	authorName: varchar("author_name", { length: 500 }).notNull(),
	contentHtml: text("content_html").notNull(),
	timestamp: bigint("timestamp", { mode: "number" }),
	scrapedAt: bigint("scraped_at", { mode: "number" }).notNull(),
	seen: boolean("seen").default(false).notNull(),
	starred: boolean("starred").default(false).notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

// SyncLog table
export const syncLogs = pgTable("sync_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	startedAt: timestamp("started_at").defaultNow().notNull(),
	completedAt: timestamp("completed_at"),
	status: varchar("status", { length: 20 }).notNull(),
	postsSynced: integer("posts_synced").default(0).notNull(),
	errorMessage: text("error_message"),
});
