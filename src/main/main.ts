/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  fetchModels,
  generateChat,
  generateChatStream,
  pullModel,
  showModelDetails,
  deleteModel,
  stopChatGeneration,
  generateChatTitle,
} from './api';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for Ollama API
ipcMain.handle('fetch-models', async () => {
  try {
    return await fetchModels();
  } catch (error) {
    console.error('Error fetching models:', error);
    return { error: 'Failed to fetch models. Is Ollama running?' };
  }
});

ipcMain.handle('generate-chat', async (_, { model, messages, parameters }) => {
  try {
    return await generateChat(model, messages, parameters);
  } catch (error) {
    console.error('Error generating chat:', error);
    return { error: 'Failed to generate chat response' };
  }
});

// Add new handler for streaming chat
ipcMain.on('generate-chat-stream', (event, { model, messages, parameters }) => {
  try {
    const stream = generateChatStream(model, messages, parameters);
    
    stream.on('chunk', (data) => {
      // Only send if the window still exists
      if (!event.sender.isDestroyed()) {
        event.sender.send('chat-response-chunk', data);
      }
    });
    
    stream.on('done', (data) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('chat-response-done', data);
      }
    });
    
    stream.on('error', (error) => {
      console.error('Streaming error:', error);
      if (!event.sender.isDestroyed()) {
        event.sender.send('chat-response-error', { error: error.message || 'Error during chat generation' });
      }
    });
    
    // Allow cancellation
    event.sender.on('destroyed', () => {
      stream.removeAllListeners();
    });
    
  } catch (error) {
    console.error('Error setting up chat stream:', error);
    if (!event.sender.isDestroyed()) {
      event.sender.send('chat-response-error', { error: 'Failed to set up streaming chat' });
    }
  }
});

// Handler for stopping chat generation
ipcMain.on('stop-chat-generation', () => {
  try {
    stopChatGeneration();
  } catch (error) {
    console.error('Error stopping chat generation:', error);
  }
});

// Handler for generating chat titles
ipcMain.handle('generate-chat-title', async (_, { model, userMessage }) => {
  try {
    return await generateChatTitle(model, userMessage);
  } catch (error) {
    console.error('Error generating chat title:', error);
    return { title: 'New Chat', error: 'Failed to generate title' };
  }
});

ipcMain.handle('pull-model', async (_, modelName) => {
  try {
    return await pullModel(modelName);
  } catch (error) {
    console.error('Error pulling model:', error);
    return { error: 'Failed to pull model' };
  }
});

ipcMain.handle('show-model-details', async (_, modelName) => {
  try {
    return await showModelDetails(modelName);
  } catch (error) {
    console.error('Error showing model details:', error);
    return { error: 'Failed to get model details' };
  }
});

ipcMain.handle('delete-model', async (_, modelName) => {
  try {
    return await deleteModel(modelName);
  } catch (error) {
    console.error('Error deleting model:', error);
    return { error: 'Failed to delete model' };
  }
});

ipcMain.handle('get-api-endpoint', () => {
  // Get from electron-store or default
  return 'http://localhost:11434';
});

ipcMain.handle('set-api-endpoint', (_, endpoint) => {
  // Save to electron-store
  return { success: true, endpoint };
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch(console.log);