interface GroupToggleProps {
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	groupName: string;
}

export function GroupToggle({
	enabled,
	onToggle,
	groupName,
}: GroupToggleProps) {
	return (
		<label className="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				role="switch"
				checked={enabled}
				aria-checked={enabled}
				onChange={(e) => onToggle(e.target.checked)}
				className="rounded"
				aria-label={`Enable ${groupName}`}
			/>
			<span className="text-xs text-gray-600">
				{enabled ? "Enabled" : "Disabled"}
			</span>
		</label>
	);
}
