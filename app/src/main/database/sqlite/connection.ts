import Database, { type Database as DatabaseType } from "better-sqlite3"
import { app } from "electron"
import { existsSync, mkdirSync } from "fs"
import { dirname, join } from "path"

const isDev = !app.isPackaged

const applicationFolder = isDev
  ? process.cwd()
  : process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath("exe"))

const dbPath = join(applicationFolder, "database", "factoryflow.db")
const dbFolder = dirname(dbPath)

if (!existsSync(dbFolder)) {
  mkdirSync(dbFolder, { recursive: true })
}

const sqlite: DatabaseType = new Database(dbPath)

sqlite.pragma("journal_mode = WAL")
sqlite.pragma("busy_timeout = 5000")

export default sqlite