import { describe, expect, it } from "vitest";
import { normalizeContent } from "./normalizer";

describe("normalizeContent", () => {
	it("should strip HTML tags", () => {
		const html = "<p>Hello <strong>World</strong></p>";
		const result = normalizeContent(html);
		expect(result).toBe("hello world");
	});

	it("should convert to lowercase", () => {
		const text = "Hello WORLD";
		const result = normalizeContent(text);
		expect(result).toBe("hello world");
	});

	it("should collapse multiple whitespace into single space", () => {
		const text = "Hello    World   Test";
		const result = normalizeContent(text);
		expect(result).toBe("hello world test");
	});

	it("should trim leading and trailing whitespace", () => {
		const text = "   Hello World   ";
		const result = normalizeContent(text);
		expect(result).toBe("hello world");
	});

	it("should handle newlines", () => {
		const text = "Hello\n\nWorld\nTest";
		const result = normalizeContent(text);
		expect(result).toBe("hello world test");
	});

	it("should handle tabs", () => {
		const text = "Hello\t\tWorld";
		const result = normalizeContent(text);
		expect(result).toBe("hello world");
	});

	it("should handle complex HTML with nested tags", () => {
		const html = `
			<div class="content">
				<p>Looking for <strong>2BR apartment</strong></p>
				<ul>
					<li>Near beach</li>
					<li>Max $2000</li>
				</ul>
			</div>
		`;
		const result = normalizeContent(html);
		expect(result).toBe("looking for 2br apartment near beach max $2000");
	});

	it("should preserve meaningful punctuation", () => {
		const text = "Hello! How are you? I'm fine.";
		const result = normalizeContent(text);
		expect(result).toBe("hello! how are you? i'm fine.");
	});

	it("should handle empty string", () => {
		const result = normalizeContent("");
		expect(result).toBe("");
	});

	it("should handle string with only whitespace", () => {
		const result = normalizeContent("   \n\t   ");
		expect(result).toBe("");
	});

	it("should handle HTML entities", () => {
		const html = "Hello &amp; World &lt;test&gt;";
		const result = normalizeContent(html);
		expect(result).toBe("hello & world <test>");
	});
});
