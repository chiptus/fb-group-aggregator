import type { Post } from "./types";

/**
 * Scrapes posts from a Facebook group page
 * @param groupId - The Facebook group ID
 * @returns Array of scraped posts (without scrapedAt and seen fields)
 */
export function scrapeGroupPosts(
	groupId: string,
): Omit<Post, "scrapedAt" | "seen">[] {
	const posts: Omit<Post, "scrapedAt" | "seen">[] = [];

	// Find the group feed container
	const feedContainer = document.querySelector('[data-pagelet="GroupFeed"]');
	if (!feedContainer) {
		return posts;
	}

	// Find all post articles
	const postElements = feedContainer.querySelectorAll('[role="article"]');

	postElements.forEach((postElement) => {
		try {
			const post = extractPostData(postElement as HTMLElement, groupId);
			if (post) {
				posts.push(post);
			}
		} catch (error) {
			console.error("Error extracting post:", error);
			// Continue to next post
		}
	});

	return posts;
}

/**
 * Extracts post data from a single post element
 */
function extractPostData(
	element: HTMLElement,
	groupId: string,
): Omit<Post, "scrapedAt" | "seen"> | null {
	// Extract post ID from data-ft attribute
	const postId = extractPostId(element);
	if (!postId) {
		return null; // Skip posts without ID
	}

	// Extract author name
	const authorName = extractAuthorName(element);

	// Extract content HTML
	const contentHtml = extractContentHtml(element);

	// Extract timestamp
	const timestamp = extractTimestamp(element);

	// Construct post URL
	const url = constructPostUrl(groupId, postId);

	return {
		id: postId,
		groupId,
		authorName,
		contentHtml,
		timestamp,
		url,
	};
}

/**
 * Extracts post ID from various sources
 * Modern Facebook may not use data-ft, so we try multiple strategies
 */
function extractPostId(element: HTMLElement): string | null {
	// Strategy 1: data-ft attribute (legacy)
	const dataFt = element.getAttribute("data-ft");
	if (dataFt) {
		try {
			const ftData = JSON.parse(dataFt);
			if (ftData.mf_story_key) {
				return ftData.mf_story_key;
			}
		} catch {
			// Continue to next strategy
		}
	}

	// Strategy 2: Extract from permalink URL
	const permalinkLink = element.querySelector('a[href*="/posts/"]');
	if (permalinkLink) {
		const href = permalinkLink.getAttribute("href") || "";
		const match = href.match(/\/posts\/(\d+)/);
		if (match?.[1]) {
			return match[1];
		}
	}

	// Strategy 3: Look for aria-label with post/comment identifier
	const ariaLabel = element.getAttribute("aria-label") || "";
	// Skip comments - we only want main posts
	if (ariaLabel.toLowerCase().includes("comment")) {
		return null;
	}

	// Strategy 4: Generate ID from timestamp link if this is a post
	const timestampLink = element.querySelector(
		'a[href*="/groups/"][href*="/posts/"]',
	);
	if (timestampLink) {
		const href = timestampLink.getAttribute("href") || "";
		const match = href.match(/\/posts\/(\d+)/);
		if (match?.[1]) {
			return match[1];
		}
	}

	// No ID found
	return null;
}

/**
 * Extracts author name from post element
 */
function extractAuthorName(element: HTMLElement): string {
	// Strategy 1: Find user link (most reliable)
	const authorLink = element.querySelector('a[href*="/user/"]');
	if (authorLink?.textContent?.trim()) {
		return authorLink.textContent.trim();
	}

	// Strategy 2: Check aria-label for author name
	const ariaLabel = element.getAttribute("aria-label") || "";
	// Match patterns like "Post by John Doe" or "Comment by John Doe"
	const byMatch = ariaLabel.match(/(?:Post|Comment) by ([^,]+)/i);
	if (byMatch?.[1]) {
		return byMatch[1].trim();
	}

	// Strategy 3: Find first non-permalink link with text
	const links = element.querySelectorAll("a");
	for (const link of Array.from(links)) {
		const href = link.getAttribute("href") || "";
		const text = link.textContent?.trim() || "";
		// Skip empty links, timestamp links (like "4d"), and permalink links
		if (
			text &&
			text.length > 1 &&
			!/^\d+[smhdw]$/.test(text) && // Skip "4d", "2h", etc.
			!href.includes("/posts/") &&
			!href.includes("Permalink") &&
			text !== "Permalink"
		) {
			return text;
		}
	}

	return "Unknown";
}

