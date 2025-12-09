interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	message: string;
}

export function DeleteConfirmationModal({
	isOpen,
	onConfirm,
	onCancel,
	message,
}: DeleteConfirmationModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg max-w-sm">
				<p className="mb-4">{message}</p>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onConfirm}
						className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
					>
						Confirm
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
