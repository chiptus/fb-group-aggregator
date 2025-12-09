import { useForm } from "@tanstack/react-form";

interface SubscriptionFormProps {
	initialValue?: string;
	onSubmit: (name: string) => void;
	onCancel: () => void;
}

export function SubscriptionForm({
	initialValue = "",
	onSubmit,
	onCancel,
}: SubscriptionFormProps) {
	const form = useForm({
		defaultValues: {
			name: initialValue,
		},
		onSubmit: async ({ value }) => {
			onSubmit(value.name.trim());
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="mt-4 border rounded-lg p-3"
		>
			<form.Field
				name="name"
				validators={{
					onChange: ({ value }) => {
						if (!value || !value.trim()) {
							return "Subscription name is required";
						}
						if (value.trim().length < 2) {
							return "Name must be at least 2 characters";
						}
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="mb-2">
						<label htmlFor="subscription-name" className="sr-only">
							Subscription name
						</label>
						<input
							id="subscription-name"
							type="text"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="Subscription name"
							className="w-full border rounded px-3 py-2 text-sm"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-red-600 text-xs mt-1">
								{field.state.meta.errors[0]}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={!form.state.canSubmit}
					className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{initialValue ? "Save" : "Create"}
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
