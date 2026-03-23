import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Post } from '@/lib/types';
import { GroupedPostsSection } from '../components/GroupedPostsSection';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PostCard } from '../components/PostCard';
import { PostsEmptyState } from '../components/PostsEmptyState';
import { PostsFilterBar } from '../components/PostsFilterBar';
import { PostsListControls } from '../components/PostsListControls';
import { SearchBar } from '../components/SearchBar';
import { SubscriptionSidebar } from '../components/SubscriptionSidebar';
import { VirtualPostList } from '../components/VirtualPostList';
import { PostsViewProvider, usePostsView } from '../context/PostsViewContext';

export function PostsTab() {
  return (
    <PostsViewProvider>
      <PostsTabInner />
    </PostsViewProvider>
  );
}

function PostsTabInner() {
  const {
    getGroupById,
    groupsMap,
    filteredPosts,
    enableGrouping,
    isLoading,
    error,
    setPostSeen,
    togglePostStarred,
    searchQuery,
    setSearchQuery,
  } = usePostsView();

  const renderPost = useCallback(
    (post: Post) => {
      const group = getGroupById(post.groupId);
      return (
        <div className="pb-4">
          <PostCard
            post={post}
            group={group}
            onToggleSeen={(postId, currentSeen) =>
              setPostSeen(postId, !currentSeen)
            }
            onToggleStarred={togglePostStarred}
          />
        </div>
      );
    },
    [getGroupById, setPostSeen, togglePostStarred]
  );

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center h-64 space-y-4"
      >
        <p className="text-red-600">
          Failed to load posts. Please refresh the page or check your extension
          storage.
        </p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <SubscriptionSidebar />

      <PostsListControls />

      <PostsFilterBar />

      {filteredPosts.length === 0 ? (
        <PostsEmptyState />
      ) : enableGrouping ? (
        <GroupedPostsSection
          filteredPosts={filteredPosts}
          groupsMap={groupsMap}
          onSetSeen={setPostSeen}
          onToggleStarred={togglePostStarred}
        />
      ) : (
        <VirtualPostList
          posts={filteredPosts}
          height="calc(100vh - 260px)"
          estimateSize={200}
          overscan={5}
          renderPost={renderPost}
        />
      )}
    </div>
  );
}
