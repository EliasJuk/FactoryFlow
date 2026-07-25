import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'

const isDev = !app.isPackaged

const applicationFolder = isDev
  ? process.cwd()
  : process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath('exe'))

const configuredPath = process.env.FACTORYFLOW_SQLITE_PATH

const dbPath = configuredPath
  ? resolve(configuredPath)
  : join(applicationFolder, 'database', 'database.db')

const databaseFolder = dirname(dbPath)

if (!existsSync(databaseFolder)) {
  mkdirSync(databaseFolder, { recursive: true })
}

console.log(`[DATABASE] SQLite: ${dbPath}`)

const sqlite: DatabaseType = new Database(dbPath)

sqlite.pragma('foreign_keys = ON')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')

export default sqlite
