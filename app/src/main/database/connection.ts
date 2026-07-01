import sqlite from "./sqlite/connection"

type SqliteDatabase = typeof sqlite

export function getDatabase(): SqliteDatabase {
  return sqlite
}

/*
import type { Database as DatabaseType } from "better-sqlite3"
import sqlite from "./sqlite/connection"

export function getDatabase(): DatabaseType {
  return sqlite
}*/