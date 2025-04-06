import axios from 'axios'
import { EventEmitter } from 'events'

let API_BASE_URL = 'http://localhost:11434'

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
          }
        }
      } catch (error) {
        eventEmitter.emit('error', error)
      }
    })
    
    response.data.on('end', () => {
      eventEmitter.emit('end')
    })
    
    response.data.on('error', (error: Error) => {
      eventEmitter.emit('error', error)
    })
  })
  .catch(error => {
    eventEmitter.emit('error', error)
  })
  
  return eventEmitter
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

