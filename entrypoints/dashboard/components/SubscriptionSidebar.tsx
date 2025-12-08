import type { Subscription } from "@/lib/types";

interface SubscriptionSidebarProps {
	subscriptions: Subscription[];
	selectedSubscriptionId: string | null;
	onSelectSubscription: (id: string | null) => void;
}

export function SubscriptionSidebar({
	subscriptions,
	selectedSubscriptionId,
	onSelectSubscription,
}: SubscriptionSidebarProps) {
	return (
		<nav className="w-64 flex-shrink-0" aria-label="Subscription filters">
			<div className="bg-white rounded-lg shadow p-4">
				<h2 className="font-semibold mb-3">Subscriptions</h2>
				<div className="space-y-1">
					<button
						type="button"
						onClick={() => onSelectSubscription(null)}
						aria-pressed={selectedSubscriptionId === null}
						aria-label="Show all posts from all subscriptions"
						className={`w-full text-left px-3 py-2 rounded ${
							selectedSubscriptionId === null
								? "bg-blue-100 text-blue-900"
								: "hover:bg-gray-100"
						}`}
					>
						All Posts
					</button>
					{subscriptions.map((sub) => (
						<button
							key={sub.id}
							type="button"
							onClick={() => onSelectSubscription(sub.id)}
							aria-pressed={selectedSubscriptionId === sub.id}
							aria-label={`Filter posts by ${sub.name} subscription`}
							className={`w-full text-left px-3 py-2 rounded ${
								selectedSubscriptionId === sub.id
									? "bg-blue-100 text-blue-900"
									: "hover:bg-gray-100"
							}`}
						>
							{sub.name}
						</button>
					))}
				</div>
			</div>
		</nav>
	);
}
