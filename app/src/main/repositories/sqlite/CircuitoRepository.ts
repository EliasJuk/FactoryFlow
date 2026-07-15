import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export interface Circuito {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  deletedBy: number | null
  createdByNome: string | null
  updatedByNome: string | null
  deletedByNome: string | null
}

type CircuitoRow = {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: number
  totalComponentes: number
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  deletedBy: number | null
  createdByNome: string | null
  updatedByNome: string | null
  deletedByNome: string | null
}

export class CircuitoRepository {
  private consultaBase(): string {
    return `
      SELECT
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        c.ativo,
        COUNT(cc.id) AS totalComponentes,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        c.deleted_at AS deletedAt,
        c.created_by AS createdBy,
        c.updated_by AS updatedBy,
        c.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM circuitos c
      LEFT JOIN circuito_componentes cc
        ON cc.circuito_id = c.id
       AND cc.ativo = 1
      LEFT JOIN usuarios criado ON criado.id = c.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = c.updated_by
      LEFT JOIN usuarios removido ON removido.id = c.deleted_by
    `
  }

  private mapear(circuito: CircuitoRow): Circuito {
    return {
      ...circuito,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0)
    }
  }

  listar(): Circuito[] {
    const circuitos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE c.ativo = 1
        GROUP BY
          c.id,
          c.uuid,
          c.codigo,
          c.nome,
          c.ativo,
          c.created_at,
          c.updated_at,
          c.deleted_at,
          c.created_by,
          c.updated_by,
          c.deleted_by,
          criado.nome,
          atualizado.nome,
          removido.nome
        ORDER BY c.codigo
      `
      )
      .all() as CircuitoRow[]

    return circuitos.map((circuito) => this.mapear(circuito))
  }

  listarInativos(): Circuito[] {
    const circuitos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE c.ativo = 0
        GROUP BY
          c.id,
          c.uuid,
          c.codigo,
          c.nome,
          c.ativo,
          c.created_at,
          c.updated_at,
          c.deleted_at,
          c.created_by,
          c.updated_by,
          c.deleted_by,
          criado.nome,
          atualizado.nome,
          removido.nome
        ORDER BY c.codigo
      `
      )
      .all() as CircuitoRow[]

    return circuitos.map((circuito) => this.mapear(circuito))
  }

  criar(codigo: string, nome: string, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const existente = db
      .prepare(
        `
        SELECT id, ativo
        FROM circuitos
        WHERE codigo = ?
        LIMIT 1
      `
      )
      .get(codigoFormatado) as { id: number; ativo: number } | undefined

    if (existente?.ativo === 1) {
      throw new Error('CIRCUITO_DUPLICADO')
    }

    if (existente?.ativo === 0) {
      throw new Error(
        'Já existe um circuito inativo com este código. Restaure o circuito em vez de criar outro.'
      )
    }

    db.prepare(
      `
      INSERT INTO circuitos (
        uuid,
        codigo,
        nome,
        ativo,
        created_at,
        updated_at,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'), ?, ?)
    `
    ).run(IdGenerator.generate(), codigoFormatado, nomeFormatado, usuarioId, usuarioId)
  }

  editar(id: number, codigo: string, nome: string, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(
        `
        SELECT id, ativo
        FROM circuitos
        WHERE codigo = ?
          AND id <> ?
        LIMIT 1
      `
      )
      .get(codigoFormatado, id) as { id: number; ativo: number } | undefined

    if (duplicado?.ativo === 1) {
      throw new Error('CIRCUITO_DUPLICADO')
    }

    if (duplicado?.ativo === 0) {
      throw new Error(
        'Já existe um circuito inativo com este código. Altere o código ou restaure o circuito inativo.'
      )
    }

    db.prepare(
      `
      UPDATE circuitos
      SET
        codigo = ?,
        nome = ?,
        updated_at = datetime('now','localtime'),
        updated_by = ?
      WHERE id = ?
    `
    ).run(codigoFormatado, nomeFormatado, usuarioId, id)
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.prepare(
      `
      UPDATE circuitos
      SET
        ativo = 0,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = datetime('now','localtime'),
        deleted_by = ?
      WHERE id = ?
    `
    ).run(usuarioId, usuarioId, id)
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.prepare(
      `
      UPDATE circuitos
      SET
        ativo = 1,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = ?
    `
    ).run(usuarioId, id)
  }

  excluirPermanente(id: number): void {
    const vinculos = [
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM circuito_componentes
        WHERE circuito_id = ?
      `
        )
        .get(id) as { total: number },
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM circuito_posto_componentes
        WHERE circuito_id = ?
      `
        )
        .get(id) as { total: number },
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM refugos
        WHERE circuito_id = ?
      `
        )
        .get(id) as { total: number }
    ]

    if (vinculos.some((item) => Number(item.total) > 0)) {
      throw new Error('CIRCUITO_EM_USO')
    }

    db.prepare(
      `
      DELETE FROM circuitos
      WHERE id = ?
        AND ativo = 0
    `
    ).run(id)
  }
}
