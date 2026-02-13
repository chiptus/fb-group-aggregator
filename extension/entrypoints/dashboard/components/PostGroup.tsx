import DOMPurify from "dompurify";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PostGroup as PostGroupType } from "@/lib/grouping/types";
import { computeGroupProperties } from "@/lib/grouping/types";
import type { Group, Post } from "@/lib/types";
import { GroupsTooltip } from "./GroupsTooltip";

export interface PostGroupProps {
	/** Post group to display */
	group: PostGroupType;

	/** Posts belonging to this group */
	posts: Post[];

	/** The representative post to show details for (first/newest post) */
	representativePost: Post;

	/** Map of group IDs to Group objects for tooltip */
	groupsMap: Map<string, Group>;

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
	representativePost,
	groupsMap,
	isExpanded,
	onToggle,
	onMarkSeen,
	renderPost,
	className,
}: PostGroupProps) {
	const computed = computeGroupProperties(group);
	const otherPostsCount = group.count - 1;

	// Get all unique group IDs from posts in this group
	const allGroupIds = [...new Set(posts.map((p) => p.groupId))];

	// Get other posts (excluding the representative post)
	const otherPosts = posts.filter((p) => p.id !== representativePost.id);

	return (
		<article
			className={`bg-white rounded-lg shadow border-l-4 ${
				computed.isFullySeen
					? "border-l-gray-300"
					: computed.isPartiallySeen
						? "border-l-yellow-400"
						: "border-l-blue-500"
			} ${className ?? ""}`}
		>
			{/* Representative post details */}
			<div className="p-6">
				{/* Header with author and actions */}
				<div className="flex justify-between items-start mb-3">
					<div>
						<h3 className="font-semibold text-gray-900">
							{representativePost.authorName}
						</h3>
						<p className="text-sm text-gray-500">
							<GroupsTooltip groupIds={allGroupIds} groupsMap={groupsMap} />
							{" • "}
							Scraped: {new Date(representativePost.scrapedAt).toLocaleString()}
						</p>
					</div>
					<div className="flex gap-2">
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
					</div>
				</div>

				{/* Post content */}
				<div
					className="prose max-w-full mb-3 break-all overflow-hidden"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(representativePost.contentHtml),
					}}
				/>

				{/* Open on Facebook link */}
				<a
					href={representativePost.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Open post from ${representativePost.authorName} on Facebook in new tab`}
					className="text-sm text-blue-600 hover:text-blue-800"
				>
					Open on Facebook
				</a>
			</div>

			{/* Footer with group stats and expand button */}
			<div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-gray-700">
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

				{otherPostsCount > 0 && (
					<Button
						variant="primary"
						size="sm"
						onClick={onToggle}
						aria-label={
							isExpanded
								? "Hide other posts"
								: `See ${otherPostsCount} other post${otherPostsCount !== 1 ? "s" : ""}`
						}
					>
						{isExpanded
							? "Hide"
							: `See ${otherPostsCount} other post${otherPostsCount !== 1 ? "s" : ""}`}
					</Button>
				)}
			</div>

			{/* Expanded: Other posts (not the representative one) */}
			{isExpanded && otherPosts.length > 0 && (
				<div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
					{otherPosts.map((post) => (
						<div key={post.id}>{renderPost(post)}</div>
					))}
				</div>
			)}
		</article>
	);
}
