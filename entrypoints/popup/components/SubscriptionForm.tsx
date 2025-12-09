interface SubscriptionFormProps {
	value: string;
	onValueChange: (value: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

export function SubscriptionForm({
	value,
	onValueChange,
	onSubmit,
	onCancel,
}: SubscriptionFormProps) {
	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSubmit();
	}

	return (
		<form onSubmit={handleSubmit} className="mt-4 border rounded-lg p-3">
			<label htmlFor="subscription-name" className="sr-only">
				Subscription name
			</label>
			<input
				id="subscription-name"
				type="text"
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				placeholder="Subscription name"
				className="w-full border rounded px-3 py-2 text-sm mb-2"
			/>
			<div className="flex gap-2">
				<button
					type="submit"
					className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
				>
					Create
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
