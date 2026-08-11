import { Client, type PoolClient } from 'pg'

import { getDatabase } from '../database/connection'
import { runPostgresMigrationsSafely } from '../database/postgres/migrationRunner'
import { IdGenerator } from '../shared/ids/IdGenerator'
import { SYSTEM_IDS } from '../shared/ids/systemIds'
import { gerarHashSenha } from '../shared/security/password'

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

export type EstadoConfiguracaoInicial =
  'SEM_CONFIGURACAO' | 'SEM_CONEXAO' | 'SEM_ADMIN' | 'AGUARDANDO_SINCRONIZACAO' | 'PRONTO'

export type StatusConfiguracaoInicial = {
  status: EstadoConfiguracaoInicial
  mensagem: string
  temAdminLocal: boolean
  temAdminRemoto: boolean | null
}

export type PrimeiroAdministradorInput = {
  nome: string
  matricula: string
  senha: string
}

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

type SenhaPostgresProtegida = {
  password: string | null
  configured: boolean
  unreadable: boolean
}

const secrets = new SecretStorageService()
const PRIMEIRO_ADMIN_LOCK_ID = 2026080201
const MATRICULA_USUARIO_SISTEMA = '0000'
const MENSAGEM_CONFIGURACAO_INICIAL_ENCERRADA =
  'A configuração inicial já foi concluída. Entre como administrador para alterar o banco.'

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function texto(valor: unknown, campo: string, obrigatorio: boolean, tamanhoMaximo = 255): string {
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

function inteiro(valor: unknown, campo: string, minimo: number, maximo: number): number {
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
    const legacyPassword = loadLegacyPostgresPassword()

    if (!legacyPassword) {
      return
    }

    let passwordConfigured = false

    try {
      passwordConfigured = secrets.hasPostgresPassword()
    } catch {
      passwordConfigured = false
    }

    if (!passwordConfigured) {
      secrets.savePostgresPassword(legacyPassword)
    }

    // Regrava o config.json sem a senha antiga em texto puro, inclusive quando
    // a credencial protegida já havia sido criada em uma execução anterior.
    saveConfig(loadConfig())
  }

  private lerSenhaPostgresProtegida(): SenhaPostgresProtegida {
    let configured = false

    try {
      configured = secrets.hasPostgresPassword()
    } catch {
      return {
        password: null,
        configured: true,
        unreadable: true
      }
    }

    if (!configured) {
      return {
        password: null,
        configured: false,
        unreadable: false
      }
    }

    try {
      return {
        password: secrets.getPostgresPassword(),
        configured: true,
        unreadable: false
      }
    } catch {
      return {
        password: null,
        configured: true,
        unreadable: true
      }
    }
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

  private temAdminLocal(): boolean {
    try {
      const db = getDatabase()
      const row = db
        .prepare(
          `
          SELECT 1
          FROM usuarios
          WHERE uuid <> ?
            AND perfil = 'ADMIN'
            AND ativo = 1
            AND deleted_at IS NULL
          LIMIT 1
          `
        )
        .get(SYSTEM_IDS.usuarioSistema)

      return Boolean(row)
    } catch {
      return false
    }
  }

  private garantirSemAdminLocal(): void {
    if (this.temAdminLocal()) {
      throw new Error(MENSAGEM_CONFIGURACAO_INICIAL_ENCERRADA)
    }
  }

  private async garantirConfiguracaoInicialEditavel(): Promise<void> {
    this.garantirSemAdminLocal()
    this.migrateLegacyPassword()

    const { password } = this.lerSenhaPostgresProtegida()

    if (!password) {
      // Sem uma credencial utilizável, o primeiro acesso precisa continuar disponível
      // para que o usuário possa corrigir a configuração local.
      return
    }

    let postgres: PostgresNormalizado

    try {
      postgres = this.normalizarPostgres(loadConfig().database.postgres, true)
    } catch {
      return
    }

    const client = this.criarClientePostgres(postgres, password)

    try {
      await client.connect()

      if (!(await this.tabelaUsuariosExiste(client))) {
        return
      }

      if (await this.temAdminRemoto(client)) {
        throw new Error('CONFIGURACAO_INICIAL_ENCERRADA')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFIGURACAO_INICIAL_ENCERRADA') {
        throw new Error(MENSAGEM_CONFIGURACAO_INICIAL_ENCERRADA)
      }

      // Falhas de conexão não podem impedir a correção das credenciais durante
      // o primeiro acesso. A existência do ADMIN remoto será verificada novamente
      // assim que a conexão voltar a funcionar.
    } finally {
      await client.end().catch(() => {})
    }
  }

  private obterSenhaPostgres(postgres: PostgresNormalizado): string {
    const protegida = this.lerSenhaPostgresProtegida()
    const password = postgres.password?.trim() || protegida.password || ''

    if (!password) {
      throw new Error('Informe a senha do PostgreSQL.')
    }

    return password
  }

  private criarClientePostgres(postgres: PostgresNormalizado, password: string): Client {
    return new Client({
      host: postgres.host,
      port: postgres.port,
      database: postgres.database,
      user: postgres.user,
      password,
      connectionTimeoutMillis: postgres.timeoutSeconds * 1000,
      ssl: postgres.ssl ? { rejectUnauthorized: true } : false
    })
  }

  private async tabelaUsuariosExiste(client: Client | PoolClient): Promise<boolean> {
    const result = await client.query<{ tabela: string | null }>(
      `SELECT to_regclass('public.usuarios')::text AS tabela`
    )

    return Boolean(result.rows[0]?.tabela)
  }

  private async temAdminRemoto(client: Client | PoolClient): Promise<boolean> {
    const result = await client.query<{ existe: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM usuarios
        WHERE uuid <> $1
          AND perfil = 'ADMIN'
          AND ativo = true
          AND deleted_at IS NULL
      ) AS existe
      `,
      [SYSTEM_IDS.usuarioSistema]
    )

    return Boolean(result.rows[0]?.existe)
  }

  private normalizarPrimeiroAdministrador(
    input: PrimeiroAdministradorInput
  ): PrimeiroAdministradorInput {
    if (!objeto(input)) {
      throw new Error('Dados do primeiro administrador inválidos.')
    }

    const nome = texto(input.nome, 'o nome do administrador', true, 150)
    const matricula = texto(input.matricula, 'a matrícula do administrador', true, 80)

    if (matricula === MATRICULA_USUARIO_SISTEMA) {
      throw new Error('A matrícula 0000 é reservada ao usuário Sistema.')
    }

    if (typeof input.senha !== 'string' || input.senha.length < 8 || input.senha.length > 128) {
      throw new Error('A senha do administrador deve possuir entre 8 e 128 caracteres.')
    }

    if (/[\0\r\n]/.test(input.senha)) {
      throw new Error('Senha do administrador inválida.')
    }

    return {
      nome,
      matricula,
      senha: input.senha
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
        passwordConfigured: Boolean(this.lerSenhaPostgresProtegida().password)
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
    const protegida = this.lerSenhaPostgresProtegida()
    const password = postgres.password?.trim() || protegida.password || ''

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

  async carregarPostgresConfiguracaoInicial() {
    await this.garantirConfiguracaoInicialEditavel()

    const config = loadConfig()

    return {
      ...config.database.postgres,
      password: '',
      passwordConfigured: Boolean(this.lerSenhaPostgresProtegida().password),
      clearPassword: false
    }
  }

  async obterStatusConfiguracaoInicial(): Promise<StatusConfiguracaoInicial> {
    this.migrateLegacyPassword()

    if (this.temAdminLocal()) {
      return {
        status: 'PRONTO',
        mensagem: 'O FactoryFlow já possui um administrador local.',
        temAdminLocal: true,
        temAdminRemoto: null
      }
    }

    const config = loadConfig()
    const protegida = this.lerSenhaPostgresProtegida()
    const password = protegida.password

    if (!password) {
      return {
        status: 'SEM_CONFIGURACAO',
        mensagem: protegida.unreadable
          ? 'A senha protegida do PostgreSQL não pôde ser aberta neste usuário do Windows. Configure novamente a conexão.'
          : 'Configure a conexão com o PostgreSQL para continuar.',
        temAdminLocal: false,
        temAdminRemoto: null
      }
    }

    const postgres = this.normalizarPostgres(config.database.postgres, true)
    const client = this.criarClientePostgres(postgres, password)

    try {
      await client.connect()

      if (!(await this.tabelaUsuariosExiste(client))) {
        return {
          status: 'SEM_CONEXAO',
          mensagem:
            'A conexão foi realizada, mas as migrations do PostgreSQL ainda não criaram a tabela de usuários.',
          temAdminLocal: false,
          temAdminRemoto: null
        }
      }

      const temAdminRemoto = await this.temAdminRemoto(client)

      return temAdminRemoto
        ? {
            status: 'AGUARDANDO_SINCRONIZACAO',
            mensagem:
              'Já existe um administrador no PostgreSQL. Reinicie o FactoryFlow para sincronizar os usuários.',
            temAdminLocal: false,
            temAdminRemoto: true
          }
        : {
            status: 'SEM_ADMIN',
            mensagem: 'A conexão está pronta. Cadastre o primeiro administrador.',
            temAdminLocal: false,
            temAdminRemoto: false
          }
    } catch {
      return {
        status: 'SEM_CONEXAO',
        mensagem: 'Não foi possível conectar ao PostgreSQL configurado.',
        temAdminLocal: false,
        temAdminRemoto: null
      }
    } finally {
      await client.end().catch(() => {})
    }
  }

  async testarPostgresConfiguracaoInicial(config: PostgresConfig & { password?: string }) {
    await this.garantirConfiguracaoInicialEditavel()
    return this.testarPostgres(config)
  }

  async salvarPostgresConfiguracaoInicial(config: PostgresConfig & { password?: string }) {
    await this.garantirConfiguracaoInicialEditavel()

    const postgres = this.normalizarPostgres(config, true)
    const password = this.obterSenhaPostgres(postgres)

    await runPostgresMigrationsSafely({
      host: postgres.host,
      port: postgres.port,
      database: postgres.database,
      user: postgres.user,
      timeoutSeconds: postgres.timeoutSeconds,
      ssl: postgres.ssl,
      password
    })

    secrets.savePostgresPassword(password)

    const atual = loadConfig()
    const novaConfig: AppConfig = {
      ...atual,
      database: {
        ...atual.database,
        mode: 'sqliteSync',
        provider: 'sqlite',
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
        }
      },
      sync: {
        ...atual.sync,
        enabled: true,
        destination: 'postgres',
        syncOnStartup: true,
        syncOnReconnect: true,
        retryFailed: true
      }
    }

    saveConfig(novaConfig)

    return {
      sucesso: true,
      mensagem: 'PostgreSQL preparado e conexão inicial salva com sucesso.'
    }
  }

  async criarPrimeiroAdministrador(input: PrimeiroAdministradorInput) {
    this.garantirSemAdminLocal()
    this.migrateLegacyPassword()

    const dados = this.normalizarPrimeiroAdministrador(input)
    const config = loadConfig()
    const postgres = this.normalizarPostgres(config.database.postgres, true)
    const password = this.obterSenhaPostgres(postgres)
    const client = this.criarClientePostgres(postgres, password)

    try {
      await client.connect()
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock($1)', [PRIMEIRO_ADMIN_LOCK_ID])

      if (!(await this.tabelaUsuariosExiste(client))) {
        throw new Error('TABELA_USUARIOS_INEXISTENTE')
      }

      if (await this.temAdminRemoto(client)) {
        throw new Error('ADMIN_JA_EXISTE')
      }

      const usuarioSistema = await client.query<{ id: number }>(
        `
        SELECT id
        FROM usuarios
        WHERE uuid = $1
          AND ativo = true
          AND deleted_at IS NULL
        LIMIT 1
        FOR SHARE
        `,
        [SYSTEM_IDS.usuarioSistema]
      )

      const usuarioSistemaId = usuarioSistema.rows[0]?.id

      if (!usuarioSistemaId) {
        throw new Error('USUARIO_SISTEMA_NAO_ENCONTRADO')
      }

      const matriculaExistente = await client.query<{ id: number }>(
        `
        SELECT id
        FROM usuarios
        WHERE matricula = $1
          AND deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
        `,
        [dados.matricula]
      )

      if (matriculaExistente.rows[0]) {
        throw new Error('MATRICULA_JA_EXISTE')
      }

      const inserido = await client.query<{ id: number }>(
        `
        INSERT INTO usuarios (
          uuid,
          nome,
          matricula,
          perfil,
          senha_hash,
          deve_trocar_senha,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES (
          $1,
          $2,
          $3,
          'ADMIN',
          $4,
          true,
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          $5,
          $5
        )
        RETURNING id
        `,
        [
          IdGenerator.generate(),
          dados.nome,
          dados.matricula,
          gerarHashSenha(dados.senha),
          usuarioSistemaId
        ]
      )

      const usuarioId = inserido.rows[0]?.id

      if (!usuarioId) {
        throw new Error('ADMIN_NAO_CRIADO')
      }

      await client.query('COMMIT')

      return {
        sucesso: true,
        mensagem:
          'Primeiro administrador criado no PostgreSQL. Reinicie o FactoryFlow para sincronizar e entrar.'
      }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})

      const codigo = error instanceof Error ? error.message : ''

      if (codigo === 'ADMIN_JA_EXISTE') {
        return {
          sucesso: false,
          mensagem:
            'Já existe um administrador no PostgreSQL. Reinicie o FactoryFlow para sincronizá-lo.'
        }
      }

      if (codigo === 'MATRICULA_JA_EXISTE') {
        return {
          sucesso: false,
          mensagem: 'A matrícula informada já existe no PostgreSQL.'
        }
      }

      if (codigo === 'USUARIO_SISTEMA_NAO_ENCONTRADO') {
        return {
          sucesso: false,
          mensagem:
            'O usuário reservado Sistema não foi encontrado no PostgreSQL. Execute novamente as migrations.'
        }
      }

      if (codigo === 'TABELA_USUARIOS_INEXISTENTE') {
        return {
          sucesso: false,
          mensagem: 'A tabela de usuários ainda não existe. Execute as migrations do PostgreSQL.'
        }
      }

      return {
        sucesso: false,
        mensagem: 'Não foi possível criar o primeiro administrador.'
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
