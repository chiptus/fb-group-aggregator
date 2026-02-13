import { useMemo, useState } from "react";
import {
	useBulkDeleteGroups,
	useBulkUpdateGroups,
	useDeleteGroup,
	useGroups,
	useScanGroupsList,
	useUpdateGroup,
} from "@/lib/hooks/storage/useGroups";
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
import { BulkActionsBar } from "./BulkActionsBar";
import { GroupsPageHeader } from "./GroupsPageHeader";
import { GroupsTable } from "./GroupsTable";

export function GroupsPage() {
	const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
		new Set(),
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterSubscriptionId, setFilterSubscriptionId] = useState<
		string | null
	>(null);
	const [bulkSubscriptionId, setBulkSubscriptionId] = useState("");

	// Fetch data
	const groupsQuery = useGroups();
	const subscriptionsQuery = useSubscriptions();

	// Mutations
	const scanGroupsList = useScanGroupsList();
	const updateGroup = useUpdateGroup();
	const deleteGroup = useDeleteGroup();
	const bulkUpdateGroups = useBulkUpdateGroups();
	const bulkDeleteGroups = useBulkDeleteGroups();

	const groups = groupsQuery.data ?? [];
	const subscriptions = subscriptionsQuery.data ?? [];
	const isLoading = groupsQuery.isLoading || subscriptionsQuery.isLoading;

	// Filter and search groups
	const filteredGroups = useMemo(() => {
		let result = groups;

		// Filter by subscription
		if (filterSubscriptionId) {
			result = result.filter((g) =>
				filterSubscriptionId === "unassigned"
					? g.subscriptionIds.length === 0
					: g.subscriptionIds.includes(filterSubscriptionId),
			);
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((g) => g.name.toLowerCase().includes(query));
		}

		return result;
	}, [groups, filterSubscriptionId, searchQuery]);

	// Calculate stats
	const stats = useMemo(() => {
		const total = groups.length;
		const unassigned = groups.filter(
			(g) => g.subscriptionIds.length === 0,
		).length;
		const enabled = groups.filter((g) => g.enabled).length;
		return { total, unassigned, enabled };
	}, [groups]);

	// Handle checkbox toggle
	function handleToggleSelection(groupId: string) {
		setSelectedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) {
				next.delete(groupId);
			} else {
				next.add(groupId);
			}
			return next;
		});
	}

	// Handle select all
	function handleSelectAll() {
		if (selectedGroupIds.size === filteredGroups.length) {
			setSelectedGroupIds(new Set());
		} else {
			setSelectedGroupIds(new Set(filteredGroups.map((g) => g.id)));
		}
	}

	// Handle bulk assign to subscription
	function handleBulkAssign() {
		if (!bulkSubscriptionId || selectedGroupIds.size === 0) return;

		bulkUpdateGroups.mutate(
			{
				groupIds: Array.from(selectedGroupIds),
				updates: { subscriptionIds: [bulkSubscriptionId], enabled: true },
			},
			{
				onSuccess: () => {
					setSelectedGroupIds(new Set());
					setBulkSubscriptionId("");
				},
			},
		);
	}

	// Handle bulk enable/disable
	function handleBulkToggleEnabled(enabled: boolean) {
		if (selectedGroupIds.size === 0) return;

		bulkUpdateGroups.mutate(
			{
				groupIds: Array.from(selectedGroupIds),
				updates: { enabled },
			},
			{
				onSuccess: () => {
					setSelectedGroupIds(new Set());
				},
			},
		);
	}

	// Handle bulk delete
	function handleBulkDelete() {
		if (selectedGroupIds.size === 0) return;

		if (
			!confirm(
				`Delete ${selectedGroupIds.size} group(s)? This will also delete all posts from these groups.`,
			)
		) {
			return;
		}

		bulkDeleteGroups.mutate(Array.from(selectedGroupIds), {
			onSuccess: () => {
				setSelectedGroupIds(new Set());
			},
		});
	}

	// Handle individual group toggle
	function handleToggleGroup(groupId: string, enabled: boolean) {
		updateGroup.mutate({ id: groupId, updates: { enabled } });
	}

	// Handle individual group assignment
	function handleAssignGroup(groupId: string, subscriptionId: string) {
		const subscriptionIds = subscriptionId ? [subscriptionId] : [];
		const enabled = !!subscriptionId;
		updateGroup.mutate({ id: groupId, updates: { subscriptionIds, enabled } });
	}

	// Handle individual group delete
	function handleDeleteGroup(groupId: string) {
		if (!confirm("Delete this group? This will also delete all its posts.")) {
			return;
		}
		deleteGroup.mutate(groupId);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">Loading groups...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<GroupsPageHeader
				stats={stats}
				searchQuery={searchQuery}
				filterSubscriptionId={filterSubscriptionId}
				subscriptions={subscriptions}
				scanGroupsList={scanGroupsList}
				onSearchChange={setSearchQuery}
				onFilterChange={setFilterSubscriptionId}
			/>

			{selectedGroupIds.size > 0 && (
				<BulkActionsBar
					selectedCount={selectedGroupIds.size}
					bulkSubscriptionId={bulkSubscriptionId}
					subscriptions={subscriptions}
					onBulkSubscriptionChange={setBulkSubscriptionId}
					onBulkAssign={handleBulkAssign}
					onBulkEnable={() => handleBulkToggleEnabled(true)}
					onBulkDisable={() => handleBulkToggleEnabled(false)}
					onBulkDelete={handleBulkDelete}
				/>
			)}

			<GroupsTable
				groups={filteredGroups}
				subscriptions={subscriptions}
				selectedGroupIds={selectedGroupIds}
				onSelectAll={handleSelectAll}
				onToggleSelection={handleToggleSelection}
				onToggleEnabled={handleToggleGroup}
				onAssign={handleAssignGroup}
				onDelete={handleDeleteGroup}
			/>
		</div>
	);
}
