import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroupAssignSubscription } from "./GroupAssignSubscription";

describe("GroupAssignSubscription", () => {
	const mockSubscriptions = [
		{ id: "sub1", name: "Subscription 1", createdAt: Date.now() },
		{ id: "sub2", name: "Subscription 2", createdAt: Date.now() },
		{ id: "sub3", name: "Subscription 3", createdAt: Date.now() },
	];

	it('renders "No subscription" option', () => {
		render(
			<GroupAssignSubscription
				selectedSubscriptionId={null}
				subscriptions={mockSubscriptions}
				onAssign={() => {}}
				groupName="Test Group"
			/>,
		);

		expect(
			screen.getByRole("option", { name: "No subscription" }),
		).toBeInTheDocument();
	});

	it("renders all provided subscriptions", () => {
		render(
			<GroupAssignSubscription
				selectedSubscriptionId={null}
				subscriptions={mockSubscriptions}
				onAssign={() => {}}
				groupName="Test Group"
			/>,
		);

		expect(
			screen.getByRole("option", { name: "Subscription 1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Subscription 2" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Subscription 3" }),
		).toBeInTheDocument();
	});

	it("selects correct subscription based on prop", () => {
		render(
			<GroupAssignSubscription
				selectedSubscriptionId="sub2"
				subscriptions={mockSubscriptions}
				onAssign={() => {}}
				groupName="Test Group"
			/>,
		);

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("sub2");
	});

	it("selects empty value when no subscription is selected", () => {
		render(
			<GroupAssignSubscription
				selectedSubscriptionId={null}
				subscriptions={mockSubscriptions}
				onAssign={() => {}}
				groupName="Test Group"
			/>,
		);

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("");
	});

	it("calls onAssign with selected subscription ID when changed", async () => {
		const user = userEvent.setup();
		const onAssign = vi.fn();

		render(
			<GroupAssignSubscription
				selectedSubscriptionId={null}
				subscriptions={mockSubscriptions}
				onAssign={onAssign}
				groupName="Test Group"
			/>,
		);

		const select = screen.getByRole("combobox");
		await user.selectOptions(select, "sub2");

		expect(onAssign).toHaveBeenCalledWith("sub2");
	});

	it("calls onAssign with empty string when No subscription is selected", async () => {
		const user = userEvent.setup();
		const onAssign = vi.fn();

		render(
			<GroupAssignSubscription
				selectedSubscriptionId="sub1"
				subscriptions={mockSubscriptions}
				onAssign={onAssign}
				groupName="Test Group"
			/>,
		);

		const select = screen.getByRole("combobox");
		await user.selectOptions(select, "");

		expect(onAssign).toHaveBeenCalledWith("");
	});

	it("has proper ARIA label", () => {
		render(
			<GroupAssignSubscription
				selectedSubscriptionId={null}
				subscriptions={mockSubscriptions}
				onAssign={() => {}}
				groupName="Test Group"
			/>,
		);

		const select = screen.getByRole("combobox", {
			name: "Subscription for Test Group",
		});
		expect(select).toBeInTheDocument();
	});
});
