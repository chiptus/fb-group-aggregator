import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Group } from "@/lib/types";
import { GroupItem } from "./GroupItem";

describe("GroupItem", () => {
	const mockGroup: Group = {
		id: "group1",
		name: "Test Group",
		url: "https://facebook.com/groups/test",
		subscriptionIds: ["sub1"],
		addedAt: Date.now(),
		lastScrapedAt: Date.now(),
		enabled: true,
	};

	const mockSubscriptions = [
		{ id: "sub1", name: "Subscription 1", createdAt: Date.now() },
		{ id: "sub2", name: "Subscription 2", createdAt: Date.now() },
	];

	it("renders group name and URL", () => {
		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={() => {}}
				onDelete={() => {}}
			/>,
		);

		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(
			screen.getByText("https://facebook.com/groups/test"),
		).toBeInTheDocument();
	});

	it("passes correct enabled state to GroupToggle", () => {
		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={() => {}}
				onDelete={() => {}}
			/>,
		);

		const toggle = screen.getByRole("switch");
		expect(toggle).toBeChecked();
	});

	it("passes correct subscription to GroupAssignSubscription", () => {
		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={() => {}}
				onDelete={() => {}}
			/>,
		);

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("sub1");
	});

	it("calls onToggle with groupId and new enabled state", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();

		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={onToggle}
				onAssign={() => {}}
				onDelete={() => {}}
			/>,
		);

		const toggle = screen.getByRole("switch");
		await user.click(toggle);

		expect(onToggle).toHaveBeenCalledWith("group1", false);
	});

	it("calls onAssign with groupId and subscriptionId", async () => {
		const user = userEvent.setup();
		const onAssign = vi.fn();

		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={onAssign}
				onDelete={() => {}}
			/>,
		);

		const select = screen.getByRole("combobox");
		await user.selectOptions(select, "sub2");

		expect(onAssign).toHaveBeenCalledWith("group1", "sub2");
	});

	it("calls onDelete with groupId", async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();

		render(
			<GroupItem
				group={mockGroup}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={() => {}}
				onDelete={onDelete}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete Test Group",
		});
		await user.click(deleteButton);

		expect(onDelete).toHaveBeenCalledWith("group1");
	});

	it("handles group with no subscription assigned", () => {
		const groupWithoutSub: Group = {
			...mockGroup,
			subscriptionIds: [],
		};

		render(
			<GroupItem
				group={groupWithoutSub}
				subscriptions={mockSubscriptions}
				onToggle={() => {}}
				onAssign={() => {}}
				onDelete={() => {}}
			/>,
		);

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("");
	});
});
