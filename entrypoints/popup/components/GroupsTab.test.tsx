import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { renderWithQuery } from "../test-utils";
import { GroupsTab } from "./GroupsTab";

vi.mock("@/lib/storage", () => ({
	listSubscriptions: vi.fn(),
	listGroups: vi.fn(),
	updateGroup: vi.fn(),
	deleteGroup: vi.fn(),
}));

describe("GroupsTab", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);
		vi.mocked(storage.listGroups).mockResolvedValue([]);
	});

	it("should display list of groups", async () => {
		const mockGroups = [
			{
				id: "group1",
				url: "https://facebook.com/groups/test1",
				name: "Test Group 1",
				subscriptionIds: [],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: true,
			},
			{
				id: "group2",
				url: "https://facebook.com/groups/test2",
				name: "Test Group 2",
				subscriptionIds: [],
				addedAt: Date.now(),
				lastScrapedAt: null,
				enabled: false,
			},
		];

		vi.mocked(storage.listGroups).mockResolvedValue(mockGroups);

		renderWithQuery(<GroupsTab />);

		await waitFor(() => {
			expect(screen.getByText("Test Group 1")).toBeInTheDocument();
			expect(screen.getByText("Test Group 2")).toBeInTheDocument();
		});
	});

	it("should toggle group enabled state", async () => {
		const user = userEvent.setup();
		const mockGroup = {
			id: "group1",
			url: "https://facebook.com/groups/test",
			name: "Test Group",
			subscriptionIds: [],
			addedAt: Date.now(),
			lastScrapedAt: null,
			enabled: true,
		};

		vi.mocked(storage.listGroups).mockResolvedValue([mockGroup]);
		vi.mocked(storage.updateGroup).mockImplementation(async (_id, updates) => ({
			...mockGroup,
			...updates,
		}));

		renderWithQuery(<GroupsTab />);

		await waitFor(() => {
			expect(screen.getByText("Test Group")).toBeInTheDocument();
		});

		// Find the toggle switch
		const toggle = screen.getByRole("switch", { name: /enable test group/i });
		expect(toggle).toBeChecked();

		await user.click(toggle);

		await waitFor(() => {
			expect(storage.updateGroup).toHaveBeenCalledWith("group1", {
				enabled: false,
			});
		});
	});

	it("should assign group to subscription", async () => {
		const user = userEvent.setup();
		const mockSubscriptions = [
			{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
		];
		const mockGroup = {
			id: "group1",
			url: "https://facebook.com/groups/test",
			name: "Test Group",
			subscriptionIds: [],
			addedAt: Date.now(),
			lastScrapedAt: null,
			enabled: true,
		};

		vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);
		vi.mocked(storage.listGroups).mockResolvedValue([mockGroup]);
		vi.mocked(storage.updateGroup).mockImplementation(async (_id, updates) => ({
			...mockGroup,
			...updates,
		}));

		renderWithQuery(<GroupsTab />);

		await waitFor(() => {
			expect(screen.getByText("Test Group")).toBeInTheDocument();
		});

		// Find the subscription dropdown
		const select = screen.getByRole("combobox", {
			name: /subscription for test group/i,
		});
		await user.selectOptions(select, "sub1");

		await waitFor(() => {
			expect(storage.updateGroup).toHaveBeenCalledWith("group1", {
				subscriptionIds: ["sub1"],
			});
		});
	});

	it("should delete group", async () => {
		const user = userEvent.setup();
		const mockGroup = {
			id: "group1",
			url: "https://facebook.com/groups/test",
			name: "Test Group",
			subscriptionIds: [],
			addedAt: Date.now(),
			lastScrapedAt: null,
			enabled: true,
		};

		vi.mocked(storage.listGroups).mockResolvedValue([mockGroup]);
		vi.mocked(storage.deleteGroup).mockResolvedValue(undefined);

		renderWithQuery(<GroupsTab />);

		await waitFor(() => {
			expect(screen.getByText("Test Group")).toBeInTheDocument();
		});

		// Click delete button
		const deleteButton = screen.getByRole("button", {
			name: /delete test group/i,
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(storage.deleteGroup).toHaveBeenCalledWith("group1");
		});
	});

	it("should show empty state when no groups", async () => {
		vi.mocked(storage.listGroups).mockResolvedValue([]);

		renderWithQuery(<GroupsTab />);

		await waitFor(() => {
			expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
		});
	});
});
