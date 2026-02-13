export interface GroupingStatsBannerProps {
	/** Total groups created */
	totalGroups: number;

	/** Total posts grouped */
	totalPostsGrouped: number;

	/** List reduction percentage */
	reductionPercentage: number;

	/** CSS class name */
	className?: string;
}

export function GroupingStatsBanner({
	totalGroups,
	totalPostsGrouped,
	reductionPercentage,
	className,
}: GroupingStatsBannerProps) {
	if (totalGroups === 0) {
		return (
			<output
				aria-live="polite"
				className={`block p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 ${className ?? ""}`}
			>
				No groups found - posts will be displayed individually
			</output>
		);
	}

	const groupText = totalGroups === 1 ? "1 group" : `${totalGroups} groups`;
	const postText =
		totalPostsGrouped === 1
			? "1 post grouped"
			: `${totalPostsGrouped} posts grouped`;

	return (
		<output
			aria-live="polite"
			className={`block p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 ${className ?? ""}`}
		>
			<span className="font-medium">{groupText}</span>
			{" containing "}
			<span className="font-medium">{postText}</span>
			{reductionPercentage > 0 && (
				<>
					{" ("}
					<span className="font-medium">{reductionPercentage}%</span>
					{" reduction)"}
				</>
			)}
		</output>
	);
}
