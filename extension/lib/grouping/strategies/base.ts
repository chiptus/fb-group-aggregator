import type { Post } from "@/lib/types";
import type { GroupingResult } from "../types";

/**
 * Grouping Strategy Interface
 *
 * Contract that all grouping algorithms must implement.
 * Allows swapping between exact match, fuzzy match, etc.
 */
export interface GroupingStrategy {
	/** Human-readable name of strategy (e.g., "exact-match", "fuzzy-match") */
	readonly name: string;

	/**
	 * Group posts by similarity
	 *
	 * @param posts - Array of posts to group
	 * @returns GroupingResult with groups, ungrouped posts, and stats
	 *
	 * @performance Must complete in <500ms for 10,000 posts
	 */
	group(posts: Post[]): GroupingResult;
}

/**
 * Text Normalizer Function Type
 *
 * Converts raw HTML content to normalized text for comparison.
 */
export type TextNormalizer = (html: string) => string;
