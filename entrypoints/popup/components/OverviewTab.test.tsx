import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as groupsStorage from "@/lib/storage/groups";
import * as postsStorage from "@/lib/storage/posts";
import * as subscriptionsStorage from "@/lib/storage/subscriptions";
import { renderWithQuery } from "@/test/test-utils";
import { OverviewTab } from "./OverviewTab";

vi.mock("@/lib/storage/subscriptions", () => ({
	listSubscriptions: vi.fn(),
}));

vi.mock("@/lib/storage/groups", () => ({
	listGroups: vi.fn(),
}));

vi.mock("@/lib/storage/posts", () => ({
	listPosts: vi.fn(),
}));

describe("OverviewTab", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(subscriptionsStorage.listSubscriptions).mockResolvedValue([]);
		vi.mocked(groupsStorage.listGroups).mockResolvedValue([]);
		vi.mocked(postsStorage.listPosts).mockResolvedValue([]);
	});

	it('should display "Open Dashboard" button', async () => {
		renderWithQuery(<OverviewTab />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /open dashboard/i }),
			).toBeInTheDocument();
		});
	});

	it("should open dashboard in new tab when button clicked", async () => {
		const user = userEvent.setup();
		const mockOpen = vi.fn();

		global.chrome = {
			...global.chrome,
			tabs: {
				create: mockOpen,
			},
		} as unknown as typeof chrome;

		renderWithQuery(<OverviewTab />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /open dashboard/i }),
			).toBeInTheDocument();
		});

		await user.click(screen.getByRole("button", { name: /open dashboard/i }));

		expect(mockOpen).toHaveBeenCalledWith({ url: "/dashboard.html" });
	});

	it("should display statistics", async () => {
		const mockSubscriptions = [
			{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
			{ id: "sub2", name: "Apartments", createdAt: Date.now() },
		];
		const mockGroups = [
			{
				id: "group1",
				url: "https://facebook.com/groups/test",
				name: "Test Group",
				subscriptionIds: ["sub1"],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
		];
		const mockPosts = [
			{
				id: "123456789012345",
				groupId: "group1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				starred: false,
				url: "https://facebook.com/123456789012345",
			},
		];

		vi.mocked(subscriptionsStorage.listSubscriptions).mockResolvedValue(
			mockSubscriptions,
		);
		vi.mocked(groupsStorage.listGroups).mockResolvedValue(mockGroups);
		vi.mocked(postsStorage.listPosts).mockResolvedValue(mockPosts);

		renderWithQuery(<OverviewTab />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /open dashboard/i }),
			).toBeInTheDocument();
		});

		// Wait for stats to load
		await waitFor(() => {
			const statCards = screen
				.getAllByText(/subscriptions|groups|total posts/i)
				.filter((el) => el.className.includes("text-xs text-gray-600"));

			expect(statCards.length).toBe(3);

			// Verify counts
			const subsCard = statCards.find(
				(el) => el.textContent === "Subscriptions",
			)?.parentElement;
			expect(subsCard).toHaveTextContent("2");

			const groupsCard = statCards.find(
				(el) => el.textContent === "Groups",
			)?.parentElement;
			expect(groupsCard).toHaveTextContent("1");

			const postsCard = statCards.find(
				(el) => el.textContent === "Total Posts",
			)?.parentElement;
			expect(postsCard).toHaveTextContent("1");
		});
	});
});
