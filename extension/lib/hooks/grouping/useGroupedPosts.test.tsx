import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "@/lib/types";
import { useGroupedPosts } from "./useGroupedPosts";

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

function createMockPost(id: string, content: string, seen = false): Post {
	return {
		id,
		groupId: "group1",
		authorName: "Test Author",
		contentHtml: content,
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: false,
	};
}

describe("useGroupedPosts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return grouped posts data", async () => {
		const posts = [
			createMockPost("1", "Looking for apartment in the city"),
			createMockPost("2", "Looking for apartment in the city"),
			createMockPost("3", "Selling my car in good condition"),
		];

		const { result } = renderHook(() => useGroupedPosts(posts), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});

		expect(result.current.data?.totalGroups).toBe(1);
	});

	it("should provide service instance", () => {
		const posts = [createMockPost("1", "Some content here is long")];

		const { result } = renderHook(() => useGroupedPosts(posts), {
			wrapper: createWrapper(),
		});

		expect(result.current.service).toBeDefined();
		expect(result.current.service.strategy.name).toBe("exact-match");
	});

	it("should manage expansion state", async () => {
		const posts = [
			createMockPost("1", "Looking for apartment in the city"),
			createMockPost("2", "Looking for apartment in the city"),
		];

		const { result } = renderHook(() => useGroupedPosts(posts), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});

		const groupId = result.current.data?.groups[0]?.id;
		expect(groupId).toBeDefined();

		// Initially collapsed
		expect(result.current.expansionState.get(groupId!)).toBeUndefined();

		// Toggle expansion
		act(() => {
			result.current.toggleExpanded(groupId!);
		});

		expect(result.current.expansionState.get(groupId!)).toBe(true);

		// Toggle again to collapse
		act(() => {
			result.current.toggleExpanded(groupId!);
		});

		expect(result.current.expansionState.get(groupId!)).toBe(false);
	});

	it("should handle empty posts array", async () => {
		const { result } = renderHook(() => useGroupedPosts([]), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});

		expect(result.current.data?.totalGroups).toBe(0);
		expect(result.current.data?.groups).toHaveLength(0);
	});

	it("should update when posts change", async () => {
		const initialPosts = [
			createMockPost("1", "Looking for apartment in the city"),
			createMockPost("2", "Looking for apartment in the city"),
		];

		const { result, rerender } = renderHook(
			(props: { posts: Post[] }) => useGroupedPosts(props.posts),
			{
				wrapper: createWrapper(),
				initialProps: { posts: initialPosts },
			},
		);

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});

		expect(result.current.data?.totalGroups).toBe(1);

		// Add more posts with same content
		const updatedPosts = [
			...initialPosts,
			createMockPost("3", "Looking for apartment in the city"),
		];

		rerender({ posts: updatedPosts });

		await waitFor(() => {
			expect(result.current.data?.groups[0]?.count).toBe(3);
		});
	});
});
