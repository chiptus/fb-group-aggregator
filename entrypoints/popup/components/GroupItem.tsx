import type { Group, Subscription } from "@/lib/types";
import { DeleteButton } from "./DeleteButton";
import { GroupAssignSubscription } from "./GroupAssignSubscription";
import { GroupToggle } from "./GroupToggle";

interface GroupItemProps {
	group: Group;
	subscriptions: Subscription[];
	onToggle: (groupId: string, enabled: boolean) => void;
	onAssign: (groupId: string, subscriptionId: string) => void;
	onDelete: (groupId: string) => void;
}

export function GroupItem({
	group,
	subscriptions,
	onToggle,
	onAssign,
	onDelete,
}: GroupItemProps) {
	return (
		<div className="border rounded-lg p-3 space-y-2">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-medium text-sm">{group.name}</h3>
					<p className="text-xs text-gray-500 truncate">{group.url}</p>
				</div>
				<DeleteButton
					onDelete={() => onDelete(group.id)}
					label={`Delete ${group.name}`}
				/>
			</div>

			<div className="flex items-center justify-between">
				<GroupToggle
					enabled={group.enabled}
					onToggle={(enabled) => onToggle(group.id, enabled)}
					groupName={group.name}
				/>

				<GroupAssignSubscription
					selectedSubscriptionId={group.subscriptionIds[0] || null}
					subscriptions={subscriptions}
					onAssign={(subscriptionId) => onAssign(group.id, subscriptionId)}
					groupName={group.name}
				/>
			</div>
		</div>
	);
}
