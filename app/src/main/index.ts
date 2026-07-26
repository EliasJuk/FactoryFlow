import { app, shell, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { isAbsolute, join, relative, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const testUserDataDir = process.env.FACTORYFLOW_USER_DATA_DIR
if (testUserDataDir) {
  app.setPath('userData', resolve(testUserDataDir))
  console.log(`[TEST INSTANCE] userData: ${app.getPath('userData')}`)
}

import { DatabaseManager } from './database/DatabaseManager'
import { pool } from './database/postgres/connection'
import { SyncWorker } from './sync/SyncWorker'
import { SyncPullWorker } from './sync/SyncPullWorker'

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
import { SecretStorageService } from './services/SecretStorageService'

let mainWindow: BrowserWindow | null = null
let appReady = false

const syncWorker = new SyncWorker(30_000)
const syncPullWorker = new SyncPullWorker(30_000)

const syncBackfillService = new SyncBackfillService()

type SyncTestInstance = 'PC-A' | 'PC-B'

function isPathInside(basePath: string, candidatePath: string): boolean {
  const relativePath = relative(
    resolve(basePath),
    resolve(candidatePath)
  )

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  )
}

/**
 * Valida se o processo atual e realmente uma instancia isolada
 * dos testes de sincronizacao.
 *
 * Essa verificacao impede que a senha recebida para os testes seja
 * usada por uma instalacao normal ou empacotada do projeto.
 */

function getSyncTestInstance(): SyncTestInstance | null {
  if (app.isPackaged || !is.dev) {
    return null
  }

  const instance =
    process.env.FACTORYFLOW_TEST_INSTANCE?.trim()

  if (instance !== 'PC-A' && instance !== 'PC-B') {
    return null
  }

  const configDirectory =
    process.env.FACTORYFLOW_CONFIG_DIR?.trim()
  const userDataDirectory =
    process.env.FACTORYFLOW_USER_DATA_DIR?.trim()
  const sqlitePath =
    process.env.FACTORYFLOW_SQLITE_PATH?.trim()

  if (
    !configDirectory ||
    !userDataDirectory ||
    !sqlitePath
  ) {
    return null
  }

  const syncTestRoot = resolve(
    process.cwd(),
    'tests',
    'sync'
  )

  const pathsAreIsolated = [
    configDirectory,
    userDataDirectory,
    sqlitePath
  ].every((path) => isPathInside(syncTestRoot, path))

  return pathsAreIsolated ? instance : null
}

/**
 * Grava a senha **descartavel** dos testes no mesmo SecretStorageService
 * utilizado pela aplicacao.
 *
 * A senha:
 * - somente e aceita em desenvolvimento;
 * - somente e aceita para PC-A ou PC-B;
 * - somente e aceita quando todos os caminhos apontam para tests/sync;
 * - e criptografada pelo safeStorage do proprio processo principal;
 * - e removida do ambiente logo apos ser armazenada.
 */
function prepareSyncTestPostgresCredential(): void {
  const instance = getSyncTestInstance()

  if (!instance) {
    return
  }

  const password =
    process.env.FACTORYFLOW_TEST_POSTGRES_PASSWORD

  if (!password?.trim()) {
    throw new Error(
      `A senha protegida de teste nao foi recebida pelo ${instance}.`
    )
  }

  const secrets = new SecretStorageService()
  secrets.savePostgresPassword(password)

  delete process.env.FACTORYFLOW_TEST_POSTGRES_PASSWORD

  console.log(
    `[SYNC TEST] Credencial PostgreSQL protegida preparada para ${instance}.`
  )
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: process.env.FACTORYFLOW_TEST_INSTANCE
      ? `FactoryFlow — ${process.env.FACTORYFLOW_TEST_INSTANCE}`
      : 'FactoryFlow',
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
    prepareSyncTestPostgresCredential()

    sendStartupProgress('Preparando sistema...', 20)

    sendStartupProgress('Inicializando banco de dados...', 45)
    console.time('DatabaseManager.initialize')
    await DatabaseManager.initialize()
    console.timeEnd('DatabaseManager.initialize')

    syncBackfillService.runBaseEntitiesBackfill()
    syncWorker.start()
    syncPullWorker.start()

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
  syncPullWorker.stop()
  globalShortcut.unregisterAll()
  void pool.end()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
