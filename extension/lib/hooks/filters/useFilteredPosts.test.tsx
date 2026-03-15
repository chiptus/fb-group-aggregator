import type { UseQueryResult } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterSettings } from "@/lib/filters/types";
import { usePosts } from "@/lib/hooks/storage/usePosts";
import type { Post } from "@/lib/types";
import { useFilteredPosts } from "./useFilteredPosts";
import { useFilters } from "./useFilters";

// Mock dependencies
vi.mock("@/lib/hooks/storage/usePosts");
vi.mock("./useFilters");

const mockPosts: Post[] = [
	{
		id: "1",
		groupId: "g1",
		authorName: "John Doe",
		contentHtml: "<p>Looking for apartment</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		starred: false,
		url: "https://facebook.com/post/1",
	},
	{
		id: "2",
		groupId: "g1",
		authorName: "Jane Smith",
		contentHtml: "<p>Apartment sold</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: false,
		starred: false,
		url: "https://facebook.com/post/2",
	},
	{
		id: "3",
		groupId: "g2",
		authorName: "Bob Johnson",
		contentHtml: "<p>House for sale</p>",
		timestamp: undefined,
		scrapedAt: Date.now(),
		seen: true,
		starred: false,
		url: "https://facebook.com/post/3",
	},
];

const defaultFilters: FilterSettings = {
	positiveKeywords: [],
	negativeKeywords: [],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

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

describe("useFilteredPosts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return all posts when no filters are active", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: defaultFilters,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.data).toEqual(mockPosts);
		expect(result.current.stats).toEqual({
			totalPosts: 3,
			filteredPosts: 3,
			removedPosts: 0,
			efficiency: 100,
		});
	});

	it("should filter posts by positive keywords", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: {
				positiveKeywords: ["apartment"],
				negativeKeywords: [] as string[],
				caseSensitive: false,
				searchFields: ["contentHtml"] as ("contentHtml" | "authorName")[],
			},
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.data).toHaveLength(2); // Posts 1 and 2
		expect(result.current.data?.map((p: Post) => p.id)).toEqual(
			expect.arrayContaining(["1", "2"]),
		);
		expect(result.current.stats?.filteredPosts).toBe(2);
	});

	it("should filter posts by negative keywords", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: {
				positiveKeywords: [] as string[],
				negativeKeywords: ["sold"],
				caseSensitive: false,
				searchFields: ["contentHtml"] as ("contentHtml" | "authorName")[],
			},
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.data).toHaveLength(2); // Posts 1 and 3 (not 2)
		expect(result.current.data?.map((p: Post) => p.id)).not.toContain("2");
	});

	it("should apply negative precedence when both positive and negative filters match", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: {
				positiveKeywords: ["apartment"],
				negativeKeywords: ["sold"],
				caseSensitive: false,
				searchFields: ["contentHtml"] as ("contentHtml" | "authorName")[],
			},
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		// Only post 1 should match (has "apartment" but not "sold")
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].id).toBe("1");
	});

	it("should handle loading state", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: undefined,
			isSuccess: false,
			isPending: true,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: undefined,
			isSuccess: false,
			isPending: true,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it("should handle empty posts array", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: [] as Post[],
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: defaultFilters,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.data).toEqual([]);
		expect(result.current.stats?.totalPosts).toBe(0);
	});

	it("should calculate stats correctly", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: {
				positiveKeywords: ["apartment"],
				negativeKeywords: [] as string[],
				caseSensitive: false,
				searchFields: ["contentHtml"] as ("contentHtml" | "authorName")[],
			},
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.stats).toEqual({
			totalPosts: 3,
			filteredPosts: 2,
			removedPosts: 1,
			efficiency: expect.closeTo(66.67, 0.01),
		});
	});

	it("should return empty array when no posts match filters", () => {
		vi.mocked(usePosts).mockReturnValue({
			data: mockPosts,
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<Post[], Error>);

		vi.mocked(useFilters).mockReturnValue({
			data: {
				positiveKeywords: ["nonexistent"],
				negativeKeywords: [] as string[],
				caseSensitive: false,
				searchFields: ["contentHtml"] as ("contentHtml" | "authorName")[],
			},
			isSuccess: true,
			isPending: false,
			isError: false,
			error: null,
		} as UseQueryResult<FilterSettings, Error>);

		const { result } = renderHook(() => useFilteredPosts(), {
			wrapper: createWrapper(),
		});

		expect(result.current.data).toEqual([]);
		expect(result.current.stats?.filteredPosts).toBe(0);
		expect(result.current.stats?.efficiency).toBe(0);
	});
});
