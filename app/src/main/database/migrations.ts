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

    CREATE TABLE IF NOT EXISTS componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS circuitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS circuito_componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circuito_id INTEGER NOT NULL,
      componente_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (circuito_id) REFERENCES circuitos(id),
      FOREIGN KEY (componente_id) REFERENCES componentes(id)
    );
  `)
}