export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  loading?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  isActive: boolean
}

export interface Model {
  name: string
  size?: string
  modified_at?: string
  details?: any
}

export interface Settings {
  apiEndpoint: string
  temperature: number
  maxTokens: number
}

export interface StreamChunk {
  content: string
  fullContent: string
  done: boolean
}

export interface StreamDone {
  content: string
  done: boolean
}

export interface StreamError {
  error: string
}

// Extend the Window interface to include our API
declare global {
  interface Window {
    api: {
      fetchModels: () => Promise<any>
      generateChat: (params: {
        model: string
        messages: any[]
        parameters: any
      }) => Promise<any>
      startChatStream: (params: {
        model: string
        messages: any[]
        parameters: any
      }) => void
      onChatResponseChunk: (callback: (data: StreamChunk) => void) => () => void
      onChatResponseDone: (callback: (data: StreamDone) => void) => () => void
      onChatResponseError: (callback: (data: StreamError) => void) => () => void
      pullModel: (modelName: string) => Promise<any>
      showModelDetails: (modelName: string) => Promise<any>
      deleteModel: (modelName: string) => Promise<any>
      getApiEndpoint: () => Promise<string>
      setApiEndpoint: (endpoint: string) => Promise<any>
    }
  }
}

