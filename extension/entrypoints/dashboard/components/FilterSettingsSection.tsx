import type { FilterSettings } from "@/lib/filters/types";

interface FilterSettingsSectionProps {
	filters: FilterSettings;
	onCaseSensitiveChange: (checked: boolean) => void;
	onSearchFieldChange: (
		field: "contentHtml" | "authorName",
		checked: boolean,
	) => void;
	disabled: boolean;
}

export function FilterSettingsSection({
	filters,
	onCaseSensitiveChange,
	onSearchFieldChange,
	disabled,
}: FilterSettingsSectionProps) {
	return (
		<div className="space-y-2">
			<label className="flex items-center gap-2">
				<input
					type="checkbox"
					checked={filters.caseSensitive}
					onChange={(e) => onCaseSensitiveChange(e.target.checked)}
					disabled={disabled}
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
							onSearchFieldChange("contentHtml", e.target.checked)
						}
						disabled={disabled}
					/>
					Content
				</label>
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={filters.searchFields.includes("authorName")}
						onChange={(e) =>
							onSearchFieldChange("authorName", e.target.checked)
						}
						disabled={disabled}
					/>
					Author
				</label>
			</div>
		</div>
	);
}
