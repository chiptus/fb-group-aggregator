import { useEffect, useState } from "react";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	debounceMs?: number;
}

export function SearchBar({
	value,
	onChange,
	debounceMs = 300,
}: SearchBarProps) {
	const [inputValue, setInputValue] = useState(value);

	// Sync input value when external value changes
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	// Debounce the onChange callback
	useEffect(() => {
		const handler = setTimeout(() => {
			if (inputValue !== value) {
				onChange(inputValue);
			}
		}, debounceMs);

		return () => clearTimeout(handler);
	}, [inputValue, debounceMs, onChange, value]);

	return (
		<div className="mb-4">
			<label htmlFor="search-posts" className="sr-only">
				Search posts by content or author
			</label>
			<input
				id="search-posts"
				type="search"
				placeholder="Search posts..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	);
}
