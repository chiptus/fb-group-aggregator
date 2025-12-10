import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { CreateSubscriptionForm } from "./CreateSubscriptionForm";

// Mock the storage module
vi.mock("@/lib/storage", () => ({
	createSubscription: vi.fn(),
}));

describe("CreateSubscriptionForm", () => {
	function renderWithQuery(ui: React.ReactElement) {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false, gcTime: 0 },
				mutations: { retry: false },
			},
		});

		return render(
			<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
		);
	}

	it("renders with empty input", () => {
		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		expect(input).toHaveValue("");
	});

	it("shows validation error for empty input", async () => {
		const user = userEvent.setup();

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "a");
		await user.clear(input);
		await user.tab();

		await waitFor(() => {
			expect(
				screen.getByText("Subscription name is required"),
			).toBeInTheDocument();
		});
	});

	it("shows validation error for name less than 2 characters", async () => {
		const user = userEvent.setup();

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		await user.type(input, "a");
		await user.tab();

		await waitFor(() => {
			expect(
				screen.getByText("Name must be at least 2 characters"),
			).toBeInTheDocument();
		});
	});

	it("calls mutation on valid submission", async () => {
		const user = userEvent.setup();
		const mockCreate = vi.mocked(storage.createSubscription).mockResolvedValue({
			id: "new-sub",
			name: "Test Sub",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "Test Sub");
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledWith("Test Sub");
		});
	});

	it("calls onSuccess after successful mutation", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		vi.mocked(storage.createSubscription).mockResolvedValue({
			id: "new-sub",
			name: "Test Sub",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={onSuccess} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "Test Sub");
		await user.click(submitButton);

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("calls onCancel when cancel button is clicked", async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={onCancel} />,
		);

		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		await user.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});

	it("disables buttons while mutation is pending", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.createSubscription).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 1000)),
		);

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });
		const cancelButton = screen.getByRole("button", { name: /cancel/i });

		await user.type(input, "Test Sub");
		await user.click(submitButton);

		await waitFor(() => {
			expect(submitButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
		});
	});

	it("shows Creating... text while mutation is pending", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.createSubscription).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 1000)),
		);

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "Test Sub");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Creating...")).toBeInTheDocument();
		});
	});

	it("shows mutation error when mutation fails", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.createSubscription).mockRejectedValue(
			new Error("Network error"),
		);

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "Test Sub");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Network error")).toBeInTheDocument();
		});
	});

	it("trims whitespace from input", async () => {
		const user = userEvent.setup();
		const mockCreate = vi.mocked(storage.createSubscription).mockResolvedValue({
			id: "new-sub",
			name: "Test Sub",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<CreateSubscriptionForm onSuccess={() => {}} onCancel={() => {}} />,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /create/i });

		await user.type(input, "  Test Sub  ");
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledWith("Test Sub");
		});
	});
});
