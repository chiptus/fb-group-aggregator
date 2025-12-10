import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { EditSubscriptionForm } from "./EditSubscriptionForm";

// Mock the storage module
vi.mock("@/lib/storage", () => ({
	updateSubscription: vi.fn(),
}));

describe("EditSubscriptionForm", () => {
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

	it("renders with initial name value", () => {
		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Existing Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		expect(input).toHaveValue("Existing Name");
	});

	it("shows validation error for empty input", async () => {
		const user = userEvent.setup();

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Existing Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
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
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Existing Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		await user.clear(input);
		await user.type(input, "a");
		await user.tab();

		await waitFor(() => {
			expect(
				screen.getByText("Name must be at least 2 characters"),
			).toBeInTheDocument();
		});
	});

	it("calls mutation with subscriptionId and updated name", async () => {
		const user = userEvent.setup();
		const mockUpdate = vi.mocked(storage.updateSubscription).mockResolvedValue({
			id: "sub1",
			name: "Updated Name",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });

		await user.clear(input);
		await user.type(input, "Updated Name");
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith("sub1", { name: "Updated Name" });
		});
	});

	it("calls onSuccess after successful mutation", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		vi.mocked(storage.updateSubscription).mockResolvedValue({
			id: "sub1",
			name: "Updated Name",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={onSuccess}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });

		await user.clear(input);
		await user.type(input, "Updated Name");
		await user.click(submitButton);

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("calls onCancel when cancel button is clicked", async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={onCancel}
			/>,
		);

		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		await user.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});

	it("disables buttons while mutation is pending", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.updateSubscription).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 1000)),
		);

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });
		const cancelButton = screen.getByRole("button", { name: /cancel/i });

		await user.clear(input);
		await user.type(input, "Updated Name");
		await user.click(submitButton);

		await waitFor(() => {
			expect(submitButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
		});
	});

	it("shows Saving... text while mutation is pending", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.updateSubscription).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 1000)),
		);

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });

		await user.clear(input);
		await user.type(input, "Updated Name");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Saving...")).toBeInTheDocument();
		});
	});

	it("shows mutation error when mutation fails", async () => {
		const user = userEvent.setup();
		vi.mocked(storage.updateSubscription).mockRejectedValue(
			new Error("Network error"),
		);

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });

		await user.clear(input);
		await user.type(input, "Updated Name");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText("Network error")).toBeInTheDocument();
		});
	});

	it("trims whitespace from input", async () => {
		const user = userEvent.setup();
		const mockUpdate = vi.mocked(storage.updateSubscription).mockResolvedValue({
			id: "sub1",
			name: "Updated Name",
			createdAt: Date.now(),
		});

		renderWithQuery(
			<EditSubscriptionForm
				subscriptionId="sub1"
				initialName="Old Name"
				onSuccess={() => {}}
				onCancel={() => {}}
			/>,
		);

		const input = screen.getByPlaceholderText("Subscription name");
		const submitButton = screen.getByRole("button", { name: /save/i });

		await user.clear(input);
		await user.type(input, "  Updated Name  ");
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith("sub1", { name: "Updated Name" });
		});
	});
});
