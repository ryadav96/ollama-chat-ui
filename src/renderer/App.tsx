import type React from 'react';
import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import ModelSelector from './components/ModelSelector';
import SettingsPanel from './components/SettingsPanel';
import type { Message, Model, Settings, Chat } from './types';
import './globals.css';

function App() {
  console.log('App component is starting to render');
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<Settings>({
    apiEndpoint: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 2000,
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Define load functions before useEffect
  const loadModels = async () => {
    try {
      setError(null);
      const response = await window.api.fetchModels();

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.models) {
        setModels(response.models);
        if (response.models.length > 0 && !selectedModel) {
          setSelectedModel(response.models[0].name);
        }
      }
    } catch (err) {
      setError('Failed to load models. Is Ollama running?');
      console.error('Error loading models:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const apiEndpoint = await window.api.getApiEndpoint();
      setSettings((prev) => ({ ...prev, apiEndpoint }));
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  // Create a new chat function
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Clear current messages
    setMessages([]);

    // Set all other chats as inactive
    const updatedChats = chats.map((chat) => ({
      ...chat,
      isActive: false,
    }));

    // Add the new chat and update state
    const newChats = [...updatedChats, newChat];
    setChats(newChats);
    setActiveChatId(newChatId);

    // Save to localStorage
    localStorage.setItem('chats', JSON.stringify(newChats));
  };

  // Load initial data
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);

      // Set the last active chat as current
      const lastActiveChat = parsedChats.find((chat: Chat) => chat.isActive);
      if (lastActiveChat) {
        setActiveChatId(lastActiveChat.id);
        setMessages(lastActiveChat.messages);
      } else if (parsedChats.length > 0) {
        // If no active chat, set the first one as active
        setActiveChatId(parsedChats[0].id);
        setMessages(parsedChats[0].messages);

        // Mark this chat as active
        const updatedChats = parsedChats.map((chat: Chat, index: number) => ({
          ...chat,
          isActive: index === 0,
        }));
        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }

    loadModels();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chat history to localStorage whenever chats or messages change
  useEffect(() => {
    if (activeChatId) {
      // Update the messages of the active chat
      const updatedChats = chats.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: messages } : chat,
      );
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  }, [messages, activeChatId]);

  // Set up streaming response listeners
  useEffect(() => {
    // Listen for streaming response chunks
    const removeChunkListener = window.api.onChatResponseChunk(
      ({ content, fullContent }) => {
        setMessages((prev) => {
          const lastMessage = prev.length > 0 ? prev[prev.length - 1] : null;
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.loading) {
            return prev.map((msg) =>
              msg.id === lastMessage.id
                ? { ...msg, content: fullContent, loading: true }
                : msg,
            );
          }
          return prev;
        });
      },
    );

    // Listen for completion
    const removeDoneListener = window.api.onChatResponseDone(({ content }) => {
      setMessages((prev) => {
        const lastMessage = prev.length > 0 ? prev[prev.length - 1] : null;
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.loading) {
          return prev.map((msg) =>
            msg.id === lastMessage.id
              ? { ...msg, content, loading: false }
              : msg,
          );
        }
        return prev;
      });
      setLoading(false);
    });

    // Listen for errors
    const removeErrorListener = window.api.onChatResponseError(({ error: responseError }) => {
      setError(responseError || 'Failed to generate response');
      setMessages((prev) => {
        const lastMessage = prev.length > 0 ? prev[prev.length - 1] : null;
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.loading) {
          return prev.map((msg) =>
            msg.id === lastMessage.id
              ? {
                  ...msg,
                  content: 'Error: Failed to generate response',
                  loading: false,
                }
              : msg,
          );
        }
        return prev;
      });
      setLoading(false);
    });

    // Cleanup listeners on component unmount
    return () => {
      removeChunkListener();
      removeDoneListener();
      removeErrorListener();
    };
  }, []);

  const switchChat = (chatId: string) => {
    // Find the selected chat
    const selectedChat = chats.find((chat) => chat.id === chatId);
    if (!selectedChat) return;

    // Set all chats as inactive except the selected one
    const updatedChats = chats.map((chat) => ({
      ...chat,
      isActive: chat.id === chatId,
    }));

    setChats(updatedChats);
    setActiveChatId(chatId);
    setMessages(selectedChat.messages);

    // Save to localStorage
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const deleteChat = (chatId: string) => {
    // Filter out the chat to delete
    const filteredChats = chats.filter((chat) => chat.id !== chatId);

    // If we're deleting the active chat, switch to another one
    if (activeChatId === chatId) {
      if (filteredChats.length > 0) {
        // Set the first chat as active
        const updatedChats = filteredChats.map((chat, index) => ({
          ...chat,
          isActive: index === 0,
        }));
        setChats(updatedChats);
        setActiveChatId(updatedChats[0].id);
        setMessages(updatedChats[0].messages);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      } else {
        // If no chats left, create a new one
        setChats([]);
        localStorage.setItem('chats', JSON.stringify([]));
        createNewChat();
      }
    } else {
      // If we're not deleting the active chat, just update the list
      setChats(filteredChats);
      localStorage.setItem('chats', JSON.stringify(filteredChats));
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedModel) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      loading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(true);

    try {
      setError(null);

      // Format messages for Ollama API
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messageHistory.push({ role: 'user', content });

      // Start streaming response
      window.api.startChatStream({
        model: selectedModel,
        messages: messageHistory,
        parameters: {
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        },
      });
    } catch (err) {
      setError('Failed to start chat streaming');
      console.error('Error starting message stream:', err);

      // Update the assistant message to show the error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Error: Failed to generate response',
                loading: false,
              }
            : msg,
        ),
      );
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (activeChatId) {
      // Create a new array of chats with the active chat's messages cleared
      const updatedChats = chats.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: [] } : chat,
      );
      setChats(updatedChats);
      setMessages([]);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };

  const handleRefreshModels = () => {
    loadModels();
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      await window.api.setApiEndpoint(newSettings.apiEndpoint);
      setSettings(newSettings);
      setShowSettings(false);
      // Reload models after changing API endpoint
      loadModels();
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  // Icons extracted for better readability (define these as components or import from a library)
  const SearchIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const TrashIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );

  const handlePullModel = async (modelName: string) => {
    try {
      setError(null);
      const response = await window.api.pullModel(modelName);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Refresh models list after pulling
      loadModels();
    } catch (err) {
      setError('Failed to pull model');
      console.error('Error pulling model:', err);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    try {
      setError(null);
      const response = await window.api.deleteModel(modelName);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Refresh models list after deleting
      loadModels();
    } catch (err) {
      setError('Failed to delete model');
      console.error('Error deleting model:', err);
    }
  };

  // Rename chat to first message content if title is default
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const activeChat = chats.find((chat) => chat.id === activeChatId);
      if (
        activeChat &&
        activeChat.title.startsWith('New Chat') &&
        messages[0]?.role === 'user'
      ) {
        // Get first few characters of the first user message
        const newTitle =
          messages[0].content.slice(0, 25) +
          (messages[0].content.length > 25 ? '...' : '');

        // Update chat title
        const updatedChats = chats.map((chat) =>
          chat.id === activeChatId ? { ...chat, title: newTitle } : chat,
        );
        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      }
    }
  }, [messages, activeChatId]);

  // Return chats sorted by date (newest first) and filtered by search term
  const getFilteredChats = () => {
    return [...chats]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .filter(
        (chat) =>
          chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.messages.some((msg) =>
            msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="w-full border-b border-primary/20 bg-background/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm ">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          {/* Logo/Title Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center bg-primary/10 p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary w-5 h-5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Ollama Chat
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearChat}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                messages.length === 0 || loading
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-foreground hover:bg-primary/10'
              }`}
              aria-label="Clear Chat"
              title="Clear Chat"
              disabled={messages.length === 0 || loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              <span>Clear</span>
            </button>

            <button
              onClick={createNewChat}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                loading
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-foreground hover:bg-primary/10'
              }`}
              aria-label="New Chat"
              title="New Chat"
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              <span>New Chat</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/15 border-l-4 border-destructive p-3 mx-4 my-2 rounded-md shadow-sm">
          <p className="text-destructive flex items-center gap-2 text-sm font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </p>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-muted/20 shadow-inner overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="p-3 border-b">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium shadow-sm transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              New Chat
            </button>
          </div>

          <div className="flex flex-col h-full">
            {/* Chat History Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header and Search */}
              <div className="px-3 pt-3 pb-2 space-y-2 border-b">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Chat History
                </h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <SearchIcon className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    aria-label="Search chat history"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto p-2">
                {getFilteredChats().length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <p className="text-sm text-gray-500">
                      {searchTerm
                        ? 'No matching chats found'
                        : 'No chat history available'}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {getFilteredChats().map((chat) => (
                      <li key={chat.id}>
                        <button
                          onClick={() => switchChat(chat.id)}
                          className={`w-full flex items-center justify-between p-2 text-sm rounded-md transition-colors
                  ${
                    chat.isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                          aria-current={chat.isActive ? 'true' : 'false'}
                        >
                          <span className="truncate text-left flex-1">
                            {chat.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
                            aria-label={`Delete chat ${chat.title}`}
                            title="Delete chat"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Model Selector Section */}
            <div className="border-t p-3">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onRefreshModels={handleRefreshModels}
                onPullModel={handlePullModel}
                onDeleteModel={handleDeleteModel}
                loading={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden mb-4">
          <ChatWindow
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;
