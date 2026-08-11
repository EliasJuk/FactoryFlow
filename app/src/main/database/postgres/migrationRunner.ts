import { Client } from 'pg'

import type { PostgresConfig } from '../../config/appConfig'
import { runPostgresMigrations } from './migrations'

const POSTGRES_MIGRATION_LOCK_ID = 2026081101

export type PostgresMigrationInput = PostgresConfig & {
  password: string
}

export async function runPostgresMigrationsSafely(config: PostgresMigrationInput): Promise<void> {
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

    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [POSTGRES_MIGRATION_LOCK_ID])

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
