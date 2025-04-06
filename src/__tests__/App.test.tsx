import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../renderer/App';

// Mock scrollIntoView which isn't available in JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock the window.api object
window.api = {
  fetchModels: jest.fn().mockResolvedValue({ models: [{ name: 'llama2' }] }),
  generateChat: jest.fn(),
  startChatStream: jest.fn(),
  stopChatGeneration: jest.fn(),
  generateChatTitle: jest.fn(),
  onChatResponseChunk: jest.fn().mockReturnValue(jest.fn()),
  onChatResponseDone: jest.fn().mockReturnValue(jest.fn()),
  onChatResponseError: jest.fn().mockReturnValue(jest.fn()),
  pullModel: jest.fn(),
  showModelDetails: jest.fn(),
  deleteModel: jest.fn(),
  getApiEndpoint: jest.fn().mockResolvedValue('http://localhost:11434'),
  setApiEndpoint: jest.fn(),
};

// Mock localStorage
interface MockStorage {
  [key: string]: string;
}
const localStorageMock = (() => {
  let store: MockStorage = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders the app successfully', async () => {
    render(<App />);
    
    // Wait for initial data loading
    await waitFor(() => expect(window.api.fetchModels).toHaveBeenCalled());
    
    // Basic UI elements should be present
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('creates a new chat on initial load when no chats exist', async () => {
    // Ensure localStorage returns null for 'chats'
    localStorageMock.getItem.mockReturnValueOnce(null);
    
    render(<App />);
    
    // Wait for models to load
    await waitFor(() => expect(window.api.fetchModels).toHaveBeenCalled());
    
    // Verify localStorage was called to save a new chat
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chats', expect.any(String));
    
    // Parse the saved chat to verify it's a new one
    const setItemCalls = localStorageMock.setItem.mock.calls;
    const chatsSaveCall = setItemCalls.find(call => call[0] === 'chats');
    if (chatsSaveCall) {
      const savedChatsStr = chatsSaveCall[1];
      const savedChats = JSON.parse(savedChatsStr);
      
      expect(savedChats).toHaveLength(1);
      expect(savedChats[0].title).toContain('New Chat');
      expect(savedChats[0].isActive).toBe(true);
    }
  });

  it('loads existing chats from localStorage', async () => {
    // Mock existing chats in localStorage
    const mockChats = JSON.stringify([
      {
        id: 'test-id-1',
        title: 'Existing Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ]);
    
    localStorageMock.getItem.mockReturnValueOnce(mockChats);
    
    render(<App />);
    
    // Wait for models to load
    await waitFor(() => expect(window.api.fetchModels).toHaveBeenCalled());
    
    // Verify that the existing chat title appears
    expect(screen.getByText('Existing Chat')).toBeInTheDocument();
  });

  it('loads API endpoint from settings', async () => {
    render(<App />);
    
    // Wait for the API endpoint to be retrieved
    await waitFor(() => expect(window.api.getApiEndpoint).toHaveBeenCalled());
  });
});
