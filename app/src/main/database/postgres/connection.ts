import { Pool } from "pg"
import { loadConfig } from "../../config/appConfig"

const config = loadConfig().database.postgres

export const pool = new Pool({
  host: config.host,
  port: Number(config.port),
  database: config.database,
  user: config.user,
  password: config.password
})