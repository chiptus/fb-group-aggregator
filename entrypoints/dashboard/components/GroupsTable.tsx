import type { Group } from "@/lib/types";
import { GroupRow } from "./GroupRow";

export function GroupsTable({
	groups,
	subscriptions,
	selectedGroupIds,
	onSelectAll,
	onToggleSelection,
	onToggleEnabled,
	onAssign,
	onDelete,
}: {
	groups: Group[];
	subscriptions: Array<{ id: string; name: string }>;
	selectedGroupIds: Set<string>;
	onSelectAll: () => void;
	onToggleSelection: (id: string) => void;
	onToggleEnabled: (id: string, enabled: boolean) => void;
	onAssign: (id: string, subscriptionId: string) => void;
	onDelete: (id: string) => void;
}) {
	const allSelected =
		groups.length > 0 && selectedGroupIds.size === groups.length;

	return (
		<div className="bg-white rounded-lg shadow overflow-hidden">
			<table className="w-full">
				<thead className="bg-gray-50 border-b border-gray-200">
					<tr>
						<th className="px-4 py-3 text-left">
							<input
								type="checkbox"
								checked={allSelected}
								onChange={onSelectAll}
								className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
						</th>
						<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Group Name
						</th>
						<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Subscription
						</th>
						<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Enabled
						</th>
						<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Last Scraped
						</th>
						<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					{groups.length === 0 ? (
						<tr>
							<td colSpan={6} className="px-4 py-8 text-center text-gray-500">
								No groups match your filters.
							</td>
						</tr>
					) : (
						groups.map((group) => (
							<GroupRow
								key={group.id}
								group={group}
								subscriptions={subscriptions}
								isSelected={selectedGroupIds.has(group.id)}
								onToggleSelection={onToggleSelection}
								onToggleEnabled={onToggleEnabled}
								onAssign={onAssign}
								onDelete={onDelete}
							/>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
