import db from "../database"

function columnExists(table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string
  }>

  return columns.some((item) => item.name === column)
}

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL DEFAULT 'OPERADOR',
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS setores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      sigla TEXT,
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

    CREATE TABLE IF NOT EXISTS postos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      subsetor_id INTEGER NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (subsetor_id) REFERENCES subsetores(id)
    );

    CREATE TABLE IF NOT EXISTS circuito_posto_componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circuito_id INTEGER NOT NULL,
      posto_id INTEGER NOT NULL,
      componente_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo INTEGER NOT NULL DEFAULT 1,

      FOREIGN KEY (circuito_id) REFERENCES circuitos(id),
      FOREIGN KEY (posto_id) REFERENCES postos(id),
      FOREIGN KEY (componente_id) REFERENCES componentes(id)
    );

    CREATE TABLE IF NOT EXISTS defeitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS refugos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      numero_refugo TEXT NOT NULL,
      sigla_setor TEXT NOT NULL,
      ano INTEGER NOT NULL,
      sequencia INTEGER NOT NULL,

      data_hora TEXT NOT NULL,
      turno TEXT NOT NULL DEFAULT 'A',
      matricula_operador TEXT NOT NULL,
      usuario_id INTEGER,

      setor_id INTEGER NOT NULL,
      subsetor_id INTEGER NOT NULL,
      posto_id INTEGER NOT NULL,
      circuito_id INTEGER NOT NULL,

      quantidade_produzida INTEGER NOT NULL DEFAULT 0,
      observacao TEXT,

      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (setor_id) REFERENCES setores(id),
      FOREIGN KEY (subsetor_id) REFERENCES subsetores(id),
      FOREIGN KEY (posto_id) REFERENCES postos(id),
      FOREIGN KEY (circuito_id) REFERENCES circuitos(id)
    );

    CREATE TABLE IF NOT EXISTS refugo_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      refugo_id INTEGER NOT NULL,
      componente_id INTEGER NOT NULL,
      defeito_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,

      FOREIGN KEY (refugo_id) REFERENCES refugos(id),
      FOREIGN KEY (componente_id) REFERENCES componentes(id),
      FOREIGN KEY (defeito_id) REFERENCES defeitos(id)
    );
  `)

  if (!columnExists("usuarios", "senha_hash")) {
    db.exec(`
      ALTER TABLE usuarios 
      ADD COLUMN senha_hash TEXT;
    `)
  }

  if (!columnExists("usuarios", "created_at")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists("usuarios", "updated_at")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists("usuarios", "deleted_at")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists("usuarios", "created_by")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists("usuarios", "updated_by")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists("usuarios", "deleted_by")) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN deleted_by INTEGER;`)
  }

  if (!columnExists("setores", "sigla")) {
    db.exec(`ALTER TABLE setores ADD COLUMN sigla TEXT;`)
  }

  if (!columnExists("refugos", "numero_refugo")) {
    db.exec(`ALTER TABLE refugos ADD COLUMN numero_refugo TEXT;`)
  }

  if (!columnExists("refugos", "sigla_setor")) {
    db.exec(`ALTER TABLE refugos ADD COLUMN sigla_setor TEXT;`)
  }

  if (!columnExists("refugos", "ano")) {
    db.exec(`ALTER TABLE refugos ADD COLUMN ano INTEGER;`)
  }

  if (!columnExists("refugos", "sequencia")) {
    db.exec(`ALTER TABLE refugos ADD COLUMN sequencia INTEGER;`)
  }

  if (!columnExists("refugos", "turno")) {
    db.exec(`ALTER TABLE refugos ADD COLUMN turno TEXT NOT NULL DEFAULT 'A';`)
  }

  if (!columnExists("refugos", "quantidade_produzida")) {
    db.exec(`
      ALTER TABLE refugos 
      ADD COLUMN quantidade_produzida INTEGER NOT NULL DEFAULT 0;
    `)
  }

  if (!columnExists("refugos", "status")) {
    db.exec(`
      ALTER TABLE refugos 
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO';
    `)
  }

  if (!columnExists("refugos", "motivo_cancelamento")) {
    db.exec(`
      ALTER TABLE refugos 
      ADD COLUMN motivo_cancelamento TEXT;
    `)
  }

  db.prepare(`
    INSERT OR IGNORE INTO usuarios (
      id,
      nome,
      matricula,
      perfil,
      ativo,
      created_at,
      updated_at
    )
    VALUES (
      1,
      'Sistema',
      '0000',
      'ADMIN',
      1,
      datetime('now','localtime'),
      datetime('now','localtime')
    )
  `).run()
}