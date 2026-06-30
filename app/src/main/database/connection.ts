import sqliteDb from "./database"
import type { DatabaseConfig } from "./database.types"

const config: DatabaseConfig = {
  driver: "sqlite"
}

export function getDatabase() {
  if (config.driver === "sqlite") {
    return sqliteDb
  }

  throw new Error("PostgreSQL ainda não implementado.")
}