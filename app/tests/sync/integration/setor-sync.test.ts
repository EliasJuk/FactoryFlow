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

type TestSetor = {
  uuid: string
  nome: string
  sigla: string
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
const suffix = Date.now().toString().slice(-6)
const testName = `Setor Integracao ${suffix}`
const testSigla = `SI${suffix}`.slice(0, 10)
const updatedName = `Setor Integracao Atualizado ${suffix}`
const updatedSigla = `SA${suffix}`.slice(0, 10)

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

function findSetor(db: DatabaseSync): TestSetor | undefined {
  return db
    .prepare(
      `SELECT uuid, nome, sigla, ativo, updated_at, deleted_at
       FROM setores
       WHERE uuid = ?
       LIMIT 1`
    )
    .get(testUuid) as TestSetor | undefined
}

function enqueueSetor(db: DatabaseSync, operation: SyncOperation): void {
  const setor = db
    .prepare(
      `SELECT
         setor.uuid,
         setor.nome,
         setor.sigla,
         setor.ativo,
         setor.created_at AS createdAt,
         setor.updated_at AS updatedAt,
         setor.deleted_at AS deletedAt,
         criador.uuid AS createdByUuid,
         atualizador.uuid AS updatedByUuid,
         excluidor.uuid AS deletedByUuid
       FROM setores setor
       LEFT JOIN usuarios criador ON criador.id = setor.created_by
       LEFT JOIN usuarios atualizador ON atualizador.id = setor.updated_by
       LEFT JOIN usuarios excluidor ON excluidor.id = setor.deleted_by
       WHERE setor.uuid = ?
       LIMIT 1`
    )
    .get(testUuid) as
    | {
        uuid: string
        nome: string
        sigla: string
        ativo: number
        createdAt: string
        updatedAt: string
        deletedAt: string | null
        createdByUuid: string | null
        updatedByUuid: string | null
        deletedByUuid: string | null
      }
    | undefined

  if (!setor) {
    throw new Error('Setor de teste nao encontrado para sincronizacao.')
  }

  const payload = {
    schemaVersion: 1,
    sourceInstallationUuid: installationUuid(db),
    entity: 'SETOR',
    operation,
    record: {
      ...setor,
      ativo: Boolean(setor.ativo)
    }
  }

  const timestamp = nowSqlite()

  db.prepare(
    `INSERT INTO sync_queue (
       uuid, entity, record_uuid, operation, payload,
       status, attempts, max_attempts, created_at, updated_at
     )
     VALUES (?, 'SETOR', ?, ?, ?, 'PENDENTE', 0, 10, ?, ?)`
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

async function postgresSetor(): Promise<TestSetor | undefined> {
  if (!postgres || !postgresConnected) {
    throw new Error('PostgreSQL nao esta conectado.')
  }

  const result = await postgres.query<TestSetor>(
    `SELECT uuid, nome, sigla, ativo, updated_at, deleted_at
     FROM setores
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
      `INSERT INTO setores (
         uuid,
         nome,
         sigla,
         ativo,
         created_at,
         updated_at,
         deleted_at,
         created_by,
         updated_by,
         deleted_by
       )
       VALUES (?, ?, ?, 1, ?, ?, NULL, NULL, NULL, NULL)`
    )
    .run(testUuid, testName, testSigla, timestamp, timestamp)

  enqueueSetor(pcA, 'CREATE')
}

function updateOnPcB(): void {
  const timestamp = nowSqlite()

  const result = pcB
    .prepare(
      `UPDATE setores
       SET nome = ?,
           sigla = ?,
           updated_at = ?,
           updated_by = NULL
       WHERE uuid = ?`
    )
    .run(updatedName, updatedSigla, timestamp, testUuid)

  if (Number(result.changes) !== 1) {
    throw new Error('Setor de teste nao foi atualizado no PC-B.')
  }

  enqueueSetor(pcB, 'UPDATE')
}

function deactivateOnPcA(): void {
  const timestamp = nowSqlite()

  const result = pcA
    .prepare(
      `UPDATE setores
       SET ativo = 0,
           updated_at = ?,
           deleted_at = ?,
           updated_by = NULL,
           deleted_by = NULL
       WHERE uuid = ?`
    )
    .run(timestamp, timestamp, testUuid)

  if (Number(result.changes) !== 1) {
    throw new Error('Setor de teste nao foi inativado no PC-A.')
  }

  enqueueSetor(pcA, 'UPDATE')
}

describe.sequential('sincronizacao de setores entre PC-A e PC-B', () => {
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

    await postgresClient.query(
      `DELETE FROM setores
       WHERE uuid = $1 OR sigla = $2 OR sigla = $3`,
      [testUuid, testSigla, updatedSigla]
    )

    pcA.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
    pcB.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)

    pcA
      .prepare('DELETE FROM setores WHERE uuid = ? OR sigla IN (?, ?)')
      .run(testUuid, testSigla, updatedSigla)

    pcB
      .prepare('DELETE FROM setores WHERE uuid = ? OR sigla IN (?, ?)')
      .run(testUuid, testSigla, updatedSigla)
  })

  afterAll(async () => {
    try {
      pcA?.prepare('DELETE FROM sync_pull_conflicts WHERE record_uuid = ?').run(testUuid)
      pcA?.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
      pcA?.prepare('DELETE FROM setores WHERE uuid = ?').run(testUuid)
    } catch {
      // O PC-A pode nao ter sido inicializado.
    }

    try {
      pcB?.prepare('DELETE FROM sync_pull_conflicts WHERE record_uuid = ?').run(testUuid)
      pcB?.prepare('DELETE FROM sync_queue WHERE record_uuid = ?').run(testUuid)
      pcB?.prepare('DELETE FROM setores WHERE uuid = ?').run(testUuid)
    } catch {
      // O PC-B pode nao ter sido inicializado.
    }

    try {
      if (postgres && postgresConnected) {
        await postgres.query('DELETE FROM setores WHERE uuid = $1', [testUuid])
      }
    } finally {
      try {
        pcA?.close()
      } catch {
        // Ja fechado ou nao inicializado.
      }

      try {
        pcB?.close()
      } catch {
        // Ja fechado ou nao inicializado.
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

      await waitFor('push do setor do PC-A para PostgreSQL', async () => {
        const setor = await postgresSetor()
        return setor?.nome === testName && setor.sigla === testSigla && Boolean(setor.ativo)
      })

      await waitFor('pull do setor para PC-B', () => {
        const setor = findSetor(pcB)
        return setor?.nome === testName && setor.sigla === testSigla && Number(setor.ativo) === 1
      })

      expect(findSetor(pcB)).toMatchObject({
        uuid: testUuid,
        nome: testName,
        sigla: testSigla,
        ativo: 1
      })
    },
    WAIT_TIMEOUT_MS * 2
  )

  it(
    'sincroniza edicao do PC-B para PostgreSQL e PC-A',
    async () => {
      updateOnPcB()

      await waitFor('push da edicao do setor do PC-B', async () => {
        const setor = await postgresSetor()
        return setor?.nome === updatedName && setor.sigla === updatedSigla
      })

      await waitFor('pull da edicao do setor para PC-A', () => {
        const setor = findSetor(pcA)
        return setor?.nome === updatedName && setor.sigla === updatedSigla
      })

      expect(findSetor(pcA)).toMatchObject({
        nome: updatedName,
        sigla: updatedSigla,
        ativo: 1
      })
    },
    WAIT_TIMEOUT_MS * 2
  )

  it(
    'sincroniza inativacao do PC-A para PostgreSQL e PC-B',
    async () => {
      deactivateOnPcA()

      await waitFor('push da inativacao do setor do PC-A', async () => {
        return !Boolean((await postgresSetor())?.ativo)
      })

      await waitFor('pull da inativacao do setor para PC-B', () => {
        return Number(findSetor(pcB)?.ativo) === 0
      })

      expect(findSetor(pcB)).toMatchObject({
        nome: updatedName,
        sigla: updatedSigla,
        ativo: 0
      })
    },
    WAIT_TIMEOUT_MS * 2
  )
})
