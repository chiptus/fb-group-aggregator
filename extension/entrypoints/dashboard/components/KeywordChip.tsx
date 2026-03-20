import type { KeywordType } from "@/lib/filters/types";

interface KeywordChipProps {
	keyword: string;
	type: KeywordType;
	onRemove: (keyword: string, type: KeywordType) => void;
}

export function KeywordChip({ keyword, type, onRemove }: KeywordChipProps) {
	const isPositive = type === "positive";
	const colorClasses = isPositive
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";
	const hoverClass = isPositive ? "hover:bg-green-200" : "hover:bg-red-200";

	return (
		<div
			data-type={type}
			className={`flex items-center gap-1 px-3 py-1 ${colorClasses} rounded-full text-sm`}
		>
			<span>{keyword}</span>
			<button
				type="button"
				onClick={() => onRemove(keyword, type)}
				className={`ml-1 ${hoverClass} rounded-full p-0.5`}
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
	);
}
