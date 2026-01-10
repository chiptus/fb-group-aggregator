import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilterControls } from "./FilterControls";

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

describe("FilterControls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("apartment")).toBeInTheDocument();
		});
	});

	it("should add negative keyword when negative toggle selected", async () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		const negativeToggle = screen.getByRole("radio", { name: /negative/i });
		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.click(negativeToggle);
		fireEvent.change(input, { target: { value: "sold" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("sold")).toBeInTheDocument();
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
		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);

		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

		await waitFor(() => {
			expect(screen.getByText("apartment")).toBeInTheDocument();
		});
	});

	it("should trim whitespace from keywords", async () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		fireEvent.change(input, { target: { value: "  apartment  " } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("apartment")).toBeInTheDocument();
		});
	});

	it("should not add duplicate keywords", async () => {
		render(<FilterControls />, { wrapper: createWrapper() });

		const input = screen.getByPlaceholderText(/add keyword/i);
		const addButton = screen.getByRole("button", { name: /add/i });

		// Add first keyword
		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		// Try to add same keyword again
		fireEvent.change(input, { target: { value: "apartment" } });
		fireEvent.click(addButton);

		await waitFor(() => {
			const keywords = screen.getAllByText("apartment");
			expect(keywords).toHaveLength(1);
		});
	});
});
