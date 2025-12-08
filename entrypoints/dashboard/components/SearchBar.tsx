interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
	return (
		<div className="mb-4">
			<label htmlFor="search-posts" className="sr-only">
				Search posts by content or author
			</label>
			<input
				id="search-posts"
				type="search"
				placeholder="Search posts..."
				value={value}
				onChange={(e) => onChange(e.target.value)}

				className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	);
}
