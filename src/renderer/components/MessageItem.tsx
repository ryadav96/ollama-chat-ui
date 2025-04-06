import React, { useState } from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const handleCopyContent = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mr-2">
          <span className="text-primary text-xs font-bold">AI</span>
        </div>
      )}
      
      <div 
        onClick={handleCopyContent}
        className={`
          relative rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer
          hover-shadow-effect
          ${isUser 
            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-none' 
            : 'bg-card border border-border text-card-foreground rounded-tl-none'
          }
          ${message.loading ? 'animate-pulse' : ''}
          max-w-[85%] md:max-w-[75%]
        `}
      >
        {copied && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background text-foreground px-2 py-1 rounded text-xs shadow-md">
            Copied!
          </div>
        )}
        
        <div className="text-sm md:text-base whitespace-pre-wrap">{message.content}</div>
        
        {message.timestamp && (
          <div className={`text-xs mt-2 flex items-center ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 ml-2">
          <span className="text-secondary-foreground text-xs font-bold">You</span>
        </div>
      )}
    </div>
  );
};

export default MessageItem;

