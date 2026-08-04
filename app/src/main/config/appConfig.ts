import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

export type StorageMode = 'sqliteSync' | 'api' | 'postgres'
export type DatabaseProvider = 'sqlite' | 'postgres'
export type SyncDestination = 'postgres' | 'api'

export type PostgresConfig = {
  host: string
  port: number
  database: string
  user: string
  timeoutSeconds: number
  ssl: boolean
}

export type ApiConfig = {
  baseUrl: string
  version: string
  authMethod: 'bearer'
  timeoutSeconds: number
  validateSsl: boolean
  retryOnError: boolean
}

export type AppConfig = {
  database: {
    mode: StorageMode
    /**
     * Campo de compatibilidade para os repositories atuais.
     * Em SQLite + Sync, o aplicativo sempre trabalha no SQLite.
     */
    provider: DatabaseProvider
    sqlite: {
      path: string
    }
    postgres: PostgresConfig
    api: ApiConfig
  }
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

const defaultConfig: AppConfig = {
  database: {
    mode: 'sqliteSync',
    provider: 'sqlite',
    sqlite: {
      path: 'database/database.db'
    },
    postgres: {
      host: 'localhost',
      port: 5432,
      database: 'factoryflow',
      user: 'postgres',
      timeoutSeconds: 15,
      ssl: false
    },
    api: {
      baseUrl: 'http://localhost:8080',
      version: 'v1',
      authMethod: 'bearer',
      timeoutSeconds: 15,
      validateSsl: true,
      retryOnError: true
    }
  },
  sync: {
    enabled: false,
    destination: 'postgres',
    syncOnStartup: true,
    syncOnReconnect: true,
    retryFailed: true,
    refugoRetention: {
      enabled: false,
      months: null
    }
  }
}

type LegacyConfig = {
  database?: {
    provider?: DatabaseProvider
    postgres?: Partial<PostgresConfig> & {
      password?: string
    }
  }
}

export function getApplicationFolder() {
  const override = process.env.FACTORYFLOW_CONFIG_DIR
  if (override) return resolve(override)

  if (!app.isPackaged) return process.cwd()

  return process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath('exe'))
}

export function getConfigPath() {
  return join(getApplicationFolder(), 'config', 'config.json')
}

export function getSecretsPath() {
  return join(getApplicationFolder(), 'config', 'secrets.json')
}

export function loadLegacyPostgresPassword(): string | null {
  const configPath = getConfigPath()

  if (!existsSync(configPath)) {
    return null
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf8')) as LegacyConfig
    const password = raw.database?.postgres?.password
    return typeof password === 'string' && password.length > 0 ? password : null
  } catch {
    return null
  }
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath()
  const configFolder = dirname(configPath)

  if (!existsSync(configFolder)) {
    mkdirSync(configFolder, { recursive: true })
  }

  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
    return defaultConfig
  }

  const savedConfig = JSON.parse(readFileSync(configPath, 'utf8')) as Partial<AppConfig> &
    LegacyConfig

  const legacyProvider = savedConfig.database?.provider
  const inferredMode: StorageMode =
    savedConfig.database?.mode ?? (legacyProvider === 'postgres' ? 'postgres' : 'sqliteSync')

  const provider: DatabaseProvider = inferredMode === 'postgres' ? 'postgres' : 'sqlite'
  const postgresSemSenha = { ...(savedConfig.database?.postgres ?? {}) }
  delete postgresSemSenha.password

  return {
    ...defaultConfig,
    ...savedConfig,
    database: {
      ...defaultConfig.database,
      ...savedConfig.database,
      mode: inferredMode,
      provider,
      sqlite: {
        ...defaultConfig.database.sqlite,
        ...savedConfig.database?.sqlite
      },
      postgres: {
        ...defaultConfig.database.postgres,
        ...postgresSemSenha
      },
      api: {
        ...defaultConfig.database.api,
        ...savedConfig.database?.api
      }
    },
    sync: {
      ...defaultConfig.sync,
      ...savedConfig.sync,
      refugoRetention: {
        ...defaultConfig.sync.refugoRetention,
        ...savedConfig.sync?.refugoRetention
      }
    }
  }
}

export function saveConfig(config: AppConfig) {
  const configPath = getConfigPath()
  const configFolder = dirname(configPath)

  if (!existsSync(configFolder)) {
    mkdirSync(configFolder, { recursive: true })
  }

  const normalized: AppConfig = {
    ...config,
    database: {
      ...config.database,
      provider: config.database.mode === 'postgres' ? 'postgres' : 'sqlite',
      postgres: {
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        database: config.database.postgres.database,
        user: config.database.postgres.user,
        timeoutSeconds: config.database.postgres.timeoutSeconds,
        ssl: config.database.postgres.ssl
      }
    }
  }

  writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf8')
}
