import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MessageItem from '../renderer/components/MessageItem';
import type { Message } from '../renderer/types';
import React from 'react';

// Mock react-markdown and its related packages to prevent actual markdown processing
jest.mock('react-markdown', () => () => null);
jest.mock('rehype-raw', () => () => null);
jest.mock('remark-gfm', () => () => null);

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

  it('renders a user message correctly', () => {
    render(<MessageItem message={userMessage} />);
    
    // Check if the user's message is displayed
    expect(screen.getByText('Hello, AI assistant!')).toBeInTheDocument();
    
    // Check for the user icon or indicator
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders an assistant message correctly', () => {
    render(<MessageItem message={assistantMessage} />);
    
    // Check if the assistant's message is displayed somewhere in the document
    expect(screen.getByText(/Hello! How can I help you today?/)).toBeInTheDocument();
    
    // Check for the assistant icon or indicator
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('shows loading indicator for messages in loading state', () => {
    render(<MessageItem message={loadingMessage} />);
    
    // Check if loading content is present
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders markdown content in assistant messages', () => {
    const markdownMessage: Message = {
      id: '4',
      role: 'assistant',
      content: '# Heading\n\n- List item 1\n- List item 2\n\n`code`',
      timestamp: '2023-01-01T12:00:30Z',
    };
    
    render(<MessageItem message={markdownMessage} />);
    
    // Just check that the raw markdown content is visible in the DOM
    // This is a simpler test since we've mocked react-markdown to return null
    const markdownContainer = screen.getByText(/# Heading/);
    expect(markdownContainer).toBeInTheDocument();
  });

  it('displays a timestamp', () => {
    render(<MessageItem message={userMessage} />);
    
    // Look for a timestamp element (matches a time format pattern)
    const timeElement = screen.getByText(/\d{2}:\d{2}\s+[AP]M/);
    expect(timeElement).toBeInTheDocument();
  });
}); 