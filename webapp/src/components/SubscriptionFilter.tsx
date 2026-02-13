import type { Subscription } from '../hooks/useApi';

interface SubscriptionFilterProps {
  subscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  onSelectSubscription: (subscriptionId: string | null) => void;
}

export function SubscriptionFilter({
  subscriptions,
  selectedSubscriptionId,
  onSelectSubscription,
}: SubscriptionFilterProps) {
  function handleSelectAll() {
    onSelectSubscription(null);
  }

  function handleSelectSubscription(subscriptionId: string) {
    onSelectSubscription(subscriptionId);
  }

  return (
    <nav className="bg-white rounded-lg shadow p-4" role="navigation" aria-label="Subscription filter">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Subscriptions</h2>

      {/* All option */}
      <button
        onClick={handleSelectAll}
        className={`w-full text-left px-4 py-2 rounded mb-2 ${
          selectedSubscriptionId === null
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        All
      </button>

      {/* Subscription list */}
      {subscriptions.length === 0 ? (
        <p className="text-gray-500 text-sm px-4 py-2">No subscriptions yet</p>
      ) : (
        <ul className="space-y-2">
          {subscriptions.map((subscription) => (
            <li key={subscription.id}>
              <button
                onClick={() => handleSelectSubscription(subscription.id)}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedSubscriptionId === subscription.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {subscription.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
