import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PostGroup as PostGroupType } from "@/lib/grouping/types";
import type { Post } from "@/lib/types";
import { PostGroup } from "./PostGroup";

function createMockPost(id: string, seen = false): Post {
	return {
		id,
		groupId: "group1",
		authorName: `Author ${id}`,
		contentHtml: `<p>Content for post ${id}</p>`,
		timestamp: undefined,
		scrapedAt: Date.now() - Number(id) * 1000,
		seen,
		url: `https://facebook.com/groups/test/posts/${id}`,
		starred: false,
	};
}

function createMockGroup(postIds: string[], seenCount = 0): PostGroupType {
	return {
		id: "group-abc123",
		normalizedContent: "looking for apartment in the city center area",
		postIds,
		firstSeenAt: Date.now() - 10000,
		count: postIds.length,
		seenCount,
		isExpanded: false,
	};
}

describe("PostGroup", () => {
	it("should display group count when collapsed", () => {
		const group = createMockGroup(["1", "2", "3"]);
		const posts = [
			createMockPost("1"),
			createMockPost("2"),
			createMockPost("3"),
		];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => (
					<div data-testid={`post-${post.id}`}>{post.id}</div>
				)}
			/>,
		);

		expect(screen.getByText(/3 similar posts/i)).toBeInTheDocument();
	});

	it("should display normalized content preview", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText(/looking for apartment/i)).toBeInTheDocument();
	});

	it("should call onToggle when expand button clicked", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];
		const onToggle = vi.fn();

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={onToggle}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		const expandButton = screen.getByRole("button", { name: /expand/i });
		fireEvent.click(expandButton);

		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it("should render posts when expanded", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={true}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => (
					<div data-testid={`post-${post.id}`}>{post.id}</div>
				)}
			/>,
		);

		expect(screen.getByTestId("post-1")).toBeInTheDocument();
		expect(screen.getByTestId("post-2")).toBeInTheDocument();
	});

	it("should not render posts when collapsed", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => (
					<div data-testid={`post-${post.id}`}>{post.id}</div>
				)}
			/>,
		);

		expect(screen.queryByTestId("post-1")).not.toBeInTheDocument();
		expect(screen.queryByTestId("post-2")).not.toBeInTheDocument();
	});

	it("should display 'Mark all as seen' button", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /mark all as seen/i }),
		).toBeInTheDocument();
	});

	it("should call onMarkSeen when 'Mark all as seen' clicked", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];
		const onMarkSeen = vi.fn();

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={onMarkSeen}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		const markSeenButton = screen.getByRole("button", {
			name: /mark all as seen/i,
		});
		fireEvent.click(markSeenButton);

		expect(onMarkSeen).toHaveBeenCalledTimes(1);
	});

	it("should show seen count when partially seen", () => {
		const group = createMockGroup(["1", "2", "3"], 1);
		const posts = [
			createMockPost("1", true),
			createMockPost("2", false),
			createMockPost("3", false),
		];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText(/1 of 3 seen/i)).toBeInTheDocument();
	});

	it("should show fully seen indicator", () => {
		const group = createMockGroup(["1", "2"], 2);
		const posts = [createMockPost("1", true), createMockPost("2", true)];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText(/all seen/i)).toBeInTheDocument();
	});

	it("should display collapse button when expanded", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={true}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /collapse/i }),
		).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		const { container } = render(
			<PostGroup
				group={group}
				posts={posts}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
				className="custom-class"
			/>,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});
});
