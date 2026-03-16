/**
 * Normalizes HTML content for grouping comparison.
 *
 * Steps:
 * 1. Strip HTML tags
 * 2. Decode HTML entities
 * 3. Collapse whitespace
 * 4. Convert to lowercase
 * 5. Trim
 *
 * @param html - HTML content string
 * @returns Normalized plain text for comparison
 */
export function normalizeContent(html: string): string {
	// Strip HTML tags
	let text = html.replace(/<[^>]*>/g, " ");

	// Decode HTML entities
	text = decodeHtmlEntities(text);

	// Collapse whitespace (spaces, tabs, newlines) into single space
	text = text.replace(/\s+/g, " ");

	// Convert to lowercase
	text = text.toLowerCase();

	// Trim leading/trailing whitespace
	text = text.trim();

	return text;
}

/**
 * Decodes common HTML entities
 */
function decodeHtmlEntities(text: string): string {
	const entities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
		"&apos;": "'",
		"&nbsp;": " ",
	};

	return text.replace(
		/&(amp|lt|gt|quot|#39|apos|nbsp);/g,
		(match) => entities[match] || match,
	);
}

/**
 * Generates a simple hash for a string to use as group ID
 */
export function hashContent(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return `grp_${Math.abs(hash).toString(16)}`;
}
