import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilterStatsBanner } from './FilterStatsBanner';

describe('FilterStatsBanner', () => {
  it('shows correct post counts', () => {
    render(
      <FilterStatsBanner
        totalPosts={10}
        filteredPosts={7}
        positiveKeywordCount={0}
        negativeKeywordCount={0}
      />
    );

    expect(screen.getByText(/showing 7 of 10 posts/i)).toBeInTheDocument();
  });

  it('shows filtered-out count when posts are removed', () => {
    render(
      <FilterStatsBanner
        totalPosts={10}
        filteredPosts={7}
        positiveKeywordCount={1}
        negativeKeywordCount={0}
      />
    );

    expect(screen.getByText(/3 filtered out/i)).toBeInTheDocument();
  });

  it('does not show filtered-out count when nothing is removed', () => {
    render(
      <FilterStatsBanner
        totalPosts={5}
        filteredPosts={5}
        positiveKeywordCount={0}
        negativeKeywordCount={0}
      />
    );

    expect(screen.queryByText(/filtered out/i)).not.toBeInTheDocument();
  });

  it('shows include filter summary', () => {
    render(
      <FilterStatsBanner
        totalPosts={10}
        filteredPosts={5}
        positiveKeywordCount={2}
        negativeKeywordCount={0}
      />
    );

    expect(screen.getByText(/2 include filters/i)).toBeInTheDocument();
  });

  it('uses singular form for one filter', () => {
    render(
      <FilterStatsBanner
        totalPosts={10}
        filteredPosts={5}
        positiveKeywordCount={1}
        negativeKeywordCount={1}
      />
    );

    expect(screen.getByText(/1 include filter,/i)).toBeInTheDocument();
    expect(screen.getByText(/1 exclude filter/i)).toBeInTheDocument();
  });
});
