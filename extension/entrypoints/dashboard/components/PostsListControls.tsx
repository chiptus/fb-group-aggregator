interface PostsListControlsProps {
	unseenCount: number;
	starredCount: number;
	showOnlyUnseen: boolean;
	onToggleShowOnlyUnseen: (value: boolean) => void;
	showOnlyStarred: boolean;
	onToggleShowOnlyStarred: (value: boolean) => void;
	enableGrouping: boolean;
	onToggleEnableGrouping: (value: boolean) => void;
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
}: PostsListControlsProps) {
	return (
		<div className="flex items-center justify-between mb-4">
			<p className="text-sm text-gray-600" aria-live="polite">
				{unseenCount} unseen post{unseenCount !== 1 ? "s" : ""} • {starredCount}{" "}
				starred post{starredCount !== 1 ? "s" : ""}
			</p>
			<div className="flex gap-4">
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						checked={showOnlyUnseen}
						onChange={(e) => onToggleShowOnlyUnseen(e.target.checked)}
						className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span>Show only unseen</span>
				</label>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						checked={showOnlyStarred}
						onChange={(e) => onToggleShowOnlyStarred(e.target.checked)}
						className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span>Show only starred</span>
				</label>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						checked={enableGrouping}
						onChange={(e) => onToggleEnableGrouping(e.target.checked)}
						className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span>Group similar posts</span>
				</label>
			</div>
		</div>
	);
}
