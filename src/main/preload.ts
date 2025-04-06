import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  fetchModels: () => ipcRenderer.invoke('fetch-models'),
  generateChat: (params: { model: string; messages: any[]; parameters: any }) =>
    ipcRenderer.invoke('generate-chat', params),
  startChatStream: (params: { model: string; messages: any[]; parameters: any }) => {
    ipcRenderer.send('generate-chat-stream', params);
  },
  onChatResponseChunk: (callback: (data: any) => void) => {
    ipcRenderer.on('chat-response-chunk', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('chat-response-chunk');
  },
  onChatResponseDone: (callback: (data: any) => void) => {
    ipcRenderer.on('chat-response-done', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('chat-response-done');
  },
  onChatResponseError: (callback: (error: any) => void) => {
    ipcRenderer.on('chat-response-error', (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('chat-response-error');
  },
  pullModel: (modelName: string) => ipcRenderer.invoke('pull-model', modelName),
  showModelDetails: (modelName: string) => ipcRenderer.invoke('show-model-details', modelName),
  deleteModel: (modelName: string) => ipcRenderer.invoke('delete-model', modelName),
  getApiEndpoint: () => ipcRenderer.invoke('get-api-endpoint'),
  setApiEndpoint: (endpoint: string) => ipcRenderer.invoke('set-api-endpoint', endpoint),
});

