import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroupToggle } from "./GroupToggle";

describe("GroupToggle", () => {
	it("renders checked when enabled is true", () => {
		render(
			<GroupToggle enabled={true} onToggle={() => {}} groupName="Test Group" />,
		);

		const checkbox = screen.getByRole("switch", { name: "Enable Test Group" });
		expect(checkbox).toBeChecked();
		expect(screen.getByText("Enabled")).toBeInTheDocument();
	});

	it("renders unchecked when enabled is false", () => {
		render(
			<GroupToggle
				enabled={false}
				onToggle={() => {}}
				groupName="Test Group"
			/>,
		);

		const checkbox = screen.getByRole("switch", { name: "Enable Test Group" });
		expect(checkbox).not.toBeChecked();
		expect(screen.getByText("Disabled")).toBeInTheDocument();
	});

	it("calls onToggle with true when checkbox is checked", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();

		render(
			<GroupToggle
				enabled={false}
				onToggle={onToggle}
				groupName="Test Group"
			/>,
		);

		const checkbox = screen.getByRole("switch");
		await user.click(checkbox);

		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it("calls onToggle with false when checkbox is unchecked", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();

		render(
			<GroupToggle enabled={true} onToggle={onToggle} groupName="Test Group" />,
		);

		const checkbox = screen.getByRole("switch");
		await user.click(checkbox);

		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it("has proper ARIA attributes", () => {
		render(
			<GroupToggle enabled={true} onToggle={() => {}} groupName="Test Group" />,
		);

		const checkbox = screen.getByRole("switch");
		expect(checkbox).toHaveAttribute("aria-checked", "true");
		expect(checkbox).toHaveAttribute("aria-label", "Enable Test Group");
	});
});
