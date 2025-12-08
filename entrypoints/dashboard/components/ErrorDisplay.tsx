interface ErrorDisplayProps {
	message: string;
	onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
	return (
		<div className="flex items-center justify-center min-h-screen" role="alert">
			<div className="text-center">
				<p className="text-lg text-red-600 mb-4">{message}</p>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Reload Page
					</button>
				)}
			</div>
		</div>
	);
}
