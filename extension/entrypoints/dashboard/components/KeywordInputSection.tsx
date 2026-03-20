import { useForm } from "@tanstack/react-form";

interface KeywordInputSectionProps {
	onAdd: (params: { value: string; type: "positive" | "negative" }) => void;
	disabled: boolean;
}

export function KeywordInputSection({
	onAdd,
	disabled,
}: KeywordInputSectionProps) {
	const form = useForm({
		defaultValues: {
			keyword: "",
			type: "positive" as "positive" | "negative",
		},
		onSubmit({ value, formApi }) {
			onAdd({ value: value.keyword, type: value.type });
			formApi.reset();
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="flex gap-2 mb-3">
				<form.Field name="keyword">
					{(field) => (
						<input
							type="text"
							placeholder="Add keyword"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							disabled={disabled}
							className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
						/>
					)}
				</form.Field>
				<button
					type="submit"
					disabled={disabled}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					Add
				</button>
			</div>

			<div className="flex gap-4">
				<form.Field name="type">
					{(field) => (
						<>
							<label className="flex items-center gap-2">
								<input
									type="radio"
									value="positive"
									checked={field.state.value === "positive"}
									onChange={() => field.handleChange("positive")}
								/>
								Positive
							</label>
							<label className="flex items-center gap-2">
								<input
									type="radio"
									value="negative"
									checked={field.state.value === "negative"}
									onChange={() => field.handleChange("negative")}
								/>
								Negative
							</label>
						</>
					)}
				</form.Field>
			</div>
		</form>
	);
}
