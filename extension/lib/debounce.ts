/**
 * debounce function
 *
 * @param fn - The function to debounce
 * @param ms - The delay in milliseconds.
 * @returns A new function
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  ms: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      void fn(...args);
    }, ms);
  };
}
