import type { DatabaseConfig } from "./database.types"
import Database from "better-sqlite3"
import sqliteDb from "./database"

const config: DatabaseConfig = {
  driver: "sqlite"
}

export function getDatabase(): Database.Database  {
  if (config.driver === "sqlite") {
    return sqliteDb
  }

  throw new Error("PostgreSQL ainda não implementado.")
}