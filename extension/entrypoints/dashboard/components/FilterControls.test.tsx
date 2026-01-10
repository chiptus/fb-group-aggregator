import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "wxt/utils/storage";
import type { FilterSettings } from "@/lib/filters/types";
import { FilterControls } from "./FilterControls";

// Mock WXT storage
vi.mock("wxt/utils/storage", () => ({
	storage: {
		getItem: vi.fn(),
		setItem: vi.fn(),
	},
}));

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
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("FilterControls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(storage.getItem).mockResolvedValue(defaultFilters);
		vi.mocked(storage.setItem).mockResolvedValue(undefined);
	});

	it("should render keyword input and add button", () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		expect(screen.getByPlaceholderText(/add keyword/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
	});

	it("should have positive/negative keyword toggle", () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		expect(
			screen.getByRole("radio", { name: /positive/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: /negative/i }),
		).toBeInTheDocument();
	});

	it("should add positive keyword when button clicked", async () => {
		const updatedFilters: FilterSettings = {
			...defaultFilters,
			positiveKeywords: ["apartment"],
		};

		// Update mock to return new filters after mutation
		vi.mocked(storage.getItem).mockResolvedValueOnce(defaultFilters);
		vi.mocked(storage.setItem).mockImplementation(async () => {
			vi.mocked(storage.getItem).mockResolvedValue(updatedFilters);
		});

		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(storage.setItem).toHaveBeenCalledWith(
				"local:filterSettings",
				updatedFilters,
			);
		});
	});

	it("should add negative keyword when negative toggle selected", async () => {
		const updatedFilters: FilterSettings = {
			...defaultFilters,
			negativeKeywords: ["sold"],
		};

		render(<FilterControls />, { wrapper: createWrapper() });

		const negativeToggle = screen.getByRole("radio", { name: /negative/i });
		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.click(negativeToggle);
		fireEvent.change(input, { target: { value: "sold" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(storage.setItem).toHaveBeenCalledWith(
				"local:filterSettings",
				updatedFilters,
			);
		});
	});

	it("should clear input after adding keyword", async () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(
			/add keyword/i,
		) as HTMLInputElement;
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(input.value).toBe("");
		});
	});

	it("should not add empty keyword", () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.click(addButton);

		// No error should be thrown, button just doesn't do anything
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("should have case-sensitive toggle", () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		expect(
			screen.getByRole("checkbox", { name: /case.sensitive/i }),
		).toBeInTheDocument();
	});

	it("should have search fields selection", () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		expect(
			screen.getByRole("checkbox", { name: /content/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: /author/i }),
		).toBeInTheDocument();
	});

	it("should allow adding keyword with Enter key", async () => {
		const updatedFilters: FilterSettings = {
			...defaultFilters,
			positiveKeywords: ["apartment"],
		};

		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);

		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

		await waitFor(() => {
			expect(storage.setItem).toHaveBeenCalledWith(
				"local:filterSettings",
				updatedFilters,
			);
		});
	});

	it("should trim whitespace from keywords", async () => {
		const updatedFilters: FilterSettings = {
			...defaultFilters,
			positiveKeywords: ["apartment"],
		};

		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.change(input, { target: { value: "  apartment  " } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(storage.setItem).toHaveBeenCalledWith(
				"local:filterSettings",
				updatedFilters,
			);
		});
	});

	it("should not add duplicate keywords", async () => {
		const filtersWithKeyword: FilterSettings = {
			...defaultFilters,
			positiveKeywords: ["apartment"],
		};

		// First getItem returns existing keyword, subsequent calls return same
		vi.mocked(storage.getItem).mockResolvedValue(filtersWithKeyword);

		render(<FilterControls />, { wrapper: createWrapper() });

		// Clear mocks after initial render
		await waitFor(() => {
			expect(screen.getByPlaceholderText(/add keyword/i)).toBeInTheDocument();
		});
		vi.mocked(storage.setItem).mockClear();

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		// Try to add duplicate keyword
		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		// Wait a bit for potential mutation
		await new Promise((resolve) => setTimeout(resolve, 100));

		// setItem should NOT have been called (duplicate prevented)
		expect(storage.setItem).not.toHaveBeenCalled();
	});
});
