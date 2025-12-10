import { useForm } from "@tanstack/react-form";
import { useCreateSubscription } from "@/lib/hooks/storage/useSubscriptions";
import { subscriptionSchema } from "./subscriptionFormSchema";

interface CreateSubscriptionFormProps {
	onSuccess?: () => void;
	onCancel: () => void;
}

export function CreateSubscriptionForm({
	onSuccess,
	onCancel,
}: CreateSubscriptionFormProps) {
	const createMutation = useCreateSubscription();

	const form = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onChange: subscriptionSchema,
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate(value.name, {
				onSuccess: () => {
					onSuccess?.();
				},
			});
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
					onChange: subscriptionSchema.shape.name,
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
								{typeof field.state.meta.errors[0] === "string"
									? field.state.meta.errors[0]
									: (field.state.meta.errors[0] as { message?: string })
											?.message || "Invalid input"}
							</p>
						)}
					</div>
				)}
			</form.Field>

			{createMutation.error && (
				<div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
					{createMutation.error instanceof Error
						? createMutation.error.message
						: "An error occurred"}
				</div>
			)}

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={!form.state.canSubmit || createMutation.isPending}
					className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{createMutation.isPending ? "Creating..." : "Create"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={createMutation.isPending}
					className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
