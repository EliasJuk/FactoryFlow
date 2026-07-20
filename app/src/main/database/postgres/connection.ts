import { Pool } from 'pg'

import { loadConfig } from '../../config/appConfig'
import { SecretStorageService } from '../../services/SecretStorageService'

const config = loadConfig().database.postgres
const secrets = new SecretStorageService()

export const pool = new Pool({
  host: config.host,
  port: Number(config.port),
  database: config.database,
  user: config.user,
  password: secrets.getPostgresPassword() ?? '',
  connectionTimeoutMillis: Math.max(1, Number(config.timeoutSeconds || 15)) * 1000,
  ssl: config.ssl ? { rejectUnauthorized: true } : false
})
