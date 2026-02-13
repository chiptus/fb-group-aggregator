import { Button } from "@/components/ui/button";
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
		<nav className="w-64 shrink-0" aria-label="Subscription filters">
			<div className="bg-white rounded-lg shadow p-4">
				<h2 className="font-semibold mb-3">Subscriptions</h2>
				<div className="space-y-1">
					<Button
						onClick={() => onSelectSubscription(null)}
						aria-pressed={selectedSubscriptionId === null}
						aria-label="Show all posts from all subscriptions"
						variant={selectedSubscriptionId === null ? "primary" : "ghost"}
						className="w-full justify-start"
					>
						All Posts
					</Button>
					{subscriptions.map((sub) => (
						<Button
							key={sub.id}
							onClick={() => onSelectSubscription(sub.id)}
							aria-pressed={selectedSubscriptionId === sub.id}
							aria-label={`Filter posts by ${sub.name} subscription`}
							variant={selectedSubscriptionId === sub.id ? "primary" : "ghost"}
							className="w-full justify-start"
						>
							{sub.name}
						</Button>
					))}
				</div>
			</div>
		</nav>
	);
}
