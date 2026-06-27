import db from "./database"

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS setores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

      CREATE TABLE IF NOT EXISTS subsetores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      setor_id INTEGER NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (setor_id) REFERENCES setores(id)
    );
  `)
}