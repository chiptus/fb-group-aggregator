import type { Subscription } from "@/lib/types";

interface GroupAssignSubscriptionProps {
	selectedSubscriptionId: string | null;
	subscriptions: Subscription[];
	onAssign: (subscriptionId: string) => void;
	groupName: string;
}

export function GroupAssignSubscription({
	selectedSubscriptionId,
	subscriptions,
	onAssign,
	groupName,
}: GroupAssignSubscriptionProps) {
	return (
		<select
			value={selectedSubscriptionId || ""}
			onChange={(e) => onAssign(e.target.value)}
			className="border rounded px-2 py-1 text-xs"
			aria-label={`Subscription for ${groupName}`}
		>
			<option value="">No subscription</option>
			{subscriptions.map((sub) => (
				<option key={sub.id} value={sub.id}>
					{sub.name}
				</option>
			))}
		</select>
	);
}
