"use client"

import React, { useState, useRef, useEffect } from "react"
import MessageItem from "./MessageItem"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import type { Message } from "../types"

interface ChatWindowProps {
  messages: Message[]
  loading: boolean
  onSendMessage: (content: string) => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, onSendMessage }) => {
  const [input, setInput] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if (input.trim() && !loading) {
      onSendMessage(input)
      setInput("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Welcome to Ollama Chat</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">Select a model and start chatting with your AI assistant</p>
            </div>
            <div className="glass-effect p-4 rounded-lg max-w-md mx-auto w-full">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Pro Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
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

      <div className="border-t p-4 bg-card">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            className="min-h-[44px] resize-none focus-ring"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !input.trim()}
            className="shrink-0"
            variant={loading ? "outline" : "gradient"}
            size="lg"
          >
            {loading ? (
              <div className="flex items-center">
                <span className="animate-pulse">•</span>
                <span className="animate-pulse ml-1 delay-75">•</span>
                <span className="animate-pulse ml-1 delay-150">•</span>
              </div>
            ) : "Send"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow

