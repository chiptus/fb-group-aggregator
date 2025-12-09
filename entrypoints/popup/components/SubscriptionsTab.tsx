import { useState } from "react";
import {
	useCreateSubscription,
	useDeleteSubscription,
	useSubscriptions,
	useUpdateSubscription,
} from "@/lib/hooks/useStorageData";
import type { Subscription } from "@/lib/types";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionListItem } from "./SubscriptionListItem";

export function SubscriptionsTab() {
	const subscriptionsQuery = useSubscriptions();
	const createSubscriptionMutation = useCreateSubscription();
	const updateSubscriptionMutation = useUpdateSubscription();
	const deleteSubscriptionMutation = useDeleteSubscription();

	const subscriptions = subscriptionsQuery.data ?? [];

	const [showSubForm, setShowSubForm] = useState(false);
	const [editingSubId, setEditingSubId] = useState<string | null>(null);
	const [subFormValue, setSubFormValue] = useState("");
	const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

	function handleCreateSubscription() {
		if (!subFormValue.trim()) return;

		createSubscriptionMutation.mutate(subFormValue.trim(), {
			onSuccess: () => {
				setSubFormValue("");
				setShowSubForm(false);
			},
			onError: (err) => {
				console.error("Failed to create subscription:", err);
			},
		});
	}

	function handleCancelForm() {
		setShowSubForm(false);
		setSubFormValue("");
	}

	function handleStartEditSubscription(sub: Subscription) {
		setEditingSubId(sub.id);
		setSubFormValue(sub.name);
	}

	function handleSaveSubscription() {
		if (!editingSubId || !subFormValue.trim()) return;

		updateSubscriptionMutation.mutate(
			{
				id: editingSubId,
				updates: { name: subFormValue.trim() },
			},
			{
				onSuccess: () => {
					setEditingSubId(null);
					setSubFormValue("");
				},
				onError: (err) => {
					console.error("Failed to update subscription:", err);
				},
			},
		);
	}

	function handleCancelEdit() {
		setEditingSubId(null);
		setSubFormValue("");
	}

	function handleConfirmDeleteSubscription() {
		if (!deletingSubId) return;

		deleteSubscriptionMutation.mutate(deletingSubId, {
			onSuccess: () => {
				setDeletingSubId(null);
			},
			onError: (err) => {
				console.error("Failed to delete subscription:", err);
			},
		});
	}

	return (
		<div className="p-4">
			<h2 className="text-lg font-semibold mb-4">Manage Subscriptions</h2>

			{subscriptions.length === 0 && !showSubForm && (
				<p className="text-gray-500 text-sm mb-4">
					No subscriptions yet. Create one to get started!
				</p>
			)}

			<div className="space-y-2">
				{subscriptions.map((sub) => (
					<SubscriptionListItem
						key={sub.id}
						subscription={sub}
						isEditing={editingSubId === sub.id}
						editValue={subFormValue}
						onEditValueChange={setSubFormValue}
						onStartEdit={() => handleStartEditSubscription(sub)}
						onSaveEdit={handleSaveSubscription}
						onCancelEdit={handleCancelEdit}
						onDelete={() => setDeletingSubId(sub.id)}
					/>
				))}
			</div>

			{showSubForm && (
				<SubscriptionForm
					value={subFormValue}
					onValueChange={setSubFormValue}
					onSubmit={handleCreateSubscription}
					onCancel={handleCancelForm}
				/>
			)}

			{!showSubForm && (
				<button
					type="button"
					onClick={() => setShowSubForm(true)}
					className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
				>
					Add Subscription
				</button>
			)}

			<DeleteConfirmationModal
				isOpen={deletingSubId !== null}
				message="Are you sure you want to delete this subscription?"
				onConfirm={handleConfirmDeleteSubscription}
				onCancel={() => setDeletingSubId(null)}
			/>
		</div>
	);
}
