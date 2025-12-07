import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Group, Post, Subscription } from "@/lib/types";
import App from "./App";

// Mock the storage module
vi.mock("@/lib/storage", () => ({
	listSubscriptions: vi.fn(),
	listGroups: vi.fn(),
	listPosts: vi.fn(),
	markPostAsSeen: vi.fn(),
}));

import * as storage from "@/lib/storage";

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
		vi.mocked(storage.listSubscriptions).mockResolvedValue(mockSubscriptions);
		vi.mocked(storage.listGroups).mockResolvedValue(mockGroups);
		vi.mocked(storage.listPosts).mockResolvedValue(mockPosts);
	});

	it("should render loading state initially", () => {
		render(<App />);
		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});

	it("should load and display subscriptions", async () => {
		render(<App />);

		await waitFor(() => {
			expect(screen.getByText("Tech Jobs")).toBeInTheDocument();
			expect(screen.getByText("Apartments TLV")).toBeInTheDocument();
		});
	});

	it("should display all posts when no subscription is selected", async () => {
		render(<App />);

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
		render(<App />);

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
		vi.mocked(storage.markPostAsSeen).mockResolvedValue();
		const user = userEvent.setup();
		render(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
		});

		// Find and click the mark as seen button for post1
		const markSeenButtons = screen.getAllByRole("button", {
			name: /mark as seen/i,
		});
		await user.click(markSeenButtons[0]);

		// Should call storage.markPostAsSeen with seen: true
		await waitFor(() => {
			expect(storage.markPostAsSeen).toHaveBeenCalledWith("post1", true);
		});
	});

	it("should allow marking posts as unseen", async () => {
		vi.mocked(storage.markPostAsSeen).mockResolvedValue();
		const user = userEvent.setup();
		render(<App />);

		await waitFor(() => {
			expect(screen.getByText(/Junior Frontend opening/)).toBeInTheDocument();
		});

		// Find and click the mark as unseen button for post3 (which is already seen)
		const markUnseenButtons = screen.getAllByRole("button", {
			name: /mark as unseen/i,
		});
		await user.click(markUnseenButtons[0]);

		// Should call storage.markPostAsSeen with seen: false
		await waitFor(() => {
			expect(storage.markPostAsSeen).toHaveBeenCalledWith("post3", false);
		});
	});

	it("should display unseen post count", async () => {
		render(<App />);

		await waitFor(() => {
			// 2 unseen posts (post1, post2)
			expect(screen.getByText(/2.*unseen/i)).toBeInTheDocument();
		});
	});

	it("should handle search functionality", async () => {
		const user = userEvent.setup();
		render(<App />);

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

	it("should open Facebook post in new tab when clicking on post", async () => {
		const user = userEvent.setup();
		const windowOpenSpy = vi
			.spyOn(window, "open")
			.mockImplementation(() => null);

		render(<App />);

		await waitFor(() => {
			expect(
				screen.getByText(/Senior React Developer needed/),
			).toBeInTheDocument();
		});

		// Click on "Open on Facebook" link
		const openLinks = screen.getAllByText(/open on facebook/i);
		await user.click(openLinks[0]);

		expect(windowOpenSpy).toHaveBeenCalledWith(
			"https://facebook.com/groups/react-jobs/posts/1",
			"_blank",
		);

		windowOpenSpy.mockRestore();
	});

	it("should handle empty state when no posts exist", async () => {
		vi.mocked(storage.listPosts).mockResolvedValue([]);
		render(<App />);

		await waitFor(() => {
			expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
		});
	});

	it("should sort posts by timestamp (newest first)", async () => {
		render(<App />);

		await waitFor(() => {
			const posts = screen.getAllByRole("article");
			// post1 (newest) should be first, post3 (oldest) should be last
			expect(posts[0]).toHaveTextContent(/Senior React Developer needed/);
			expect(posts[2]).toHaveTextContent(/Junior Frontend opening/);
		});
	});
});
