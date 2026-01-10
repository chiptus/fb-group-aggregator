import type { FilterSettings } from "@/lib/filters/types";

export interface FilterChipsProps {
	filters: FilterSettings;
	onRemoveKeyword: (keyword: string, type: "positive" | "negative") => void;
}

export function FilterChips({ filters, onRemoveKeyword }: FilterChipsProps) {
	const hasKeywords =
		filters.positiveKeywords.length > 0 || filters.negativeKeywords.length > 0;

	if (!hasKeywords) {
		return (
			<div className="p-4 text-gray-500 text-sm">
				No filters active. Add keywords above to filter posts.
			</div>
		);
	}

	const searchFieldsText = filters.searchFields
		.map((field) => {
			if (field === "contentHtml") return "content";
			if (field === "authorName") return "author";
			return field;
		})
		.join(" and ");

	return (
		<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
			{/* Positive keywords section */}
			{filters.positiveKeywords.length > 0 && (
				<div>
					<div className="text-sm font-medium text-green-700 mb-2">
						Positive Keywords
					</div>
					<div className="flex flex-wrap gap-2">
						{filters.positiveKeywords.map((keyword) => (
							<div
								key={keyword}
								data-type="positive"
								className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
							>
								<span>{keyword}</span>
								<button
									type="button"
									onClick={() => onRemoveKeyword(keyword, "positive")}
									className="ml-1 hover:bg-green-200 rounded-full p-0.5"
									aria-label={`Remove ${keyword}`}
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Negative keywords section */}
			{filters.negativeKeywords.length > 0 && (
				<div>
					<div className="text-sm font-medium text-red-700 mb-2">
						Negative Keywords
					</div>
					<div className="flex flex-wrap gap-2">
						{filters.negativeKeywords.map((keyword) => (
							<div
								key={keyword}
								data-type="negative"
								className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
							>
								<span>{keyword}</span>
								<button
									type="button"
									onClick={() => onRemoveKeyword(keyword, "negative")}
									className="ml-1 hover:bg-red-200 rounded-full p-0.5"
									aria-label={`Remove ${keyword}`}
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Filter settings info */}
			<div className="flex gap-4 text-xs text-gray-600 pt-2 border-t">
				{filters.caseSensitive && (
					<span className="font-medium">Case-sensitive</span>
				)}
				<span>Searching in: {searchFieldsText}</span>
			</div>
		</div>
	);
}
