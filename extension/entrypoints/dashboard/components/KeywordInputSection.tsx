import { useFormik } from "formik";

interface AddKeywordValues {
	keyword: string;
	type: "positive" | "negative";
}

interface KeywordInputSectionProps {
	onAdd: (params: { value: string; type: "positive" | "negative" }) => void;
	disabled: boolean;
}

export function KeywordInputSection({
	onAdd,
	disabled,
}: KeywordInputSectionProps) {
	const formik = useFormik<AddKeywordValues>({
		initialValues: { keyword: "", type: "positive" },
		onSubmit(values, { resetForm }) {
			onAdd({ value: values.keyword, type: values.type });
			resetForm();
		},
	});

	return (
		<form onSubmit={formik.handleSubmit}>
			<div className="flex gap-2 mb-3">
				<input
					type="text"
					name="keyword"
					placeholder="Add keyword"
					value={formik.values.keyword}
					onChange={formik.handleChange}
					disabled={disabled}
					className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={disabled || !formik.values.keyword.trim()}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					Add
				</button>
			</div>

			<div className="flex gap-4">
				<label className="flex items-center gap-2">
					<input
						type="radio"
						name="type"
						value="positive"
						checked={formik.values.type === "positive"}
						onChange={formik.handleChange}
					/>
					Positive
				</label>
				<label className="flex items-center gap-2">
					<input
						type="radio"
						name="type"
						value="negative"
						checked={formik.values.type === "negative"}
						onChange={formik.handleChange}
					/>
					Negative
				</label>
			</div>
		</form>
	);
}
