import type React from 'react';
import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import ModelSelector from './components/ModelSelector';
import SettingsPanel from './components/SettingsPanel';
import type { Message, Model, Settings, Chat } from './types';
import './globals.css';

const App: React.FC = () => {
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
          isActive: index === 0
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
  }, []);

  // Save chat history to localStorage whenever chats or messages change
  useEffect(() => {
    if (activeChatId) {
      // Update the messages of the active chat
      const updatedChats = chats.map((chat) => 
        chat.id === activeChatId 
          ? { ...chat, messages: messages } 
          : chat
      );
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  }, [messages, activeChatId]);

  // Set up streaming response listeners
  useEffect(() => {
    // Listen for streaming response chunks
    const removeChunkListener = window.api.onChatResponseChunk(({ content, fullContent }) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.loading) {
          return prev.map((msg) =>
            msg.id === lastMessage.id
              ? { ...msg, content: fullContent, loading: true }
              : msg
          );
        }
        return prev;
      });
    });

    // Listen for completion
    const removeDoneListener = window.api.onChatResponseDone(({ content }) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.loading) {
          return prev.map((msg) =>
            msg.id === lastMessage.id
              ? { ...msg, content, loading: false }
              : msg
          );
        }
        return prev;
      });
      setLoading(false);
    });

    // Listen for errors
    const removeErrorListener = window.api.onChatResponseError(({ error }) => {
      setError(error || 'Failed to generate response');
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.loading) {
          return prev.map((msg) =>
            msg.id === lastMessage.id
              ? { ...msg, content: 'Error: Failed to generate response', loading: false }
              : msg
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
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (!selectedChat) return;
    
    // Set all chats as inactive except the selected one
    const updatedChats = chats.map(chat => ({
      ...chat,
      isActive: chat.id === chatId
    }));
    
    setChats(updatedChats);
    setActiveChatId(chatId);
    setMessages(selectedChat.messages);
    
    // Save to localStorage
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const deleteChat = (chatId: string) => {
    // Filter out the chat to delete
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    
    // If we're deleting the active chat, switch to another one
    if (activeChatId === chatId) {
      if (filteredChats.length > 0) {
        // Set the first chat as active
        const updatedChats = filteredChats.map((chat, index) => ({
          ...chat,
          isActive: index === 0
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
            ? { ...msg, content: 'Error: Failed to generate response', loading: false }
            : msg
        )
      );
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (activeChatId) {
      // Create a new array of chats with the active chat's messages cleared
      const updatedChats = chats.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [] } 
          : chat
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
      const activeChat = chats.find(chat => chat.id === activeChatId);
      if (activeChat && activeChat.title.startsWith('New Chat') && messages[0]?.role === 'user') {
        // Get first few characters of the first user message
        const newTitle = messages[0].content.slice(0, 25) + (messages[0].content.length > 25 ? '...' : '');
        
        // Update chat title
        const updatedChats = chats.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, title: newTitle } 
            : chat
        );
        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      }
    }
  }, [messages, activeChatId]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="border-b p-3 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Ollama Chat</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearChat}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear Chat"
              title="Clear Chat"
              disabled={messages.length === 0 || loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
            <button
              onClick={createNewChat}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="New Chat"
              title="New Chat"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/15 border-l-4 border-destructive p-3 mx-4 my-2 rounded-md shadow-sm">
          <p className="text-destructive-foreground flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </p>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="w-60 border-r bg-muted/20 shadow-inner overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="p-3 border-b">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium shadow-sm transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              New Chat
            </button>
          </div>
          
          <div className=" relative overflow-y-auto flex-1 p-2">
            <div className="space-y-1 mb-4 h-[60%] overflow-y-auto">
              <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Chat History</h3>
              {chats.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No chat history
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`
                        group flex items-center justify-between p-2 text-sm rounded-md cursor-pointer
                        ${chat.isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                      `}
                      onClick={() => switchChat(chat.id)}
                    >
                      <div className="truncate flex-1">{chat.title}</div>
                      {chat.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground"
                          title="Delete Chat"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t absolute bottom-0 left-0 right-0">
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
};

export default App;

