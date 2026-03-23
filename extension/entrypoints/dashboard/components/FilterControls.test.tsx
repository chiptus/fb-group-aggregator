import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from 'wxt/utils/storage';
import type { FilterSettings } from '@/lib/filters/types';
import { FilterControls } from './FilterControls';

// Mock WXT storage
vi.mock('wxt/utils/storage', () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const defaultFilters: FilterSettings = {
  positiveKeywords: [],
  negativeKeywords: [],
  caseSensitive: false,
  searchFields: ['contentHtml', 'authorName'],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderFilterControls() {
  return render(<FilterControls />, { wrapper: createWrapper() });
}

async function getInputAndButton() {
  const input = await screen.findByPlaceholderText(/add keyword/i);
  const addButton = screen.getByRole('button', { name: /add/i });
  return { input, addButton };
}

async function addKeywordViaButton(keyword: string) {
  const { input, addButton } = await getInputAndButton();
  fireEvent.change(input, { target: { value: keyword } });
  fireEvent.click(addButton);
}

describe('FilterControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getItem).mockResolvedValue(defaultFilters);
    vi.mocked(storage.setItem).mockResolvedValue(undefined);
  });

  it('should render keyword input and add button', async () => {
    renderFilterControls();
    const { input, addButton } = await getInputAndButton();
    expect(input).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
  });

  it('should have positive/negative keyword toggle', async () => {
    renderFilterControls();
    await getInputAndButton();
    expect(
      screen.getByRole('radio', { name: /positive/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /negative/i })
    ).toBeInTheDocument();
  });

  it('should add positive keyword when button clicked', async () => {
    const updatedFilters: FilterSettings = {
      ...defaultFilters,
      positiveKeywords: ['apartment'],
    };

    renderFilterControls();
    await addKeywordViaButton('apartment');

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith(
        'local:filterSettings',
        updatedFilters
      );
    });
  });

  it('should add negative keyword when negative toggle selected', async () => {
    const updatedFilters: FilterSettings = {
      ...defaultFilters,
      negativeKeywords: ['sold'],
    };

    renderFilterControls();
    const negativeToggle = await screen.findByRole('radio', {
      name: /negative/i,
    });
    fireEvent.click(negativeToggle);
    await addKeywordViaButton('sold');

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith(
        'local:filterSettings',
        updatedFilters
      );
    });
  });

  it('should clear input after adding keyword', async () => {
    renderFilterControls();
    const { input } = await getInputAndButton();
    await addKeywordViaButton('apartment');

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  it('should not add empty keyword', async () => {
    renderFilterControls();
    const { addButton } = await getInputAndButton();
    fireEvent.click(addButton);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should have case-sensitive toggle', async () => {
    renderFilterControls();
    await getInputAndButton();
    expect(
      screen.getByRole('checkbox', { name: /case.sensitive/i })
    ).toBeInTheDocument();
  });

  it('should have search fields selection', async () => {
    renderFilterControls();
    await getInputAndButton();
    expect(
      screen.getByRole('checkbox', { name: /content/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /author/i })
    ).toBeInTheDocument();
  });

  it('should allow adding keyword with Enter key', async () => {
    const updatedFilters: FilterSettings = {
      ...defaultFilters,
      positiveKeywords: ['apartment'],
    };

    renderFilterControls();
    const { input } = await getInputAndButton();
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'apartment' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith(
        'local:filterSettings',
        updatedFilters
      );
    });
  });

  it('should trim whitespace from keywords', async () => {
    const updatedFilters: FilterSettings = {
      ...defaultFilters,
      positiveKeywords: ['apartment'],
    };

    renderFilterControls();
    await addKeywordViaButton('  apartment  ');

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith(
        'local:filterSettings',
        updatedFilters
      );
    });
  });

  it('should not add duplicate keywords', async () => {
    const filtersWithKeyword: FilterSettings = {
      ...defaultFilters,
      positiveKeywords: ['apartment'],
    };

    vi.mocked(storage.getItem).mockResolvedValue(filtersWithKeyword);
    renderFilterControls();
    await getInputAndButton();
    vi.mocked(storage.setItem).mockClear();

    await addKeywordViaButton('apartment');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
