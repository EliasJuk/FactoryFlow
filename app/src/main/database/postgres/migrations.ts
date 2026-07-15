import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SYSTEM_IDS } from '../../shared/ids/systemIds'
import { pool } from './connection'

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await pool.query(
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

export async function runPostgresMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL DEFAULT 'OPERADOR',
      senha_hash TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true
    );

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
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      valor_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0,
      vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
      vigencia_fim DATE,
      ativo BOOLEAN NOT NULL DEFAULT true
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
      circuito_id INTEGER NOT NULL REFERENCES circuitos(id),
      componente_id INTEGER NOT NULL REFERENCES componentes(id),
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT true
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

  if (!(await columnExists('usuarios', 'uuid'))) {
    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN uuid UUID;
    `)
  }

  await pool.query(
    `
      UPDATE usuarios
      SET uuid = $1
      WHERE id = 1
    `,
    [SYSTEM_IDS.usuarioSistema]
  )

  const usuariosSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM usuarios
    WHERE uuid IS NULL
  `)

  for (const usuario of usuariosSemUuid.rows) {
    await pool.query(
      `
        UPDATE usuarios
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), usuario.id]
    )
  }

  await pool.query(`
    ALTER TABLE usuarios
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_uuid
    ON usuarios(uuid);
  `)

  if (!(await columnExists('setores', 'uuid'))) {
    await pool.query(`
      ALTER TABLE setores
      ADD COLUMN uuid UUID;
    `)
  }

  const setoresSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM setores
    WHERE uuid IS NULL
  `)

  for (const setor of setoresSemUuid.rows) {
    await pool.query(
      `
        UPDATE setores
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), setor.id]
    )
  }

  await pool.query(`
    ALTER TABLE setores
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('setores', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE setores
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('subsetores', 'uuid'))) {
    await pool.query(`
      ALTER TABLE subsetores
      ADD COLUMN uuid UUID;
    `)
  }

  const subsetoresSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM subsetores
    WHERE uuid IS NULL
  `)

  for (const subsetor of subsetoresSemUuid.rows) {
    await pool.query(
      `
        UPDATE subsetores
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), subsetor.id]
    )
  }

  await pool.query(`
    ALTER TABLE subsetores
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('subsetores', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE subsetores
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('postos', 'uuid'))) {
    await pool.query(`
      ALTER TABLE postos
      ADD COLUMN uuid UUID;
    `)
  }

  const postosSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM postos
    WHERE uuid IS NULL
  `)

  for (const posto of postosSemUuid.rows) {
    await pool.query(
      `
        UPDATE postos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), posto.id]
    )
  }

  await pool.query(`
    ALTER TABLE postos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('postos', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE postos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('componentes', 'uuid'))) {
    await pool.query(`
      ALTER TABLE componentes
      ADD COLUMN uuid UUID;
    `)
  }

  const componentesSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM componentes
    WHERE uuid IS NULL
  `)

  for (const componente of componentesSemUuid.rows) {
    await pool.query(
      `
        UPDATE componentes
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), componente.id]
    )
  }

  await pool.query(`
    ALTER TABLE componentes
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('componentes', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE componentes
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('defeitos', 'uuid'))) {
    await pool.query(`
      ALTER TABLE defeitos
      ADD COLUMN uuid UUID;
    `)
  }

  const defeitosSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM defeitos
    WHERE uuid IS NULL
  `)

  for (const defeito of defeitosSemUuid.rows) {
    await pool.query(
      `
        UPDATE defeitos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), defeito.id]
    )
  }

  await pool.query(`
    ALTER TABLE defeitos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('defeitos', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE defeitos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('circuitos', 'uuid'))) {
    await pool.query(`
      ALTER TABLE circuitos
      ADD COLUMN uuid UUID;
    `)
  }

  const circuitosSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM circuitos
    WHERE uuid IS NULL
  `)

  for (const circuito of circuitosSemUuid.rows) {
    await pool.query(
      `
        UPDATE circuitos
        SET uuid = $1
        WHERE id = $2
      `,
      [IdGenerator.generate(), circuito.id]
    )
  }

  await pool.query(`
    ALTER TABLE circuitos
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('circuitos', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE circuitos
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('circuito_posto_componentes', 'uuid'))) {
    await pool.query(`
      ALTER TABLE circuito_posto_componentes
      ADD COLUMN uuid UUID;
    `)
  }

  const roteirosSemUuid = await pool.query<{ id: number }>(`
    SELECT id
    FROM circuito_posto_componentes
    WHERE uuid IS NULL
  `)

  for (const roteiro of roteirosSemUuid.rows) {
    await pool.query(`UPDATE circuito_posto_componentes SET uuid = $1 WHERE id = $2`, [
      IdGenerator.generate(),
      roteiro.id
    ])
  }

  await pool.query(`
    ALTER TABLE circuito_posto_componentes
    ALTER COLUMN uuid SET NOT NULL;
  `)

  await pool.query(`
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
    if (!(await columnExists('circuito_posto_componentes', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  await pool.query(`
    UPDATE circuito_posto_componentes
    SET
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!(await columnExists('usuarios', 'senha_hash'))) {
    await pool.query(`ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;`)
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
    if (!(await columnExists('usuarios', coluna.nome))) {
      await pool.query(coluna.sql)
    }
  }

  if (!(await columnExists('refugos', 'status'))) {
    await pool.query(`
      ALTER TABLE refugos
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO';
    `)
  }

  if (!(await columnExists('refugos', 'motivo_cancelamento'))) {
    await pool.query(`
      ALTER TABLE refugos
      ADD COLUMN motivo_cancelamento TEXT;
    `)
  }

  if (!(await columnExists('refugo_itens', 'codigo_componente_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists('refugo_itens', 'nome_componente_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN nome_componente_snapshot TEXT;
    `)
  }

  if (!(await columnExists('refugo_itens', 'codigo_defeito_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN codigo_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists('refugo_itens', 'descricao_defeito_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN descricao_defeito_snapshot TEXT;
    `)
  }

  if (!(await columnExists('refugo_itens', 'preco_unitario_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN preco_unitario_snapshot NUMERIC(12, 4);
    `)
  }

  if (!(await columnExists('refugo_itens', 'custo_total_snapshot'))) {
    await pool.query(`
      ALTER TABLE refugo_itens
      ADD COLUMN custo_total_snapshot NUMERIC(12, 4);
    `)
  }

  await pool.query(
    `
      INSERT INTO usuarios (
        id,
        uuid,
        nome,
        matricula,
        perfil,
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
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE
      SET uuid = EXCLUDED.uuid;
    `,
    [SYSTEM_IDS.usuarioSistema]
  )

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('usuarios', 'id'),
      COALESCE((SELECT MAX(id) FROM usuarios), 1),
      true
    );
  `)
}
