import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
	it("renders with default variant and size", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("bg-gray-900");
		expect(button).toHaveClass("h-10");
	});

	it("renders with primary variant", () => {
		render(<Button variant="primary">Primary</Button>);
		const button = screen.getByRole("button", { name: "Primary" });
		expect(button).toHaveClass("bg-blue-600");
	});

	it("renders with secondary variant", () => {
		render(<Button variant="secondary">Secondary</Button>);
		const button = screen.getByRole("button", { name: "Secondary" });
		expect(button).toHaveClass("bg-gray-100");
	});

	it("renders with ghost variant", () => {
		render(<Button variant="ghost">Ghost</Button>);
		const button = screen.getByRole("button", { name: "Ghost" });
		expect(button).toHaveClass("hover:bg-gray-100");
	});

	it("renders with link variant", () => {
		render(<Button variant="link">Link</Button>);
		const button = screen.getByRole("button", { name: "Link" });
		expect(button).toHaveClass("text-blue-600");
		expect(button).toHaveClass("underline-offset-4");
	});

	it("renders with destructive variant", () => {
		render(<Button variant="destructive">Delete</Button>);
		const button = screen.getByRole("button", { name: "Delete" });
		expect(button).toHaveClass("bg-red-600");
	});

	it("renders with outline variant", () => {
		render(<Button variant="outline">Outline</Button>);
		const button = screen.getByRole("button", { name: "Outline" });
		expect(button).toHaveClass("border");
		expect(button).toHaveClass("bg-white");
	});

	it("renders with small size", () => {
		render(<Button size="sm">Small</Button>);
		const button = screen.getByRole("button", { name: "Small" });
		expect(button).toHaveClass("h-8");
		expect(button).toHaveClass("text-xs");
	});

	it("renders with large size", () => {
		render(<Button size="lg">Large</Button>);
		const button = screen.getByRole("button", { name: "Large" });
		expect(button).toHaveClass("h-12");
		expect(button).toHaveClass("text-base");
	});

	it("renders with icon size", () => {
		render(<Button size="icon">🔍</Button>);
		const button = screen.getByRole("button", { name: "🔍" });
		expect(button).toHaveClass("h-10");
		expect(button).toHaveClass("w-10");
	});

	it("applies custom className", () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole("button", { name: "Custom" });
		expect(button).toHaveClass("custom-class");
	});

	it("passes through button attributes", () => {
		render(
			<Button disabled aria-label="Custom label">
				Disabled
			</Button>,
		);
		const button = screen.getByRole("button", { name: "Custom label" });
		expect(button).toBeDisabled();
	});

	it("defaults type to button", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toHaveAttribute("type", "button");
	});

	it("allows custom type attribute", () => {
		render(<Button type="submit">Submit</Button>);
		const button = screen.getByRole("button", { name: "Submit" });
		expect(button).toHaveAttribute("type", "submit");
	});
});
