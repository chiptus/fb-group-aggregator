import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Confirm Deletion</DialogTitle>
					<DialogDescription>{message}</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
					>
						Confirm
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
