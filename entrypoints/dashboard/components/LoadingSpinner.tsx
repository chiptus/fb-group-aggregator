export function LoadingSpinner() {
	return (
		<output
			className="flex flex-col items-center justify-center min-h-screen gap-4"
			aria-live="polite"
		>
			<div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
			<p className="text-lg text-gray-600">Loading posts...</p>
		</output>
	);
}
