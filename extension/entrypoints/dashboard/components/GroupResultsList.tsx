import type { ScrapeJob } from '@/lib/types';

export function GroupResultsList({
  groupResults,
}: {
  groupResults: ScrapeJob['groupResults'];
}) {
  return (
    <div>
      <h4 className="font-medium mb-3">Group Results</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {groupResults.map((result, index) => (
          <div
            key={result.groupId}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded text-sm"
          >
            <span className="text-gray-500 w-8">{index + 1}.</span>
            {result.status === 'success' && (
              <span className="text-green-600 text-lg">✓</span>
            )}
            {result.status === 'failed' && (
              <span className="text-red-600 text-lg">✗</span>
            )}
            {result.status === 'pending' && (
              <span className="text-gray-400 text-lg">⏳</span>
            )}
            {result.status === 'skipped' && (
              <span className="text-gray-400 text-lg">⊘</span>
            )}
            <span className="flex-1 font-medium">{result.groupName}</span>
            {result.postsScraped !== undefined && (
              <span className="text-gray-600">{result.postsScraped} posts</span>
            )}
            {result.error && (
              <span className="text-red-600 text-xs">{result.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
