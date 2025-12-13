export function BulkActionsBar({
	selectedCount,
	bulkSubscriptionId,
	subscriptions,
	onBulkSubscriptionChange,
	onBulkAssign,
	onBulkEnable,
	onBulkDisable,
	onBulkDelete,
}: {
	selectedCount: number;
	bulkSubscriptionId: string;
	subscriptions: Array<{ id: string; name: string }>;
	onBulkSubscriptionChange: (subscriptionId: string) => void;
	onBulkAssign: () => void;
	onBulkEnable: () => void;
	onBulkDisable: () => void;
	onBulkDelete: () => void;
}) {
	return (
		<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-blue-900">
					{selectedCount} group(s) selected
				</span>
				<div className="flex gap-2">
					<select
						value={bulkSubscriptionId}
						onChange={(e) => onBulkSubscriptionChange(e.target.value)}
						className="px-3 py-1 text-sm border border-blue-300 rounded"
					>
						<option value="">Choose subscription...</option>
						{subscriptions.map((sub) => (
							<option key={sub.id} value={sub.id}>
								{sub.name}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={onBulkAssign}
						disabled={!bulkSubscriptionId}
						className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Assign
					</button>
					<button
						type="button"
						onClick={onBulkEnable}
						className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
					>
						Enable
					</button>
					<button
						type="button"
						onClick={onBulkDisable}
						className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
					>
						Disable
					</button>
					<button
						type="button"
						onClick={onBulkDelete}
						className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
