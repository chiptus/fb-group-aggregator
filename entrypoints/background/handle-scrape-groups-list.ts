import { createGroup, listGroups, updateGroup } from "@/lib/storage";
import type { GroupDiscovery, ScrapeGroupsListResponse } from "@/lib/types";

/**
 * Handles SCRAPE_GROUPS_LIST message from content script
 * - Creates new groups with enabled: false, subscriptionIds: []
 * - Updates existing groups (name, URL if changed)
 * - Returns count of new vs updated groups
 */
export async function handleScrapeGroupsList(payload: {
	groups: GroupDiscovery[];
	totalCount: number;
}): Promise<ScrapeGroupsListResponse> {
	const { groups } = payload;

	try {
		// Get existing groups
		const existingGroups = await listGroups();
		const existingGroupsMap = new Map(existingGroups.map((g) => [g.id, g]));

		let newGroupsCount = 0;
		let updatedGroupsCount = 0;

		for (const discoveredGroup of groups) {
			const existingGroup = existingGroupsMap.get(discoveredGroup.id);

			if (existingGroup) {
				// Group exists - update if name or URL changed
				const needsUpdate =
					existingGroup.name !== discoveredGroup.name ||
					existingGroup.url !== discoveredGroup.url;

				if (needsUpdate) {
					await updateGroup(discoveredGroup.id, {
						name: discoveredGroup.name,
						url: discoveredGroup.url,
					});
					updatedGroupsCount++;
				}
			} else {
				// New group - create with defaults
				await createGroup({
					id: discoveredGroup.id,
					name: discoveredGroup.name,
					url: discoveredGroup.url,
					subscriptionIds: [],
					enabled: false,
				});
				newGroupsCount++;
			}
		}

		console.log(
			`[Background] Processed groups list: ${newGroupsCount} new, ${updatedGroupsCount} updated`,
		);

		return {
			success: true,
			newGroupsCount,
			updatedGroupsCount,
		};
	} catch (error) {
		console.error("[Background] Error in handleScrapeGroupsList:", error);
		throw error;
	}
}
