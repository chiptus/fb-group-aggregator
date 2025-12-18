import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test/test-utils";
import { PopupHeader } from "./PopupHeader";

vi.mock("@/lib/storage/posts", () => ({
	listPosts: vi.fn(),
}));

import * as postsStorage from "@/lib/storage/posts";

describe("PopupHeader", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postsStorage.listPosts).mockResolvedValue([]);
	});

	it("should render title", async () => {
		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("FB Group Aggregator")).toBeInTheDocument();
		});
	});

	it("should display unseen posts count", async () => {
		const mockPosts = [
			{
				id: "123456789012345",
				groupId: "group1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: false,
				url: "https://facebook.com/123456789012345",
			},
			{
				id: "234567890123456",
				groupId: "group1",
				authorName: "Jane",
				contentHtml: "<p>Test 2</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: true,
				url: "https://facebook.com/234567890123456",
			},
		];

		vi.mocked(postsStorage.listPosts).mockResolvedValue(mockPosts);

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			// Should show "1" unseen post (post1 is unseen, post2 is seen)
			expect(screen.getByText("1")).toBeInTheDocument();
		});
	});

	it("should display zero when no unseen posts", async () => {
		const mockPosts = [
			{
				id: "123456789012345",
				groupId: "group1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: true,
				url: "https://facebook.com/123456789012345",
			},
		];

		vi.mocked(postsStorage.listPosts).mockResolvedValue(mockPosts);

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("0")).toBeInTheDocument();
		});
	});

	it("should display loading state", () => {
		vi.mocked(postsStorage.listPosts).mockImplementation(
			() => new Promise(() => {}),
		);

		renderWithQuery(<PopupHeader />);

		expect(screen.getByText("...")).toBeInTheDocument();
	});

	it("should display error state", async () => {
		vi.mocked(postsStorage.listPosts).mockRejectedValue(
			new Error("Failed to fetch posts"),
		);

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("-")).toBeInTheDocument();
			expect(
				screen.getByText(/Error: Failed to fetch posts/i),
			).toBeInTheDocument();
		});
	});

	it("should display generic error when error is not an Error instance", async () => {
		vi.mocked(postsStorage.listPosts).mockRejectedValue("Unknown error");

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("-")).toBeInTheDocument();
			expect(screen.getByText(/Error: Failed to load/i)).toBeInTheDocument();
		});
	});
});
