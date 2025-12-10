import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteButton } from "./DeleteButton";

describe("DeleteButton", () => {
	it("renders with correct label", () => {
		render(<DeleteButton onDelete={() => {}} label="Delete item" />);

		const button = screen.getByRole("button", { name: "Delete item" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent("Delete");
	});

	it("calls onDelete when clicked", async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();

		render(<DeleteButton onDelete={onDelete} label="Delete item" />);

		const button = screen.getByRole("button", { name: "Delete item" });
		await user.click(button);

		expect(onDelete).toHaveBeenCalledOnce();
	});
});
