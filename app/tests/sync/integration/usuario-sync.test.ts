import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const { Client } = pg

const appRoot = process.cwd()
const pcAPath = resolve(appRoot, 'tests/sync/databases/pc-a.db')
const pcBPath = resolve(appRoot, 'tests/sync/databases/pc-b.db')
const postgresConfigPath = resolve(appRoot, 'tests/config/postgres.json')
const postgresLocalConfigPath = resolve(appRoot, 'tests/config/postgres.local.json')

const WAIT_TIMEOUT_MS = 75_000
const WAIT_INTERVAL_MS = 1_000

type TestUser = {
  uuid: string
  nome: string
  matricula: string
  perfil: string
  ativo: number | boolean
  updated_at: string
  deleted_at: string | null
}

type SyncOperation = 'CREATE' | 'UPDATE'

type PostgresConnectionConfig = {
  host: string
  port: number
  database: string
  user: string
  password: string
  timeoutSeconds: number
  ssl: boolean
}

type PostgresPublicConfigFile = {
  connection?: Partial<Omit<PostgresConnectionConfig, 'password'>>
}

type PostgresLocalConfigFile = {
  password?: string
}

let pcA: DatabaseSync
let pcB: DatabaseSync
let postgres: pg.Client | null = null
let postgresConnected = false

const testUuid = randomUUID()
const testMatricula = `SYNC-${Date.now()}`
const testName = 'Usuario Integracao'
const updatedName = 'Usuario Integracao Atualizado'

function readJsonFile<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Arquivo de configuracao nao encontrado: ${path}`)
  }

  const content = readFileSync(path, 'utf8')

  try {
    return JSON.parse(content) as T
  } catch {
    throw new Error(`JSON invalido no arquivo: ${path}`)
  }
}

function loadPostgresConfig(): PostgresConnectionConfig {
  const publicConfig = readJsonFile<PostgresPublicConfigFile>(postgresConfigPath)
  const localConfig = readJsonFile<PostgresLocalConfigFile>(postgresLocalConfigPath)

  const connection = publicConfig.connection
  const password = localConfig.password

  if (
    !connection?.host ||
    !connection.port ||
    !connection.database ||
    !connection.user ||
    !password
  ) {
    throw new Error(
      'Configuracao PostgreSQL de teste incompleta. Verifique config/postgres.json e config/postgres.local.json.'
    )
  }

  return {
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password,
    timeoutSeconds: connection.timeoutSeconds ?? 15,
    ssl: connection.ssl ?? false
  }
}

function nowSqlite(): string {
  const date = new Date()
  const pad = (part: number, size = 2): string => String(part).padStart(size, '0')

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
      date.getMilliseconds(),
      3
    )}`
  ].join(' ')
}

function installationUuid(db: DatabaseSync): string {
  const row = db
    .prepare('SELECT machine_uuid AS machineUuid FROM sync_installation WHERE id = 1')
    .get() as { machineUuid?: string } | undefined

  if (!row?.machineUuid) {
    throw new Error('Instalacao de sincronizacao nao encontrada.')
  }

  return row.machineUuid
}

function findUser(db: DatabaseSync): TestUser | undefined {
  return db
    .prepare(
      `SELECT uuid, nome, matricula, perfil, ativo, updated_at, deleted_at
       FROM usuarios WHERE uuid = ? LIMIT 1`
    )
    .get(testUuid) as TestUser | undefined
}

