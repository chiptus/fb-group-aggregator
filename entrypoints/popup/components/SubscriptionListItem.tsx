import type { Subscription } from "@/lib/types";

interface SubscriptionListItemProps {
	subscription: Subscription;
	isEditing: boolean;
	editValue: string;
	onEditValueChange: (value: string) => void;
	onStartEdit: () => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onDelete: () => void;
}

export function SubscriptionListItem({
	subscription,
	isEditing,
	editValue,
	onEditValueChange,
	onStartEdit,
	onSaveEdit,
	onCancelEdit,
	onDelete,
}: SubscriptionListItemProps) {
	return (
		<div className="border rounded-lg p-3 flex items-center justify-between">
			{isEditing ? (
				<div className="flex-1 flex items-center gap-2">
					<input
						type="text"
						value={editValue}
						onChange={(e) => onEditValueChange(e.target.value)}
						className="flex-1 border rounded px-2 py-1 text-sm"
						placeholder="Subscription name"
					/>
					<button
						type="button"
						onClick={onSaveEdit}
						className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
					>
						Save
					</button>
					<button
						type="button"
						onClick={onCancelEdit}
						className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
					>
						Cancel
					</button>
				</div>
			) : (
				<>
					<span className="font-medium text-sm">{subscription.name}</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onStartEdit}
							className="text-blue-600 hover:text-blue-800 text-sm"
							aria-label={`Edit ${subscription.name}`}
						>
							Edit
						</button>
						<button
							type="button"
							onClick={onDelete}
							className="text-red-600 hover:text-red-800 text-sm"
							aria-label={`Delete ${subscription.name}`}
						>
							Delete
						</button>
					</div>
				</>
			)}
		</div>
	);
}
