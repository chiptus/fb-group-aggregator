import { beforeEach, describe, expect, it } from "vitest";
import { extractGroupInfo, scrapeGroupPosts } from "./scraper";

describe("Facebook Scraper", () => {
  beforeEach(() => {
    // Clear document before each test
    document.body.innerHTML = "";
  });

  describe("scrapeGroupPosts", () => {
    it("should extract posts from Facebook group page", () => {
      // Mock Facebook group posts HTML structure
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">This is a test post with some content</div>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
            <a href="/groups/testgroup/posts/12345/">Permalink</a>
          </div>
          <div role="article" data-ft='{"mf_story_key":"67890"}'>
            <div>
              <a href="/user/janedoe">Jane Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Another post content here</div>
            </div>
            <abbr data-utime="1704070800">1 hour ago</abbr>
            <a href="/groups/testgroup/posts/67890/">Permalink</a>
          </div>
        </div>
      `;

      const groupId = "testgroup";
      const posts = scrapeGroupPosts(groupId);

      expect(posts).toHaveLength(2);

      expect(posts[0]).toMatchObject({
        id: expect.any(String),
        groupId: "testgroup",
        authorName: "John Doe",
        contentHtml: expect.stringContaining("test post"),
        timestamp: expect.any(Number),
        url: expect.stringContaining("12345"),
      });

      expect(posts[1]).toMatchObject({
        id: expect.any(String),
        groupId: "testgroup",
        authorName: "Jane Doe",
        contentHtml: expect.stringContaining("Another post"),
        timestamp: expect.any(Number),
        url: expect.stringContaining("67890"),
      });
    });

    it("should handle posts with missing author gracefully", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div data-ad-preview="message">
              <div dir="auto">Post without author</div>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
            <a href="/groups/testgroup/posts/12345/">Permalink</a>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      expect(posts[0].authorName).toBe("Unknown");
    });

    it("should handle posts with missing content gracefully", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
            <a href="/groups/testgroup/posts/12345/">Permalink</a>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      expect(posts[0].contentHtml).toBe("");
    });

    it("should handle posts with missing timestamp gracefully", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Test content</div>
            </div>
            <a href="/groups/testgroup/posts/12345/">Permalink</a>
          </div>
        </div>
      `;

      const now = Date.now();
      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      // Allow for small timing differences (within 100ms)
      expect(posts[0].timestamp).toBeGreaterThanOrEqual(now);
      expect(posts[0].timestamp).toBeLessThanOrEqual(now + 100);
    });

    it("should skip posts without post ID", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article">
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Post without ID</div>
            </div>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(0);
    });

    it("should return empty array when no posts found", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div>No posts here</div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toEqual([]);
    });

    it("should return empty array when feed container not found", () => {
      document.body.innerHTML = "<div>Not a Facebook page</div>";

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toEqual([]);
    });

    it("should extract contentHtml with formatting preserved", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">
                <p>Paragraph 1</p>
                <p>Paragraph 2 with <strong>bold</strong> and <em>italic</em></p>
                <a href="https://example.com">Link text</a>
              </div>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
            <a href="/groups/testgroup/posts/12345/">Permalink</a>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      expect(posts[0].contentHtml).toContain("<p>");
      expect(posts[0].contentHtml).toContain("<strong>");
      expect(posts[0].contentHtml).toContain("<em>");
      expect(posts[0].contentHtml).toContain("<a");
    });

    it("should construct correct post URL", () => {
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Test</div>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toMatch(/facebook\.com\/groups\/testgroup/);
      expect(posts[0].url).toContain("12345");
    });

    it("should parse Unix timestamp correctly", () => {
      const unixTimestamp = 1704067200; // Jan 1, 2024 00:00:00 GMT

      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Test</div>
            </div>
            <abbr data-utime="${unixTimestamp}">2 hours ago</abbr>
          </div>
        </div>
      `;

      const posts = scrapeGroupPosts("testgroup");

      expect(posts).toHaveLength(1);
      expect(posts[0].timestamp).toBe(unixTimestamp * 1000); // Should convert to milliseconds
    });
  });

  describe("extractGroupInfo", () => {
    it("should extract group name from page", () => {
      document.body.innerHTML = `
        <div>
          <h1>
            <a href="/groups/testgroup">Test Group Name</a>
          </h1>
        </div>
      `;

      const info = extractGroupInfo();

      expect(info).toEqual({
        name: "Test Group Name",
        url: expect.stringContaining("testgroup"),
      });
    });

    it("should extract group name from alternative selector", () => {
      document.body.innerHTML = `
        <div role="main">
          <span>
            <a href="/groups/12345">Alternative Group Name</a>
          </span>
        </div>
      `;

      const info = extractGroupInfo();

      expect(info.name).toBeTruthy();
    });

    it("should return current URL when group info not found", () => {
      document.body.innerHTML = "<div>Not a group page</div>";

      const info = extractGroupInfo();

      expect(info).toEqual({
        name: "",
        url: expect.any(String),
      });
    });

    it("should extract group ID from URL", () => {
      // Mock window.location
      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.facebook.com/groups/12345/posts/67890",
        },
        writable: true,
      });

      const info = extractGroupInfo();

      expect(info.url).toContain("12345");
    });
  });
});
