import { useState } from "react";
import {
	useDeleteGroup,
	useGroups,
	useUpdateGroup,
} from "@/lib/hooks/storage/useGroups";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import { GroupItem } from "./GroupItem";

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
					<GroupItem
						key={group.id}
						group={group}
						subscriptions={subscriptions}
						onToggle={handleToggleGroup}
						onAssign={handleAssignGroupToSubscription}
						onDelete={handleDeleteGroup}
					/>
				))}
			</div>
		</div>
	);
}
