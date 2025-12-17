import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as groupsStorage from "@/lib/storage/groups";
import * as postsStorage from "@/lib/storage/posts";

import * as subscriptionsStorage from "@/lib/storage/subscriptions";
import { renderWithQuery } from "@/test/test-utils";
import App from "./App";

vi.mock("@/lib/storage/subscriptions", () => ({
	listSubscriptions: vi.fn(),
}));
vi.mock("@/lib/storage/groups", () => ({
	listGroups: vi.fn(),
}));
vi.mock("@/lib/storage/posts", () => ({
	listPosts: vi.fn(),
}));

describe("Popup - App", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(subscriptionsStorage.listSubscriptions).mockResolvedValue([]);
		vi.mocked(groupsStorage.listGroups).mockResolvedValue([]);
		vi.mocked(postsStorage.listPosts).mockResolvedValue([]);
	});

	it("should render app title", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(screen.getByText("FB Group Aggregator")).toBeInTheDocument();
		});
	});

	it("should render all tab buttons", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByRole("tab", { name: /overview/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("tab", { name: /subscriptions/i }),
			).toBeInTheDocument();
		});
	});

	it("should switch between tabs", async () => {
		const user = userEvent.setup();
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByRole("tab", { name: /overview/i }),
			).toBeInTheDocument();
		});

		// Click on Subscriptions tab
		await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

		// Should show subscriptions content
		expect(screen.getByText(/manage subscriptions/i)).toBeInTheDocument();
	});
});
