import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PostGroup as PostGroupType } from "@/lib/grouping/types";
import type { Group, Post } from "@/lib/types";
import { PostGroup } from "./PostGroup";

function createMockPost(id: string, seen = false, groupId = "group1"): Post {
	return {
		id,
		groupId,
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

function createMockGroupsMap(): Map<string, Group> {
	const map = new Map<string, Group>();
	map.set("group1", {
		id: "group1",
		name: "Test Group 1",
		url: "https://facebook.com/groups/test1",
		subscriptionIds: ["sub1"],
		addedAt: Date.now(),
		lastScrapedAt: null,
		enabled: true,
	});
	map.set("group2", {
		id: "group2",
		name: "Test Group 2",
		url: "https://facebook.com/groups/test2",
		subscriptionIds: ["sub1"],
		addedAt: Date.now(),
		lastScrapedAt: null,
		enabled: true,
	});
	return map;
}

describe("PostGroup", () => {
	it("should display group count in footer", () => {
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
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

	it("should display representative post author name", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText("Author 1")).toBeInTheDocument();
	});

	it("should display representative post content", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText(/Content for post 1/i)).toBeInTheDocument();
	});

	it("should call onToggle when 'See other posts' button clicked", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];
		const onToggle = vi.fn();

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={onToggle}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		const expandButton = screen.getByRole("button", { name: /see 1 other/i });
		fireEvent.click(expandButton);

		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it("should render only other posts when expanded (not representative)", () => {
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={true}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => (
					<div data-testid={`post-${post.id}`}>{post.id}</div>
				)}
			/>,
		);

		// Representative post should NOT appear in expanded area
		expect(screen.queryByTestId("post-1")).not.toBeInTheDocument();
		// Other posts should appear
		expect(screen.getByTestId("post-2")).toBeInTheDocument();
		expect(screen.getByTestId("post-3")).toBeInTheDocument();
	});

	it("should not render other posts when collapsed", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
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
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText(/all seen/i)).toBeInTheDocument();
	});

	it("should display 'Hide' button when expanded", () => {
		const group = createMockGroup(["1", "2"]);
		const posts = [createMockPost("1"), createMockPost("2")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={true}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /hide other posts/i }),
		).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		const { container } = render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
				className="custom-class"
			/>,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("should not show expand button for single post groups", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /see.*other/i }),
		).not.toBeInTheDocument();
	});

	it("should show group name in tooltip area", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		expect(screen.getByText("Test Group 1")).toBeInTheDocument();
	});

	it("should have Open on Facebook link", () => {
		const group = createMockGroup(["1"]);
		const posts = [createMockPost("1")];

		render(
			<PostGroup
				group={group}
				posts={posts}
				representativePost={posts[0]}
				groupsMap={createMockGroupsMap()}
				isExpanded={false}
				onToggle={vi.fn()}
				onMarkSeen={vi.fn()}
				renderPost={(post) => <div>{post.id}</div>}
			/>,
		);

		const link = screen.getByRole("link", { name: /open.*facebook/i });
		expect(link).toHaveAttribute(
			"href",
			"https://facebook.com/groups/test/posts/1",
		);
	});
});
