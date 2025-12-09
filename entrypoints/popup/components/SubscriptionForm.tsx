import { useForm } from "@tanstack/react-form";
import {
	useCreateSubscription,
	useUpdateSubscription,
} from "@/lib/hooks/useStorageData";

interface SubscriptionFormProps {
	subscriptionId?: string;
	initialValue?: string;
	onSuccess?: () => void;
	onCancel: () => void;
}

export function SubscriptionForm({
	subscriptionId,
	initialValue = "",
	onSuccess,
	onCancel,
}: SubscriptionFormProps) {
	const createMutation = useCreateSubscription();
	const updateMutation = useUpdateSubscription();

	const isEditing = !!subscriptionId;
	const mutation = isEditing ? updateMutation : createMutation;

	const form = useForm({
		defaultValues: {
			name: initialValue,
		},
		onSubmit: async ({ value }) => {
			const name = value.name.trim();

			if (isEditing) {
				updateMutation.mutate(
					{ id: subscriptionId, updates: { name } },
					{
						onSuccess: () => {
							onSuccess?.();
						},
					},
				);
			} else {
				createMutation.mutate(name, {
					onSuccess: () => {
						onSuccess?.();
					},
				});
			}
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

			{mutation.error && (
				<div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
					{mutation.error instanceof Error
						? mutation.error.message
						: "An error occurred"}
				</div>
			)}

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={!form.state.canSubmit || mutation.isPending}
					className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{mutation.isPending ? "Saving..." : initialValue ? "Save" : "Create"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={mutation.isPending}
					className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
