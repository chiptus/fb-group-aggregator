import { useState } from 'react';
import {
  useBulkDeleteGroups,
  useBulkUpdateGroups,
  useDeleteGroup,
  useScanGroupsList,
  useUpdateGroup,
} from '@/lib/hooks/storage/useGroups';
import { useGroupsPageData } from '@/lib/hooks/storage/useGroupsPageData';
import { BulkActionsBar } from './BulkActionsBar';
import { GroupsPageHeader } from './GroupsPageHeader';
import { GroupsTable } from './GroupsTable';

export function GroupsPage() {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubscriptionId, setFilterSubscriptionId] = useState<
    string | null
  >(null);
  const [bulkSubscriptionId, setBulkSubscriptionId] = useState('');

  const { subscriptions, isLoading, filteredGroups, stats } = useGroupsPageData(
    { filterSubscriptionId, searchQuery }
  );

  const scanGroupsListMutation = useScanGroupsList();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const bulkUpdateGroupsMutation = useBulkUpdateGroups();
  const bulkDeleteGroupsMutation = useBulkDeleteGroups();

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

  function handleSelectAll() {
    if (selectedGroupIds.size === filteredGroups.length) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(filteredGroups.map((g) => g.id)));
    }
  }

  function handleBulkAssign() {
    if (!bulkSubscriptionId || selectedGroupIds.size === 0) return;
    bulkUpdateGroupsMutation.mutate(
      {
        groupIds: Array.from(selectedGroupIds),
        updates: { subscriptionIds: [bulkSubscriptionId], enabled: true },
      },
      {
        onSuccess: () => {
          setSelectedGroupIds(new Set());
          setBulkSubscriptionId('');
        },
      }
    );
  }

  function handleBulkToggleEnabled(enabled: boolean) {
    if (selectedGroupIds.size === 0) return;
    bulkUpdateGroupsMutation.mutate(
      { groupIds: Array.from(selectedGroupIds), updates: { enabled } },
      { onSuccess: () => setSelectedGroupIds(new Set()) }
    );
  }

  function handleBulkDelete() {
    if (selectedGroupIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedGroupIds.size} group(s)? This will also delete all posts from these groups.`
      )
    ) {
      return;
    }
    bulkDeleteGroupsMutation.mutate(Array.from(selectedGroupIds), {
      onSuccess: () => setSelectedGroupIds(new Set()),
    });
  }

  function handleToggleGroup(groupId: string, enabled: boolean) {
    updateGroupMutation.mutate({ id: groupId, updates: { enabled } });
  }

  function handleAssignGroup(groupId: string, subscriptionId: string) {
    const subscriptionIds = subscriptionId ? [subscriptionId] : [];
    const enabled = !!subscriptionId;
    updateGroupMutation.mutate({
      id: groupId,
      updates: { subscriptionIds, enabled },
    });
  }

  function handleDeleteGroup(groupId: string) {
    if (!confirm('Delete this group? This will also delete all its posts.')) {
      return;
    }
    deleteGroupMutation.mutate(groupId);
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
        scanGroupsList={scanGroupsListMutation}
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
