import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import type { Group, Post } from "@/lib/types";

interface PostCardProps {
	post: Post;
	group?: Group;
	onToggleSeen: (postId: string, currentSeen: boolean) => void;
}

export function PostCard({ post, group, onToggleSeen }: PostCardProps) {
	return (
		<article className="bg-white rounded-lg shadow p-6">
			<div className="flex justify-between items-start mb-3">
				<div>
					<h3 className="font-semibold text-gray-900">{post.authorName}</h3>
					<p className="text-sm text-gray-500">
						{group && <span className="text-blue-600">{group.name} • </span>}
						{new Date(post.timestamp).toLocaleString()}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => onToggleSeen(post.id, post.seen)}
						aria-label={
							post.seen
								? `Mark post from ${post.authorName} as unseen`
								: `Mark post from ${post.authorName} as seen`
						}
						variant="link"
						size="sm"
					>
						{post.seen ? "Mark as unseen" : "Mark as seen"}
					</Button>
				</div>
			</div>
			<div
				className="prose max-w-none mb-3"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(post.contentHtml),
				}}
			/>
			<a
				href={post.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`Open post from ${post.authorName} on Facebook in new tab`}
				className="text-sm text-blue-600 hover:text-blue-800"
			>
				Open on Facebook
			</a>
		</article>
	);
}
