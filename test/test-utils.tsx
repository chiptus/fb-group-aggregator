import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

/**
 * Renders a component with React Query provider configured for tests
 *
 * Configuration:
 * - retry: false - Don't retry failed queries in tests
 * - gcTime: 0 - Don't cache data between tests (prevents test pollution)
 */
export function renderWithQuery(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
}
