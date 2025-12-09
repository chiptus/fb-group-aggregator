import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { renderWithQuery } from "../test-utils";
import { SubscriptionsTab } from "./SubscriptionsTab";

vi.mock("@/lib/storage", () => ({
	listSubscriptions: vi.fn(),
	createSubscription: vi.fn(),
	updateSubscription: vi.fn(),
	deleteSubscription: vi.fn(),
}));

describe("SubscriptionsTab", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);
	});

	it("should display list of subscriptions", async () => {
		const mockSubscriptions = [
			{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
			{ id: "sub2", name: "Apartments", createdAt: Date.now() },
		];

		vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(screen.getByText("Tech Jobs")).toBeInTheDocument();
			expect(screen.getByText("Apartments")).toBeInTheDocument();
		});
	});

	it('should show "Add Subscription" button', async () => {
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /add subscription/i }),
			).toBeInTheDocument();
		});
	});

	it("should create new subscription", async () => {
		const user = userEvent.setup();
		const newSubscription = {
			id: "sub1",
			name: "New Sub",
			createdAt: Date.now(),
		};

		vi.mocked(storage.createSubscription).mockResolvedValue(newSubscription);
		vi.mocked(storage.listSubscriptions).mockResolvedValue([newSubscription]);

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /add subscription/i }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("button", { name: /add subscription/i }));

		// Should show form
		const input = screen.getByPlaceholderText(/subscription name/i);
		await user.type(input, "New Sub");

		await user.click(screen.getByRole("button", { name: /create/i }));

		await waitFor(() => {
			expect(storage.createSubscription).toHaveBeenCalledWith("New Sub");
		});
	});

	it("should edit subscription name", async () => {
		const user = userEvent.setup();
		const mockSubscription = {
			id: "sub1",
			name: "Old Name",
			createdAt: Date.now(),
		};

		vi.mocked(storage.listSubscriptions).mockResolvedValue([mockSubscription]);
		vi.mocked(storage.updateSubscription).mockResolvedValue({
			...mockSubscription,
			name: "New Name",
		});

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(screen.getByText("Old Name")).toBeInTheDocument();
		});

		// Click edit button for the subscription
		const editButton = screen.getByRole("button", { name: /edit old name/i });
		await user.click(editButton);

		// Should show edit form
		const input = screen.getByDisplayValue("Old Name");
		await user.clear(input);
		await user.type(input, "New Name");

		await user.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => {
			expect(storage.updateSubscription).toHaveBeenCalledWith("sub1", {
				name: "New Name",
			});
		});
	});

	it("should delete subscription", async () => {
		const user = userEvent.setup();
		const mockSubscription = {
			id: "sub1",
			name: "To Delete",
			createdAt: Date.now(),
		};

		vi.mocked(storage.listSubscriptions).mockResolvedValue([mockSubscription]);
		vi.mocked(storage.deleteSubscription).mockResolvedValue(undefined);

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(screen.getByText("To Delete")).toBeInTheDocument();
		});

		// Click delete button
		const deleteButton = screen.getByRole("button", {
			name: /delete to delete/i,
		});
		await user.click(deleteButton);

		// Should show confirmation
		expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

		// Confirm deletion
		await user.click(screen.getByRole("button", { name: /confirm/i }));

		await waitFor(() => {
			expect(storage.deleteSubscription).toHaveBeenCalledWith("sub1");
		});
	});

	it("should show empty state when no subscriptions", async () => {
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);

		renderWithQuery(<SubscriptionsTab />);

		await waitFor(() => {
			expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
		});
	});
});
