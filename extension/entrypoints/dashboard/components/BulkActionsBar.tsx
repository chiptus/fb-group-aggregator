import { Button } from "@/components/ui/button";

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
					<Button
						onClick={onBulkAssign}
						disabled={!bulkSubscriptionId}
						variant="primary"
						size="sm"
					>
						Assign
					</Button>
					<Button
						onClick={onBulkEnable}
						variant="default"
						size="sm"
						className="bg-green-600 hover:bg-green-700 active:bg-green-800"
					>
						Enable
					</Button>
					<Button onClick={onBulkDisable} variant="secondary" size="sm">
						Disable
					</Button>
					<Button onClick={onBulkDelete} variant="destructive" size="sm">
						Delete
					</Button>
				</div>
			</div>
		</div>
	);
}
