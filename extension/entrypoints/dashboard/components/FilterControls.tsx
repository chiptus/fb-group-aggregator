import { useState } from "react";
import type { FilterSettings } from "@/lib/filters/types";
import { useFilters, useSaveFilters } from "@/lib/hooks/filters/useFilters";

export function FilterControls() {
	const filtersQuery = useFilters();
	const saveFiltersMutation = useSaveFilters();

	const [keywordInput, setKeywordInput] = useState("");
	const [keywordType, setKeywordType] = useState<"positive" | "negative">(
		"positive",
	);

	const filters = filtersQuery.data ?? {
		positiveKeywords: [],
		negativeKeywords: [],
		caseSensitive: false,
		searchFields: ["contentHtml", "authorName"] as const,
	};

	function handleAddKeyword() {
		const trimmed = keywordInput.trim();
		if (!trimmed) return;

		// Check for duplicates
		const isDuplicate =
			(keywordType === "positive" &&
				filters.positiveKeywords.includes(trimmed)) ||
			(keywordType === "negative" &&
				filters.negativeKeywords.includes(trimmed));

		if (isDuplicate) {
			setKeywordInput("");
			return;
		}

		const updatedFilters: FilterSettings = {
			...filters,
			positiveKeywords:
				keywordType === "positive"
					? [...filters.positiveKeywords, trimmed]
					: filters.positiveKeywords,
			negativeKeywords:
				keywordType === "negative"
					? [...filters.negativeKeywords, trimmed]
					: filters.negativeKeywords,
		};

		saveFiltersMutation.mutate(updatedFilters);
		setKeywordInput("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddKeyword();
		}
	}

	function handleCaseSensitiveChange(checked: boolean) {
		const updatedFilters: FilterSettings = {
			...filters,
			caseSensitive: checked,
		};
		saveFiltersMutation.mutate(updatedFilters);
	}

	function handleSearchFieldChange(
		field: "contentHtml" | "authorName",
		checked: boolean,
	) {
		const updatedFields = checked
			? [...filters.searchFields, field]
			: filters.searchFields.filter((f) => f !== field);

		// Ensure at least one field is selected
		if (updatedFields.length === 0) return;

		const updatedFilters: FilterSettings = {
			...filters,
			searchFields: updatedFields as ("contentHtml" | "authorName")[],
		};
		saveFiltersMutation.mutate(updatedFilters);
	}

	const isLoading = filtersQuery.isLoading;
	const isSaving = saveFiltersMutation.isPending;

	if (isLoading) {
		return (
			<div className="p-4 border rounded-lg bg-white">
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
					<span>Loading filters...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4 border rounded-lg bg-white">
			{isSaving && (
				<div className="flex items-center gap-2 text-xs text-gray-500">
					<div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
					<span>Saving...</span>
				</div>
			)}
			<div className="flex gap-2">
				<input
					type="text"
					placeholder="Add keyword"
					value={keywordInput}
					onChange={(e) => setKeywordInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
				/>
				<button
					type="button"
					onClick={handleAddKeyword}
					disabled={isSaving}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					Add
				</button>
			</div>

			<div className="flex gap-4">
				<label className="flex items-center gap-2">
					<input
						type="radio"
						name="keywordType"
						value="positive"
						checked={keywordType === "positive"}
						onChange={() => setKeywordType("positive")}
					/>
					Positive
				</label>
				<label className="flex items-center gap-2">
					<input
						type="radio"
						name="keywordType"
						value="negative"
						checked={keywordType === "negative"}
						onChange={() => setKeywordType("negative")}
					/>
					Negative
				</label>
			</div>

			<div className="space-y-2">
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={filters.caseSensitive}
						onChange={(e) => handleCaseSensitiveChange(e.target.checked)}
					/>
					Case-sensitive
				</label>

				<div className="space-y-1">
					<div className="text-sm font-medium">Search in:</div>
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={filters.searchFields.includes("contentHtml")}
							onChange={(e) =>
								handleSearchFieldChange("contentHtml", e.target.checked)
							}
						/>
						Content
					</label>
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={filters.searchFields.includes("authorName")}
							onChange={(e) =>
								handleSearchFieldChange("authorName", e.target.checked)
							}
						/>
						Author
					</label>
				</div>
			</div>
		</div>
	);
}
