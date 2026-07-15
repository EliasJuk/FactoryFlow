import db from '../database'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SYSTEM_IDS } from '../../shared/ids/systemIds'

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
      uuid TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL DEFAULT 'OPERADOR',
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS setores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      sigla TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS subsetores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      setor_id INTEGER NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (setor_id) REFERENCES setores(id),
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS circuitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
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
      uuid TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      subsetor_id INTEGER NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (subsetor_id) REFERENCES subsetores(id),
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS circuito_posto_componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      circuito_id INTEGER NOT NULL,
      posto_id INTEGER NOT NULL,
      componente_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,

      FOREIGN KEY (circuito_id) REFERENCES circuitos(id),
      FOREIGN KEY (posto_id) REFERENCES postos(id),
      FOREIGN KEY (componente_id) REFERENCES componentes(id),
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS defeitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      deleted_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES usuarios(id),
      FOREIGN KEY (updated_by) REFERENCES usuarios(id),
      FOREIGN KEY (deleted_by) REFERENCES usuarios(id)
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

  if (!columnExists('usuarios', 'uuid')) {
    db.exec(`
      ALTER TABLE usuarios
      ADD COLUMN uuid TEXT;
    `)
  }

  db.prepare(
    `
    UPDATE usuarios
    SET uuid = ?
    WHERE id = 1
  `
  ).run(SYSTEM_IDS.usuarioSistema)

  const usuariosSemUuid = db
    .prepare(
      `
      SELECT id
      FROM usuarios
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidUsuario = db.prepare(`
    UPDATE usuarios
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsUsuarios = db.transaction((usuarios: Array<{ id: number }>) => {
    for (const usuario of usuarios) {
      atualizarUuidUsuario.run(IdGenerator.generate(), usuario.id)
    }
  })

  preencherUuidsUsuarios(usuariosSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_uuid
    ON usuarios(uuid);
  `)

  if (!columnExists('setores', 'uuid')) {
    db.exec(`
      ALTER TABLE setores
      ADD COLUMN uuid TEXT;
    `)
  }

  const setoresSemUuid = db
    .prepare(
      `
      SELECT id
      FROM setores
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidSetor = db.prepare(`
    UPDATE setores
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsSetores = db.transaction((setores: Array<{ id: number }>) => {
    for (const setor of setores) {
      atualizarUuidSetor.run(IdGenerator.generate(), setor.id)
    }
  })

  preencherUuidsSetores(setoresSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_setores_uuid
    ON setores(uuid);
  `)

  if (!columnExists('setores', 'created_at')) {
    db.exec(`ALTER TABLE setores ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('setores', 'updated_at')) {
    db.exec(`ALTER TABLE setores ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('setores', 'deleted_at')) {
    db.exec(`ALTER TABLE setores ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('setores', 'created_by')) {
    db.exec(`ALTER TABLE setores ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('setores', 'updated_by')) {
    db.exec(`ALTER TABLE setores ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('setores', 'deleted_by')) {
    db.exec(`ALTER TABLE setores ADD COLUMN deleted_by INTEGER;`)
  }

  db.exec(`
    UPDATE setores
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('subsetores', 'uuid')) {
    db.exec(`
      ALTER TABLE subsetores
      ADD COLUMN uuid TEXT;
    `)
  }

  const subsetoresSemUuid = db
    .prepare(
      `
      SELECT id
      FROM subsetores
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidSubsetor = db.prepare(`
    UPDATE subsetores
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsSubsetores = db.transaction((subsetores: Array<{ id: number }>) => {
    for (const subsetor of subsetores) {
      atualizarUuidSubsetor.run(IdGenerator.generate(), subsetor.id)
    }
  })

  preencherUuidsSubsetores(subsetoresSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subsetores_uuid
    ON subsetores(uuid);
  `)

  if (!columnExists('subsetores', 'created_at')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('subsetores', 'updated_at')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('subsetores', 'deleted_at')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('subsetores', 'created_by')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('subsetores', 'updated_by')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('subsetores', 'deleted_by')) {
    db.exec(`ALTER TABLE subsetores ADD COLUMN deleted_by INTEGER;`)
  }

  db.exec(`
    UPDATE subsetores
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('postos', 'uuid')) {
    db.exec(`
      ALTER TABLE postos
      ADD COLUMN uuid TEXT;
    `)
  }

  const postosSemUuid = db
    .prepare(
      `
      SELECT id
      FROM postos
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidPosto = db.prepare(`
    UPDATE postos
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsPostos = db.transaction((postos: Array<{ id: number }>) => {
    for (const posto of postos) {
      atualizarUuidPosto.run(IdGenerator.generate(), posto.id)
    }
  })

  preencherUuidsPostos(postosSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_postos_uuid
    ON postos(uuid);
  `)

  if (!columnExists('postos', 'created_at')) {
    db.exec(`ALTER TABLE postos ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('postos', 'updated_at')) {
    db.exec(`ALTER TABLE postos ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('postos', 'deleted_at')) {
    db.exec(`ALTER TABLE postos ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('postos', 'created_by')) {
    db.exec(`ALTER TABLE postos ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('postos', 'updated_by')) {
    db.exec(`ALTER TABLE postos ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('postos', 'deleted_by')) {
    db.exec(`ALTER TABLE postos ADD COLUMN deleted_by INTEGER;`)
  }

  db.exec(`
    UPDATE postos
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('componentes', 'uuid')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN uuid TEXT;
    `)
  }

  const componentesSemUuid = db
    .prepare(
      `
      SELECT id
      FROM componentes
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidComponente = db.prepare(`
    UPDATE componentes
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsComponentes = db.transaction((componentes: Array<{ id: number }>) => {
    for (const componente of componentes) {
      atualizarUuidComponente.run(IdGenerator.generate(), componente.id)
    }
  })

  preencherUuidsComponentes(componentesSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_componentes_uuid
    ON componentes(uuid);
  `)

  if (!columnExists('componentes', 'created_at')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
    `)
  }

  if (!columnExists('componentes', 'updated_at')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
    `)
  }

  if (!columnExists('componentes', 'deleted_at')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN deleted_at TEXT;
    `)
  }

  if (!columnExists('componentes', 'created_by')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN created_by INTEGER;
    `)
  }

  if (!columnExists('componentes', 'updated_by')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN updated_by INTEGER;
    `)
  }

  if (!columnExists('componentes', 'deleted_by')) {
    db.exec(`
      ALTER TABLE componentes
      ADD COLUMN deleted_by INTEGER;
    `)
  }

  db.exec(`
    UPDATE componentes
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('defeitos', 'uuid')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN uuid TEXT;
    `)
  }

  const defeitosSemUuid = db
    .prepare(
      `
      SELECT id
      FROM defeitos
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidDefeito = db.prepare(`
    UPDATE defeitos
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsDefeitos = db.transaction((defeitos: Array<{ id: number }>) => {
    for (const defeito of defeitos) {
      atualizarUuidDefeito.run(IdGenerator.generate(), defeito.id)
    }
  })

  preencherUuidsDefeitos(defeitosSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_defeitos_uuid
    ON defeitos(uuid);
  `)

  if (!columnExists('defeitos', 'created_at')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
    `)
  }

  if (!columnExists('defeitos', 'updated_at')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
    `)
  }

  if (!columnExists('defeitos', 'deleted_at')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN deleted_at TEXT;
    `)
  }

  if (!columnExists('defeitos', 'created_by')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN created_by INTEGER;
    `)
  }

  if (!columnExists('defeitos', 'updated_by')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN updated_by INTEGER;
    `)
  }

  if (!columnExists('defeitos', 'deleted_by')) {
    db.exec(`
      ALTER TABLE defeitos
      ADD COLUMN deleted_by INTEGER;
    `)
  }

  db.exec(`
    UPDATE defeitos
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('circuitos', 'uuid')) {
    db.exec(`
      ALTER TABLE circuitos
      ADD COLUMN uuid TEXT;
    `)
  }

  const circuitosSemUuid = db
    .prepare(
      `
      SELECT id
      FROM circuitos
      WHERE uuid IS NULL
         OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidCircuito = db.prepare(`
    UPDATE circuitos
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsCircuitos = db.transaction((circuitos: Array<{ id: number }>) => {
    for (const circuito of circuitos) {
      atualizarUuidCircuito.run(IdGenerator.generate(), circuito.id)
    }
  })

  preencherUuidsCircuitos(circuitosSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circuitos_uuid
    ON circuitos(uuid);
  `)

  if (!columnExists('circuitos', 'created_at')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('circuitos', 'updated_at')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('circuitos', 'deleted_at')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('circuitos', 'created_by')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('circuitos', 'updated_by')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('circuitos', 'deleted_by')) {
    db.exec(`ALTER TABLE circuitos ADD COLUMN deleted_by INTEGER;`)
  }

  db.exec(`
    UPDATE circuitos
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('circuito_posto_componentes', 'uuid')) {
    db.exec(`ALTER TABLE circuito_posto_componentes ADD COLUMN uuid TEXT;`)
  }

  const roteirosSemUuid = db
    .prepare(
      `
      SELECT id
      FROM circuito_posto_componentes
      WHERE uuid IS NULL OR TRIM(uuid) = ''
    `
    )
    .all() as Array<{ id: number }>

  const atualizarUuidRoteiro = db.prepare(`
    UPDATE circuito_posto_componentes
    SET uuid = ?
    WHERE id = ?
  `)

  const preencherUuidsRoteiros = db.transaction((roteiros: Array<{ id: number }>) => {
    for (const roteiro of roteiros) {
      atualizarUuidRoteiro.run(IdGenerator.generate(), roteiro.id)
    }
  })

  preencherUuidsRoteiros(roteirosSemUuid)

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circuito_posto_componentes_uuid
    ON circuito_posto_componentes(uuid);
  `)

  if (!columnExists('circuito_posto_componentes', 'created_at')) {
    db.exec(
      `ALTER TABLE circuito_posto_componentes ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`
    )
  }

  if (!columnExists('circuito_posto_componentes', 'updated_at')) {
    db.exec(
      `ALTER TABLE circuito_posto_componentes ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`
    )
  }

  if (!columnExists('circuito_posto_componentes', 'deleted_at')) {
    db.exec(`ALTER TABLE circuito_posto_componentes ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('circuito_posto_componentes', 'created_by')) {
    db.exec(`ALTER TABLE circuito_posto_componentes ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('circuito_posto_componentes', 'updated_by')) {
    db.exec(`ALTER TABLE circuito_posto_componentes ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('circuito_posto_componentes', 'deleted_by')) {
    db.exec(`ALTER TABLE circuito_posto_componentes ADD COLUMN deleted_by INTEGER;`)
  }

  db.exec(`
    UPDATE circuito_posto_componentes
    SET
      created_at = COALESCE(created_at, datetime('now','localtime')),
      updated_at = COALESCE(updated_at, created_at, datetime('now','localtime')),
      created_by = COALESCE(created_by, 1),
      updated_by = COALESCE(updated_by, created_by, 1)
  `)

  if (!columnExists('usuarios', 'senha_hash')) {
    db.exec(`
      ALTER TABLE usuarios
      ADD COLUMN senha_hash TEXT;
    `)
  }

  if (!columnExists('usuarios', 'created_at')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('usuarios', 'updated_at')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`)
  }

  if (!columnExists('usuarios', 'deleted_at')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN deleted_at TEXT;`)
  }

  if (!columnExists('usuarios', 'created_by')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN created_by INTEGER;`)
  }

  if (!columnExists('usuarios', 'updated_by')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN updated_by INTEGER;`)
  }

  if (!columnExists('usuarios', 'deleted_by')) {
    db.exec(`ALTER TABLE usuarios ADD COLUMN deleted_by INTEGER;`)
  }

  if (!columnExists('setores', 'sigla')) {
    db.exec(`ALTER TABLE setores ADD COLUMN sigla TEXT;`)
  }

  if (!columnExists('refugos', 'numero_refugo')) {
    db.exec(`ALTER TABLE refugos ADD COLUMN numero_refugo TEXT;`)
  }

  if (!columnExists('refugos', 'sigla_setor')) {
    db.exec(`ALTER TABLE refugos ADD COLUMN sigla_setor TEXT;`)
  }

  if (!columnExists('refugos', 'ano')) {
    db.exec(`ALTER TABLE refugos ADD COLUMN ano INTEGER;`)
  }

  if (!columnExists('refugos', 'sequencia')) {
    db.exec(`ALTER TABLE refugos ADD COLUMN sequencia INTEGER;`)
  }

  if (!columnExists('refugos', 'turno')) {
    db.exec(`ALTER TABLE refugos ADD COLUMN turno TEXT NOT NULL DEFAULT 'A';`)
  }

  if (!columnExists('refugos', 'quantidade_produzida')) {
    db.exec(`
      ALTER TABLE refugos
      ADD COLUMN quantidade_produzida INTEGER NOT NULL DEFAULT 0;
    `)
  }

  if (!columnExists('refugos', 'status')) {
    db.exec(`
      ALTER TABLE refugos
      ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO';
    `)
  }

  if (!columnExists('refugos', 'motivo_cancelamento')) {
    db.exec(`
      ALTER TABLE refugos
      ADD COLUMN motivo_cancelamento TEXT;
    `)
  }

  db.prepare(
    `
    INSERT OR IGNORE INTO usuarios (
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
      ?,
      'Sistema',
      '0000',
      'ADMIN',
      1,
      datetime('now','localtime'),
      datetime('now','localtime')
    )
  `
  ).run(SYSTEM_IDS.usuarioSistema)
}
