import type { Post } from "./types";

/**
 * Scrapes posts from a Facebook group page
 * @param groupId - The Facebook group ID
 * @returns Promise that resolves to array of scraped posts (without scrapedAt and seen fields)
 */
export async function scrapeGroupPosts(
	groupId: string,
): Promise<Omit<Post, "scrapedAt" | "seen">[]> {
	const posts: Omit<Post, "scrapedAt" | "seen">[] = [];

	// Find the group feed container
	const feedContainer = document.querySelector('[role="feed"]');
	if (!feedContainer) {
		console.warn(
			"[Scraper] Feed container not found - Facebook may not have loaded yet",
		);
		return posts;
	}

	console.log("[Scraper] Feed container found, searching for posts");

	// Try multiple strategies to find posts
	let postElements: Element[] = [];

	// Strategy 1: Articles within feed
	const articlesInFeed = feedContainer.querySelectorAll(
		".x1n2onr6.xh8yej3.x1ja2u2z.xod5an3",
	);
	postElements = Array.from(articlesInFeed);

	// DEBUG: Log what we're seeing in the feed
	const allArticles = document.querySelectorAll(
		".x1n2onr6.xh8yej3.x1ja2u2z.xod5an3",
	);
	console.log("[Scraper] DEBUG:", {
		totalArticlesOnPage: allArticles.length,
		articlesInFeed: articlesInFeed.length,
		feedContainerTag: feedContainer.tagName,
		feedContainerClasses: feedContainer.className,
	});

	if (postElements.length === 0) {
		// Strategy 2: Look for direct children that might be posts
		console.log("[Scraper] No articles in feed, trying direct children");
		const children = feedContainer.children;
		console.log(`[Scraper] Feed has ${children.length} direct children`);

		// Convert to array and filter for likely post containers
		postElements = Array.from(children).filter((child) => {
			// Posts typically have links with /posts/ in them
			const hasPostLink = child.querySelector('a[href*="/posts/"]');
			return hasPostLink !== null;
		});

		console.log(
			`[Scraper] Found ${postElements.length} children with post links`,
		);
	}

	console.log(`[Scraper] Found ${postElements.length} potential post elements`);

	for (let index = 0; index < postElements.length; index++) {
		try {
			// Skip hidden or virtualized placeholder elements
			const element = postElements[index] as HTMLElement;
			if (element.hasAttribute("hidden") || element.querySelector("[hidden]")) {
				console.log(
					`[Scraper] Skipped element ${index + 1} (hidden/placeholder)`,
				);
				continue;
			}

			// Skip elements with no links (likely empty placeholders)
			const linkCount = element.querySelectorAll("a[href]").length;
			if (linkCount === 0) {
				console.log(
					`[Scraper] Skipped element ${index + 1} (no links - likely placeholder)`,
				);
				continue;
			}

			// Expand "see more" links before extracting content
			await expandSeeMore(element);

			const post = extractPostData(element, groupId);
			if (post) {
				posts.push(post);
				console.log(
					`[Scraper] Successfully extracted post ${index + 1}: ${post.id}`,
				);
			} else {
				console.log(
					`[Scraper] Skipped element ${index + 1} (no post ID found)`,
					postElements[index],
				);
			}
		} catch (error) {
			console.error(`[Scraper] Error extracting post ${index + 1}:`, error);
			// Continue to next post
		}
	}

	console.log(`[Scraper] Total posts extracted: ${posts.length}`);

	return posts;
}

/**
 * Finds and clicks "see more" links to expand truncated content
 * @param element - The post element to search for "see more" links
 */
