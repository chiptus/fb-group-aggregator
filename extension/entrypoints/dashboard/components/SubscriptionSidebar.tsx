import type { Subscription } from "@/lib/types";
import { TogglePill } from "./TogglePill";

interface SubscriptionSidebarProps {
	subscriptions: Subscription[];
	selectedSubscriptionId: string | null;
	onSelectSubscription: (id: string | null) => void;
	unseenCounts: Map<string, number>;
}

export function SubscriptionSidebar({
	subscriptions,
	selectedSubscriptionId,
	onSelectSubscription,
	unseenCounts,
}: SubscriptionSidebarProps) {
	return (
		<nav
			aria-label="Subscription filters"
			className="flex flex-wrap gap-2 mb-3"
		>
			<TogglePill
				variant="nav"
				active={selectedSubscriptionId === null}
				onClick={() => onSelectSubscription(null)}
				label="All Posts"
				count={unseenCounts.get("__all__")}
			/>
			{subscriptions.map((sub) => (
				<TogglePill
					key={sub.id}
					variant="nav"
					active={selectedSubscriptionId === sub.id}
					onClick={() => onSelectSubscription(sub.id)}
					label={sub.name}
					count={unseenCounts.get(sub.id)}
				/>
			))}
		</nav>
	);
}
