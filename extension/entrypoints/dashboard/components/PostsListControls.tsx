import { CheckCheck, Eye, Filter, Layers, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TogglePill } from "./TogglePill";

interface PostsListControlsProps {
	unseenCount: number;
	starredCount: number;
	showOnlyUnseen: boolean;
	onToggleShowOnlyUnseen: (value: boolean) => void;
	showOnlyStarred: boolean;
	onToggleShowOnlyStarred: (value: boolean) => void;
	enableGrouping: boolean;
	onToggleEnableGrouping: (value: boolean) => void;
	showFilterPanel: boolean;
	onToggleFilterPanel: () => void;
	activeFilterCount: number;
	onMarkAllSeen: () => void;
}

export function PostsListControls({
	unseenCount,
	starredCount,
	showOnlyUnseen,
	onToggleShowOnlyUnseen,
	showOnlyStarred,
	onToggleShowOnlyStarred,
	enableGrouping,
	onToggleEnableGrouping,
	showFilterPanel,
	onToggleFilterPanel,
	activeFilterCount,
	onMarkAllSeen,
}: PostsListControlsProps) {
	return (
		<div className="flex items-center justify-between mb-3" aria-live="polite">
			<div className="flex items-center gap-1.5 flex-wrap">
				<TogglePill
					active={showOnlyUnseen}
					onClick={() => onToggleShowOnlyUnseen(!showOnlyUnseen)}
					icon={<Eye size={12} />}
					label="Unseen"
					count={unseenCount}
				/>
				<TogglePill
					active={showOnlyStarred}
					onClick={() => onToggleShowOnlyStarred(!showOnlyStarred)}
					icon={<Star size={12} />}
					label="Starred"
					count={starredCount}
				/>
				<TogglePill
					active={enableGrouping}
					onClick={() => onToggleEnableGrouping(!enableGrouping)}
					icon={<Layers size={12} />}
					label="Grouped"
				/>
				<TogglePill
					active={showFilterPanel}
					onClick={onToggleFilterPanel}
					icon={<Filter size={12} />}
					label="Filters"
					count={activeFilterCount}
				/>
			</div>
			{unseenCount > 0 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onMarkAllSeen}
					className="text-xs text-gray-500 hover:text-gray-900 gap-1.5"
				>
					<CheckCheck size={14} />
					Mark all seen
				</Button>
			)}
		</div>
	);
}
