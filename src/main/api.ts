import axios from 'axios'
import { EventEmitter } from 'events'

let API_BASE_URL = 'http://localhost:11434'
let activeStreamController: AbortController | null = null

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url
}

export const fetchModels = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/tags`)
  return response.data
}

// Non-streaming version for compatibility
export const generateChat = async (
  model: string,
  messages: any[],
  parameters: any = {}
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/chat`,
      {
        model,
        messages,
        stream: false,
        ...parameters,
      }
    )
    
    return {
      message: response.data.message || { content: '' },
      success: true
    }
  } catch (error: any) {
    console.error('Error in generateChat:', error)
    return {
      error: error.message || 'Unknown error in chat generation',
      success: false
    }
  }
}

// Streaming version that returns an EventEmitter
export const generateChatStream = (
  model: string,
  messages: any[],
  parameters: any = {}
) => {
  const eventEmitter = new EventEmitter()
  
  // Create an AbortController to allow cancellation
  activeStreamController = new AbortController()
  
  // Make the streaming request
  axios({
    method: 'post',
    url: `${API_BASE_URL}/api/chat`,
    data: {
      model,
      messages,
      stream: true,
      ...parameters,
    },
    responseType: 'stream',
    signal: activeStreamController.signal,
  })
  .then(response => {
    let streamedContent = ''
    
    response.data.on('data', (chunk: Buffer) => {
      try {
        const chunkString = chunk.toString('utf8')
        // Ollama sends each chunk as a newline-delimited JSON
        const lines = chunkString.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          const data = JSON.parse(line)
          if (data.message?.content) {
            streamedContent += data.message.content
            eventEmitter.emit('chunk', {
              content: data.message.content,
              fullContent: streamedContent,
              done: false,
            })
          }
          
          if (data.done) {
            eventEmitter.emit('done', {
              content: streamedContent,
              done: true,
            })
            // Clear the active controller when done
            activeStreamController = null
          }
        }
      } catch (error) {
        eventEmitter.emit('error', error)
      }
    })
    
    response.data.on('end', () => {
      eventEmitter.emit('end')
      // Clear the active controller when done
      activeStreamController = null
    })
    
    response.data.on('error', (error: Error) => {
      eventEmitter.emit('error', error)
      // Clear the active controller on error
      activeStreamController = null
    })
  })
  .catch(error => {
    // Don't report error if it's from an abortion
    if (!axios.isCancel(error)) {
      eventEmitter.emit('error', error)
    } else {
      eventEmitter.emit('done', {
        content: 'Generation stopped',
        done: true,
      })
    }
    // Clear the active controller on error/abort
    activeStreamController = null
  })
  
  return eventEmitter
}

// Stop any active generation
export const stopChatGeneration = () => {
  if (activeStreamController) {
    activeStreamController.abort()
    activeStreamController = null
    return true
  }
  return false
}

// Generate a title for a chat using the LLM
export const generateChatTitle = async (
  model: string,
  userMessage: string,
) => {
  try {
    // Create a system message asking the model to generate a short title
    const messages = [
      {
        role: 'system',
        content: 'Generate a short, concise title (max 5 words) for a conversation that starts with this user message. Return only the title without quotes or explanations.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ]

    const response = await axios.post(
      `${API_BASE_URL}/api/chat`,
      {
        model,
        messages,
        stream: false,
        // Use lower temperature for more predictable title generation
        temperature: 0.3,
        max_tokens: 20,
      }
    )
    
    const title = response.data.message?.content?.trim() || 'New Chat'
    
    // Ensure title isn't too long
    return {
      title: title.length > 30 ? title.substring(0, 30) + '...' : title
    }
  } catch (error: any) {
    console.error('Error generating chat title:', error)
    return {
      title: 'New Chat',
      error: error.message
    }
  }
}

export const pullModel = async (modelName: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/pull`, {
    name: modelName,
  })

  return response.data
}

export const showModelDetails = async (modelName: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/show`, {
    name: modelName,
  })

  return response.data
}

export const deleteModel = async (modelName: string) => {
  const response = await axios.delete(`${API_BASE_URL}/api/delete`, {
    data: { name: modelName },
  })

  return response.data
}

