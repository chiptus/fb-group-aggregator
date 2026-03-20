import type { KeyboardEvent } from "react";

interface KeywordInputSectionProps {
	keywordInput: string;
	setKeywordInput: (value: string) => void;
	keywordType: "positive" | "negative";
	setKeywordType: (type: "positive" | "negative") => void;
	onAdd: () => void;
	disabled: boolean;
}

export function KeywordInputSection({
	keywordInput,
	setKeywordInput,
	keywordType,
	setKeywordType,
	onAdd,
	disabled,
}: KeywordInputSectionProps) {
	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault();
			onAdd();
		}
	}

	return (
		<>
			<div className="flex gap-2">
				<input
					type="text"
					placeholder="Add keyword"
					value={keywordInput}
					onChange={(e) => setKeywordInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={disabled}
					className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
				/>
				<button
					type="button"
					onClick={onAdd}
					disabled={disabled}
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
		</>
	);
}