function enqueueUser(db: DatabaseSync, operation: SyncOperation): void {
  const user = db
    .prepare(
      `SELECT
         usuario.uuid,
         usuario.nome,
         usuario.matricula,
         usuario.perfil,
         usuario.senha_hash AS senhaHash,
         usuario.deve_trocar_senha AS deveTrocarSenha,
         usuario.ativo,
         usuario.created_at AS createdAt,
         usuario.updated_at AS updatedAt,
         usuario.deleted_at AS deletedAt,
         criador.uuid AS createdByUuid,
         atualizador.uuid AS updatedByUuid,
         excluidor.uuid AS deletedByUuid
       FROM usuarios usuario
       LEFT JOIN usuarios criador ON criador.id = usuario.created_by
       LEFT JOIN usuarios atualizador ON atualizador.id = usuario.updated_by
       LEFT JOIN usuarios excluidor ON excluidor.id = usuario.deleted_by
       WHERE usuario.uuid = ?
       LIMIT 1`
    )
    .get(testUuid) as
    | {
        uuid: string
        nome: string
        matricula: string
        perfil: string
        senhaHash: string | null
        deveTrocarSenha: number
        ativo: number
        createdAt: string
        updatedAt: string
        deletedAt: string | null
        createdByUuid: string | null
        updatedByUuid: string | null
        deletedByUuid: string | null
      }
    | undefined

  if (!user) throw new Error('Usuario de teste nao encontrado para sincronizacao.')

  const payload = {
    schemaVersion: 1,
    sourceInstallationUuid: installationUuid(db),
    entity: 'USUARIO',
    operation,
    record: {
      ...user,
      deveTrocarSenha: Boolean(user.deveTrocarSenha),
      ativo: Boolean(user.ativo)
    }
  }

  const timestamp = nowSqlite()

  db.prepare(
    `INSERT INTO sync_queue (
       uuid, entity, record_uuid, operation, payload,
       status, attempts, max_attempts, created_at, updated_at
     )
     VALUES (?, 'USUARIO', ?, ?, ?, 'PENDENTE', 0, 10, ?, ?)`
  ).run(randomUUID(), testUuid, operation, JSON.stringify(payload), timestamp, timestamp)
}

async function waitFor(
  description: string,
  predicate: () => boolean | Promise<boolean>
): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    if (await predicate()) return
    await new Promise((resolvePromise) => setTimeout(resolvePromise, WAIT_INTERVAL_MS))
  }

  throw new Error(`Tempo esgotado aguardando: ${description}`)
}

async function postgresUser(): Promise<TestUser | undefined> {
  if (!postgres || !postgresConnected) {
    throw new Error('PostgreSQL não está conectado.')
  }

  const result = await postgres.query<TestUser>(
    `SELECT uuid, nome, matricula, perfil, ativo, updated_at, deleted_at
     FROM usuarios
     WHERE uuid = $1
     LIMIT 1`,
    [testUuid]
  )

  return result.rows[0]
}

function createOnPcA(): void {
  const timestamp = nowSqlite()

  pcA
    .prepare(
      `INSERT INTO usuarios (
       uuid, nome, matricula, perfil, senha_hash,
       deve_trocar_senha, ativo, created_at, updated_at,
       deleted_at, created_by, updated_by, deleted_by
     )
     VALUES (?, ?, ?, 'OPERADOR', ?, 1, 1, ?, ?, NULL, NULL, NULL, NULL)`
    )
    .run(testUuid, testName, testMatricula, 'test-salt:test-hash', timestamp, timestamp)

  enqueueUser(pcA, 'CREATE')
}

function updateOnPcB(): void {
  const timestamp = nowSqlite()

  pcB
    .prepare(
      `UPDATE usuarios
     SET nome = ?, perfil = 'TECNICO', updated_at = ?, updated_by = NULL
     WHERE uuid = ?`
    )
    .run(updatedName, timestamp, testUuid)

  enqueueUser(pcB, 'UPDATE')
}

function deactivateOnPcA(): void {
  const timestamp = nowSqlite()

  pcA
    .prepare(
      `UPDATE usuarios
     SET ativo = 0, updated_at = ?, updated_by = NULL
     WHERE uuid = ?`
    )
    .run(timestamp, testUuid)

  enqueueUser(pcA, 'UPDATE')
}

