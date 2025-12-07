import { extractGroupInfo, scrapeGroupPosts } from "../lib/scraper";

export default defineContentScript({
  matches: ["*://*.facebook.com/*"],

  main() {
    // Only run on Facebook group pages
    const groupIdMatch = window.location.href.match(
      /facebook\.com\/groups\/([^/]+)/,
    );
    if (!groupIdMatch) {
      return; // Not a group page
    }

    const groupId = groupIdMatch[1];
    console.log("[FB Aggregator] Detected group:", groupId);

    // Track last scrape time to avoid scraping too frequently
    let lastScrapeTime = 0;
    const minScrapeInterval = 2000; // 2 seconds

    // Initial scrape on page load
    // Wait a bit for Facebook to render content
    setTimeout(() => {
      scrapeAndSend();
    }, 1000);

    // Scrape on scroll (Facebook lazy-loads posts)
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Optional: Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "TRIGGER_SCRAPE") {
        scrapeAndSend().then(() => {
          sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
      }
    });

    console.log("[FB Aggregator] Content script initialized");

    /**
     * Scrapes posts from the current page and sends to background script
     */
    async function scrapeAndSend() {
      const now = Date.now();

      // Debounce: Don't scrape too frequently
      if (now - lastScrapeTime < minScrapeInterval) {
        return;
      }

      lastScrapeTime = now;

      try {
        console.log("[FB Aggregator] Scraping posts...");

        // Scrape posts from page
        const posts = scrapeGroupPosts(groupId);

        if (posts.length === 0) {
          console.log("[FB Aggregator] No posts found");
          return;
        }

        console.log(`[FB Aggregator] Found ${posts.length} posts`);

        // Extract group info
        const groupInfo = extractGroupInfo();

        // Send to background script for storage
        const response = await chrome.runtime.sendMessage({
          type: "SCRAPE_POSTS",
          payload: {
            groupId,
            groupInfo,
            posts,
          },
        });

        if (response.success) {
          console.log(
            `[FB Aggregator] Successfully saved ${response.count} new posts`,
          );
        } else {
          console.error(
            "[FB Aggregator] Failed to save posts:",
            response.error,
          );
        }
      } catch (error) {
        console.error("[FB Aggregator] Scraping error:", error);
      }
    }

    /**
     * Check if user has scrolled near the bottom of the page
     */
    function isNearBottom(threshold = 100) {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      return scrollHeight - scrollTop - clientHeight < threshold;
    }

    /**
     * Handle scroll events to trigger scraping
     */
    function handleScroll() {
      if (isNearBottom()) {
        scrapeAndSend();
      }
    }
  },
});
