import React, { useState, useEffect } from 'react';
import {
  Search,
  Settings,
  Info,
  PlusCircle,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { Chat, Model } from '../types';

interface SidebarProps {
  chats: Chat[];
  models: Model[];
  selectedModel: string;
  activeChatId: string | null;
  onSwitchChat: (chatId: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onSelectModel: (modelName: string) => void;
  onRefreshModels: () => void;
  onOpenSettings: () => void;
  onPullModel: (modelName: string) => void;
  isOllamaAvailable: boolean;
}

const Sidebar: React.FC<SidebarProps> = function ({
  chats,
  models,
  selectedModel,
  activeChatId,
  onSwitchChat,
  onCreateChat,
  onDeleteChat,
  onRenameChat,
  onSelectModel,
  onRefreshModels,
  onOpenSettings,
  onPullModel,
  isOllamaAvailable,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRenamingChatId, setIsRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Filter chats based on search term
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle rename submission
  const handleRenameSubmit = (chatId: string) => {
    if (newChatTitle.trim()) {
      onRenameChat(chatId, newChatTitle);
      setIsRenamingChatId(null);
      setNewChatTitle('');
    }
  };

  // Start rename process
  const startRenaming = (chat: Chat) => {
    setIsRenamingChatId(chat.id);
    setNewChatTitle(chat.title);
  };

  // Create formatted date for chat timestamp
  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Toggle sidebar expanded state for mobile
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  // Base classes for the sidebar
  const sidebarBaseClasses =
    'h-full flex flex-col border-r bg-gray-50 text-gray-900 transition-width duration-300 ease-in-out';
  // Classes for collapsed state (mobile)
  const sidebarCollapsedClasses = 'w-[60px] overflow-hidden';
  // Classes for expanded state (desktop default, mobile expanded)
  const sidebarExpandedClasses = 'w-64';
  // Classes for expanded state on mobile (absolute positioning)
  const sidebarMobileExpandedClasses =
    'sm:absolute sm:z-50 sm:h-full sm:shadow-lg';

  return (
    <div
      className={`
        ${sidebarBaseClasses} 
        ${expanded ? `${sidebarExpandedClasses} ${sidebarMobileExpandedClasses}` : `sm:${sidebarCollapsedClasses} ${sidebarExpandedClasses}`}
        // Custom scrollbar (assuming defined in globals.css or a UI library)
        // custom-scrollbar 
      `}
    >
      {/* Toggle button for mobile - visible only on sm screens */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`sm:flex hidden absolute top-2 -right-6 z-60 w-6 h-6 bg-blue-600 text-white rounded-r-md items-center justify-center cursor-pointer ${expanded ? '' : 'sm:right-[-24px]'}`}
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Header Section */}
      <div
        className={`p-4 border-b border-gray-200 ${expanded ? '' : 'sm:hidden'}`}
      >
        <h1 className="text-lg font-bold">Ollama Chat</h1>
        <button
          type="button"
          onClick={onCreateChat}
          className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <PlusCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className={`${expanded ? '' : 'sm:hidden'}`}>New Chat</span>
        </button>
      </div>

      {/* Chat History Section */}
      <div
        className={`flex-1 h-[40%] overflow-y-auto custom-scrollbar ${expanded ? '' : 'sm:overflow-hidden'}`}
      >
        <div className={`p-4 ${expanded ? '' : 'sm:p-1'}`}>
          {/* Search Input - hidden on collapsed mobile */}
          <div className={`relative mb-4 ${expanded ? '' : 'sm:hidden'}`}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 text-sm border rounded-md border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Chat List */}
          <div
            className={`space-y-1 ${expanded ? '' : 'sm:flex sm:flex-col sm:items-center'}`}
          >
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`rounded-md cursor-pointer group transition-colors duration-150 
                    ${
                      chat.id === activeChatId
                        ? 'bg-blue-100 border-l-2 border-blue-500'
                        : 'hover:bg-gray-100 border-l-2 border-transparent'
                    }
                    ${expanded ? 'p-2' : 'sm:p-2 sm:w-10 sm:h-10 sm:flex sm:items-center sm:justify-center'}
                  `}
                >
                  {isRenamingChatId === chat.id ? (
                    // Rename Input - hidden on collapsed mobile
                    <div
                      className={`flex items-center ${expanded ? '' : 'sm:hidden'}`}
                    >
                      <input
                        type="text"
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(chat.id);
                          if (e.key === 'Escape') setIsRenamingChatId(null);
                        }}
                        className="flex-1 p-1 text-sm border rounded border-gray-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(chat.id)}
                        className="ml-1 p-1 text-green-600 hover:text-green-800"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRenamingChatId(null)}
                        className="ml-1 p-1 text-red-600 hover:text-red-800"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    // Chat Item Button
                    <button
                      type="button"
                      onClick={() => onSwitchChat(chat.id)}
                      className={`w-full text-left ${expanded ? '' : 'sm:w-auto'}`}
                      title={chat.title} // Tooltip for collapsed view
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSwitchChat(chat.id);
                        }
                      }}
                    >
                      {/* Icon for collapsed view */}
                      {!expanded && (
                        <Info size={18} className="text-gray-600" />
                      )}

                      {/* Content for expanded view */}
                      <div className={`${expanded ? '' : 'sm:hidden'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate text-sm">
                            {chat.title}
                          </span>
                          {/* Action buttons appear on hover in expanded view */}
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenaming(chat);
                              }}
                              className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                              title="Rename Chat"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                              }}
                              className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-100"
                              title="Delete Chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatChatDate(chat.createdAt)}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div
                className={`text-center text-gray-500 p-4 text-sm ${expanded ? '' : 'sm:hidden'}`}
              >
                No chats found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Selection Section */}
      <div
        className={`p-4 border-t border-gray-200 ${expanded ? '' : 'sm:hidden'}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold">Model</h2>
          <button
            type="button"
            onClick={onRefreshModels}
            className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
            title="Refresh models"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {!isOllamaAvailable && (
          <div className="mb-2 p-2 text-xs text-yellow-800 bg-yellow-100 rounded-md">
            Ollama not detected. Start Ollama.
          </div>
        )}

        <select
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          disabled={!isOllamaAvailable || models.length === 0}
          className="w-full p-2 text-sm border rounded-md border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {models.length === 0 ? (
            <option value="" disabled>
              No models found
            </option>
          ) : (
            models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))
          )}
        </select>

        <button
          type="button"
          onClick={() => onPullModel(selectedModel || 'llama3')}
          disabled={!isOllamaAvailable}
          className="mt-2 w-full p-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Info size={14} className="mr-1" /> Pull Model
        </button>
      </div>

      {/* Footer Section */}
      <div
        className={`p-4 border-t border-gray-200 ${expanded ? '' : 'sm:flex sm:flex-col sm:items-center sm:py-4'}`}
      >
        <div
          className={`flex ${expanded ? 'justify-around' : 'sm:flex-col sm:space-y-2'}`}
        >
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className={`ml-1 ${expanded ? 'sr-only' : 'sm:hidden'}`}>
              Settings
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              window.open('https://github.com/your-org/your-repo', '_blank')
            }
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            title="About"
          >
            <Info className="w-5 h-5" />
            <span className={`ml-1 ${expanded ? 'sr-only' : 'sm:hidden'}`}>
              About
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
