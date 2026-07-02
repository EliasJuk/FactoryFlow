import { pool } from "./connection"

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = $1
        AND column_name = $2
      LIMIT 1
    `,
    [table, column]
  )

  return (result.rowCount ?? 0) > 0
}

export async function runPostgresMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL DEFAULT 'OPERADOR',
      senha_hash TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS setores (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      sigla TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS subsetores (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      setor_id INTEGER NOT NULL REFERENCES setores(id),
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS componentes (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS componentes_precos (
      id SERIAL PRIMARY KEY,
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      valor_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0,
      vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
      vigencia_fim DATE,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS circuitos (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS circuito_componentes (
      id SERIAL PRIMARY KEY,
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS postos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      subsetor_id INTEGER NOT NULL REFERENCES subsetores(id),
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS circuito_posto_componentes (
      id SERIAL PRIMARY KEY,
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),
      posto_id INTEGER NOT NULL REFERENCES postos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS defeitos (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS refugos (
      id SERIAL PRIMARY KEY,

      numero_refugo TEXT NOT NULL,
      sigla_setor TEXT NOT NULL,
      ano INTEGER NOT NULL,
      sequencia INTEGER NOT NULL,

      data_hora TIMESTAMP NOT NULL DEFAULT NOW(),
      turno TEXT NOT NULL DEFAULT 'A',
      matricula_operador TEXT NOT NULL,
      usuario_id INTEGER REFERENCES usuarios(id),

      setor_id INTEGER NOT NULL REFERENCES setores(id),
      subsetor_id INTEGER NOT NULL REFERENCES subsetores(id),
      posto_id INTEGER NOT NULL REFERENCES postos(id),
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),

      quantidade_produzida INTEGER NOT NULL DEFAULT 0,
      observacao TEXT,

      status TEXT NOT NULL DEFAULT 'ATIVO',
      motivo_cancelamento TEXT
    );

    CREATE TABLE IF NOT EXISTS refugo_itens (
      id SERIAL PRIMARY KEY,
      refugo_id INTEGER NOT NULL REFERENCES refugos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      defeito_id INTEGER NOT NULL REFERENCES defeitos(id),
      quantidade INTEGER NOT NULL,

      codigo_componente_snapshot TEXT,
      nome_componente_snapshot TEXT,
      codigo_defeito_snapshot TEXT,
      descricao_defeito_snapshot TEXT,
      preco_unitario_snapshot NUMERIC(12, 4),
      custo_total_snapshot NUMERIC(12, 4)
    );
  `)

  if (!(await columnExists("usuarios", "senha_hash"))) {
    await pool.query(`ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;`)
  }

  if (!(await columnExists("refugos", "status"))) {
    await pool.query(`
      ALTER TABLE refugos
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO';
    `)
  }

  if (!(await columnExists("refugos", "motivo_cancelamento"))) {
    await pool.query(`
      ALTER TABLE refugos
      ADD COLUMN motivo_cancelamento TEXT;
    `)
  }

  if (!(await columnExists("refugo_itens", "codigo_componente_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists("refugo_itens", "nome_componente_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN nome_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists("refugo_itens", "codigo_defeito_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists("refugo_itens", "descricao_defeito_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN descricao_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists("refugo_itens", "preco_unitario_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN preco_unitario_snapshot NUMERIC(12, 4);
    `)
  }

  if (!(await columnExists("refugo_itens", "custo_total_snapshot"))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN custo_total_snapshot NUMERIC(12, 4);
    `)
  }

  await pool.query(`
    INSERT INTO usuarios (id, nome, matricula, perfil, ativo)
    VALUES (1, 'Sistema', '0000', 'ADMIN', true)
    ON CONFLICT (id) DO NOTHING;
  `)
}