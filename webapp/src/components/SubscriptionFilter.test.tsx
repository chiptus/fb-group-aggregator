import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SubscriptionFilter } from './SubscriptionFilter';

const mockSubscriptions = [
  { id: 'sub1', name: 'Tech Jobs', createdAt: Date.now() },
  { id: 'sub2', name: 'Apartments', createdAt: Date.now() },
  { id: 'sub3', name: 'Events', createdAt: Date.now() },
];

describe('SubscriptionFilter', () => {
  it('should render list of subscriptions', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    expect(screen.getByText('Tech Jobs')).toBeInTheDocument();
    expect(screen.getByText('Apartments')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('should render "All" option', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('should highlight selected subscription', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId="sub1"
        onSelectSubscription={vi.fn()}
      />
    );

    const selectedButton = screen.getByRole('button', { name: 'Tech Jobs' });
    expect(selectedButton).toHaveClass(/selected|active|bg-/);
  });

  it('should highlight "All" when no subscription selected', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    const allButton = screen.getByRole('button', { name: 'All' });
    expect(allButton).toHaveClass(/selected|active|bg-/);
  });

  it('should call onSelectSubscription when subscription clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={mockOnSelect}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Tech Jobs' }));

    expect(mockOnSelect).toHaveBeenCalledWith('sub1');
  });

  it('should call onSelectSubscription with null when "All" clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId="sub1"
        onSelectSubscription={mockOnSelect}
      />
    );

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('should display empty state when no subscriptions', () => {
    render(
      <SubscriptionFilter
        subscriptions={[]}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    // Should still show "All" option
    expect(screen.getByText('All')).toBeInTheDocument();

    // Optionally show a message
    expect(screen.getByText(/no subscriptions/i) || screen.getByText('All')).toBeInTheDocument();
  });

  it('should render as a list for accessibility', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    expect(screen.getByRole('list') || screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should not change selection on already selected subscription', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId="sub1"
        onSelectSubscription={mockOnSelect}
      />
    );

    // Click on already selected subscription
    await user.click(screen.getByRole('button', { name: 'Tech Jobs' }));

    // Should still be called (no prevention logic)
    expect(mockOnSelect).toHaveBeenCalledWith('sub1');
  });

  it('should display subscriptions in order', () => {
    render(
      <SubscriptionFilter
        subscriptions={mockSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');

    // "All" should be first
    expect(buttons[0]).toHaveTextContent('All');

    // Then subscriptions in order
    expect(buttons[1]).toHaveTextContent('Tech Jobs');
    expect(buttons[2]).toHaveTextContent('Apartments');
    expect(buttons[3]).toHaveTextContent('Events');
  });

  it('should handle long subscription names gracefully', () => {
    const longNameSubscriptions = [
      {
        id: 'sub1',
        name: 'Very Long Subscription Name That Should Be Handled Gracefully',
        createdAt: Date.now(),
      },
    ];

    render(
      <SubscriptionFilter
        subscriptions={longNameSubscriptions}
        selectedSubscriptionId={null}
        onSelectSubscription={vi.fn()}
      />
    );

    expect(
      screen.getByText('Very Long Subscription Name That Should Be Handled Gracefully')
    ).toBeInTheDocument();
  });
});
