import { useState } from 'react';
import { PostList } from '../components/PostList';
import { SubscriptionFilter } from '../components/SubscriptionFilter';
import { useSubscriptions, useGroups, usePosts, useTogglePostSeen, useTogglePostStarred } from '../hooks/useApi';
import type { Post } from '../hooks/useApi';

export function HomePage() {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const subscriptionsQuery = useSubscriptions();
  const groupsQuery = useGroups();
  const postsQuery = usePosts();

  // Mutations
  const toggleSeenMutation = useTogglePostSeen();
  const toggleStarredMutation = useTogglePostStarred();

  // Extract data
  const subscriptions = subscriptionsQuery.data?.subscriptions ?? [];
  const groups = groupsQuery.data?.groups ?? [];
  const posts = postsQuery.data?.posts ?? [];

  // Loading states
  const isLoading = subscriptionsQuery.isLoading || groupsQuery.isLoading || postsQuery.isLoading;

  // Error states
  const error = subscriptionsQuery.error || groupsQuery.error || postsQuery.error;

  // Filter posts by selected subscription
  const filteredPosts = selectedSubscriptionId === null
    ? posts
    : posts.filter((post: Post) => {
        const group = groups.find((g) => g.id === post.groupId);
        return group?.subscriptionIds.includes(selectedSubscriptionId);
      });

  function handleSelectSubscription(subscriptionId: string | null) {
    setSelectedSubscriptionId(subscriptionId);
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  function handleToggleSeen(postId: string, seen: boolean) {
    toggleSeenMutation.mutate({ postId, seen });
  }

  function handleToggleStarred(postId: string, starred: boolean) {
    toggleStarredMutation.mutate({ postId, starred });
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading data</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Subscription Filter */}
          <aside className="lg:col-span-1">
            <SubscriptionFilter
              subscriptions={subscriptions}
              selectedSubscriptionId={selectedSubscriptionId}
              onSelectSubscription={handleSelectSubscription}
            />
          </aside>

          {/* Main Content - Posts */}
          <main className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                aria-label="Search posts"
              />
            </div>

            {/* Posts List */}
            <PostList
              posts={filteredPosts}
              searchQuery={searchQuery}
              onToggleSeen={handleToggleSeen}
              onToggleStarred={handleToggleStarred}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
