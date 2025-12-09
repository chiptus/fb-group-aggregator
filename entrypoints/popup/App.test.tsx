import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { renderWithQuery } from "@/test/test-utils";
import App from "./App";

vi.mock("@/lib/storage", () => ({
	listSubscriptions: vi.fn(),
	listGroups: vi.fn(),
	listPosts: vi.fn(),
}));

describe("Popup - App", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);
		vi.mocked(storage.listGroups).mockResolvedValue([]);
		vi.mocked(storage.listPosts).mockResolvedValue([]);
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
			expect(screen.getByRole("tab", { name: /groups/i })).toBeInTheDocument();
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

		// Click on Groups tab
		await user.click(screen.getByRole("tab", { name: /groups/i }));

		// Should show groups content
		expect(screen.getByText(/manage groups/i)).toBeInTheDocument();
	});
});
