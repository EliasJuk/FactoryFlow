import Database, { type Database as DatabaseType } from "better-sqlite3"
import { app } from "electron"
import { join } from "path"

const databasePath = join(app.getPath("userData"), "factoryflow.db")

const db: DatabaseType = new Database(databasePath)

export default db