import { app, shell, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { DatabaseManager } from './database/DatabaseManager'
import { pool } from './database/postgres/connection'
import { SyncWorker } from './sync/SyncWorker'

import { registerSetorIpc } from './ipc/setor.ipc'
import { registerSubsetorIpc } from './ipc/subsetor.ipc'
import { registerComponenteIpc } from './ipc/componente.ipc'
import { registerCircuitoIpc } from './ipc/circuito.ipc'
import { registerCircuitoComponenteIpc } from './ipc/circuitoComponente.ipc'
import { registerPostoIpc } from './ipc/posto.ipc'
import { registerPostoDefeitoIpc } from './ipc/postoDefeito.ipc'
import { registerDefeitoIpc } from './ipc/defeito.ipc'
import { registerRefugoIpc } from './ipc/refugo.ipc'
import { registerRoteiroIpc } from './ipc/roteiro.ipc'
import { registerUsuarioIpc } from './ipc/usuario.ipc'
import { registerImportacaoIpc } from './ipc/importacao.ipc'
import { registerExportacaoIpc } from './ipc/exportacao.ipc'
import { registerConfiguracaoIpc } from './ipc/configuracao.ipc'
import { registerAuthIpc } from './ipc/auth.ipc'
import { registerPasswordResetIpc } from './ipc/passwordReset.ipc'
import { SyncBackfillService } from './sync/SyncBackfillService'

let mainWindow: BrowserWindow | null = null
let appReady = false

const syncWorker = new SyncWorker(30_000)
const syncBackfillService = new SyncBackfillService()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function sendStartupProgress(message: string, progress: number): void {
  mainWindow?.webContents.send('app:startup-progress', {
    message,
    progress
  })
}

function registerBootstrapIpcHandlers(): void {
  registerConfiguracaoIpc()

  ipcMain.handle('app:is-ready', () => {
    return appReady
  })
}

function registerDatabaseIpcHandlers(): void {
  registerSetorIpc()
  registerSubsetorIpc()
  registerComponenteIpc()
  registerCircuitoIpc()
  registerCircuitoComponenteIpc()
  registerPostoIpc()
  registerPostoDefeitoIpc()
  registerDefeitoIpc()
  registerRoteiroIpc()
  registerRefugoIpc()
  registerUsuarioIpc()
  registerImportacaoIpc()
  registerExportacaoIpc()
  registerAuthIpc()
  registerPasswordResetIpc()
}

//DEV TOOLS
function registerShortcuts(): void {
  globalShortcut.register('F12', () => {
    BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
  })
}

async function initializeApplication(): Promise<void> {
  try {
    sendStartupProgress('Preparando sistema...', 20)

    sendStartupProgress('Inicializando banco de dados...', 45)
    console.time('DatabaseManager.initialize')
    await DatabaseManager.initialize()
    console.timeEnd('DatabaseManager.initialize')

    syncBackfillService.runBaseEntitiesBackfill()
    syncWorker.start()

    sendStartupProgress('Registrando módulos...', 75)
    registerDatabaseIpcHandlers()

    sendStartupProgress('Finalizando...', 100)

    appReady = true

    mainWindow?.webContents.send('app:ready')
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error)

    mainWindow?.webContents.send('app:startup-error', {
      message: 'Erro ao inicializar o sistema. Verifique o banco de dados.'
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.factoryflow')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerBootstrapIpcHandlers()
  createWindow()
  registerShortcuts()

  void initializeApplication()

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('will-quit', () => {
  syncWorker.stop()
  globalShortcut.unregisterAll()
  void pool.end()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
