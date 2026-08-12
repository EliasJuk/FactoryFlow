import { loadConfig } from '../../config/appConfig'
import { SecretStorageService } from '../../services/SecretStorageService'
import { runPostgresMigrationsSafely } from './migrationRunner'

export class PostgresMigrationService {
  private prepared = false
  private preparing: Promise<void> | null = null

  async ensureReady(): Promise<void> {
    if (this.prepared) {
      return
    }

    if (this.preparing) {
      return this.preparing
    }

    this.preparing = this.prepare()

    try {
      await this.preparing
      this.prepared = true
    } finally {
      this.preparing = null
    }
  }

  private async prepare(): Promise<void> {
    const config = loadConfig()
    const postgres = config.database.postgres

    const secrets = new SecretStorageService()
    const password = secrets.getPostgresPassword()

    if (!password) {
      throw new Error('A senha do PostgreSQL ainda não foi configurada.')
    }

    await runPostgresMigrationsSafely({
      host: postgres.host,
      port: postgres.port,
      database: postgres.database,
      user: postgres.user,
      timeoutSeconds: postgres.timeoutSeconds,
      ssl: postgres.ssl,
      password
    })
  }
}

export const postgresMigrationService = new PostgresMigrationService()
