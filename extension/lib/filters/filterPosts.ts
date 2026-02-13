import type { Post } from "@/lib/types";
import type { FilterSettings } from "./types";

export function filterPosts(posts: Post[], settings: FilterSettings): Post[] {
	const { positiveKeywords, negativeKeywords, caseSensitive, searchFields } =
		settings;

	// If no positive keywords, show all posts (unless negative keywords filter them out)
	if (positiveKeywords.length === 0 && negativeKeywords.length === 0) {
		return posts;
	}

	return posts.filter((post) => {
		// Extract search text from specified fields
		const searchTexts: string[] = searchFields.map((field) => {
			if (field === "contentHtml") {
				return post.contentHtml;
			}
			if (field === "authorName") {
				return post.authorName;
			}
			return "";
		});

		const combinedText = searchTexts.join(" ");
		const textToSearch = caseSensitive
			? combinedText
			: combinedText.toLowerCase();

		// Check negative keywords first (negative precedence)
		if (negativeKeywords.length > 0) {
			const hasNegativeMatch = negativeKeywords.some((keyword) => {
				const keywordToMatch = caseSensitive ? keyword : keyword.toLowerCase();
				return textToSearch.includes(keywordToMatch);
			});

			if (hasNegativeMatch) {
				return false; // Exclude this post
			}
		}

		// If no positive keywords, include the post (it passed negative filter)
		if (positiveKeywords.length === 0) {
			return true;
		}

		// Check positive keywords (ANY match)
		const hasPositiveMatch = positiveKeywords.some((keyword) => {
			const keywordToMatch = caseSensitive ? keyword : keyword.toLowerCase();
			return textToSearch.includes(keywordToMatch);
		});

		return hasPositiveMatch;
	});
}
