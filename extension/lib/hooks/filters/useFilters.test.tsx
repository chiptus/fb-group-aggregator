import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "wxt/utils/storage";
import type { FilterSettings } from "@/lib/filters/types";
import { useFilters, useSaveFilters } from "./useFilters";

// Mock WXT storage
vi.mock("wxt/utils/storage", () => ({
	storage: {
		getItem: vi.fn(),
		setItem: vi.fn(),
	},
}));

const DEFAULT_FILTERS: FilterSettings = {
	positiveKeywords: [],
	negativeKeywords: [],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useFilters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return default filters when storage is empty", async () => {
		vi.mocked(storage.getItem).mockResolvedValue(null);

		const { result } = renderHook(() => useFilters(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(DEFAULT_FILTERS);
	});

	it("should load filters from storage", async () => {
		const storedFilters: FilterSettings = {
			positiveKeywords: ["apartment", "2br"],
			negativeKeywords: ["sold"],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		vi.mocked(storage.getItem).mockResolvedValue(storedFilters);

		const { result } = renderHook(() => useFilters(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(storedFilters);
		expect(storage.getItem).toHaveBeenCalledWith("local:filterSettings");
	});

	it("should handle loading state", () => {
		vi.mocked(storage.getItem).mockReturnValue(
			new Promise(() => {}), // Never resolves
		);

		const { result } = renderHook(() => useFilters(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isPending).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it("should handle errors gracefully", async () => {
		vi.mocked(storage.getItem).mockRejectedValue(new Error("Storage error"));

		const { result } = renderHook(() => useFilters(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeTruthy();
	});
});

describe("useSaveFilters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should save filters to storage", async () => {
		vi.mocked(storage.getItem).mockResolvedValue(DEFAULT_FILTERS);
		vi.mocked(storage.setItem).mockResolvedValue(undefined);

		const { result } = renderHook(
			() => ({
				filters: useFilters(),
				update: useSaveFilters(),
			}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

		const newFilters: FilterSettings = {
			positiveKeywords: ["test"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		result.current.update.mutate(newFilters);

		await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

		expect(storage.setItem).toHaveBeenCalledWith(
			"local:filterSettings",
			newFilters,
		);
	});

	it("should update query cache on successful mutation", async () => {
		vi.mocked(storage.getItem).mockResolvedValue(DEFAULT_FILTERS);
		vi.mocked(storage.setItem).mockResolvedValue(undefined);

		const { result } = renderHook(
			() => ({
				filters: useFilters(),
				update: useSaveFilters(),
			}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

		const newFilters: FilterSettings = {
			positiveKeywords: ["updated"],
			negativeKeywords: ["test"],
			caseSensitive: true,
			searchFields: ["contentHtml", "authorName"],
		};

		// Update mock to return new filters after mutation
		vi.mocked(storage.getItem).mockResolvedValue(newFilters);

		result.current.update.mutate(newFilters);

		await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

		// Query cache should be updated (after invalidation refetch)
		await waitFor(() =>
			expect(result.current.filters.data).toEqual(newFilters),
		);
	});

	it("should handle mutation errors", async () => {
		vi.mocked(storage.getItem).mockResolvedValue(DEFAULT_FILTERS);
		vi.mocked(storage.setItem).mockRejectedValue(new Error("Save failed"));

		const { result } = renderHook(
			() => ({
				filters: useFilters(),
				update: useSaveFilters(),
			}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

		const newFilters: FilterSettings = {
			positiveKeywords: ["test"],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		result.current.update.mutate(newFilters);

		await waitFor(() => expect(result.current.update.isError).toBe(true));

		expect(result.current.update.error).toBeTruthy();
		// Original data should remain unchanged
		expect(result.current.filters.data).toEqual(DEFAULT_FILTERS);
	});
});
