'use client';

import React, { useState, useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import type { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  isStopping?: boolean;
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  loading,
  isStopping = false,
  onSendMessage,
  onStopGeneration,
}) => {
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="space-y-2 animate-fade-in delay-100">
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to Ollama Chat
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Select a model and start chatting with your AI assistant
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto w-full border border-muted animate-fade-in delay-200">
              <p className="text-sm text-muted-foreground mb-2 font-medium">
                Pro Tips:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5 text-left">
                <li>Use Shift+Enter for line breaks in your messages</li>
                <li>Click on a message to copy its content</li>
                <li>Different models have different capabilities</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            className="min-h-[44px] max-h-[200px] resize-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            rows={1}
          />
          {loading ? (
            <Button
              onClick={onStopGeneration}
              disabled={isStopping}
              className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground h-[44px] transition-colors"
              size="lg"
              type="button"
            >
              {isStopping ? (
                <div className="flex items-center space-x-1">
                  <span className="animate-pulse">•</span>
                  <span className="animate-pulse delay-75">•</span>
                  <span className="animate-pulse delay-150">•</span>
                </div>
              ) : (
                <span>Stop</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="shrink-0 bg-primary hover:bg-primary/90 h-[44px] transition-colors"
              size="lg"
              type="button"
            >
              <span className="font-medium">Send</span>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 opacity-70">
          {messages.length > 0
            ? `${messages.length} messages`
            : 'Start a new conversation'}
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
