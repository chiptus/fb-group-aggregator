import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as groupsStorage from "@/lib/storage/groups";
import * as postsStorage from "@/lib/storage/posts";
import * as subscriptionsStorage from "@/lib/storage/subscriptions";
import type { Group, Post, Subscription } from "@/lib/types";
import { renderWithQuery } from "@/test/test-utils";
import App from "./App";

// Mock the storage modules
vi.mock("@/lib/storage/subscriptions", () => ({
	listSubscriptions: vi.fn(),
}));
vi.mock("@/lib/storage/groups", () => ({
	listGroups: vi.fn(),
}));
vi.mock("@/lib/storage/posts", () => ({
	listPosts: vi.fn(),
	markPostAsSeen: vi.fn(),
}));

describe("Dashboard App", () => {
	const mockSubscriptions: Subscription[] = [
		{ id: "sub1", name: "Tech Jobs", createdAt: Date.now() },
		{ id: "sub2", name: "Apartments TLV", createdAt: Date.now() },
	];

	const mockGroups: Group[] = [
		{
			id: "group1",
			name: "React Jobs",
			url: "https://facebook.com/groups/react-jobs",
			subscriptionIds: ["sub1"],
			addedAt: Date.now(),
			lastScrapedAt: Date.now(),
			enabled: true,
		},
		{
			id: "group2",
			name: "TLV Apartments",
			url: "https://facebook.com/groups/tlv-apartments",
			subscriptionIds: ["sub2"],
			addedAt: Date.now(),
			lastScrapedAt: Date.now(),
			enabled: true,
		},
	];

	const mockPosts: Post[] = [
		{
			id: "post1",
			groupId: "group1",
			authorName: "John Doe",
			contentHtml: "Senior React Developer needed",
			timestamp: Date.now() - 1000,
			scrapedAt: Date.now(),
			seen: false,
			url: "https://facebook.com/groups/react-jobs/posts/1",
		},
		{
			id: "post2",
			groupId: "group2",
			authorName: "Jane Smith",
			contentHtml: "3BR apartment in TLV",
			timestamp: Date.now() - 2000,
			scrapedAt: Date.now(),
			seen: false,
			url: "https://facebook.com/groups/tlv-apartments/posts/2",
		},
		{
			id: "post3",
			groupId: "group1",
			authorName: "Bob Wilson",
			contentHtml: "Junior Frontend opening",
			timestamp: Date.now() - 3000,
			scrapedAt: Date.now(),
			seen: true,
			url: "https://facebook.com/groups/react-jobs/posts/3",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(subscriptionsStorage.listSubscriptions).mockResolvedValue(
			mockSubscriptions,
		);
		vi.mocked(groupsStorage.listGroups).mockResolvedValue(mockGroups);
		vi.mocked(postsStorage.listPosts).mockResolvedValue(mockPosts);
	});

	it("should render loading state initially", () => {
		renderWithQuery(<App />);
		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});

	it("should load and display subscriptions", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(screen.getByText("Tech Jobs")).toBeInTheDocument();
			expect(screen.getByText("Apartments TLV")).toBeInTheDocument();
		});
	});

	it("should display all posts when no subscription is selected", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
			expect(screen.getByText(/3BR apartment in TLV/)).toBeInTheDocument();
			expect(screen.getByText(/Junior Frontend opening/)).toBeInTheDocument();
		});
	});

	it("should filter posts by selected subscription", async () => {
		const user = userEvent.setup();
		renderWithQuery(<App />);

		// Wait for initial load
		await waitFor(() => {
			expect(screen.getByText("Tech Jobs")).toBeInTheDocument();
		});

		// Click on Tech Jobs subscription
		await user.click(screen.getByText("Tech Jobs"));

		// Should only show posts from group1 (React Jobs)
		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
			expect(screen.getByText(/Junior Frontend opening/)).toBeInTheDocument();
			expect(
				screen.queryByText(/3BR apartment in TLV/),
			).not.toBeInTheDocument();
		});
	});

	it("should allow marking posts as seen", async () => {
		vi.mocked(postsStorage.markPostAsSeen).mockResolvedValue();
		const user = userEvent.setup();
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
		});

		// Find and click the mark as seen button for post1 (from John Doe)
		const markSeenButton = screen.getByRole("button", {
			name: /Mark post from John Doe as seen/i,
		});
		await user.click(markSeenButton);

		// Should call postsStorage.markPostAsSeen with seen: true
		await waitFor(() => {
			expect(postsStorage.markPostAsSeen).toHaveBeenCalledWith("post1", true);
		});
	});

	it("should allow marking posts as unseen", async () => {
		vi.mocked(postsStorage.markPostAsSeen).mockResolvedValue();
		const user = userEvent.setup();
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(screen.getByText(/Junior Frontend opening/)).toBeInTheDocument();
		});

		// Find and click the mark as unseen button for post3 (from Bob Wilson, which is already seen)
		const markUnseenButton = screen.getByRole("button", {
			name: /Mark post from Bob Wilson as unseen/i,
		});
		await user.click(markUnseenButton);

		// Should call postsStorage.markPostAsSeen with seen: false
		await waitFor(() => {
			expect(postsStorage.markPostAsSeen).toHaveBeenCalledWith("post3", false);
		});
	});

	it("should display unseen post count", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			// 2 unseen posts (post1, post2)
			expect(screen.getByText(/2.*unseen/i)).toBeInTheDocument();
		});
	});

	it("should handle search functionality", async () => {
		const user = userEvent.setup();
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
		});

		// Type in search box
		const searchInput = screen.getByPlaceholderText(/search posts/i);
		await user.type(searchInput, "apartment");

		// Should only show posts matching "apartment"
		await waitFor(() => {
			expect(
				screen.queryByText(/Senior React Developer needed/),
			).not.toBeInTheDocument();
			expect(screen.getByText(/3BR apartment in TLV/)).toBeInTheDocument();
			expect(
				screen.queryByText(/Junior Frontend opening/),
			).not.toBeInTheDocument();
		});
	});

	it("should have link to open Facebook post in new tab", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
		});

		// Check that "Open on Facebook" links have correct attributes
		const openLinks = screen.getAllByText(/open on facebook/i);
		expect(openLinks[0]).toBeInTheDocument();
		expect(openLinks[0]).toHaveAttribute(
			"href",
			"https://facebook.com/groups/react-jobs/posts/1",
		);
		expect(openLinks[0]).toHaveAttribute("target", "_blank");
		expect(openLinks[0]).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("should handle empty state when no posts exist", async () => {
		vi.mocked(postsStorage.listPosts).mockResolvedValue([]);
		renderWithQuery(<App />);

		await waitFor(() => {
			expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
		});
	});

	it("should sort posts by timestamp (newest first)", async () => {
		renderWithQuery(<App />);

		await waitFor(() => {
			const posts = screen.getAllByRole("article");
			// post1 (newest) should be first, post3 (oldest) should be last
			expect(posts[0]).toHaveTextContent(/Senior React Developer needed/);
			expect(posts[2]).toHaveTextContent(/Junior Frontend opening/);
		});
	});

	describe("Error Handling", () => {
		it("should display error message when loading posts fails", async () => {
			vi.mocked(postsStorage.listPosts).mockRejectedValue(
				new Error("Failed to load posts"),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
			});

			// Error should have role="alert" for accessibility
			const errorContainer = screen.getByRole("alert");
			expect(errorContainer).toBeInTheDocument();
		});

		it("should display error message when loading subscriptions fails", async () => {
			vi.mocked(subscriptionsStorage.listSubscriptions).mockRejectedValue(
				new Error("Failed to load subscriptions"),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
			});
		});

		it("should display error message when loading groups fails", async () => {
			vi.mocked(groupsStorage.listGroups).mockRejectedValue(
				new Error("Failed to load groups"),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
			});
		});

		it("should show reload button when error occurs", async () => {
			vi.mocked(postsStorage.listPosts).mockRejectedValue(
				new Error("Failed to load posts"),
			);

			renderWithQuery(<App />);

			await waitFor(() => {
				const reloadButton = screen.getByRole("button", {
					name: /reload page/i,
				});
				expect(reloadButton).toBeInTheDocument();
			});
		});

		it("should reload page when clicking reload button", async () => {
			const reloadFn = vi.fn();
			Object.defineProperty(window, "location", {
				value: { reload: reloadFn },
				writable: true,
			});

			vi.mocked(postsStorage.listPosts).mockRejectedValue(
				new Error("Failed to load posts"),
			);

			const user = userEvent.setup();
			renderWithQuery(<App />);

			await waitFor(() => {
				expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
			});

			const reloadButton = screen.getByRole("button", { name: /reload page/i });
			await user.click(reloadButton);

			expect(reloadFn).toHaveBeenCalled();
		});
	});
});
