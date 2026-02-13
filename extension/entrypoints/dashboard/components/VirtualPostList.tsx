import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { Post } from "@/lib/types";

export interface VirtualPostListProps {
	posts: Post[];
	height: number;
	estimateSize?: number;
	overscan?: number;
	renderPost: (post: Post, index: number) => React.ReactNode;
	className?: string;
}

export function VirtualPostList(props: VirtualPostListProps) {
	const {
		posts,
		height,
		estimateSize = 200,
		overscan = 5,
		renderPost,
		className = "",
	} = props;

	const parentRef = useRef<HTMLDivElement>(null);

	// React 19 workaround: wrap virtualizer in useRef to prevent over-optimization
	// See: https://github.com/TanStack/virtual/issues/743
	const virtualizerRef = useRef(
		useVirtualizer({
			count: posts.length,
			getScrollElement: () => parentRef.current,
			estimateSize: () => estimateSize,
			overscan,
		}),
	);

	// Update virtualizer when posts change
	const virtualizer = useVirtualizer({
		count: posts.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateSize,
		overscan,
	});

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<div
			ref={parentRef}
			data-testid="virtual-scroll-container"
			className={`overflow-auto ${className}`}
			style={{ height }}
		>
			<div
				role="feed"
				aria-label="Facebook group posts"
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{virtualItems.map((virtualItem) => {
					const post = posts[virtualItem.index];
					if (!post) return null;

					return (
						<div
							key={post.id}
							data-index={virtualItem.index}
							ref={virtualizer.measureElement}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							{renderPost(post, virtualItem.index)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
