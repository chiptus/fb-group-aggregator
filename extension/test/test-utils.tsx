import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders a component with React Query provider configured for tests
 *
 * Configuration:
 * - retry: false - Don't retry failed queries in tests
 * - gcTime: 0 - Don't cache data between tests (prevents test pollution)
 */
export function renderWithQuery(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>
  );
}

/**
 * Returns a wrapper component for use with renderHook, configured with React Query.
 */
export function createQueryWrapper() {
  const queryClient = makeQueryClient();
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
