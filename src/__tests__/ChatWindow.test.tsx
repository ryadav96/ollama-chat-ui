import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWindow from '../renderer/components/ChatWindow';
import type { Message } from '../renderer/types';

// Mock scrollIntoView method which isn't available in JSDOM
Element.prototype.scrollIntoView = jest.fn();

describe('ChatWindow', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello, AI assistant!',
      timestamp: '2023-01-01T12:00:00Z',
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: '2023-01-01T12:00:10Z',
    },
  ];

  const mockProps = {
    messages: mockMessages,
    onSendMessage: jest.fn(),
    loading: false,
    onStopGeneration: jest.fn(),
    isStopping: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat messages correctly', () => {
    render(
      <ChatWindow
        messages={mockProps.messages}
        onSendMessage={mockProps.onSendMessage}
        loading={mockProps.loading}
        onStopGeneration={mockProps.onStopGeneration}
        isStopping={mockProps.isStopping}
      />
    );

    // Check if user message is displayed
    expect(screen.getByText('Hello, AI assistant!')).toBeInTheDocument();
    
    // Check if assistant message is displayed
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
  });

  it('sends a message when the send button is clicked', () => {
    render(
      <ChatWindow
        messages={mockProps.messages}
        onSendMessage={mockProps.onSendMessage}
        loading={mockProps.loading}
        onStopGeneration={mockProps.onStopGeneration}
        isStopping={mockProps.isStopping}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'New test message' } });

    // Click send button
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);

    // Check if onSendMessage was called with the correct message
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('New test message');
  });

  it('sends a message when Enter is pressed (without Shift)', () => {
    render(
      <ChatWindow
        messages={mockProps.messages}
        onSendMessage={mockProps.onSendMessage}
        loading={mockProps.loading}
        onStopGeneration={mockProps.onStopGeneration}
        isStopping={mockProps.isStopping}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Enter message test' } });

    // Press Enter (without Shift)
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

    // Check if onSendMessage was called with the correct message
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Enter message test');
  });

  it('does not send a message when Shift+Enter is pressed', () => {
    render(
      <ChatWindow
        messages={mockProps.messages}
        onSendMessage={mockProps.onSendMessage}
        loading={mockProps.loading}
        onStopGeneration={mockProps.onStopGeneration}
        isStopping={mockProps.isStopping}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Shift+Enter test' } });

    // Press Shift+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    // Check that onSendMessage was not called
    expect(mockProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('shows stop button when loading', () => {
    render(
      <ChatWindow
        messages={mockProps.messages}
        onSendMessage={mockProps.onSendMessage}
        loading={true}
        onStopGeneration={mockProps.onStopGeneration}
        isStopping={mockProps.isStopping}
      />
    );

    // Find and verify the stop button
    const stopButton = screen.getByText('Stop');
    expect(stopButton).toBeInTheDocument();
    
    // Click the stop button
    fireEvent.click(stopButton);
    
    // Check if onStopGeneration was called
    expect(mockProps.onStopGeneration).toHaveBeenCalled();
  });
}); 