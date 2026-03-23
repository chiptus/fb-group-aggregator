import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KeywordChip } from './KeywordChip';

describe('KeywordChip', () => {
  it('displays the keyword text', () => {
    render(
      <KeywordChip keyword="apartment" type="positive" onRemove={vi.fn()} />
    );

    expect(screen.getByText('apartment')).toBeInTheDocument();
  });

  it('calls onRemove with keyword and type when button is clicked', async () => {
    const onRemove = vi.fn();
    render(<KeywordChip keyword="sold" type="negative" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: /remove sold/i }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('sold', 'negative');
  });

  it('has accessible aria-label and title on remove button', () => {
    render(<KeywordChip keyword="2br" type="positive" onRemove={vi.fn()} />);

    const button = screen.getByRole('button', { name: /remove 2br/i });
    expect(button).toHaveAttribute('aria-label', 'Remove 2br');
    expect(button).toHaveAttribute('title', 'Remove 2br');
  });
});
