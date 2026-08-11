import type { QueryResult, QueryResultRow } from 'pg'

import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SYSTEM_IDS } from '../../shared/ids/systemIds'
import { pool } from './connection'

type MigrationDatabase = {
  query<T extends QueryResultRow = any>(text: string, values?: unknown[]): Promise<QueryResult<T>>
}

async function columnExists(
  db: MigrationDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const result = await db.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = $2
      LIMIT 1
    `,
    [table, column]
  )

  return (result.rowCount ?? 0) > 0
}

export async function runPostgresMigrations(db: MigrationDatabase = pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL DEFAULT 'OPERADOR',
      senha_hash TEXT,
      deve_trocar_senha BOOLEAN NOT NULL DEFAULT false,
      senha_alterada_em TIMESTAMP NULL,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS solicitacoes_alteracao_senha (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      solicitado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atendido_em TIMESTAMP NULL,
      cancelado_em TIMESTAMP NULL,
      atendido_por INTEGER NULL REFERENCES usuarios(id),
      cancelado_por INTEGER NULL REFERENCES usuarios(id),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitacao_senha_pendente_usuario
    ON solicitacoes_alteracao_senha(usuario_id)
    WHERE status = 'PENDENTE';

    CREATE TABLE IF NOT EXISTS setores (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      sigla TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS subsetores (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      setor_id INTEGER NOT NULL REFERENCES setores(id),
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS componentes (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS componentes_precos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      valor_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0,
      vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
      vigencia_fim DATE,
      ativo BOOLEAN NOT NULL DEFAULT true,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circuitos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS circuito_componentes (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS postos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      subsetor_id INTEGER NOT NULL REFERENCES subsetores(id),
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS circuito_posto_componentes (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),
      posto_id INTEGER NOT NULL REFERENCES postos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS defeitos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS posto_defeitos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      posto_id INTEGER NOT NULL REFERENCES postos(id),
      defeito_id INTEGER NOT NULL REFERENCES defeitos(id),
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id),
      CONSTRAINT uq_posto_defeitos UNIQUE (posto_id, defeito_id)
    );

    CREATE INDEX IF NOT EXISTS idx_posto_defeitos_posto_ativo
    ON posto_defeitos(posto_id, ativo);

    CREATE TABLE IF NOT EXISTS refugos (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,

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
      motivo_cancelamento TEXT,

      origem TEXT NOT NULL DEFAULT 'LANCAMENTO_MANUAL',
      id_origem TEXT,
      importado_em TIMESTAMP NULL,
      importado_por INTEGER NULL REFERENCES usuarios(id),

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS refugo_itens (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      refugo_id INTEGER NOT NULL REFERENCES refugos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      defeito_id INTEGER NOT NULL REFERENCES defeitos(id),
      quantidade INTEGER NOT NULL,

      codigo_componente_snapshot TEXT,
      nome_componente_snapshot TEXT,
      codigo_defeito_snapshot TEXT,
      descricao_defeito_snapshot TEXT,
      preco_unitario_snapshot NUMERIC(12, 4),
      custo_total_snapshot NUMERIC(12, 4),

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      created_by INTEGER NULL REFERENCES usuarios(id),
      updated_by INTEGER NULL REFERENCES usuarios(id),
      deleted_by INTEGER NULL REFERENCES usuarios(id)
    );
  `)

  if (!(await columnExists(db, 'usuarios', 'uuid'))) {
    await db.query(`
      ALTER TABLE usuarios
      ADD COLUMN uuid UUID;
    `)
  }

  await db.query(
    `
      UPDATE usuarios
      SET uuid = $1
      WHERE id = 1
    `,
    [SYSTEM_IDS.usuarioSistema]
  )

  const usuariosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM usuarios
    WHERE uuid IS NULL
  `)

  for (const usuario of usuariosSemUuid.rows) {
    await db.query(
      `
        UPDATE usuarios
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), usuario.id]
    )
  }

  await db.query(`
    ALTER TABLE usuarios
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_uuid
    ON usuarios(uuid);
  `)

  if (!(await columnExists(db, 'setores', 'uuid'))) {
    await db.query(`
      ALTER TABLE setores
      ADD COLUMN uuid UUID;
    `)
  }

  const setoresSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM setores
    WHERE uuid IS NULL
  `)

  for (const setor of setoresSemUuid.rows) {
    await db.query(
      `
        UPDATE setores
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), setor.id]
    )
  }

  await db.query(`
    ALTER TABLE setores
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_setores_uuid
    ON setores(uuid);
  `)

  const colunasSetores = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE setores ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE setores ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE setores ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE setores ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE setores ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE setores ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasSetores) {
    if (!(await columnExists(db, 'setores', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE setores
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'subsetores', 'uuid'))) {
    await db.query(`
      ALTER TABLE subsetores
      ADD COLUMN uuid UUID;
    `)
  }

  const subsetoresSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM subsetores
    WHERE uuid IS NULL
  `)

  for (const subsetor of subsetoresSemUuid.rows) {
    await db.query(
      `
        UPDATE subsetores
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), subsetor.id]
    )
  }

  await db.query(`
    ALTER TABLE subsetores
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subsetores_uuid
    ON subsetores(uuid);
  `)

  const colunasSubsetores = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE subsetores ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE subsetores ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE subsetores ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE subsetores ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE subsetores ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE subsetores ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasSubsetores) {
    if (!(await columnExists(db, 'subsetores', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE subsetores
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'postos', 'uuid'))) {
    await db.query(`
      ALTER TABLE postos
      ADD COLUMN uuid UUID;
    `)
  }

  const postosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM postos
    WHERE uuid IS NULL
  `)

  for (const posto of postosSemUuid.rows) {
    await db.query(
      `
        UPDATE postos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), posto.id]
    )
  }

  await db.query(`
    ALTER TABLE postos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_postos_uuid
    ON postos(uuid);
  `)

  const colunasPostos = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE postos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE postos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE postos ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE postos ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE postos ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE postos ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasPostos) {
    if (!(await columnExists(db, 'postos', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE postos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'componentes', 'uuid'))) {
    await db.query(`
      ALTER TABLE componentes
      ADD COLUMN uuid UUID;
    `)
  }

  const componentesSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM componentes
    WHERE uuid IS NULL
  `)

  for (const componente of componentesSemUuid.rows) {
    await db.query(
      `
        UPDATE componentes
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), componente.id]
    )
  }

  await db.query(`
    ALTER TABLE componentes
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_componentes_uuid
    ON componentes(uuid);
  `)

  const colunasComponentes = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE componentes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE componentes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE componentes ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE componentes ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE componentes ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE componentes ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasComponentes) {
    if (!(await columnExists(db, 'componentes', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE componentes
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'componentes_precos', 'uuid'))) {
    await db.query(`
      ALTER TABLE componentes_precos
      ADD COLUMN uuid UUID;
    `)
  }

  if (!(await columnExists(db, 'componentes_precos', 'criado_em'))) {
    await db.query(`
      ALTER TABLE componentes_precos
      ADD COLUMN criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `)
  }

  const componentesPrecosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM componentes_precos
    WHERE uuid IS NULL
  `)

  for (const preco of componentesPrecosSemUuid.rows) {
    await db.query(
      `
        UPDATE componentes_precos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), preco.id]
    )
  }

  await db.query(`
    ALTER TABLE componentes_precos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    ALTER TABLE componentes_precos
    ALTER COLUMN criado_em SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_componentes_precos_uuid
    ON componentes_precos(uuid);
  `)

  if (!(await columnExists(db, 'defeitos', 'uuid'))) {
    await db.query(`
      ALTER TABLE defeitos
      ADD COLUMN uuid UUID;
    `)
  }

  const defeitosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM defeitos
    WHERE uuid IS NULL
  `)

  for (const defeito of defeitosSemUuid.rows) {
    await db.query(
      `
        UPDATE defeitos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), defeito.id]
    )
  }

  await db.query(`
    ALTER TABLE defeitos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_defeitos_uuid
    ON defeitos(uuid);
  `)

  const colunasDefeitos = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE defeitos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE defeitos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE defeitos ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE defeitos ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE defeitos ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE defeitos ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasDefeitos) {
    if (!(await columnExists(db, 'defeitos', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE defeitos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'circuitos', 'uuid'))) {
    await db.query(`
      ALTER TABLE circuitos
      ADD COLUMN uuid UUID;
    `)
  }

  const circuitosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM circuitos
    WHERE uuid IS NULL
  `)

  for (const circuito of circuitosSemUuid.rows) {
    await db.query(
      `
        UPDATE circuitos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), circuito.id]
    )
  }

  await db.query(`
    ALTER TABLE circuitos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circuitos_uuid
    ON circuitos(uuid);
  `)

  const colunasCircuitos = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE circuitos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE circuitos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE circuitos ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE circuitos ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE circuitos ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE circuitos ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasCircuitos) {
    if (!(await columnExists(db, 'circuitos', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE circuitos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'circuito_posto_componentes', 'uuid'))) {
    await db.query(`
      ALTER TABLE circuito_posto_componentes
      ADD COLUMN uuid UUID;
    `)
  }

  const roteirosSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM circuito_posto_componentes
    WHERE uuid IS NULL
  `)

  for (const roteiro of roteirosSemUuid.rows) {
    await db.query(`UPDATE circuito_posto_componentes SET uuid = $1 WHERE id = $2`, [
      IdGenerator.generate(),
      roteiro.id
    ])
  }

  await db.query(`
    ALTER TABLE circuito_posto_componentes
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circuito_posto_componentes_uuid
    ON circuito_posto_componentes(uuid);
  `)

  const colunasRoteiro = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE circuito_posto_componentes ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasRoteiro) {
    if (!(await columnExists(db, 'circuito_posto_componentes', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE circuito_posto_componentes
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists(db, 'usuarios', 'deve_trocar_senha'))) {
    await db.query(`
      ALTER TABLE usuarios
      ADD COLUMN deve_trocar_senha BOOLEAN NOT NULL DEFAULT false;
    `)
  }

  if (!(await columnExists(db, 'usuarios', 'senha_alterada_em'))) {
    await db.query(`
      ALTER TABLE usuarios
      ADD COLUMN senha_alterada_em TIMESTAMP NULL;
    `)
  }

  if (!(await columnExists(db, 'usuarios', 'senha_hash'))) {
    await db.query(`ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;`)
  }

  const colunasUsuarios = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE usuarios ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE usuarios ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE usuarios ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE usuarios ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasUsuarios) {
    if (!(await columnExists(db, 'usuarios', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  if (!(await columnExists(db, 'circuito_componentes', 'uuid'))) {
    await db.query(`ALTER TABLE circuito_componentes ADD COLUMN uuid UUID;`)
  }

  const circuitoComponentesSemUuid = await db.query<{ id: number }>(`
    SELECT id
    FROM circuito_componentes
    WHERE uuid IS NULL
  `)

  for (const item of circuitoComponentesSemUuid.rows) {
    await db.query(`UPDATE circuito_componentes SET uuid = $1 WHERE id = $2`, [
      IdGenerator.generate(),
      item.id
    ])
  }

  await db.query(`
    ALTER TABLE circuito_componentes
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circuito_componentes_uuid
    ON circuito_componentes(uuid);
  `)

  const colunasCircuitoComponentes = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'deleted_at',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN deleted_at TIMESTAMP NULL;'
    },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE circuito_componentes ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasCircuitoComponentes) {
    if (!(await columnExists(db, 'circuito_componentes', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    UPDATE circuito_componentes
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1),
      deleted_at = CASE
        WHEN ativo = false THEN COALESCE(deleted_at, updated_at, CURRENT_TIMESTAMP)
        ELSE NULL
      END,
      deleted_by = CASE
        WHEN ativo = false THEN COALESCE(deleted_by, updated_by, created_by, 1)
        ELSE NULL
      END
  `)

  if (!(await columnExists(db, 'refugos', 'status'))) {
    await db.query(`
      ALTER TABLE refugos
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO';
    `)
  }

  if (!(await columnExists(db, 'refugos', 'motivo_cancelamento'))) {
    await db.query(`
      ALTER TABLE refugos
      ADD COLUMN motivo_cancelamento TEXT;
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'codigo_componente_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'nome_componente_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN nome_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'codigo_defeito_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'descricao_defeito_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN descricao_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'preco_unitario_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN preco_unitario_snapshot NUMERIC(12, 4);
    `)
  }

  if (!(await columnExists(db, 'refugo_itens', 'custo_total_snapshot'))) {
    await db.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN custo_total_snapshot NUMERIC(12, 4);
    `)
  }

  await db.query(
    `
      INSERT INTO usuarios (
        id,
        uuid,
        nome,
        matricula,
        perfil,
        senha_hash,
        deve_trocar_senha,
        ativo,
        created_at,
        updated_at
      )
      VALUES (
        1,
        $1,
        'Sistema',
        '0000',
        'ADMIN',
        NULL,
        false,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE
      SET
        uuid = EXCLUDED.uuid,
        senha_hash = NULL,
        deve_trocar_senha = false;
    `,
    [SYSTEM_IDS.usuarioSistema]
  )

  await db.query(`
    SELECT setval(
      pg_get_serial_sequence('usuarios', 'id'),
      COALESCE((SELECT MAX(id) FROM usuarios), 1),
      true
    );
  `)

  if (!(await columnExists(db, 'refugos', 'uuid'))) {
    await db.query(`ALTER TABLE refugos ADD COLUMN uuid UUID;`)
  }

  const refugosSemUuid = await db.query<{ id: number }>(`
    SELECT id FROM refugos WHERE uuid IS NULL
  `)

  for (const refugo of refugosSemUuid.rows) {
    await db.query(`UPDATE refugos SET uuid = $1 WHERE id = $2`, [
      IdGenerator.generate(),
      refugo.id
    ])
  }

  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_refugos_uuid ON refugos(uuid);`)

  const colunasAuditoriaRefugos = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE refugos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE refugos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    { nome: 'deleted_at', sql: 'ALTER TABLE refugos ADD COLUMN deleted_at TIMESTAMP NULL;' },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE refugos ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE refugos ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE refugos ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasAuditoriaRefugos) {
    if (!(await columnExists(db, 'refugos', coluna.nome))) await db.query(coluna.sql)
  }

  await db.query(`
    UPDATE refugos
    SET created_at = COALESCE(created_at, data_hora, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, created_at, data_hora, CURRENT_TIMESTAMP),
        created_by = COALESCE(created_by, usuario_id, 1),
        updated_by = COALESCE(updated_by, created_by, usuario_id, 1)
  `)

  if (!(await columnExists(db, 'refugo_itens', 'uuid'))) {
    await db.query(`ALTER TABLE refugo_itens ADD COLUMN uuid UUID;`)
  }

  const itensRefugoSemUuid = await db.query<{ id: number }>(`
    SELECT id FROM refugo_itens WHERE uuid IS NULL
  `)

  for (const item of itensRefugoSemUuid.rows) {
    await db.query(`UPDATE refugo_itens SET uuid = $1 WHERE id = $2`, [
      IdGenerator.generate(),
      item.id
    ])
  }

  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_refugo_itens_uuid ON refugo_itens(uuid);`)

  const colunasAuditoriaItensRefugo = [
    {
      nome: 'created_at',
      sql: 'ALTER TABLE refugo_itens ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    {
      nome: 'updated_at',
      sql: 'ALTER TABLE refugo_itens ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
    },
    { nome: 'deleted_at', sql: 'ALTER TABLE refugo_itens ADD COLUMN deleted_at TIMESTAMP NULL;' },
    {
      nome: 'created_by',
      sql: 'ALTER TABLE refugo_itens ADD COLUMN created_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'updated_by',
      sql: 'ALTER TABLE refugo_itens ADD COLUMN updated_by INTEGER NULL REFERENCES usuarios(id);'
    },
    {
      nome: 'deleted_by',
      sql: 'ALTER TABLE refugo_itens ADD COLUMN deleted_by INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasAuditoriaItensRefugo) {
    if (!(await columnExists(db, 'refugo_itens', coluna.nome))) await db.query(coluna.sql)
  }

  await db.query(`
    UPDATE refugo_itens ri
    SET created_at = COALESCE(ri.created_at, r.created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(ri.updated_at, ri.created_at, r.updated_at, CURRENT_TIMESTAMP),
        created_by = COALESCE(ri.created_by, r.created_by, 1),
        updated_by = COALESCE(ri.updated_by, ri.created_by, r.updated_by, 1)
    FROM refugos r
    WHERE r.id = ri.refugo_id
  `)

  const colunasMigracaoRefugos = [
    {
      nome: 'origem',
      sql: "ALTER TABLE refugos ADD COLUMN origem TEXT NOT NULL DEFAULT 'LANCAMENTO_MANUAL';"
    },
    {
      nome: 'id_origem',
      sql: 'ALTER TABLE refugos ADD COLUMN id_origem TEXT NULL;'
    },
    {
      nome: 'importado_em',
      sql: 'ALTER TABLE refugos ADD COLUMN importado_em TIMESTAMP NULL;'
    },
    {
      nome: 'importado_por',
      sql: 'ALTER TABLE refugos ADD COLUMN importado_por INTEGER NULL REFERENCES usuarios(id);'
    }
  ]

  for (const coluna of colunasMigracaoRefugos) {
    if (!(await columnExists(db, 'refugos', coluna.nome))) {
      await db.query(coluna.sql)
    }
  }

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_refugos_id_origem_historica
    ON refugos(id_origem)
    WHERE id_origem IS NOT NULL AND BTRIM(id_origem) <> '';
  `)
}
