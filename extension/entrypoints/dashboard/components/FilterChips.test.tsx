import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterSettings } from "@/lib/filters/types";
import { FilterChips } from "./FilterChips";

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

const mockFilters: FilterSettings = {
	positiveKeywords: ["apartment", "2br"],
	negativeKeywords: ["sold", "pending"],
	caseSensitive: false,
	searchFields: ["contentHtml", "authorName"],
};

describe("FilterChips", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should display positive keyword chips", () => {
		render(<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("apartment")).toBeInTheDocument();
		expect(screen.getByText("2br")).toBeInTheDocument();
	});

	it("should display negative keyword chips", () => {
		render(<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("sold")).toBeInTheDocument();
		expect(screen.getByText("pending")).toBeInTheDocument();
	});

	it("should show positive and negative sections with labels", () => {
		render(<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText(/positive/i)).toBeInTheDocument();
		expect(screen.getByText(/negative/i)).toBeInTheDocument();
	});

	it("should call onRemoveKeyword when chip remove button clicked", () => {
		const handleRemove = vi.fn();

		render(
			<FilterChips filters={mockFilters} onRemoveKeyword={handleRemove} />,
			{
				wrapper: createWrapper(),
			},
		);

		const removeButtons = screen.getAllByRole("button", { name: /remove/i });
		fireEvent.click(removeButtons[0]);

		expect(handleRemove).toHaveBeenCalledTimes(1);
	});

	it("should pass correct keyword and type to onRemoveKeyword", () => {
		const handleRemove = vi.fn();

		render(
			<FilterChips filters={mockFilters} onRemoveKeyword={handleRemove} />,
			{
				wrapper: createWrapper(),
			},
		);

		// Find the remove button for "apartment" (first positive keyword)
		const apartmentChip = screen.getByText("apartment").closest("div");
		const removeButton = apartmentChip?.querySelector("button");

		if (removeButton) {
			fireEvent.click(removeButton);
		}

		expect(handleRemove).toHaveBeenCalledWith("apartment", "positive");
	});

	it("should show empty state when no keywords", () => {
		const emptyFilters: FilterSettings = {
			positiveKeywords: [],
			negativeKeywords: [],
			caseSensitive: false,
			searchFields: ["contentHtml"],
		};

		render(<FilterChips filters={emptyFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText(/no filters/i)).toBeInTheDocument();
	});

	it("should display case-sensitive indicator when enabled", () => {
		const caseSensitiveFilters: FilterSettings = {
			...mockFilters,
			caseSensitive: true,
		};

		render(
			<FilterChips filters={caseSensitiveFilters} onRemoveKeyword={vi.fn()} />,
			{
				wrapper: createWrapper(),
			},
		);

		expect(screen.getByText(/case.sensitive/i)).toBeInTheDocument();
	});

	it("should display search fields indicator", () => {
		render(<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText(/searching.*content.*author/i)).toBeInTheDocument();
	});

	it("should show only content when only contentHtml is selected", () => {
		const contentOnlyFilters: FilterSettings = {
			...mockFilters,
			searchFields: ["contentHtml"],
		};

		render(
			<FilterChips filters={contentOnlyFilters} onRemoveKeyword={vi.fn()} />,
			{
				wrapper: createWrapper(),
			},
		);

		expect(screen.getByText(/searching.*content/i)).toBeInTheDocument();
		expect(screen.queryByText(/author/i)).not.toBeInTheDocument();
	});

	it("should render with accessible remove buttons", () => {
		render(<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const removeButtons = screen.getAllByRole("button", { name: /remove/i });

		// Should have remove button for each keyword (4 total: 2 positive + 2 negative)
		expect(removeButtons).toHaveLength(4);
	});

	it("should visually distinguish positive and negative chips", () => {
		const { container } = render(
			<FilterChips filters={mockFilters} onRemoveKeyword={vi.fn()} />,
			{
				wrapper: createWrapper(),
			},
		);

		// Positive and negative chips should have different styling (tested via class or data attribute)
		const positiveChips = container.querySelectorAll('[data-type="positive"]');
		const negativeChips = container.querySelectorAll('[data-type="negative"]');

		expect(positiveChips.length).toBe(2);
		expect(negativeChips.length).toBe(2);
	});
});
