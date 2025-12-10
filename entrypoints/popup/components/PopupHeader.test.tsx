import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/lib/storage";
import { renderWithQuery } from "@/test/test-utils";
import { PopupHeader } from "./PopupHeader";

vi.mock("@/lib/storage", () => ({
	listPosts: vi.fn(),
}));

describe("PopupHeader", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(storage.listPosts).mockResolvedValue([]);
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

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			// Should show "1" unseen post (post1 is unseen, post2 is seen)
			expect(screen.getByText("1")).toBeInTheDocument();
		});
	});

	it("should display zero when no unseen posts", async () => {
		const mockPosts = [
			{
				id: "post1",
				groupId: "group1",
				authorName: "John",
				contentHtml: "<p>Test</p>",
				timestamp: Date.now(),
				scrapedAt: Date.now(),
				seen: true,
				url: "https://facebook.com/post1",
			},
		];

		vi.mocked(storage.listPosts).mockResolvedValue(mockPosts);

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("0")).toBeInTheDocument();
		});
	});

	it("should display loading state", () => {
		vi.mocked(storage.listPosts).mockImplementation(
			() => new Promise(() => {}),
		);

		renderWithQuery(<PopupHeader />);

		expect(screen.getByText("...")).toBeInTheDocument();
	});

	it("should display error state", async () => {
		vi.mocked(storage.listPosts).mockRejectedValue(
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
		vi.mocked(storage.listPosts).mockRejectedValue("Unknown error");

		renderWithQuery(<PopupHeader />);

		await waitFor(() => {
			expect(screen.getByText("-")).toBeInTheDocument();
			expect(screen.getByText(/Error: Failed to load/i)).toBeInTheDocument();
		});
	});
});
