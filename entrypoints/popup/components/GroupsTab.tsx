import { useState } from "react";
import {
	useDeleteGroup,
	useGroups,
	useUpdateGroup,
} from "@/lib/hooks/storage/useGroups";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";

export function GroupsTab() {
	const groupsQuery = useGroups();
	const subscriptionsQuery = useSubscriptions();
	const updateGroupMutation = useUpdateGroup();
	const deleteGroupMutation = useDeleteGroup();

	const groups = groupsQuery.data ?? [];
	const subscriptions = subscriptionsQuery.data ?? [];
	const [mutationError, setMutationError] = useState<string | null>(null);

	function handleToggleGroup(groupId: string, enabled: boolean) {
		setMutationError(null);
		updateGroupMutation.mutate(
			{
				id: groupId,
				updates: { enabled },
			},
			{
				onError: (err) => {
					const message =
						err instanceof Error ? err.message : "Failed to toggle group";
					setMutationError(message);
				},
			},
		);
	}

	function handleAssignGroupToSubscription(
		groupId: string,
		subscriptionId: string,
	) {
		setMutationError(null);
		const subscriptionIds = subscriptionId ? [subscriptionId] : [];
		updateGroupMutation.mutate(
			{
				id: groupId,
				updates: { subscriptionIds },
			},
			{
				onSuccess: () => {
					setMutationError(null);
				},
				onError: (err) => {
					const message =
						err instanceof Error ? err.message : "Failed to assign group";
					setMutationError(message);
				},
			},
		);
	}

	function handleDeleteGroup(groupId: string) {
		setMutationError(null);
		deleteGroupMutation.mutate(groupId, {
			onError: (err) => {
				const message =
					err instanceof Error ? err.message : "Failed to delete group";
				setMutationError(message);
			},
		});
	}

	const isLoading = groupsQuery.isLoading || subscriptionsQuery.isLoading;
	const error = groupsQuery.error || subscriptionsQuery.error;

	if (isLoading) {
		return (
			<div className="p-4">
				<p className="text-gray-500">Loading groups...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4">
				<p className="text-red-600 text-sm">
					Error loading groups:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		);
	}

	return (
		<div className="p-4">
			<h2 className="text-lg font-semibold mb-4">Manage Groups</h2>

			{mutationError && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
					{mutationError}
				</div>
			)}

			{groups.length === 0 && (
				<p className="text-gray-500 text-sm mb-4">
					No groups yet. Visit Facebook groups to start scraping!
				</p>
			)}

			<div className="space-y-3">
				{groups.map((group) => (
					<div key={group.id} className="border rounded-lg p-3 space-y-2">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="font-medium text-sm">{group.name}</h3>
								<p className="text-xs text-gray-500 truncate">{group.url}</p>
							</div>
							<button
								type="button"
								onClick={() => handleDeleteGroup(group.id)}
								className="text-red-600 hover:text-red-800 text-xs ml-2"
								aria-label={`Delete ${group.name}`}
							>
								Delete
							</button>
						</div>

						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									role="switch"
									checked={group.enabled}
									aria-checked={group.enabled}
									onChange={(e) =>
										handleToggleGroup(group.id, e.target.checked)
									}
									className="rounded"
									aria-label={`Enable ${group.name}`}
								/>
								<span className="text-xs text-gray-600">
									{group.enabled ? "Enabled" : "Disabled"}
								</span>
							</label>

							<select
								value={group.subscriptionIds[0] || ""}
								onChange={(e) =>
									handleAssignGroupToSubscription(group.id, e.target.value)
								}
								className="border rounded px-2 py-1 text-xs"
								aria-label={`Subscription for ${group.name}`}
							>
								<option value="">No subscription</option>
								{subscriptions.map((sub) => (
									<option key={sub.id} value={sub.id}>
										{sub.name}
									</option>
								))}
							</select>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
