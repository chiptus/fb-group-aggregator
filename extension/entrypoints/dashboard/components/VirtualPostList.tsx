import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useRef } from "react";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface VirtualPostListProps {
	posts: Post[];
	height: number | string;
	estimateSize?: number;
	overscan?: number;
	renderPost: (post: Post, index: number) => ReactNode;
	className?: string;
}

export function VirtualPostList({
	posts,
	height,
	estimateSize = 200,
	overscan = 5,
	renderPost,
	className,
}: VirtualPostListProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: posts.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateSize,
		overscan,
		getItemKey(index) {
			return posts[index]?.id || index;
		},
	});

	// React 19 workaround: store in ref to prevent compiler over-optimization
	// See: https://github.com/TanStack/virtual/issues/743
	const virtualizerRef = useRef(virtualizer);
	virtualizerRef.current = virtualizer;

	const virtualItems = virtualizerRef.current.getVirtualItems();

	return (
		<div
			ref={parentRef}
			data-testid="virtual-scroll-container"
			className={cn("overflow-auto", className)}
			style={{ height }}
		>
			<div
				role="feed"
				aria-label="Facebook group posts"
				className="w-full relative"
				style={{ height: `${virtualizerRef.current.getTotalSize()}px` }}
			>
				{virtualItems.map((virtualItem) => {
					const post = posts[virtualItem.index];
					if (!post) return null;

					return (
						<div
							key={virtualItem.index}
							data-index={virtualItem.index}
							ref={virtualizerRef.current.measureElement}
							className="absolute top-0 left-0 w-full"
							style={{ transform: `translateY(${virtualItem.start}px)` }}
						>
							{renderPost(post, virtualItem.index)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
