import React, { useState, useEffect } from 'react';
import type { Message } from '../types';

// Declare types for dynamic imports
interface MarkdownComponentProps {
  children: string;
  components?: any;
  remarkPlugins?: any[];
  rehypePlugins?: any[];
}

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [MarkdownComponent, setMarkdownComponent] = useState<React.ComponentType<MarkdownComponentProps> | null>(null);
  
  useEffect(() => {
    // Dynamically import Markdown components
    const loadMarkdown = async () => {
      try {
        const ReactMarkdown = await import('react-markdown');
        await Promise.all([
          import('remark-gfm'),
          import('rehype-raw')
        ]);
        
        setMarkdownComponent(() => ReactMarkdown.default);
      } catch (error) {
        console.error('Failed to load Markdown components:', error);
      }
    };
    
    loadMarkdown();
  }, []);
  
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
        
        <div className="text-sm md:text-base whitespace-pre-wrap markdown-content">
          {isUser || !MarkdownComponent ? (
            message.content
          ) : (
            <MarkdownComponent
              remarkPlugins={[() => import('remark-gfm').then(mod => mod.default)]}
              rehypePlugins={[() => import('rehype-raw').then(mod => mod.default)]}
              components={{
                a: (props: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline" />,
                pre: (props: any) => <pre {...props} className="bg-muted p-2 rounded my-2 overflow-x-auto" />,
                code: ({inline, ...props}: {inline?: boolean} & React.HTMLAttributes<HTMLElement>) => 
                  inline 
                    ? <code {...props} className="bg-muted px-1 py-0.5 rounded text-xs" />
                    : <code {...props} className="text-sm block" />,
                ul: (props: any) => <ul {...props} className="list-disc pl-6 my-2" />,
                ol: (props: any) => <ol {...props} className="list-decimal pl-6 my-2" />,
                li: (props: any) => <li {...props} className="my-1" />,
                h1: (props: any) => <h1 {...props} className="text-lg font-bold my-3" />,
                h2: (props: any) => <h2 {...props} className="text-md font-bold my-2" />,
                h3: (props: any) => <h3 {...props} className="text-sm font-bold my-2" />,
                p: (props: any) => <p {...props} className="my-2" />,
                blockquote: (props: any) => <blockquote {...props} className="border-l-4 border-primary/30 pl-2 italic my-2" />
              }}
            >
              {message.content}
            </MarkdownComponent>
          )}
        </div>
        
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