/**
 * Extracts content HTML from post element
 */
function extractContentHtml(element: HTMLElement): string {
	// Look for the message container
	const messageContainer = element.querySelector('[data-ad-preview="message"]');
	if (!messageContainer) {
		return "";
	}

	// Get the inner content (usually in a div with dir="auto")
	const contentElement = messageContainer.querySelector('[dir="auto"]');
	if (!contentElement) {
		return messageContainer.innerHTML.trim();
	}

	return contentElement.innerHTML.trim();
}

/**
 * Extracts timestamp from post element
 */
function extractTimestamp(element: HTMLElement): number {
	// Strategy 1: abbr element with data-utime attribute (most accurate)
	const timeElement = element.querySelector("abbr[data-utime]");
	if (timeElement) {
		const utime = timeElement.getAttribute("data-utime");
		if (utime) {
			// Facebook stores Unix timestamp in seconds, convert to milliseconds
			return parseInt(utime, 10) * 1000;
		}
	}

	// Strategy 2: Look for aria-label timestamp pattern
	const ariaLabel = element.getAttribute("aria-label") || "";
	// Match patterns like "4 days ago", "2 hours ago", etc.
	const timeMatch = ariaLabel.match(
		/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i,
	);
	if (timeMatch) {
		const value = parseInt(timeMatch[1], 10);
		const unit = timeMatch[2].toLowerCase();
		const now = Date.now();

		const unitMs: Record<string, number> = {
			second: 1000,
			minute: 60 * 1000,
			hour: 60 * 60 * 1000,
			day: 24 * 60 * 60 * 1000,
			week: 7 * 24 * 60 * 60 * 1000,
			month: 30 * 24 * 60 * 60 * 1000,
			year: 365 * 24 * 60 * 60 * 1000,
		};

		return now - value * (unitMs[unit] || 0);
	}

	// Strategy 3: Look for relative time in links (like "4d")
	const links = element.querySelectorAll("a");
	for (const link of Array.from(links)) {
		const text = link.textContent?.trim() || "";
		const relativeMatch = text.match(/^(\d+)([smhdw])$/);
		if (relativeMatch) {
			const value = parseInt(relativeMatch[1], 10);
			const unit = relativeMatch[2];
			const now = Date.now();

			const unitMs: Record<string, number> = {
				s: 1000,
				m: 60 * 1000,
				h: 60 * 60 * 1000,
				d: 24 * 60 * 60 * 1000,
				w: 7 * 24 * 60 * 60 * 1000,
			};

			return now - value * (unitMs[unit] || 0);
		}
	}

	// Fallback to current time if timestamp not found
	return Date.now();
}

/**
 * Constructs the full post URL
 */
function constructPostUrl(groupId: string, postId: string): string {
	return `https://www.facebook.com/groups/${groupId}/posts/${postId}/`;
}

/**
 * Extracts group information from the current page
 */
export function extractGroupInfo(): { name: string; url: string } {
	let name = "";
	let url = window.location.href;

	// Try to find group name from header
	const groupLink = document.querySelector(
		'h1 a, [role="main"] a[href*="/groups/"]',
	);
	if (groupLink) {
		name = groupLink.textContent?.trim() || "";
		const href = groupLink.getAttribute("href");
		if (href) {
			// Construct full URL if it's a relative path
			url = href.startsWith("http") ? href : `https://www.facebook.com${href}`;
		}
	}

	return { name, url };
}
