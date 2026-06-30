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

function colunaExiste(tabela: string, coluna: string) {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all() as {
    name: string
  }[]

  return colunas.some((item) => item.name === coluna)
}

function adicionarColunaSeNaoExistir(
  tabela: string,
  coluna: string,
  definicao: string
) {
  if (!colunaExiste(tabela, coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`)
  }
}

function aplicarMigracoes() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS componentes_precos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      componente_id INTEGER NOT NULL,
      valor_unitario REAL NOT NULL,
      vigencia_inicio TEXT NOT NULL DEFAULT (date('now','localtime')),
      vigencia_fim TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (componente_id) REFERENCES componentes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_componentes_precos_componente
    ON componentes_precos (componente_id);

    CREATE INDEX IF NOT EXISTS idx_componentes_precos_ativo
    ON componentes_precos (ativo);
  `)

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "codigo_componente_snapshot",
    "TEXT"
  )

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "nome_componente_snapshot",
    "TEXT"
  )

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "codigo_defeito_snapshot",
    "TEXT"
  )

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "descricao_defeito_snapshot",
    "TEXT"
  )

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "preco_unitario_snapshot",
    "REAL NOT NULL DEFAULT 0"
  )

  adicionarColunaSeNaoExistir(
    "refugo_itens",
    "custo_total_snapshot",
    "REAL NOT NULL DEFAULT 0"
  )
}

aplicarMigracoes()

export default db