interface DeleteButtonProps {
	onDelete: () => void;
	label: string;
}

export function DeleteButton({ onDelete, label }: DeleteButtonProps) {
	return (
		<button
			type="button"
			onClick={onDelete}
			className="text-red-600 hover:text-red-800 text-xs ml-2"
			aria-label={label}
		>
			Delete
		</button>
	);
}
