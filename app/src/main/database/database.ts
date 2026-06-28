import Database, { type Database as DatabaseType } from "better-sqlite3"
import { app } from "electron"
import { join, dirname } from "path"
import { existsSync, mkdirSync } from "fs"

const isDev = !app.isPackaged

const dbPath = isDev
  ? join(process.cwd(), "database", "factoryflow.db")
  : join(dirname(app.getPath("exe")), "database", "factoryflow.db")

const dbFolder = dirname(dbPath)

if (!existsSync(dbFolder)) {
  mkdirSync(dbFolder, { recursive: true })
}

console.log("[DATABASE]", dbPath)

const db: DatabaseType = new Database(dbPath)

export default db