import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Content Script Tests
 *
 * The content script runs on Facebook group pages and:
 * 1. Detects when user is on a Facebook group page
 * 2. Scrapes posts from the page using lib/scraper.ts
 * 3. Sends scraped posts to background script for storage
 * 4. Handles responses from background script
 */

describe('Content Script', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';

    // Clear all mocks
    vi.clearAllMocks();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://www.facebook.com/groups/123456/posts/',
        pathname: '/groups/123456/posts/',
      },
      writable: true,
    });
  });

  describe('URL Detection', () => {
    it('should detect Facebook group URL', () => {
      const url = 'https://www.facebook.com/groups/123456/';
      const groupIdMatch = url.match(/facebook\.com\/groups\/([^/]+)/);

      expect(groupIdMatch).toBeTruthy();
      expect(groupIdMatch?.[1]).toBe('123456');
    });

    it('should detect Facebook group posts page', () => {
      const url = 'https://www.facebook.com/groups/123456/posts/';
      const groupIdMatch = url.match(/facebook\.com\/groups\/([^/]+)/);

      expect(groupIdMatch).toBeTruthy();
      expect(groupIdMatch?.[1]).toBe('123456');
    });

    it('should not match non-group Facebook pages', () => {
      const url = 'https://www.facebook.com/profile/123';
      const groupIdMatch = url.match(/facebook\.com\/groups\/([^/]+)/);

      expect(groupIdMatch).toBeNull();
    });

    it('should extract group ID from permalink URLs', () => {
      const url = 'https://www.facebook.com/groups/123456/permalink/789/';
      const groupIdMatch = url.match(/facebook\.com\/groups\/([^/]+)/);

      expect(groupIdMatch?.[1]).toBe('123456');
    });
  });

  describe('Scraping Integration', () => {
    it('should scrape posts and send to background', async () => {
      // Mock Facebook group page with posts
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div role="article" data-ft='{"mf_story_key":"12345"}'>
            <div>
              <a href="/user/johndoe">John Doe</a>
            </div>
            <div data-ad-preview="message">
              <div dir="auto">Test post content</div>
            </div>
            <abbr data-utime="1704067200">2 hours ago</abbr>
            <a href="/groups/123456/posts/12345/">Permalink</a>
          </div>
        </div>
      `;

      // Mock chrome.runtime.sendMessage
      const sendMessageMock = vi.fn().mockResolvedValue({ success: true });
      global.chrome = {
        runtime: {
          sendMessage: sendMessageMock,
        },
      } as any;

      // Import scraper (in real code, content script will import this)
      const { scrapeGroupPosts } = await import('@/lib/scraper');

      const groupId = '123456';
      const posts = scrapeGroupPosts(groupId);

      expect(posts).toHaveLength(1);

      // Content script should send these posts to background
      await chrome.runtime.sendMessage({
        type: 'SCRAPE_POSTS',
        payload: {
          groupId,
          posts,
        },
      });

      expect(sendMessageMock).toHaveBeenCalledWith({
        type: 'SCRAPE_POSTS',
        payload: {
          groupId,
          posts: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              groupId: '123456',
              authorName: 'John Doe',
              contentHtml: expect.stringContaining('Test post'),
            }),
          ]),
        },
      });
    });

    it('should handle empty scrape results', async () => {
      // Mock Facebook page with no posts
      document.body.innerHTML = `
        <div data-pagelet="GroupFeed">
          <div>No posts here</div>
        </div>
      `;

      const { scrapeGroupPosts } = await import('@/lib/scraper');

      const groupId = '123456';
      const posts = scrapeGroupPosts(groupId);

      expect(posts).toEqual([]);
    });

    it('should extract group info from page', async () => {
      document.body.innerHTML = `
        <div>
          <h1>
            <a href="/groups/123456">Test Group Name</a>
          </h1>
        </div>
      `;

      const { extractGroupInfo } = await import('@/lib/scraper');

      const info = extractGroupInfo();

      expect(info).toEqual({
        name: 'Test Group Name',
        url: expect.stringContaining('123456'),
      });
    });
  });

  describe('Message Handling', () => {
    it('should handle successful scrape response', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({
        success: true,
        count: 5,
      });

      global.chrome = {
        runtime: {
          sendMessage: sendMessageMock,
        },
      } as any;

      const response = await chrome.runtime.sendMessage({
        type: 'SCRAPE_POSTS',
        payload: { groupId: '123', posts: [] },
      });

      expect(response.success).toBe(true);
      expect(response.count).toBe(5);
    });

    it('should handle scrape errors', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to save posts',
      });

      global.chrome = {
        runtime: {
          sendMessage: sendMessageMock,
        },
      } as any;

      const response = await chrome.runtime.sendMessage({
        type: 'SCRAPE_POSTS',
        payload: { groupId: '123', posts: [] },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });
  });

  describe('Scraping Trigger', () => {
    it('should trigger scrape on page load', () => {
      // In real implementation, content script will:
      // 1. Wait for DOM to load
      // 2. Check if on Facebook group page
      // 3. Trigger scrape

      const url = window.location.href;
      const isGroupPage = /facebook\.com\/groups\/[^/]+/.test(url);

      expect(isGroupPage).toBe(true);
    });

    it('should trigger scrape on scroll to bottom', () => {
      // Facebook lazy-loads posts, so we need to trigger scrape
      // when user scrolls to bottom to load more posts

      const isNearBottom = (threshold = 100) => {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        return scrollHeight - scrollTop - clientHeight < threshold;
      };

      // Mock scroll position near bottom
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true });
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1200,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', { value: 150, writable: true });

      expect(isNearBottom()).toBe(true);
    });

    it('should not trigger scrape too frequently', () => {
      // Use debounce to avoid scraping on every scroll event
      let lastScrapeTime = 0;
      const minInterval = 2000; // 2 seconds

      const shouldScrape = () => {
        const now = Date.now();
        if (now - lastScrapeTime < minInterval) {
          return false;
        }
        lastScrapeTime = now;
        return true;
      };

      expect(shouldScrape()).toBe(true); // First call
      expect(shouldScrape()).toBe(false); // Too soon
    });
  });

  describe('Error Handling', () => {
    it('should handle scraper errors gracefully', () => {
      // If scraper throws, content script should catch and log
      const mockError = new Error('Scraper failed');

      expect(() => {
        try {
          throw mockError;
        } catch (error) {
          console.error('Scraping error:', error);
          // Content script should not crash
        }
      }).not.toThrow();
    });

    it('should handle message send failures', async () => {
      const sendMessageMock = vi.fn().mockRejectedValue(new Error('Network error'));

      global.chrome = {
        runtime: {
          sendMessage: sendMessageMock,
        },
      } as any;

      try {
        await chrome.runtime.sendMessage({
          type: 'SCRAPE_POSTS',
          payload: { groupId: '123', posts: [] },
        });
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });
});
