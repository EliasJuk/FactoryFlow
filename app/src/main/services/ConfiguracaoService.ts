import { Client } from 'pg'

import {
  loadConfig,
  loadLegacyPostgresPassword,
  saveConfig,
  type ApiConfig,
  type AppConfig,
  type PostgresConfig,
  type StorageMode,
  type SyncDestination
} from '../config/appConfig'
import { SecretStorageService } from './SecretStorageService'

export type ConfiguracaoBanco = {
  mode: StorageMode
  sqlite: {
    path: string
  }
  postgres: PostgresConfig & {
    password?: string
    passwordConfigured: boolean
    clearPassword?: boolean
  }
  api: ApiConfig
  sync: {
    enabled: boolean
    destination: SyncDestination
    syncOnStartup: boolean
    syncOnReconnect: boolean
    retryFailed: boolean
    refugoRetention: {
      enabled: boolean
      months: number | null
    }
  }
}

const secrets = new SecretStorageService()

export class ConfiguracaoService {
  private migrateLegacyPassword() {
    if (secrets.hasPostgresPassword()) {
      return
    }

    const legacyPassword = loadLegacyPostgresPassword()

    if (!legacyPassword) {
      return
    }

    secrets.savePostgresPassword(legacyPassword)

    // Regrava o config.json sem a senha antiga em texto puro.
    saveConfig(loadConfig())
  }

  carregarBanco(): ConfiguracaoBanco {
    this.migrateLegacyPassword()

    const config = loadConfig()

    return {
      mode: config.database.mode,
      sqlite: config.database.sqlite,
      postgres: {
        ...config.database.postgres,
        password: '',
        passwordConfigured: secrets.hasPostgresPassword()
      },
      api: config.database.api,
      sync: config.sync
    }
  }

  salvarBanco(config: ConfiguracaoBanco) {
    if (config.mode === 'api') {
      throw new Error('O modo API ainda não está disponível nesta versão.')
    }

    if (
      config.mode === 'postgres' ||
      (config.mode === 'sqliteSync' &&
        config.sync.enabled &&
        config.sync.destination === 'postgres')
    ) {
      if (!config.postgres.host.trim()) {
        throw new Error('Informe o host do PostgreSQL.')
      }

      if (!config.postgres.database.trim()) {
        throw new Error('Informe o banco de dados PostgreSQL.')
      }

      if (!config.postgres.user.trim()) {
        throw new Error('Informe o usuário do PostgreSQL.')
      }
    }

    if (config.postgres.clearPassword) {
      secrets.clearPostgresPassword()
    } else if (config.postgres.password?.trim()) {
      secrets.savePostgresPassword(config.postgres.password)
    }

    const atual = loadConfig()

    const novaConfig: AppConfig = {
      ...atual,
      database: {
        ...atual.database,
        mode: config.mode,
        provider: config.mode === 'postgres' ? 'postgres' : 'sqlite',
        sqlite: {
          path: 'database/database.db'
        },
        postgres: {
          host: config.postgres.host.trim(),
          port: Number(config.postgres.port),
          database: config.postgres.database.trim(),
          user: config.postgres.user.trim(),
          timeoutSeconds: Number(config.postgres.timeoutSeconds || 15),
          ssl: Boolean(config.postgres.ssl)
        },
        api: config.api
      },
      sync: {
        ...config.sync,
        // Nesta etapa, a retenção permanece desativada e todo o histórico fica local.
        refugoRetention: {
          enabled: false,
          months: null
        }
      }
    }

    saveConfig(novaConfig)

    return {
      sucesso: true,
      mensagem:
        'Configuração salva com segurança. Reinicie o FactoryFlow para aplicar o modo de armazenamento.'
    }
  }

  async testarPostgres(config: PostgresConfig & { password?: string }) {
    this.migrateLegacyPassword()

    const password = config.password?.trim() || secrets.getPostgresPassword() || ''
    const client = new Client({
      host: config.host,
      port: Number(config.port),
      database: config.database,
      user: config.user,
      password,
      connectionTimeoutMillis: Math.max(1, Number(config.timeoutSeconds || 15)) * 1000,
      ssl: config.ssl ? { rejectUnauthorized: true } : false
    })

    try {
      await client.connect()
      await client.query('SELECT 1')

      return {
        sucesso: true,
        mensagem: 'Conexão com PostgreSQL realizada com sucesso.'
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro ao conectar: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    } finally {
      await client.end().catch(() => {})
    }
  }

  getMode(): StorageMode {
    return loadConfig().database.mode
  }

  /**
   * Compatibilidade temporária com os repositories atuais.
   * SQLite + Sync usa sempre os repositories SQLite.
   */
  getProvider(): 'sqlite' | 'postgres' {
    return this.getMode() === 'postgres' ? 'postgres' : 'sqlite'
  }

  isSqlite(): boolean {
    return this.getProvider() === 'sqlite'
  }

  isPostgres(): boolean {
    return this.getProvider() === 'postgres'
  }
}