async function expandSeeMore(element: HTMLElement): Promise<void> {
	// Common text patterns for "see more" links on Facebook
	const seeMorePatterns = [
		"See more",
		"see more",
		"See More",
		"SEE MORE",
		"Show more",
		"show more",
	];

	// Strategy 1: Look for role="button" elements with "see more" text
	const buttons = element.querySelectorAll('[role="button"]');
	for (const button of Array.from(buttons)) {
		const text = button.textContent?.trim() || "";
		if (seeMorePatterns.some((pattern) => text.includes(pattern))) {
			console.log(`[Scraper] Found "see more" button with text: "${text}"`);
			(button as HTMLElement).click();
			// Wait for content to expand
			await new Promise((resolve) => setTimeout(resolve, 500));
			console.log("[Scraper] Clicked see more button and waited for expansion");
			return;
		}
	}

	// Strategy 2: Look for clickable divs/spans with "see more" text
	const clickableElements = element.querySelectorAll(
		'div[role="button"], span[role="button"], div[tabindex="0"], span[tabindex="0"]',
	);
	for (const el of Array.from(clickableElements)) {
		const text = el.textContent?.trim() || "";
		if (seeMorePatterns.some((pattern) => text.includes(pattern))) {
			console.log(
				`[Scraper] Found "see more" clickable element with text: "${text}"`,
			);
			(el as HTMLElement).click();
			// Wait for content to expand
			await new Promise((resolve) => setTimeout(resolve, 500));
			console.log(
				"[Scraper] Clicked see more element and waited for expansion",
			);
			return;
		}
	}

	// Strategy 3: Look for any element containing exactly "see more" (case insensitive)
	const allElements = element.querySelectorAll("*");
	for (const el of Array.from(allElements)) {
		const text = el.textContent?.trim() || "";
		// Check if element itself (not children) contains see more text
		if (
			text.length < 50 &&
			seeMorePatterns.some(
				(pattern) => text.toLowerCase() === pattern.toLowerCase(),
			)
		) {
			const htmlEl = el as HTMLElement;
			// Check if it's clickable (has cursor pointer or is interactive)
			const style = window.getComputedStyle(htmlEl);
			if (
				style.cursor === "pointer" ||
				htmlEl.onclick ||
				htmlEl.getAttribute("onclick")
			) {
				console.log(
					`[Scraper] Found "see more" element (strategy 3) with text: "${text}"`,
				);
				htmlEl.click();
				// Wait for content to expand
				await new Promise((resolve) => setTimeout(resolve, 500));
				console.log(
					"[Scraper] Clicked see more element (strategy 3) and waited for expansion",
				);
				return;
			}
		}
	}

	// No "see more" link found - content is already expanded or doesn't have one
	console.log("[Scraper] No see more link found, content already expanded");
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
		console.log("[Scraper] No post ID found, skipping element");
		return null; // Skip posts without ID
	}

	console.log(`[Scraper] Extracting data for post ${postId}`);

	// Extract author name
	const authorName = extractAuthorName(element);
	console.log(`[Scraper] Author: ${authorName}`);

	// Extract content HTML
	const contentHtml = extractContentHtml(element);
	console.log(`[Scraper] Content length: ${contentHtml.length} chars`);

	// Extract timestamp
	const timestamp = extractTimestamp(element);
	console.log(`[Scraper] Timestamp: ${new Date(timestamp).toISOString()}`);

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
	console.log("[Scraper] ===== Starting post ID extraction =====");

	// Strategy 1: data-ft attribute (legacy)
	const dataFt = element.getAttribute("data-ft");
	console.log("[Scraper] data-ft:", dataFt ? "present" : "absent");
	if (dataFt) {
		try {
			const ftData = JSON.parse(dataFt);
			if (ftData.mf_story_key) {
				console.log(
					"[Scraper] ✓ Found post ID via data-ft:",
					ftData.mf_story_key,
				);
				return ftData.mf_story_key;
			}
		} catch {
			// Continue to next strategy
		}
	}

	// Get all links once for multiple strategies
	const allLinks = element.querySelectorAll("a[href]");

	// Strategy 2: Extract from any permalink URL with /posts/
	const permalinkLinks = element.querySelectorAll('a[href*="/posts/"]');
	console.log("[Scraper] Links with /posts/:", permalinkLinks.length);
	if (permalinkLinks.length > 0) {
		for (const link of Array.from(permalinkLinks)) {
			const href = link.getAttribute("href") || "";
			console.log("[Scraper] Checking link:", href.substring(0, 100));
			const match = href.match(/\/posts\/(\d+)/);
			if (match?.[1]) {
				console.log("[Scraper] ✓ Found post ID via permalink URL:", match[1]);
				return match[1];
			}
		}
	}

	// Strategy 2b: Extract from photo/video URLs with pcb (photo collection batch) parameter
	// These contain the post ID in the pcb parameter
	console.log(
		"[Scraper] Checking for pcb parameter in",
		allLinks.length,
		"links",
	);
	for (const link of Array.from(allLinks)) {
		const href = link.getAttribute("href") || "";
		// Match pcb.XXXXXXXXX in photo URLs (set=pcb.ID) or video URLs (videos/pcb.ID/)
		const pcbMatch = href.match(/pcb\.(\d+)/);
		if (pcbMatch?.[1]) {
			console.log("[Scraper] ✓ Found post ID via pcb parameter:", pcbMatch[1]);
			return pcbMatch[1];
		}
	}

	// Strategy 3: Look for aria-label with post/comment identifier
	const ariaLabel = element.getAttribute("aria-label") || "";
	console.log("[Scraper] aria-label:", ariaLabel.substring(0, 100));
	// Skip comments - we only want main posts
	if (ariaLabel.toLowerCase().includes("comment")) {
		console.log("[Scraper] ✗ Skipping comment element");
		return null;
	}

	// Strategy 4: Look for permalink in nested elements
	console.log("[Scraper] Total links in element:", allLinks.length);

	// Sample first few links for debugging
	const sampleLinks = Array.from(allLinks).slice(0, 5);
	console.log(
		"[Scraper] Sample links:",
		sampleLinks.map((l) => (l.getAttribute("href") || "").substring(0, 80)),
	);

	for (const link of Array.from(allLinks)) {
		const href = link.getAttribute("href") || "";
		// Match various post URL patterns
		if (href.includes("/posts/") || href.includes("/permalink/")) {
			const postMatch = href.match(/\/posts\/(\d+)/);
			const permalinkMatch = href.match(/\/permalink\/(\d+)/);
			const storyMatch = href.match(/story_fbid=(\d+)/);

			const id = postMatch?.[1] || permalinkMatch?.[1] || storyMatch?.[1];
			if (id) {
				console.log("[Scraper] ✓ Found post ID via nested link:", id);
				return id;
			}
		}
	}

	// No ID found
	console.log("[Scraper] ✗ Could not extract post ID after all strategies");
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
	// Strategy 1: Look for the message container with data-ad-preview
	const messageContainer = element.querySelector('[data-ad-preview="message"]');
	if (messageContainer) {
		// Get the inner content (usually in a div with dir="auto")
		const contentElement = messageContainer.querySelector('[dir="auto"]');
		if (contentElement) {
			console.log("[Scraper] Found content via data-ad-preview + dir=auto");
			return contentElement.innerHTML.trim();
		}
		console.log("[Scraper] Found content via data-ad-preview");
		return messageContainer.innerHTML.trim();
	}

	// Strategy 2: Look for any div with dir="auto" that might contain post content
	// This is a more generic fallback for when Facebook changes structure
	const dirAutoElements = element.querySelectorAll('[dir="auto"]');
	for (const elem of Array.from(dirAutoElements)) {
		const text = elem.textContent?.trim() || "";
		// If it has substantial text content, it's likely the post content
		if (text.length > 10) {
			console.log("[Scraper] Found content via dir=auto fallback");
			return (elem as HTMLElement).innerHTML.trim();
		}
	}

	console.log("[Scraper] No content found");
	return "";
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
