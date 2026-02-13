import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PostList } from './PostList';

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

describe('PostList', () => {
  it('should render list of posts', () => {
    render(<PostList posts={mockPosts} searchQuery="" />);

    expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
    expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
  });

  it('should display empty state when no posts', () => {
    render(<PostList posts={[]} searchQuery="" />);

    expect(screen.getByText(/no posts/i)).toBeInTheDocument();
  });

  it('should filter posts by search query', () => {
    render(<PostList posts={mockPosts} searchQuery="remote" />);

    expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
    expect(screen.queryByText(/Looking for a senior developer/i)).not.toBeInTheDocument();
  });

  it('should search in post content', () => {
    render(<PostList posts={mockPosts} searchQuery="developer" />);

    expect(screen.getByText(/Looking for a senior developer/i)).toBeInTheDocument();
    expect(screen.queryByText(/Offering remote position/i)).not.toBeInTheDocument();
  });

  it('should search in author name', () => {
    render(<PostList posts={mockPosts} searchQuery="Jane" />);

    expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
    expect(screen.queryByText(/Looking for a senior developer/i)).not.toBeInTheDocument();
  });

  it('should be case-insensitive when searching', () => {
    render(<PostList posts={mockPosts} searchQuery="REMOTE" />);

    expect(screen.getByText(/Offering remote position/i)).toBeInTheDocument();
  });

  it('should display message when search returns no results', () => {
    render(<PostList posts={mockPosts} searchQuery="nonexistent" />);

    expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
  });

  it('should render PostCard for each post', () => {
    render(<PostList posts={mockPosts} searchQuery="" />);

    // Should render 2 PostCard components (one for each post)
    const postCards = screen.getAllByRole('article');
    expect(postCards).toHaveLength(2);
  });

  it('should handle search with special characters', () => {
    const postsWithSpecialChars = [
      {
        id: '789',
        groupId: 'group1',
        authorName: 'Test User',
        contentHtml: '<p>C++ developer needed</p>',
        scrapedAt: Date.now(),
        seen: false,
        starred: false,
        url: 'https://facebook.com/groups/test/posts/789',
      },
    ];

    render(<PostList posts={postsWithSpecialChars} searchQuery="C++" />);

    expect(screen.getByText(/C\+\+ developer needed/i)).toBeInTheDocument();
  });
});
