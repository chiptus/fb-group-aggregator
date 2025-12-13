import type { Group } from "@/lib/types";

export function GroupRow({
	group,
	subscriptions,
	isSelected,
	onToggleSelection,
	onToggleEnabled,
	onAssign,
	onDelete,
}: {
	group: Group;
	subscriptions: Array<{ id: string; name: string }>;
	isSelected: boolean;
	onToggleSelection: (id: string) => void;
	onToggleEnabled: (id: string, enabled: boolean) => void;
	onAssign: (id: string, subscriptionId: string) => void;
	onDelete: (id: string) => void;
}) {
	const subscription = subscriptions.find((s) =>
		group.subscriptionIds.includes(s.id),
	);

	function formatDate(timestamp: number | null) {
		if (!timestamp) return "Never";
		return new Date(timestamp).toLocaleDateString();
	}

	return (
		<tr className="hover:bg-gray-50">
			<td className="px-4 py-3">
				<input
					type="checkbox"
					checked={isSelected}
					onChange={() => onToggleSelection(group.id)}
					className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
			</td>
			<td className="px-4 py-3">
				<a
					href={group.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:underline"
				>
					{group.name}
				</a>
			</td>
			<td className="px-4 py-3">
				<select
					value={subscription?.id ?? ""}
					onChange={(e) => onAssign(group.id, e.target.value)}
					className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Unassigned</option>
					{subscriptions.map((sub) => (
						<option key={sub.id} value={sub.id}>
							{sub.name}
						</option>
					))}
				</select>
			</td>
			<td className="px-4 py-3">
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						checked={group.enabled}
						onChange={(e) => onToggleEnabled(group.id, e.target.checked)}
						className="sr-only peer"
					/>
					<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
				</label>
			</td>
			<td className="px-4 py-3 text-sm text-gray-500">
				{formatDate(group.lastScrapedAt)}
			</td>
			<td className="px-4 py-3 text-right">
				<button
					type="button"
					onClick={() => onDelete(group.id)}
					className="text-sm text-red-600 hover:text-red-800"
				>
					Delete
				</button>
			</td>
		</tr>
	);
}
