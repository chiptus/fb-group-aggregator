export interface Subscription {
  id: string;
  name: string;
  createdAt: number;
}

export interface Group {
  id: string;
  url: string;
  name: string;
  subscriptionIds: string[];
  addedAt: number;
  lastScrapedAt: number | null;
  enabled: boolean;
}

export interface Post {
  id: string;
  groupId: string;
  authorName: string;
  contentHtml: string;
  timestamp: number;
  scrapedAt: number;
  seen: boolean;
  url: string;
}

// Extension messaging types
export type ExtensionMessage =
  | { type: "SCRAPE_POSTS"; posts: Omit<Post, "scrapedAt" | "seen">[] }
  | { type: "GET_CURRENT_GROUP" }
  | {
      type: "ADD_GROUP_TO_SUBSCRIPTION";
      group: Omit<Group, "addedAt" | "lastScrapedAt">;
    };
