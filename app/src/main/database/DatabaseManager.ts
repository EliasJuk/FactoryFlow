import { loadConfig } from '../config/appConfig'

import { postgresMigrationService } from './postgres/PostgresMigrationService'
import { runMigrations as runSqliteMigrations } from './sqlite/migrations'
import { runSyncMigrations } from './sqlite/syncMigrations'

export class DatabaseManager {
  static async initialize() {
    const config = loadConfig()
    const mode = config.database.mode

    if (mode === 'postgres') {
      console.log('[DATABASE] Modo: PostgreSQL')

      await postgresMigrationService.ensureReady()

      return
    }

    if (mode === 'api') {
      throw new Error('O modo API ainda não está disponível.')
    }

    console.log('[DATABASE] Modo: SQLite + Sync')

    runSqliteMigrations()
    runSyncMigrations()

    const usaPostgres = config.sync.enabled && config.sync.destination === 'postgres'

    if (usaPostgres) {
      try {
        await postgresMigrationService.ensureReady()
      } catch (error) {
        console.warn(
          '[DATABASE] PostgreSQL indisponível durante a inicialização. O FactoryFlow continuará usando SQLite.',
          error
        )
      }
    }
  }
}
