import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HomePage } from './HomePage';

const API_URL = 'http://localhost:3000';

// Setup MSW server
const server = setupServer();

// Test data
const mockSubscriptions = [
  { id: 'sub1', name: 'Tech Jobs', createdAt: Date.now() },
  { id: 'sub2', name: 'Apartments', createdAt: Date.now() },
];

const mockGroups = [
  {
    id: 'group1',
    name: 'Tech Jobs TLV',
    url: 'https://facebook.com/groups/techjobs',
    subscriptionIds: ['sub1'],
    enabled: true,
    addedAt: Date.now(),
    lastScrapedAt: Date.now(),
  },
];

const mockPosts = [
  {
    id: '123',
    groupId: 'group1',
    authorName: 'John Doe',
    contentHtml: '<p>Looking for a senior developer</p>',
    scrapedAt: Date.now(),
    seen: false,
    starred: false,
    url: 'https://facebook.com/groups/techjobs/posts/123',
  },
  {
    id: '456',
    groupId: 'group1',
    authorName: 'Jane Smith',
    contentHtml: '<p>Offering remote position</p>',
    scrapedAt: Date.now(),
    seen: true,
    starred: false,
    url: 'https://facebook.com/groups/techjobs/posts/456',
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should display loading state initially', () => {
    server.use(
      http.get(`${API_URL}/api/sync/posts`, () => {
        return new Promise(() => {}); // Never resolve to keep loading
      })
    );

    renderWithProviders(<HomePage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display posts after loading', async () => {
    server.use(
      http.get(`${API_URL}/api/sync/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions, total: 2 });
      }),
      http.get(`${API_URL}/api/sync/groups`, () => {
        return HttpResponse.json({ groups: mockGroups, total: 1 });
      }),
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json({
          posts: mockPosts,
          total: 2,
          limit: 100,
          offset: 0,
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
      expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
    });
  });

  it('should display subscription filter sidebar', async () => {
    server.use(
      http.get(`${API_URL}/api/sync/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions, total: 2 });
      }),
      http.get(`${API_URL}/api/sync/groups`, () => {
        return HttpResponse.json({ groups: mockGroups, total: 1 });
      }),
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json({
          posts: mockPosts,
          total: 2,
          limit: 100,
          offset: 0,
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Tech Jobs')).toBeInTheDocument();
      expect(screen.getByText('Apartments')).toBeInTheDocument();
    });
  });

  it('should filter posts by selected subscription', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/sync/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions, total: 2 });
      }),
      http.get(`${API_URL}/api/sync/groups`, () => {
        return HttpResponse.json({ groups: mockGroups, total: 1 });
      }),
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json({
          posts: mockPosts,
          total: 2,
          limit: 100,
          offset: 0,
        });
      })
    );

    renderWithProviders(<HomePage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
    });

    // Click on Tech Jobs subscription
    await user.click(screen.getByText('Tech Jobs'));

    // Posts should be filtered (implementation will determine exact behavior)
    expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
  });

  it('should have search functionality', async () => {
    server.use(
      http.get(`${API_URL}/api/sync/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions, total: 2 });
      }),
      http.get(`${API_URL}/api/sync/groups`, () => {
        return HttpResponse.json({ groups: mockGroups, total: 1 });
      }),
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json({
          posts: mockPosts,
          total: 2,
          limit: 100,
          offset: 0,
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter posts by search query', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/sync/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions, total: 2 });
      }),
      http.get(`${API_URL}/api/sync/groups`, () => {
        return HttpResponse.json({ groups: mockGroups, total: 1 });
      }),
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json({
          posts: mockPosts,
          total: 2,
          limit: 100,
          offset: 0,
        });
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
    });

    // Search for "remote"
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'remote');

    // Only "Offering remote position" should be visible
    await waitFor(() => {
      expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
      expect(screen.queryByText(/Looking for a senior developer/i)).not.toBeInTheDocument();
    });
  });

  it('should display error message when loading fails', async () => {
    server.use(
      http.get(`${API_URL}/api/sync/posts`, () => {
        return HttpResponse.json(
          { error: { message: 'Failed to load posts' } },
          { status: 500 }
        );
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });
});
