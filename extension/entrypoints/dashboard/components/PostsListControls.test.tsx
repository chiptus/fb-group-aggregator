import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PostsListControls } from './PostsListControls';

const baseContext = {
  unseenCount: 0,
  starredCount: 0,
  showOnlyUnseen: false,
  setShowOnlyUnseen: vi.fn(),
  showOnlyStarred: false,
  setShowOnlyStarred: vi.fn(),
  showFilterPanel: false,
  setShowFilterPanel: vi.fn(),
  activeFilterCount: 0,
  markAllSeen: vi.fn(),
};

vi.mock('../context/PostsViewContext', () => ({
  usePostsView: () => baseContext,
}));

describe('PostsListControls', () => {
  it('renders Unseen, Starred, and Filters pills', () => {
    render(<PostsListControls />);

    expect(screen.getByRole('button', { name: /unseen/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /starred/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /filters/i })
    ).toBeInTheDocument();
  });

  it('pills reflect aria-pressed state', () => {
    baseContext.showOnlyUnseen = true;
    baseContext.showOnlyStarred = false;
    render(<PostsListControls />);

    expect(screen.getByRole('button', { name: /unseen/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /starred/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls setShowOnlyUnseen when Unseen pill is clicked', async () => {
    baseContext.showOnlyUnseen = false;
    render(<PostsListControls />);

    await userEvent.click(screen.getByRole('button', { name: /unseen/i }));

    expect(baseContext.setShowOnlyUnseen).toHaveBeenCalledWith(true);
  });

  it('shows Mark all seen button only when unseenCount > 0', () => {
    baseContext.unseenCount = 0;
    const { rerender } = render(<PostsListControls />);
    expect(
      screen.queryByRole('button', { name: /mark all seen/i })
    ).not.toBeInTheDocument();

    baseContext.unseenCount = 3;
    rerender(<PostsListControls />);
    expect(
      screen.getByRole('button', { name: /mark all seen/i })
    ).toBeInTheDocument();
  });

  it('calls markAllSeen when Mark all seen is clicked', async () => {
    baseContext.unseenCount = 5;
    render(<PostsListControls />);

    await userEvent.click(
      screen.getByRole('button', { name: /mark all seen/i })
    );

    expect(baseContext.markAllSeen).toHaveBeenCalledOnce();
  });
});
