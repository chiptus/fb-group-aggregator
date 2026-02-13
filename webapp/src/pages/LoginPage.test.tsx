import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('should render API key input and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|continue|submit/i })).toBeInTheDocument();
  });

  it('should store API key in localStorage on submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByLabelText(/api key/i);
    const submitButton = screen.getByRole('button', { name: /login|continue|submit/i });

    await user.type(input, 'test-api-key-123');
    await user.click(submitButton);

    expect(localStorage.getItem('apiKey')).toBe('test-api-key-123');
  });

  it('should navigate to home page after successful login', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByLabelText(/api key/i);
    const submitButton = screen.getByRole('button', { name: /login|continue|submit/i });

    await user.type(input, 'test-api-key-123');
    await user.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('should not submit with empty API key', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /login|continue|submit/i });

    await user.click(submitButton);

    expect(localStorage.getItem('apiKey')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display validation error for empty API key', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /login|continue|submit/i });

    await user.click(submitButton);

    expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
  });

  it('should redirect to home if API key already exists in localStorage', () => {
    localStorage.setItem('apiKey', 'existing-key');

    render(<LoginPage />);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });
});
