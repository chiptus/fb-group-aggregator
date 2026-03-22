import { useMemo } from 'react';
import { usePosts } from '@/lib/hooks/storage/usePosts';

export function PopupHeader() {
  const postsQuery = usePosts();

  const unseenCount = useMemo(() => {
    if (!postsQuery.data) {
      return 0;
    }
    return postsQuery.data.filter((post) => !post.seen).length;
  }, [postsQuery.data]);

  function getDisplayContent() {
    if (postsQuery.isLoading) {
      return (
        <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
          ...
        </span>
      );
    }

    if (postsQuery.error) {
      return (
        <div className="flex flex-col gap-1">
          <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
            -
          </span>
          <p className="text-xs text-red-200">
            Error:{' '}
            {postsQuery.error instanceof Error
              ? postsQuery.error.message
              : 'Failed to load'}
          </p>
        </div>
      );
    }

    return (
      <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
        {unseenCount}
      </span>
    );
  }

  return (
    <div className="bg-blue-600 text-white p-4">
      <h1 className="text-xl font-bold">FB Group Aggregator</h1>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm">Unseen posts:</span>
        {getDisplayContent()}
      </div>
    </div>
  );
}
