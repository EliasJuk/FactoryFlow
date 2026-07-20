import { loadConfig } from '../config/appConfig'

import { runMigrations as runSqliteMigrations } from './sqlite/migrations'
import { runSyncMigrations } from './sqlite/syncMigrations'
import { runPostgresMigrations } from './postgres/migrations'

export class DatabaseManager {
  static async initialize() {
    const config = loadConfig()
    const mode = config.database.mode

    if (mode === 'postgres') {
      console.log('[DATABASE] Modo: PostgreSQL')
      await runPostgresMigrations()
      return
    }

    if (mode === 'api') {
      throw new Error('O modo API ainda não está disponível.')
    }

    console.log('[DATABASE] Modo: SQLite + Sync')
    runSqliteMigrations()
    runSyncMigrations()
  }
}
