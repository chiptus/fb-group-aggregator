/**
 * A strictly typed debounce function that avoids 'any'.
 *
 * @param fn - The function to debounce.
 * @param ms - The delay in milliseconds.
 * @returns A new function with strict argument typing.
 */
export function debounce<Args extends unknown[]>(
	fn: (...args: Args) => void,
	ms: number,
): (...args: Args) => void {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return (...args: Args) => {
		if (timer) {
			clearTimeout(timer);
		}

		timer = setTimeout(() => {
			fn(...args);
		}, ms);
	};
}
