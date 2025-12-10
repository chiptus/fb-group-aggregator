import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Tab } from "./TabNavigation";
import { TabNavigationItem } from "./TabNavigationItem";

describe("TabNavigationItem", () => {
	it("renders with active styles when active", () => {
		render(
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab="overview"
				onTabChange={() => {}}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Overview" });
		expect(button).toHaveClass(
			"border-b-2",
			"border-blue-600",
			"text-blue-600",
		);
		expect(button).toHaveAttribute("aria-selected", "true");
	});

	it("renders with inactive styles when not active", () => {
		render(
			<TabNavigationItem
				tab="overview"
				label="Overview"
				activeTab="subscriptions"
				onTabChange={() => {}}
			/>,
		);

		const button = screen.getByRole("tab", { name: "Overview" });
		expect(button).toHaveClass("text-gray-600", "hover:text-gray-900");
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
