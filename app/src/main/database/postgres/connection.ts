import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

import { loadConfig } from '../../config/appConfig'
import { SecretStorageService } from '../../services/SecretStorageService'

let internalPool: Pool | null = null

function getInternalPool(): Pool {
  if (internalPool) {
    return internalPool
  }

  const config = loadConfig().database.postgres
  const secrets = new SecretStorageService()
  const password = secrets.getPostgresPassword()

  if (!password) {
    throw new Error(
      'A senha do PostgreSQL ainda não foi configurada.'
    )
  }

  internalPool = new Pool({
    host: config.host,
    port: Number(config.port),
    database: config.database,
    user: config.user,
    password,
    connectionTimeoutMillis:
      Math.max(1, Number(config.timeoutSeconds || 15)) * 1000,
    ssl: config.ssl
      ? {
          rejectUnauthorized: true
        }
      : false
  })

  return internalPool
}

export const pool = {
  query<T extends QueryResultRow = any>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>> {
    return getInternalPool().query<T>(text, values)
  },

  connect(): Promise<PoolClient> {
    return getInternalPool().connect()
  },

  async end(): Promise<void> {
    if (!internalPool) {
      return
    }

    await internalPool.end()
    internalPool = null
  }
}