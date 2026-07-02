import { loadConfig } from "../config/appConfig"

import { runMigrations as runSqliteMigrations } from "./migrations"
import { runPostgresMigrations } from "./postgres/migrations"

export class DatabaseManager {
  static async initialize() {
    const config = loadConfig()
    const provider = config.database.provider

    if (provider === "postgres") {
      console.log("[DATABASE] Provider: PostgreSQL")
      await runPostgresMigrations()
      return
    }

    console.log("[DATABASE] Provider: SQLite")
    runSqliteMigrations()
  }
}