import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function GroupsPageHeader({
	stats,
	searchQuery,
	filterSubscriptionId,
	subscriptions,
	scanGroupsList,
	onSearchChange,
	onFilterChange,
}: {
	stats: { total: number; enabled: number; unassigned: number };
	searchQuery: string;
	filterSubscriptionId: string | null;
	subscriptions: Array<{ id: string; name: string }>;
	scanGroupsList: UseMutationResult<void, Error, void, unknown>;
	onSearchChange: (query: string) => void;
	onFilterChange: (subscriptionId: string | null) => void;
}) {
	function handleScanGroups() {
		scanGroupsList.mutate();
	}

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="flex items-start justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold">Manage Groups</h2>
					<div className="flex gap-4 mt-2 text-sm text-gray-600">
						<span>Total: {stats.total}</span>
						<span>Enabled: {stats.enabled}</span>
						<span>Unassigned: {stats.unassigned}</span>
					</div>
				</div>
				<Button
					type="button"
					onClick={handleScanGroups}
					disabled={scanGroupsList.isPending}
					variant="primary"
				>
					{scanGroupsList.isPending ? "Scanning..." : "Scan My Groups"}
				</Button>
			</div>

			{/* Search and Filter */}
			<div className="flex gap-4">
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search groups..."
					className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<select
					value={filterSubscriptionId ?? ""}
					onChange={(e) => onFilterChange(e.target.value || null)}
					className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">All Subscriptions</option>
					<option value="unassigned">Unassigned</option>
					{subscriptions.map((sub) => (
						<option key={sub.id} value={sub.id}>
							{sub.name}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}
