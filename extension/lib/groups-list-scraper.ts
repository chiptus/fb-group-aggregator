import type { GroupDiscovery } from "./types";

/**
 * Scrapes the list of groups from Facebook's groups list page
 * URL: https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added
 * @returns Object containing array of discovered groups and total count
 */
export function scrapeGroupsList(): {
	groups: GroupDiscovery[];
	totalCount: number;
} {
	const groupsMap = new Map<string, GroupDiscovery>();
	let totalCount = 0;

	// Extract total count from page header
	totalCount = extractTotalGroupCount();

	// Find all group elements
	const groupElements = findGroupElements();

	groupElements.forEach((element) => {
		try {
			const group = extractGroupData(element);
			if (group) {
				// Deduplicate by group ID (Facebook might have duplicate DOM elements)
				if (!groupsMap.has(group.id)) {
					groupsMap.set(group.id, group);
				}
			}
		} catch (error) {
			console.error("Error extracting group:", error);
			// Continue to next group
		}
	});

	return { groups: Array.from(groupsMap.values()), totalCount };
}

/**
 * Extracts the total count of groups from the page header
 * Pattern: "All groups you've joined (320)"
 */
function extractTotalGroupCount(): number {
	// Strategy 1: Look for text pattern "All groups you've joined (X)"
	const pageText = document.body.textContent || "";
	const match = pageText.match(/All groups you've joined \((\d+)\)/i);
	if (match?.[1]) {
		return parseInt(match[1], 10);
	}

	// Strategy 2: Count visible group elements as fallback
	return findGroupElements().length;
}

/**
 * Finds all group elements on the page
 * Facebook groups are typically displayed as articles or in list items
 */
function findGroupElements(): Element[] {
	// Strategy 1: Find articles with links to groups
	const articles = Array.from(
		document.querySelectorAll('[role="article"], [role="listitem"]'),
	);

	// Filter to only those containing group links
	const groupArticles = articles.filter((article) => {
		const groupLink = article.querySelector('a[href*="/groups/"]');
		return groupLink !== null;
	});

	if (groupArticles.length > 0) {
		return groupArticles;
	}

	// Strategy 2: Find any containers with group links
	const containers = Array.from(document.querySelectorAll("div"));
	return containers.filter((div) => {
		const groupLink = div.querySelector('a[href*="/groups/"]');
		// Must have a group link and should be a reasonable container size
		return groupLink && div.children.length > 0 && div.children.length < 20;
	});
}

/**
 * Extracts group data from a single group element
 */
function extractGroupData(element: Element): GroupDiscovery | null {
	const groupLink = findGroupLink(element);
	if (!groupLink) {
		return null;
	}

	const url = extractGroupUrl(groupLink);
	if (!url) {
		return null;
	}

	const id = extractGroupId(url);
	if (!id) {
		return null;
	}

	const name = extractGroupName(groupLink, element);

	return { id, name, url };
}

/**
 * Finds the group link element
 */
function findGroupLink(element: Element): HTMLAnchorElement | null {
	// Look for links that go to /groups/ID
	const links = Array.from(element.querySelectorAll('a[href*="/groups/"]'));

	// Prefer links that don't go to /groups/feed or /groups/joins
	const groupPageLink = links.find((link) => {
		const href = link.getAttribute("href") || "";
		return (
			!href.includes("/feed") &&
			!href.includes("/joins") &&
			!href.includes("/create") &&
			!href.includes("/discover")
		);
	});

	return (groupPageLink as HTMLAnchorElement) || null;
}

/**
 * Extracts the full group URL from a link element
 */
function extractGroupUrl(link: HTMLAnchorElement): string | null {
	const href = link.getAttribute("href");
	if (!href) {
		return null;
	}

	// Construct full URL if it's a relative path
	if (href.startsWith("http")) {
		return href;
	}

	return `https://www.facebook.com${href}`;
}

/**
 * Extracts the group ID from a URL
 * Handles both numeric IDs and vanity URLs
 */
function extractGroupId(url: string): string | null {
	// Match patterns like:
	// - /groups/123456789/
	// - /groups/my-group-name/
	const match = url.match(/\/groups\/([^/?]+)/);
	if (match?.[1]) {
		return match[1];
	}

	return null;
}

/**
 * Extracts the group name from the link or surrounding element
 */
function extractGroupName(link: HTMLAnchorElement, container: Element): string {
	// Strategy 1: Look for nested anchor tags with group names (FB's current structure)
	// The group name is often in a separate <a> tag inside the container
	const allLinks = container.querySelectorAll('a[href*="/groups/"]');
	for (const innerLink of allLinks) {
		const text = innerLink.textContent?.trim();
		// Skip links with very long text (likely containing metadata)
		// Skip links that match common action text
		if (
			text &&
			text.length > 2 &&
			text.length < 100 &&
			!text.includes("Update responses") &&
			!text.includes("days ago") &&
			!text.includes("Requested to join") &&
			!text.includes("•")
		) {
			console.log("[Groups Scraper] Found name via nested link:", text);
			return text;
		}
	}

	// Strategy 2: Check aria-label on the main link (often has group name)
	const ariaLabel = link.getAttribute("aria-label");
	if (ariaLabel && ariaLabel.length > 0 && ariaLabel.length < 200) {
		console.log("[Groups Scraper] Found name via aria-label:", ariaLabel);
		return ariaLabel;
	}

	// Strategy 3: Look for SVG with aria-label (group avatar often has group name)
	const svg = container.querySelector("svg[aria-label]");
	if (svg) {
		const svgLabel = svg.getAttribute("aria-label");
		if (svgLabel && svgLabel.length > 0 && svgLabel.length < 200) {
			console.log("[Groups Scraper] Found name via SVG aria-label:", svgLabel);
			return svgLabel;
		}
	}

	// Strategy 4: Link text content from main link
	const linkText = link.textContent?.trim();
	if (linkText && linkText.length > 0 && linkText.length < 200) {
		console.log("[Groups Scraper] Found name via main link text:", linkText);
		return linkText;
	}

	// Strategy 5: Look for heading elements in container
	const heading = container.querySelector("h2, h3, h4");
	if (heading?.textContent?.trim()) {
		const headingText = heading.textContent.trim();
		console.log("[Groups Scraper] Found name via heading:", headingText);
		return headingText;
	}

	// Strategy 6: Extract from URL if it's a vanity URL
	const urlMatch = link.href.match(/\/groups\/([^/?]+)/);
	if (urlMatch?.[1] && !/^\d+$/.test(urlMatch[1])) {
		// Convert vanity URL to readable name (replace dashes with spaces)
		const nameFromUrl = urlMatch[1]
			.replace(/-/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase());
		console.log("[Groups Scraper] Found name via URL:", nameFromUrl);
		return nameFromUrl;
	}

	console.warn(
		"[Groups Scraper] Could not extract name, using Unknown Group. Link:",
		link.href,
		"Container:",
		container,
	);
	return "Unknown Group";
}

/**
 * Checks if we're currently on the groups list page
 */
export function isGroupsListPage(): boolean {
	return window.location.href.includes("/groups/joins/");
}

/**
 * Checks if we've scrolled near the bottom of the page
 * Used to trigger loading more groups
 */
export function isNearBottom(threshold = 2000): boolean {
	const scrollTop = window.scrollY;
	const scrollHeight = document.documentElement.scrollHeight;
	const clientHeight = window.innerHeight;

	return scrollHeight - scrollTop - clientHeight < threshold;
}
