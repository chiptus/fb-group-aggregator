import DOMPurify from 'dompurify';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import type { Post } from '../hooks/useApi';

interface PostCardProps {
  post: Post;
  onToggleSeen: (postId: string, seen: boolean) => void;
  onToggleStarred: (postId: string, starred: boolean) => void;
}

export function PostCard({ post, onToggleSeen, onToggleStarred }: PostCardProps) {
  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(post.contentHtml);

  function handleToggleSeen() {
    onToggleSeen(post.id, !post.seen);
  }

  function handleToggleStarred() {
    onToggleStarred(post.id, !post.starred);
  }

  return (
    <article className="bg-white rounded-lg shadow p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{post.authorName}</p>
          <p className="text-sm text-gray-500">
            {formatRelativeTime(post.scrapedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seen/Unseen Button */}
          <button
            onClick={handleToggleSeen}
            className={`px-3 py-1 rounded text-sm ${
              post.seen
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            aria-label={post.seen ? 'Mark as unseen' : 'Mark as seen'}
          >
            {post.seen ? 'Mark as unseen' : 'Mark as seen'}
          </button>

          {/* Star/Unstar Button */}
          <button
            onClick={handleToggleStarred}
            className={`px-3 py-1 rounded text-sm ${
              post.starred
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={post.starred ? 'Unstar' : 'Star'}
          >
            {post.starred ? 'Remove from starred' : 'Add to starred'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="prose max-w-none mb-4"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Footer - Link to Facebook */}
      <div className="pt-4 border-t border-gray-200">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View on Facebook →
        </a>
      </div>
    </article>
  );
}
