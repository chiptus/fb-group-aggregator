/**
 * Facebook Group Scraper Explorer
 *
 * Run this script in the browser console while on a Facebook group page
 * to identify the correct DOM selectors for scraping posts.
 *
 * Usage:
 * 1. Open a Facebook group page
 * 2. Open DevTools Console (F12 or Cmd+Option+I)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run it
 *
 * The script will output:
 * - Post container selectors
 * - Post count
 * - Sample post data
 * - Suggested selectors for the scraper
 */

console.log('🔍 Facebook Group Scraper Explorer');
console.log('==================================\n');

// Try to find post containers with various selectors
const selectors = [
  '[role="article"]',
  '[data-pagelet="FeedUnit"]',
  '[data-pagelet*="GroupFeed"]',
  '[data-pagelet*="FeedUnit"]',
  '.x1yztbdb', // Common FB class
  '[data-visualcompletion="ignore-dynamic"]'
];

let posts = null;
let usedSelector = null;

for (const selector of selectors) {
  const elements = document.querySelectorAll(selector);
  console.log(`Trying selector: ${selector}`);
  console.log(`  Found ${elements.length} elements`);

  if (elements.length > 0) {
    posts = elements;
    usedSelector = selector;
    console.log(`  ✅ Using this selector!\n`);
    break;
  }
}

if (!posts || posts.length === 0) {
  console.error('❌ Could not find any posts on this page');
  console.log('Try manually inspecting a post and look for:');
  console.log('- [role="article"] elements');
  console.log('- [data-pagelet] attributes');
  console.log('- Repeating div structures');
} else {
  console.log(`📊 Found ${posts.length} posts using selector: ${usedSelector}\n`);

  // Analyze first post
  const firstPost = posts[0];
  console.log('🔬 Analyzing first post...\n');

  // Look for post ID
  console.log('Post ID:');
  const dataFt = firstPost.getAttribute('data-ft');
  if (dataFt) {
    console.log(`  data-ft attribute found: ${dataFt.substring(0, 100)}...`);
    try {
      const parsed = JSON.parse(dataFt);
      console.log(`  Parsed data-ft:`, parsed);
    } catch (e) {
      console.log(`  Could not parse data-ft as JSON`);
    }
  }

  // Check for other ID attributes
  ['id', 'data-store', 'data-id', 'data-testid'].forEach(attr => {
    const val = firstPost.getAttribute(attr);
    if (val) console.log(`  ${attr}: ${val}`);
  });

  // Look for author
  console.log('\nAuthor:');
  const links = firstPost.querySelectorAll('a');
  console.log(`  Found ${links.length} links in post`);
  if (links.length > 0) {
    links.forEach((link, i) => {
      if (i < 5) { // Show first 5 links
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        console.log(`  Link ${i}: "${text}" -> ${href?.substring(0, 50)}...`);
      }
    });
  }

  // Look for timestamp
  console.log('\nTimestamp:');
  const timeElements = firstPost.querySelectorAll('abbr, time, [data-utime]');
  console.log(`  Found ${timeElements.length} time-related elements`);
  timeElements.forEach((el, i) => {
    console.log(`  Element ${i}:`, {
      tag: el.tagName,
      'data-utime': el.getAttribute('data-utime'),
      datetime: el.getAttribute('datetime'),
      text: el.textContent?.trim()
    });
  });

  // Look for content
  console.log('\nContent:');
  const textContainers = firstPost.querySelectorAll('[dir="auto"]');
  console.log(`  Found ${textContainers.length} [dir="auto"] elements`);
  if (textContainers.length > 0) {
    const firstText = textContainers[0];
    const preview = firstText.textContent?.trim().substring(0, 100);
    console.log(`  First text preview: "${preview}..."`);
    console.log(`  HTML length: ${firstText.innerHTML.length} chars`);
  }

  // Extract all text from post
  const allText = firstPost.textContent?.trim();
  console.log(`  Total text length: ${allText?.length} chars`);
  console.log(`  Preview: "${allText?.substring(0, 150)}..."`);

  // Output suggested implementation
  console.log('\n📝 Suggested Scraper Implementation:');
  console.log('=====================================\n');
  console.log('// Find posts container');
  console.log(`const posts = document.querySelectorAll('${usedSelector}');`);
  console.log('\n// For each post:');
  console.log('// - ID: Check data-ft, id, or other data- attributes');
  console.log('// - Author: First link or profile link');
  console.log('// - Timestamp: Look for abbr[data-utime] or time elements');
  console.log('// - Content: [dir="auto"] elements or full textContent');
  console.log('\nRun this on a few different group pages to verify consistency!');

  // Output first post HTML for inspection
  console.log('\n📄 First Post HTML (for manual inspection):');
  console.log('============================================');
  console.log(firstPost.outerHTML.substring(0, 500) + '...\n');
}

console.log('\n✅ Exploration complete!');
console.log('Copy the suggestions above to update lib/scraper.ts');
