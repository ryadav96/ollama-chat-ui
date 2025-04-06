import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import MessageItem from '../renderer/components/MessageItem';
import type { Message } from '../renderer/types';

// Mock the dynamic imports properly to prevent React act() warnings
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

jest.mock('rehype-raw', () => ({
  __esModule: true,
  default: () => () => {},
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => () => {},
}));

describe('MessageItem', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, AI assistant!',
    timestamp: '2023-01-01T12:00:00Z',
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: '2023-01-01T12:00:10Z',
  };

  const loadingMessage: Message = {
    id: '3',
    role: 'assistant',
    content: 'Loading...',
    timestamp: '2023-01-01T12:00:20Z',
    loading: true,
  };

  it('renders a user message correctly', async () => {
    await act(async () => {
      render(<MessageItem message={userMessage} />);
    });
    
    // Check if the user's message is displayed
    expect(screen.getByText('Hello, AI assistant!')).toBeInTheDocument();
    
    // Check for the user icon or indicator
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders an assistant message correctly', async () => {
    await act(async () => {
      render(<MessageItem message={assistantMessage} />);
    });
    
    // Check if the assistant's message is displayed somewhere in the document
    await waitFor(() => {
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });
    
    // Check for the assistant icon or indicator
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('shows loading indicator for messages in loading state', async () => {
    await act(async () => {
      render(<MessageItem message={loadingMessage} />);
    });
    
    // Check if loading content is present
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders markdown content in assistant messages', async () => {
    const markdownMessage: Message = {
      id: '4',
      role: 'assistant',
      content: '# Heading\n\n- List item 1\n- List item 2\n\n`code`',
      timestamp: '2023-01-01T12:00:30Z',
    };
    
    await act(async () => {
      render(<MessageItem message={markdownMessage} />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });
  });

  it('displays a timestamp', async () => {
    await act(async () => {
      render(<MessageItem message={userMessage} />);
    });
    
    // Look for a timestamp element (matches a time format pattern)
    const timeElement = screen.getByText(/\d{2}:\d{2}\s+[AP]M/);
    expect(timeElement).toBeInTheDocument();
  });
}); 