describe.sequential('sincronizacao de usuarios entre PC-A e PC-B', () => {
  beforeAll(async () => {
    if (!existsSync(pcAPath) || !existsSync(pcBPath)) {
      throw new Error('Abra primeiro as instancias PC-A e PC-B para criar os bancos de teste.')
    }

    pcA = new DatabaseSync(pcAPath)
    pcB = new DatabaseSync(pcBPath)

    const postgresConfig = loadPostgresConfig()

    const postgresClient = new Client({
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      password: postgresConfig.password,
      ssl: postgresConfig.ssl,
      connectionTimeoutMillis: postgresConfig.timeoutSeconds * 1_000
    })

    postgres = postgresClient

    await postgresClient.connect()
    postgresConnected = true

    await postgresClient.query('DELETE FROM usuarios WHERE uuid = $1 OR matricula = $2', [
      testUuid,
      testMatricula
    ])

    pcA.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
    pcB.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)

    pcA.prepare('DELETE FROM usuarios WHERE uuid = ? OR matricula = ?').run(testUuid, testMatricula)

    pcB.prepare('DELETE FROM usuarios WHERE uuid = ? OR matricula = ?').run(testUuid, testMatricula)
  })

  afterAll(async () => {
    try {
      pcA?.prepare('DELETE FROM sync_pull_conflicts WHERE record_uuid = ?').run(testUuid)
      pcA?.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
      pcA?.prepare('DELETE FROM usuarios WHERE uuid = ?').run(testUuid)
    } catch {
      // O PC-A pode não ter sido inicializado.
    }

    try {
      pcB?.prepare('DELETE FROM sync_pull_conflicts WHERE record_uuid = ?').run(testUuid)
      pcB?.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
      pcB?.prepare('DELETE FROM usuarios WHERE uuid = ?').run(testUuid)
    } catch {
      // O PC-B pode não ter sido inicializado.
    }

    try {
      if (postgres && postgresConnected) {
        await postgres.query('DELETE FROM usuarios WHERE uuid = $1', [testUuid])
      }
    } finally {
      try {
        pcA?.close()
      } catch {
        // Já fechado ou não inicializado.
      }

      try {
        pcB?.close()
      } catch {
        // Já fechado ou não inicializado.
      }

      if (postgres) {
        await postgres.end().catch(() => undefined)
      }
    }
  })

  it(
    'sincroniza criacao do PC-A para PostgreSQL e PC-B',
    async () => {
      createOnPcA()

      await waitFor('push do PC-A para PostgreSQL', async () => {
        const user = await postgresUser()
        return user?.nome === testName && Boolean(user.ativo)
      })

      await waitFor('pull para PC-B', () => {
        const user = findUser(pcB)
        return user?.nome === testName && Number(user.ativo) === 1
      })

      expect(findUser(pcB)).toMatchObject({
        uuid: testUuid,
        nome: testName,
        matricula: testMatricula,
        perfil: 'OPERADOR',
        ativo: 1
      })
    },
    WAIT_TIMEOUT_MS * 2
  )

  it(
    'sincroniza edicao do PC-B para PostgreSQL e PC-A',
    async () => {
      updateOnPcB()

      await waitFor('push da edicao do PC-B', async () => {
        const user = await postgresUser()
        return user?.nome === updatedName && user.perfil === 'TECNICO'
      })

      await waitFor('pull da edicao para PC-A', () => {
        const user = findUser(pcA)
        return user?.nome === updatedName && user.perfil === 'TECNICO'
      })

      expect(findUser(pcA)).toMatchObject({
        nome: updatedName,
        perfil: 'TECNICO',
        ativo: 1
      })
    },
    WAIT_TIMEOUT_MS * 2
  )

  it(
    'sincroniza inativacao do PC-A para PostgreSQL e PC-B',
    async () => {
      deactivateOnPcA()

      await waitFor('push da inativacao do PC-A', async () => {
        return !Boolean((await postgresUser())?.ativo)
      })

      await waitFor('pull da inativacao para PC-B', () => {
        return Number(findUser(pcB)?.ativo) === 0
      })

      expect(findUser(pcB)).toMatchObject({
        nome: updatedName,
        perfil: 'TECNICO',
        ativo: 0
      })
    },
    WAIT_TIMEOUT_MS * 2
  )
})
