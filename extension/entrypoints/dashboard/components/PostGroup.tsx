import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PostGroup as PostGroupType } from "@/lib/grouping/types";
import { computeGroupProperties } from "@/lib/grouping/types";
import type { Post } from "@/lib/types";

export interface PostGroupProps {
	/** Post group to display */
	group: PostGroupType;

	/** Posts belonging to this group */
	posts: Post[];

	/** Whether group is expanded */
	isExpanded: boolean;

	/** Callback when expand/collapse is toggled */
	onToggle: () => void;

	/** Callback when "Mark as Seen" is clicked */
	onMarkSeen: () => void;

	/** Render function for individual posts within group */
	renderPost: (post: Post) => ReactNode;

	/** CSS class name */
	className?: string;
}

export function PostGroup({
	group,
	posts,
	isExpanded,
	onToggle,
	onMarkSeen,
	renderPost,
	className,
}: PostGroupProps) {
	const computed = computeGroupProperties(group);
	const previewText =
		group.normalizedContent.length > 100
			? `${group.normalizedContent.slice(0, 100)}...`
			: group.normalizedContent;

	return (
		<div
			className={`bg-white rounded-lg shadow border-l-4 ${
				computed.isFullySeen
					? "border-l-gray-300"
					: computed.isPartiallySeen
						? "border-l-yellow-400"
						: "border-l-blue-500"
			} ${className ?? ""}`}
		>
			{/* Header */}
			<div className="p-4 flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-sm font-medium text-gray-900">
							{group.count} similar post{group.count !== 1 ? "s" : ""}
						</span>
						{computed.isFullySeen ? (
							<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
								All seen
							</span>
						) : group.seenCount > 0 ? (
							<span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
								{group.seenCount} of {group.count} seen
							</span>
						) : null}
					</div>
					<p className="text-sm text-gray-600 truncate">{previewText}</p>
				</div>

				<div className="flex items-center gap-2 ml-4">
					{!computed.isFullySeen && (
						<Button
							variant="link"
							size="sm"
							onClick={onMarkSeen}
							aria-label="Mark all as seen"
						>
							Mark all as seen
						</Button>
					)}
					<Button
						variant="primary"
						size="sm"
						onClick={onToggle}
						aria-label={isExpanded ? "Collapse group" : "Expand group"}
					>
						{isExpanded ? "Collapse" : "Expand"}
					</Button>
				</div>
			</div>

			{/* Expanded posts */}
			{isExpanded && (
				<div className="border-t border-gray-200 p-4 space-y-4">
					{posts.map((post) => (
						<div key={post.id}>{renderPost(post)}</div>
					))}
				</div>
			)}
		</div>
	);
}
