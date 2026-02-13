import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PostCard } from './PostCard';

const mockPost = {
  id: '123',
  groupId: 'group1',
  authorName: 'John Doe',
  contentHtml: '<p>Looking for a <strong>senior developer</strong></p>',
  scrapedAt: Date.now(),
  seen: false,
  starred: false,
  url: 'https://facebook.com/groups/techjobs/posts/123',
};

describe('PostCard', () => {
  it('should render post content as HTML', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByText(/Looking for a/i)).toBeInTheDocument();
    // Check that HTML is rendered (strong tag)
    const strongElement = screen.getByText('senior developer');
    expect(strongElement.tagName).toBe('STRONG');
  });

  it('should display author name', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render link to Facebook post', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    const link = screen.getByRole('link', { name: /view on facebook|open post/i });
    expect(link).toHaveAttribute('href', mockPost.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should show unseen status for unseen posts', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByRole('button', { name: /mark as seen/i })).toBeInTheDocument();
  });

  it('should show seen status for seen posts', () => {
    const seenPost = { ...mockPost, seen: true };
    render(<PostCard post={seenPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByRole('button', { name: /mark as unseen/i })).toBeInTheDocument();
  });

  it('should call onToggleSeen when seen button clicked', async () => {
    const user = userEvent.setup();
    const mockToggleSeen = vi.fn();

    render(<PostCard post={mockPost} onToggleSeen={mockToggleSeen} onToggleStarred={vi.fn()} />);

    const seenButton = screen.getByRole('button', { name: /mark as seen/i });
    await user.click(seenButton);

    expect(mockToggleSeen).toHaveBeenCalledWith(mockPost.id, true);
  });

  it('should call onToggleSeen with false when unseen button clicked', async () => {
    const user = userEvent.setup();
    const mockToggleSeen = vi.fn();
    const seenPost = { ...mockPost, seen: true };

    render(<PostCard post={seenPost} onToggleSeen={mockToggleSeen} onToggleStarred={vi.fn()} />);

    const unseenButton = screen.getByRole('button', { name: /mark as unseen/i });
    await user.click(unseenButton);

    expect(mockToggleSeen).toHaveBeenCalledWith(seenPost.id, false);
  });

  it('should show unstarred status for unstarred posts', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByRole('button', { name: /star|add to starred/i })).toBeInTheDocument();
  });

  it('should show starred status for starred posts', () => {
    const starredPost = { ...mockPost, starred: true };
    render(<PostCard post={starredPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByRole('button', { name: /unstar|remove from starred/i })).toBeInTheDocument();
  });

  it('should call onToggleStarred when star button clicked', async () => {
    const user = userEvent.setup();
    const mockToggleStarred = vi.fn();

    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={mockToggleStarred} />);

    const starButton = screen.getByRole('button', { name: /star|add to starred/i });
    await user.click(starButton);

    expect(mockToggleStarred).toHaveBeenCalledWith(mockPost.id, true);
  });

  it('should sanitize HTML content to prevent XSS', () => {
    const xssPost = {
      ...mockPost,
      contentHtml: '<p>Test</p><script>alert("xss")</script>',
    };

    render(<PostCard post={xssPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    // Script tag should not be rendered
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should display relative time for scrapedAt', () => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentPost = { ...mockPost, scrapedAt: oneHourAgo };

    render(<PostCard post={recentPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    // Should show "1 hour ago" or similar
    expect(screen.getByText(/hour ago|1h/i)).toBeInTheDocument();
  });

  it('should have article role for accessibility', () => {
    render(<PostCard post={mockPost} onToggleSeen={vi.fn()} onToggleStarred={vi.fn()} />);

    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
