import type { Post } from "@/lib/types";
import { hashContent, normalizeContent } from "../normalizer";
import type { GroupingResult, PostGroup } from "../types";
import type { GroupingStrategy, TextNormalizer } from "./base";

export interface ExactMatchOptions {
	/** Text normalizer function (default: normalizeContent) */
	normalizer?: TextNormalizer;

	/** Minimum content length to include in grouping (default: 10) */
	minContentLength?: number;
}

/**
 * Groups posts by exact normalized text match.
 *
 * Uses Map for O(n) time complexity with O(1) lookups.
 */
export class ExactMatchStrategy implements GroupingStrategy {
	readonly name = "exact-match";

	private normalizer: TextNormalizer;
	private minContentLength: number;

	constructor(options: ExactMatchOptions = {}) {
		this.normalizer = options.normalizer ?? normalizeContent;
		this.minContentLength = options.minContentLength ?? 10;
	}

	group(posts: Post[]): GroupingResult {
		// Map from normalized content to group data
		const contentToGroup = new Map<
			string,
			{
				postIds: string[];
				seenCount: number;
				firstSeenAt: number;
			}
		>();

		const ungroupedPostIds: string[] = [];

		// First pass: group posts by normalized content
		for (const post of posts) {
			const normalized = this.normalizer(post.contentHtml);

			// Skip posts below minimum content length
			if (normalized.length < this.minContentLength) {
				ungroupedPostIds.push(post.id);
				continue;
			}

			const existing = contentToGroup.get(normalized);

			if (existing) {
				existing.postIds.push(post.id);
				existing.seenCount += post.seen ? 1 : 0;
				existing.firstSeenAt = Math.min(existing.firstSeenAt, post.scrapedAt);
			} else {
				contentToGroup.set(normalized, {
					postIds: [post.id],
					seenCount: post.seen ? 1 : 0,
					firstSeenAt: post.scrapedAt,
				});
			}
		}

		// Second pass: convert to PostGroup array, moving singles to ungrouped
		const groups: PostGroup[] = [];
		let totalPostsGrouped = 0;

		for (const [normalizedContent, groupData] of contentToGroup) {
			if (groupData.postIds.length >= 2) {
				// This is a valid group (2+ posts)
				groups.push({
					id: hashContent(normalizedContent),
					normalizedContent,
					postIds: groupData.postIds,
					firstSeenAt: groupData.firstSeenAt,
					count: groupData.postIds.length,
					seenCount: groupData.seenCount,
					isExpanded: false,
				});
				totalPostsGrouped += groupData.postIds.length;
			} else {
				// Single post, add to ungrouped
				ungroupedPostIds.push(...groupData.postIds);
			}
		}

		return {
			groups,
			ungroupedPostIds,
			totalGroups: groups.length,
			totalPostsGrouped,
			strategyUsed: this.name,
		};
	}
}
