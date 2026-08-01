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

type PostgresNormalizado = PostgresConfig & {
  password?: string
  clearPassword: boolean
}

type SyncNormalizado = {
  enabled: boolean
  destination: SyncDestination
  syncOnStartup: boolean
  syncOnReconnect: boolean
  retryFailed: boolean
}

const secrets = new SecretStorageService()

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function texto(
  valor: unknown,
  campo: string,
  obrigatorio: boolean,
  tamanhoMaximo = 255
): string {
  if (typeof valor !== 'string') {
    throw new Error(`Valor inválido para ${campo}.`)
  }

  const normalizado = valor.trim()

  if (obrigatorio && !normalizado) {
    throw new Error(`Informe ${campo}.`)
  }

  if (normalizado.length > tamanhoMaximo || /[\0\r\n]/.test(normalizado)) {
    throw new Error(`Valor inválido para ${campo}.`)
  }

  return normalizado
}

function inteiro(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number
): number {
  const numero = typeof valor === 'number' ? valor : Number(valor)

  if (!Number.isSafeInteger(numero) || numero < minimo || numero > maximo) {
    throw new Error(`Valor inválido para ${campo}.`)
  }

  return numero
}

function booleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== 'boolean') {
    throw new Error(`Valor inválido para ${campo}.`)
  }

  return valor
}

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

  private normalizarModo(valor: unknown): StorageMode {
    if (valor !== 'sqliteSync' && valor !== 'postgres' && valor !== 'api') {
      throw new Error('Modo de armazenamento inválido.')
    }

    return valor
  }

  private normalizarSync(valor: unknown): SyncNormalizado {
    if (!objeto(valor)) {
      throw new Error('Configuração de sincronização inválida.')
    }

    const destination = valor.destination

    if (destination !== 'postgres' && destination !== 'api') {
      throw new Error('Destino de sincronização inválido.')
    }

    return {
      enabled: booleano(valor.enabled, 'ativação da sincronização'),
      destination,
      syncOnStartup: booleano(valor.syncOnStartup, 'sincronização ao iniciar'),
      syncOnReconnect: booleano(valor.syncOnReconnect, 'sincronização ao reconectar'),
      retryFailed: booleano(valor.retryFailed, 'repetição de operações com erro')
    }
  }

  private normalizarPostgres(valor: unknown, exigirCampos: boolean): PostgresNormalizado {
    if (!objeto(valor)) {
      throw new Error('Configuração do PostgreSQL inválida.')
    }

    let password: string | undefined

    if (valor.password != null) {
      if (typeof valor.password !== 'string' || valor.password.length > 1024) {
        throw new Error('Senha do PostgreSQL inválida.')
      }

      password = valor.password
    }

    return {
      host: texto(valor.host, 'o host do PostgreSQL', exigirCampos),
      port: inteiro(valor.port, 'a porta do PostgreSQL', 1, 65535),
      database: texto(valor.database, 'o banco de dados PostgreSQL', exigirCampos),
      user: texto(valor.user, 'o usuário do PostgreSQL', exigirCampos),
      timeoutSeconds: inteiro(valor.timeoutSeconds, 'o timeout do PostgreSQL', 1, 300),
      ssl: booleano(valor.ssl, 'o uso de SSL'),
      password,
      clearPassword: valor.clearPassword === true
    }
  }

  carregarBanco(): ConfiguracaoBanco {
    this.migrateLegacyPassword()

    const config = loadConfig()

    return {
      mode: config.database.mode,
      sqlite: {
        path: config.database.sqlite.path
      },
      postgres: {
        ...config.database.postgres,
        password: '',
        passwordConfigured: secrets.hasPostgresPassword()
      },
      api: {
        ...config.database.api
      },
      sync: {
        ...config.sync,
        refugoRetention: {
          ...config.sync.refugoRetention
        }
      }
    }
  }

  salvarBanco(config: ConfiguracaoBanco) {
    if (!objeto(config)) {
      throw new Error('Configuração de banco inválida.')
    }

    const mode = this.normalizarModo(config.mode)

    if (mode === 'api') {
      throw new Error('O modo API ainda não está disponível nesta versão.')
    }

    const sync = this.normalizarSync(config.sync)

    if (sync.destination === 'api') {
      throw new Error('O destino API ainda não está disponível nesta versão.')
    }

    const usaPostgres = mode === 'postgres' || (mode === 'sqliteSync' && sync.enabled)
    const postgres = this.normalizarPostgres(config.postgres, usaPostgres)

    if (postgres.clearPassword) {
      secrets.clearPostgresPassword()
    } else if (postgres.password?.trim()) {
      secrets.savePostgresPassword(postgres.password)
    }

    const atual = loadConfig()

    const novaConfig: AppConfig = {
      ...atual,
      database: {
        ...atual.database,
        mode,
        provider: mode === 'postgres' ? 'postgres' : 'sqlite',
        sqlite: {
          path: 'database/database.db'
        },
        postgres: {
          host: postgres.host,
          port: postgres.port,
          database: postgres.database,
          user: postgres.user,
          timeoutSeconds: postgres.timeoutSeconds,
          ssl: postgres.ssl
        },
        // A API ainda não é editável nesta versão. Mantemos apenas a configuração confiável atual.
        api: {
          ...atual.database.api
        }
      },
      sync: {
        enabled: sync.enabled,
        destination: sync.destination,
        syncOnStartup: sync.syncOnStartup,
        syncOnReconnect: sync.syncOnReconnect,
        retryFailed: sync.retryFailed,
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

    const postgres = this.normalizarPostgres(config, true)
    const password = postgres.password?.trim() || secrets.getPostgresPassword() || ''

    const client = new Client({
      host: postgres.host,
      port: postgres.port,
      database: postgres.database,
      user: postgres.user,
      password,
      connectionTimeoutMillis: postgres.timeoutSeconds * 1000,
      ssl: postgres.ssl ? { rejectUnauthorized: true } : false
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
