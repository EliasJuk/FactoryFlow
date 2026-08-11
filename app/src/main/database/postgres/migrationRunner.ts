import { Client } from 'pg'

import type { PostgresConfig } from '../../config/appConfig'
import { runPostgresMigrations } from './migrations'

const POSTGRES_MIGRATION_LOCK_ID = 2026081101

export type PostgresMigrationInput = PostgresConfig & {
  password: string
}

export async function runPostgresMigrationsSafely(config: PostgresMigrationInput): Promise<void> {
  if (!config.password) {
    throw new Error('A senha do PostgreSQL é obrigatória para executar as migrations.')
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionTimeoutMillis: Math.max(1, config.timeoutSeconds) * 1000,
    ssl: config.ssl
      ? {
          rejectUnauthorized: true
        }
      : false
  })

  let transactionStarted = false

  try {
    await client.connect()
    await client.query('SELECT 1')

    await client.query('BEGIN')
    transactionStarted = true

    // Garante que as migrations sejam aplicadas sempre no schema public,
    // evitando que uma configuração diferente do search_path mande as alterações para outro lugar.
    await client.query('SET LOCAL search_path TO public')

    const lockResult = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_xact_lock($1::bigint) AS locked',
      [POSTGRES_MIGRATION_LOCK_ID]
    )

    if (!lockResult.rows[0]?.locked) {
      throw new Error('Outra instância do FactoryFlow já está preparando este PostgreSQL.')
    }

    await runPostgresMigrations(client)

    await client.query('COMMIT')
    transactionStarted = false
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {})
    }

    throw error
  } finally {
    await client.end().catch(() => {})
  }
}
