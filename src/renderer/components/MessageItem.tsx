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
  const [MarkdownComponent, setMarkdownComponent] =
    useState<React.ComponentType<MarkdownComponentProps> | null>(null);

  useEffect(() => {
    // Dynamically import Markdown components
    const loadMarkdown = async () => {
      try {
        const ReactMarkdown = await import('react-markdown');
        await Promise.all([import('remark-gfm'), import('rehype-raw')]);

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
    <div
      className={`flex items-start py-2 animate-slide-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3 border border-primary/20">
          <span className="text-primary text-xs font-semibold">AI</span>
        </div>
      )}

      <div
        className={`
          relative rounded-lg p-4 transition-all duration-200 group
          ${
            isUser
              ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-none shadow-md'
              : 'bg-card border border-border/60 text-card-foreground rounded-tl-none shadow-sm'
          }
          ${message.loading ? 'animate-pulse' : ''}
          max-w-[85%] md:max-w-[75%]
        `}
      >
        {/* Copy button overlay - only shows on hover */}
        <button
          onClick={handleCopyContent}
          className={`
            absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity
            ${isUser ? 'bg-white/10 hover:bg-white/20' : 'bg-muted hover:bg-muted/80'} 
          `}
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        </button>

        {copied && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border px-2 py-1 rounded text-xs shadow-md animate-fade-in">
            Copied!
          </div>
        )}

        <div className="text-sm md:text-base whitespace-pre-wrap markdown-content">
          {isUser || !MarkdownComponent ? (
            message.content
          ) : (
            <MarkdownComponent
              remarkPlugins={[
                () => import('remark-gfm').then((mod) => mod.default),
              ]}
              rehypePlugins={[
                () => import('rehype-raw').then((mod) => mod.default),
              ]}
              components={{
                a: (props: any) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  />
                ),
                pre: (props: any) => (
                  <pre
                    {...props}
                    className="bg-muted/70 p-3 rounded-md my-3 overflow-x-auto"
                  />
                ),
                code: ({
                  inline,
                  ...props
                }: { inline?: boolean } & React.HTMLAttributes<HTMLElement>) =>
                  inline ? (
                    <code
                      {...props}
                      className="bg-muted/70 px-1.5 py-0.5 rounded text-xs font-mono"
                    />
                  ) : (
                    <code {...props} className="text-sm block font-mono" />
                  ),
                ul: (props: any) => (
                  <ul {...props} className="list-disc pl-6 my-3 space-y-1" />
                ),
                ol: (props: any) => (
                  <ol {...props} className="list-decimal pl-6 my-3 space-y-1" />
                ),
                li: (props: any) => <li {...props} className="my-1" />,
                h1: (props: any) => (
                  <h1
                    {...props}
                    className="text-lg font-semibold my-3 border-b pb-1 border-border/50"
                  />
                ),
                h2: (props: any) => (
                  <h2 {...props} className="text-md font-semibold my-2" />
                ),
                h3: (props: any) => (
                  <h3 {...props} className="text-sm font-semibold my-2" />
                ),
                p: (props: any) => <p {...props} className="my-2" />,
                blockquote: (props: any) => (
                  <blockquote
                    {...props}
                    className="border-l-3 border-primary pl-3 italic my-3 text-muted-foreground"
                  />
                ),
              }}
            >
              {message.content}
            </MarkdownComponent>
          )}
        </div>

        {message.timestamp && (
          <div
            className={`text-xs mt-2 flex items-center ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ml-3 border border-primary/20">
          <span className="text-primary text-xs font-semibold">You</span>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
