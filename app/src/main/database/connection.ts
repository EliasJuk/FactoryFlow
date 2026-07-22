import sqlite from "./sqlite/connection"

type SqliteDatabase = typeof sqlite

export function getDatabase(): SqliteDatabase {
  return sqlite
}