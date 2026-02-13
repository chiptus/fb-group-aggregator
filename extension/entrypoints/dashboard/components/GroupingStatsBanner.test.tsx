import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupingStatsBanner } from "./GroupingStatsBanner";

describe("GroupingStatsBanner", () => {
	it("should display total groups count", () => {
		render(
			<GroupingStatsBanner
				totalGroups={15}
				totalPostsGrouped={120}
				reductionPercentage={30}
			/>,
		);

		expect(screen.getByText(/15 groups/i)).toBeInTheDocument();
	});

	it("should display total posts grouped", () => {
		render(
			<GroupingStatsBanner
				totalGroups={15}
				totalPostsGrouped={120}
				reductionPercentage={30}
			/>,
		);

		expect(screen.getByText(/120 posts/i)).toBeInTheDocument();
	});

	it("should display reduction percentage", () => {
		render(
			<GroupingStatsBanner
				totalGroups={15}
				totalPostsGrouped={120}
				reductionPercentage={30}
			/>,
		);

		expect(screen.getByText(/30%/)).toBeInTheDocument();
	});

	it("should handle zero groups", () => {
		render(
			<GroupingStatsBanner
				totalGroups={0}
				totalPostsGrouped={0}
				reductionPercentage={0}
			/>,
		);

		expect(screen.getByText(/no groups/i)).toBeInTheDocument();
	});

	it("should handle singular group", () => {
		render(
			<GroupingStatsBanner
				totalGroups={1}
				totalPostsGrouped={5}
				reductionPercentage={10}
			/>,
		);

		expect(screen.getByText(/1 group/)).toBeInTheDocument();
		expect(screen.queryByText(/1 groups/)).not.toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const { container } = render(
			<GroupingStatsBanner
				totalGroups={15}
				totalPostsGrouped={120}
				reductionPercentage={30}
				className="custom-class"
			/>,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("should have aria-live for accessibility", () => {
		render(
			<GroupingStatsBanner
				totalGroups={15}
				totalPostsGrouped={120}
				reductionPercentage={30}
			/>,
		);

		const banner = screen.getByRole("status");
		expect(banner).toBeInTheDocument();
	});
});
