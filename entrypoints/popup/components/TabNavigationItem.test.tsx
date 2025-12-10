import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TabNavigationItem } from "./TabNavigationItem";

describe("TabNavigationItem", () => {
	it("indicates active state via aria-selected when active", () => {
		render(
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab="overview"
				onTabChange={() => {}}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Overview" });
		expect(button).toHaveAttribute("aria-selected", "true");
	});

	it("indicates inactive state via aria-selected when not active", () => {
		render(
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab="subscriptions"
				onTabChange={() => {}}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Overview" });
		expect(button).toHaveAttribute("aria-selected", "false");
	});

	it("calls onTabChange with correct tab when clicked", async () => {
		const user = userEvent.setup();
		const onTabChange = vi.fn();

		render(
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab="subscriptions"
				onTabChange={onTabChange}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Overview" });
		await user.click(button);

		expect(onTabChange).toHaveBeenCalledWith("overview");
	});

	it("has proper ARIA attributes", () => {
		render(
			<TabNavigationItem
				tab="groups"
				label="Groups"
				activeTab="groups"
				onTabChange={() => {}}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Groups" });
		expect(button).toHaveAttribute("id", "groups-tab");
		expect(button).toHaveAttribute("aria-controls", "groups-panel");
		expect(button).toHaveAttribute("aria-selected", "true");
	});

	it("renders label text correctly", () => {
		render(
			<TabNavigationItem
				tab="subscriptions"
				label="My Subscriptions"
				activeTab="subscriptions"
				onTabChange={() => {}}
			/>,
		);

		expect(screen.getByText("My Subscriptions")).toBeInTheDocument();
	});
});
