import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { existsSync, mkdirSync, renameSync } from 'fs'
import { dirname, join } from 'path'

const isDev = !app.isPackaged

const applicationFolder = isDev
  ? process.cwd()
  : process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath('exe'))

const databaseFolder = join(applicationFolder, 'database')
const legacyDbPath = join(databaseFolder, 'factoryflow.db')
const dbPath = join(databaseFolder, 'database.db')

if (!existsSync(databaseFolder)) {
  mkdirSync(databaseFolder, { recursive: true })
}

/**
 * Migração segura do nome antigo.
 * Nunca cria um banco vazio se o banco antigo ainda existir.
 */
if (!existsSync(dbPath) && existsSync(legacyDbPath)) {
  renameSync(legacyDbPath, dbPath)

  for (const suffix of ['-wal', '-shm']) {
    const oldSidecar = `${legacyDbPath}${suffix}`
    const newSidecar = `${dbPath}${suffix}`

    if (existsSync(oldSidecar) && !existsSync(newSidecar)) {
      renameSync(oldSidecar, newSidecar)
    }
  }

  console.log('[DATABASE] Banco local renomeado para database/database.db')
}

const sqlite: DatabaseType = new Database(dbPath)

sqlite.pragma('foreign_keys = ON')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')

export default sqlite
