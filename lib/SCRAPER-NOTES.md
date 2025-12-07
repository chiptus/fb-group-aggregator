# Facebook Scraper DOM Analysis Notes

## Challenge: Facebook's Dynamic DOM

Facebook's DOM structure is:
- **Dynamically loaded**: Initial HTML contains loading skeletons
- **Obfuscated**: Uses generated class names like `x1yztbdb`, `xdj266r`
- **Frequently changing**: Selectors break across updates
- **Context-dependent**: Different for mobile web vs desktop

## Real Facebook Structure (2025-12-07)

Based on actual Facebook group page testing:

### Posts vs Comments
- Both posts AND comments use `[role="article"]`
- **Differentiation**: Check `aria-label` attribute
  - Comments: `aria-label="Comment by [Name] [Time] ago"`
  - Posts: Different pattern (needs more testing)
- **Filter strategy**: Skip elements with aria-label containing "comment"

### Post ID Extraction
Modern Facebook doesn't always use `data-ft` attribute. We use multiple strategies:
1. `data-ft` JSON with `mf_story_key` (legacy)
2. Extract from permalink URL: `/posts/(\d+)/`
3. Check aria-label to filter out comments
4. Extract from timestamp link href

### Author Extraction
1. **Primary**: `a[href*="/user/"]` link text
2. **Fallback 1**: Parse aria-label for "Post/Comment by [Name]"
3. **Fallback 2**: First non-empty link that's not:
   - Timestamp (matches `/^\d+[smhdw]$/` like "4d")
   - Permalink link
   - Has length > 1

### Timestamp Extraction
Modern Facebook uses relative time instead of Unix timestamps:
1. **Primary**: `abbr[data-utime]` (if available, most accurate)
2. **Fallback 1**: Parse aria-label for "X days/hours/etc ago"
3. **Fallback 2**: Parse link text for short format like "4d", "2h"
4. **Last resort**: `Date.now()`

### Content Extraction
1. Look for `[data-ad-preview="message"]` container
2. Get inner `[dir="auto"]` element
3. Return innerHTML to preserve formatting

## Current Implementation

[scraper.ts](lib/scraper.ts) now uses **multi-strategy approach** with fallbacks for:
- Post ID (4 strategies, filters out comments)
- Author name (3 strategies, skips timestamp links)
- Timestamp (3 strategies, handles relative time)
- Content (2 strategies)

## Testing Strategy

1. **Unit tests**: Mock DOM with expected structure (✅ 14 tests passing)
2. **Manual testing**: Use [scraper-explorer.js](lib/scraper-explorer.js) to verify on real Facebook pages
3. **Run on multiple groups**: Facebook may have A/B tests with different DOM structures

## Known Limitations

- Relative timestamps are approximate (months = 30 days, years = 365 days)
- May capture comments if aria-label patterns change
- Facebook updates may break selectors
- No distinction between photo/text/link/video posts (all treated same)

## Maintenance Required

Monitor for Facebook DOM changes. If scraping breaks:
1. Run scraper-explorer.js to identify new patterns
2. Update extraction strategies in scraper.ts
3. Add new test cases if needed
