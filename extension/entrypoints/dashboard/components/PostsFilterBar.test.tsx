import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/filters/types';
import { PostsFilterBar } from './PostsFilterBar';

const baseContext = {
  showFilterPanel: false,
  hasActiveFilters: false,
  filters: DEFAULT_FILTER_SETTINGS,
  removeKeyword: vi.fn(),
  totalPostCount: 10,
  filteredPosts: Array(10).fill(null),
};

vi.mock('../context/PostsViewContext', () => ({
  usePostsView: () => baseContext,
}));

vi.mock('./FilterControls', () => ({
  FilterControls: () => <div data-testid="filter-controls" />,
}));

describe('PostsFilterBar', () => {
  it('always shows the stats banner', () => {
    render(<PostsFilterBar />);

    expect(screen.getByText(/showing 10 of 10 posts/i)).toBeInTheDocument();
  });

  it('does not render FilterControls when showFilterPanel is false', () => {
    baseContext.showFilterPanel = false;
    render(<PostsFilterBar />);

    expect(screen.queryByTestId('filter-controls')).not.toBeInTheDocument();
  });

  it('renders FilterControls when showFilterPanel is true', () => {
    baseContext.showFilterPanel = true;
    render(<PostsFilterBar />);

    expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
  });

  it('does not render keyword chips when no active filters', () => {
    baseContext.hasActiveFilters = false;
    baseContext.filters = DEFAULT_FILTER_SETTINGS;
    render(<PostsFilterBar />);

    expect(
      screen.queryByRole('button', { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  it('renders keyword chips when active filters exist', () => {
    baseContext.hasActiveFilters = true;
    baseContext.filters = {
      ...DEFAULT_FILTER_SETTINGS,
      positiveKeywords: ['apartment'],
    };
    render(<PostsFilterBar />);

    expect(
      screen.getByRole('button', { name: /remove apartment/i })
    ).toBeInTheDocument();
  });
});
