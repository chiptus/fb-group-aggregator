import { PostCard } from './PostCard';
import type { Post } from '../hooks/useApi';

interface PostListProps {
  posts: Post[];
  searchQuery: string;
  onToggleSeen?: (postId: string, seen: boolean) => void;
  onToggleStarred?: (postId: string, starred: boolean) => void;
}

export function PostList({
  posts,
  searchQuery,
  onToggleSeen = () => {},
  onToggleStarred = () => {},
}: PostListProps) {
  // Filter posts by search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const contentText = post.contentHtml.replace(/<[^>]*>/g, '').toLowerCase();
    const authorName = post.authorName.toLowerCase();

    return contentText.includes(query) || authorName.includes(query);
  });

  // Empty state when no posts
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No posts found</p>
        <p className="text-gray-400 text-sm mt-2">
          Posts will appear here once synced from your extension
        </p>
      </div>
    );
  }

  // No results for search query
  if (filteredPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No posts found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleSeen={onToggleSeen}
          onToggleStarred={onToggleStarred}
        />
      ))}
    </div>
  );
}
