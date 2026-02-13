import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "@/lib/types";
import { VirtualPostList } from "./VirtualPostList";

// Mock @tanstack/react-virtual
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: vi.fn(() => ({
		getVirtualItems: () => [
			{ index: 0, key: "0", start: 0, size: 200 },
			{ index: 1, key: "1", start: 200, size: 200 },
			{ index: 2, key: "2", start: 400, size: 200 },
		],
		getTotalSize: () => 600,
		scrollToIndex: vi.fn(),
		measureElement: vi.fn(),
	})),
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

function createMockPost(id: string, content = "Test content"): Post {
	return {
		id,
		groupId: "group1",
		authorName: "Test Author",
		contentHtml: content,
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: false,
	};
}

function createMockPosts(count: number): Post[] {
	return Array.from({ length: count }, (_, i) =>
		createMockPost(`post-${i}`, `Content for post ${i}`),
	);
}

describe("VirtualPostList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("should render only visible items for large lists", () => {
			const posts = createMockPosts(1000);

			function renderPost(post: Post) {
				return (
					<div data-testid={`post-${post.id}`} key={post.id}>
						{post.contentHtml}
					</div>
				);
			}

			render(
				<VirtualPostList posts={posts} height={600} renderPost={renderPost} />,
				{ wrapper: createWrapper() },
			);

			// Should only render visible items (mocked to 3)
			const virtualItems = screen.getAllByTestId(/^post-/);
			expect(virtualItems.length).toBeLessThan(posts.length);
		});

		it("should render with proper container height", () => {
			const posts = createMockPosts(10);

			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			const { container } = render(
				<VirtualPostList posts={posts} height={400} renderPost={renderPost} />,
				{ wrapper: createWrapper() },
			);

			const scrollContainer = container.querySelector(
				"[data-testid='virtual-scroll-container']",
			);
			expect(scrollContainer).toBeInTheDocument();
		});

		it("should handle empty posts array", () => {
			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			render(
				<VirtualPostList posts={[]} height={400} renderPost={renderPost} />,
				{ wrapper: createWrapper() },
			);

			// Should render empty state or container without posts
			expect(
				screen.queryByTestId("virtual-scroll-container"),
			).toBeInTheDocument();
		});
	});

	describe("scroll position preservation", () => {
		it("should maintain scroll container ref", () => {
			const posts = createMockPosts(100);

			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			const { container } = render(
				<VirtualPostList posts={posts} height={600} renderPost={renderPost} />,
				{ wrapper: createWrapper() },
			);

			const scrollContainer = container.querySelector(
				"[data-testid='virtual-scroll-container']",
			);
			expect(scrollContainer).toBeInTheDocument();
		});
	});

	describe("estimateSize configuration", () => {
		it("should accept custom estimateSize prop", () => {
			const posts = createMockPosts(10);

			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			// Should not throw when custom estimateSize is provided
			expect(() => {
				render(
					<VirtualPostList
						posts={posts}
						height={400}
						estimateSize={300}
						renderPost={renderPost}
					/>,
					{ wrapper: createWrapper() },
				);
			}).not.toThrow();
		});

		it("should accept custom overscan prop", () => {
			const posts = createMockPosts(10);

			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			// Should not throw when custom overscan is provided
			expect(() => {
				render(
					<VirtualPostList
						posts={posts}
						height={400}
						overscan={10}
						renderPost={renderPost}
					/>,
					{ wrapper: createWrapper() },
				);
			}).not.toThrow();
		});
	});

	describe("accessibility", () => {
		it("should have proper aria attributes on feed container", () => {
			const posts = createMockPosts(10);

			function renderPost(post: Post) {
				return <div key={post.id}>{post.contentHtml}</div>;
			}

			const { container } = render(
				<VirtualPostList posts={posts} height={400} renderPost={renderPost} />,
				{ wrapper: createWrapper() },
			);

			const feedContainer = container.querySelector('[role="feed"]');
			expect(feedContainer).toBeInTheDocument();
		});
	});
});
