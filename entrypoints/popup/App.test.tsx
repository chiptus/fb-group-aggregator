import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import App from "./App";

// Mock storage API
vi.mock("@/lib/storage", () => ({
	listSubscriptions: vi.fn(),
	createSubscription: vi.fn(),
	updateSubscription: vi.fn(),
	deleteSubscription: vi.fn(),
	listGroups: vi.fn(),
	createGroup: vi.fn(),
	updateGroup: vi.fn(),
	deleteGroup: vi.fn(),
	listPosts: vi.fn(),
}));

// Helper to render with React Query
function renderWithQuery(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
}

describe("Popup - App", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mocks
		vi.mocked(storage.listSubscriptions).mockResolvedValue([]);
		vi.mocked(storage.listGroups).mockResolvedValue([]);
		vi.mocked(storage.listPosts).mockResolvedValue([]);
	});

	describe("Initial Load", () => {
		it("should render app title", async () => {
			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText("FB Group Aggregator")).toBeInTheDocument();
			});
		});

		it("should load and display data on mount", async () => {
			const mockSubscriptions = [
				{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
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
					id: "post1",
					groupId: "group1",
					authorName: "John Doe",
					contentHtml: "<p>Test post</p>",
					timestamp: Date.now(),
					scrapedAt: Date.now(),
					seen: false,
					url: "https://facebook.com/post1",
				},
			];

			vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);
			vi.mocked(storage.listGroups).mockResolvedValue(mockGroups);
			vi.mocked(storage.listPosts).mockResolvedValue(mockPosts);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(storage.listSubscriptions).toHaveBeenCalled();
				expect(storage.listGroups).toHaveBeenCalled();
				expect(storage.listPosts).toHaveBeenCalled();
			});
		});

		it("should show loading state initially", () => {
			renderWithQuery(<App />);
			expect(screen.getByText(/loading/i)).toBeInTheDocument();
		});

		it("should display unseen posts count", async () => {
			const mockPosts = [
				{
					id: "post1",
					groupId: "group1",
					authorName: "John",
					contentHtml: "<p>Test</p>",
					timestamp: Date.now(),
					scrapedAt: Date.now(),
					seen: false,
					url: "https://facebook.com/post1",
				},
				{
					id: "post2",
					groupId: "group1",
					authorName: "Jane",
					contentHtml: "<p>Test 2</p>",
					timestamp: Date.now(),
					scrapedAt: Date.now(),
					seen: true,
					url: "https://facebook.com/post2",
				},
			];

			vi.mocked(storage.listPosts).mockResolvedValue(mockPosts);

			renderWithQuery(<App />);

			await waitFor(() => {
				// Should show "1" unseen post (post1 is unseen, post2 is seen)
				expect(screen.getByText("1")).toBeInTheDocument();
			});
		});
	});

	describe("Tab Navigation", () => {
		it("should render all tab buttons", async () => {
			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /overview/i }),
				).toBeInTheDocument();
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
				expect(
					screen.getByRole("tab", { name: /groups/i }),
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

			// Click on Groups tab
			await user.click(screen.getByRole("tab", { name: /groups/i }));

			// Should show groups content
			expect(screen.getByText(/manage groups/i)).toBeInTheDocument();
		});
	});

	describe("Overview Tab", () => {
		it('should display "Open Dashboard" button', async () => {
			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /open dashboard/i }),
				).toBeInTheDocument();
			});
		});

		it("should open dashboard in new tab when button clicked", async () => {
			const user = userEvent.setup();
			const mockOpen = vi.fn();

			// Mock chrome.tabs.create
			global.chrome = {
				...global.chrome,
				tabs: {
					create: mockOpen,
				},
			} as unknown as typeof chrome;

			renderWithQuery(<App />);

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
					id: "post1",
					groupId: "group1",
					authorName: "John",
					contentHtml: "<p>Test</p>",
					timestamp: Date.now(),
					scrapedAt: Date.now(),
					seen: false,
					url: "https://facebook.com/post1",
				},
			];

			vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);
			vi.mocked(storage.listGroups).mockResolvedValue(mockGroups);
			vi.mocked(storage.listPosts).mockResolvedValue(mockPosts);

			renderWithQuery(<App />);

			await waitFor(() => {
				// Wait for the overview tab to be loaded
				expect(
					screen.getByRole("button", { name: /open dashboard/i }),
				).toBeInTheDocument();
			});

			// Find all stat cards (they have specific structure)
			const statCards = screen
				.getAllByText(/subscriptions|groups|total posts/i)
				.filter((el) => el.className.includes("text-xs text-gray-600"));

			expect(statCards.length).toBe(3);

			// Verify each stat by finding its parent card and checking the count
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

	describe("Subscriptions Tab", () => {
		it("should display list of subscriptions", async () => {
			const user = userEvent.setup();
			const mockSubscriptions = [
				{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
				{ id: "sub2", name: "Apartments", createdAt: Date.now() },
			];

			vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

			expect(screen.getByText("Tech Jobs")).toBeInTheDocument();
			expect(screen.getByText("Apartments")).toBeInTheDocument();
		});

		it('should show "Add Subscription" button', async () => {
			const user = userEvent.setup();
			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

			expect(
				screen.getByRole("button", { name: /add subscription/i }),
			).toBeInTheDocument();
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

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));
			await user.click(
				screen.getByRole("button", { name: /add subscription/i }),
			);

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

			vi.mocked(storage.listSubscriptions).mockResolvedValue([
				mockSubscription,
			]);
			vi.mocked(storage.updateSubscription).mockResolvedValue({
				...mockSubscription,
				name: "New Name",
			});

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

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

			vi.mocked(storage.listSubscriptions).mockResolvedValue([
				mockSubscription,
			]);
			vi.mocked(storage.deleteSubscription).mockResolvedValue(undefined);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

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
			const user = userEvent.setup();
			vi.mocked(storage.listSubscriptions).mockResolvedValue([]);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /subscriptions/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /subscriptions/i }));

			expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
		});
	});

	describe("Groups Tab", () => {
		it("should display list of groups", async () => {
			const user = userEvent.setup();
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

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /groups/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /groups/i }));

			expect(screen.getByText("Test Group 1")).toBeInTheDocument();
			expect(screen.getByText("Test Group 2")).toBeInTheDocument();
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
			vi.mocked(storage.updateGroup).mockImplementation(
				async (_id, updates) => ({
					...mockGroup,
					...updates,
				}),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /groups/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /groups/i }));

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
			vi.mocked(storage.updateGroup).mockImplementation(
				async (_id, updates) => ({
					...mockGroup,
					...updates,
				}),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /groups/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /groups/i }));

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

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /groups/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /groups/i }));

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
			const user = userEvent.setup();
			vi.mocked(storage.listGroups).mockResolvedValue([]);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /groups/i }),
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /groups/i }));

			expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
		});
	});

	describe("Error Handling", () => {
		it("should display error message if data loading fails", async () => {
			vi.mocked(storage.listSubscriptions).mockRejectedValue(
				new Error("Failed to load"),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
			});
		});
	});
});
