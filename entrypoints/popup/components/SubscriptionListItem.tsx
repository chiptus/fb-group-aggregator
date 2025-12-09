import type { Subscription } from "@/lib/types";

import { SubscriptionForm } from "./SubscriptionForm";

interface SubscriptionListItemProps {
	subscription: Subscription;
	isEditing: boolean;
	onStartEdit: () => void;
	onSaveEdit: (name: string) => void;
	onCancelEdit: () => void;
	onDelete: () => void;
}

export function SubscriptionListItem({
	subscription,
	isEditing,
	onStartEdit,
	onSaveEdit,
	onCancelEdit,
	onDelete,
}: SubscriptionListItemProps) {
	return (
		<div className="border rounded-lg p-3">
			{isEditing ? (
				<SubscriptionForm
					initialValue={subscription.name}
					onSubmit={onSaveEdit}
					onCancel={onCancelEdit}
				/>
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
