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
	const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
	const [mutationError, setMutationError] = useState<string | null>(null);

	function handleCreateSubscription(name: string) {
		setMutationError(null);
		createSubscriptionMutation.mutate(name, {
			onSuccess: () => {
				setShowSubForm(false);
			},
			onError: (err) => {
				const message =
					err instanceof Error ? err.message : "Failed to create subscription";
				setMutationError(message);
			},
		});
	}

	function handleCancelForm() {
		setShowSubForm(false);
	}

	function handleStartEditSubscription(subId: string) {
		setEditingSubId(subId);
	}

	function handleSaveSubscription(name: string) {
		if (!editingSubId) return;

		setMutationError(null);
		updateSubscriptionMutation.mutate(
			{
				id: editingSubId,
				updates: { name },
			},
			{
				onSuccess: () => {
					setEditingSubId(null);
				},
				onError: (err) => {
					const message =
						err instanceof Error
							? err.message
							: "Failed to update subscription";
					setMutationError(message);
				},
			},
		);
	}

	function handleCancelEdit() {
		setEditingSubId(null);
	}

	function handleConfirmDeleteSubscription() {
		if (!deletingSubId) return;

		setMutationError(null);
		deleteSubscriptionMutation.mutate(deletingSubId, {
			onSuccess: () => {
				setDeletingSubId(null);
			},
			onError: (err) => {
				const message =
					err instanceof Error ? err.message : "Failed to delete subscription";
				setMutationError(message);
				setDeletingSubId(null);
			},
		});
	}

	if (subscriptionsQuery.isLoading) {
		return (
			<div className="p-4">
				<p className="text-gray-500">Loading subscriptions...</p>
			</div>
		);
	}

	if (subscriptionsQuery.error) {
		return (
			<div className="p-4">
				<p className="text-red-600 text-sm">
					Error loading subscriptions:{" "}
					{subscriptionsQuery.error instanceof Error
						? subscriptionsQuery.error.message
						: "Unknown error"}
				</p>
			</div>
		);
	}

	return (
		<div className="p-4">
			<h2 className="text-lg font-semibold mb-4">Manage Subscriptions</h2>

			{mutationError && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
					{mutationError}
				</div>
			)}

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
						onStartEdit={() => handleStartEditSubscription(sub.id)}
						onSaveEdit={handleSaveSubscription}
						onCancelEdit={handleCancelEdit}
						onDelete={() => setDeletingSubId(sub.id)}
					/>
				))}
			</div>

			{showSubForm && (
				<SubscriptionForm
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
