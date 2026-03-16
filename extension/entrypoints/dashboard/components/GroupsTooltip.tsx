import { useState } from "react";
import type { Group } from "@/lib/types";

interface GroupsTooltipProps {
	/** Group IDs that contain this post content */
	groupIds: string[];
	/** Map of group ID to Group object */
	groupsMap: Map<string, Group>;
	/** CSS class name */
	className?: string;
}

export function GroupsTooltip({
	groupIds,
	groupsMap,
	className,
}: GroupsTooltipProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Get unique group names from the group IDs
	const groupNames = groupIds
		.map((id) => groupsMap.get(id)?.name)
		.filter((name): name is string => name !== undefined);

	// Deduplicate names (same content might be in same group multiple times)
	const uniqueNames = [...new Set(groupNames)];

	if (uniqueNames.length === 0) {
		return null;
	}

	// Show first group name, with tooltip for others
	const displayName = uniqueNames[0];
	const hasMore = uniqueNames.length > 1;

	return (
		<span className={`relative inline-block ${className ?? ""}`}>
			<button
				type="button"
				className="text-blue-600 cursor-help bg-transparent border-none p-0 font-inherit"
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setIsOpen(false)}
				aria-describedby={hasMore ? "groups-tooltip" : undefined}
			>
				{displayName}
				{hasMore && (
					<span className="text-gray-500"> +{uniqueNames.length - 1}</span>
				)}
			</button>

			{isOpen && hasMore && (
				<div
					id="groups-tooltip"
					role="tooltip"
					className="absolute z-10 bottom-full left-0 mb-1 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap"
				>
					{uniqueNames.map((name) => (
						<div key={name}>{name}</div>
					))}
				</div>
			)}
		</span>
	);
}
