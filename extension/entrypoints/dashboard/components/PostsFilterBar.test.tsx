import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/filters/types';
import { PostsFilterBar } from './PostsFilterBar';

function makeContext() {
  return {
    showFilterPanel: false,
    hasActiveFilters: false,
    filters: DEFAULT_FILTER_SETTINGS,
    removeKeyword: vi.fn(),
    totalPostCount: 10,
    filteredPosts: Array(10).fill(null),
  };
}

let ctx: ReturnType<typeof makeContext>;

vi.mock('../context/PostsViewContext', () => ({
  usePostsView: () => ctx,
}));

vi.mock('./FilterControls', () => ({
  FilterControls: () => <div data-testid="filter-controls" />,
}));

beforeEach(() => {
  ctx = makeContext();
});

describe('PostsFilterBar', () => {
  it('always shows the stats banner', () => {
    render(<PostsFilterBar />);

    expect(screen.getByText(/showing 10 of 10 posts/i)).toBeInTheDocument();
  });

  it('does not render FilterControls when showFilterPanel is false', () => {
    render(<PostsFilterBar />);

    expect(screen.queryByTestId('filter-controls')).not.toBeInTheDocument();
  });

  it('renders FilterControls when showFilterPanel is true', () => {
    ctx.showFilterPanel = true;
    render(<PostsFilterBar />);

    expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
  });

  it('does not render keyword chips when no active filters', () => {
    render(<PostsFilterBar />);

    expect(
      screen.queryByRole('button', { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  it('renders keyword chips when active filters exist', () => {
    ctx.hasActiveFilters = true;
    ctx.filters = {
      ...DEFAULT_FILTER_SETTINGS,
      positiveKeywords: ['apartment'],
    };
    render(<PostsFilterBar />);

    expect(
      screen.getByRole('button', { name: /remove apartment/i })
    ).toBeInTheDocument();
  });
});
