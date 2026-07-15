import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export interface CircuitoComponente {
  id: number
  uuid: string
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

export class CircuitoComponenteRepository {
  listarPorCircuito(circuitoId: number): CircuitoComponente[] {
    const itens = db
      .prepare(
        `
      SELECT
        cc.id,
        cc.uuid,
        cc.circuito_id AS circuitoId,
        cc.componente_id AS componenteId,
        c.codigo AS codigoComponente,
        c.nome AS nomeComponente,
        cc.quantidade,
        cc.ativo,
        cc.created_at AS createdAt,
        cc.updated_at AS updatedAt,
        cc.deleted_at AS deletedAt,
        cc.created_by AS createdBy,
        cc.updated_by AS updatedBy,
        cc.deleted_by AS deletedBy,
        uc.nome AS createdByNome,
        uu.nome AS updatedByNome,
        ud.nome AS deletedByNome
      FROM circuito_componentes cc
      INNER JOIN componentes c ON c.id = cc.componente_id
      LEFT JOIN usuarios uc ON uc.id = cc.created_by
      LEFT JOIN usuarios uu ON uu.id = cc.updated_by
      LEFT JOIN usuarios ud ON ud.id = cc.deleted_by
      WHERE cc.circuito_id = ?
        AND cc.ativo = 1
      ORDER BY c.codigo
    `
      )
      .all(circuitoId) as Array<Omit<CircuitoComponente, 'ativo'> & { ativo: number }>

    return itens.map((item) => ({ ...item, ativo: Boolean(item.ativo) }))
  }

  adicionar(
    circuitoId: number,
    componenteId: number,
    quantidade: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): void {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    const existente = db
      .prepare(
        `
      SELECT id, ativo
      FROM circuito_componentes
      WHERE circuito_id = ? AND componente_id = ?
      ORDER BY id DESC
      LIMIT 1
    `
      )
      .get(circuitoId, componenteId) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error('COMPONENTE_JA_VINCULADO')
    }

    if (existente) {
      db.prepare(
        `
        UPDATE circuito_componentes
        SET
          quantidade = ?,
          ativo = 1,
          updated_at = datetime('now','localtime'),
          updated_by = ?,
          deleted_at = NULL,
          deleted_by = NULL
        WHERE id = ?
      `
      ).run(quantidade, usuarioId, existente.id)
      return
    }

    db.prepare(
      `
      INSERT INTO circuito_componentes (
        uuid, circuito_id, componente_id, quantidade, ativo,
        created_at, updated_at, created_by, updated_by
      )
      VALUES (?, ?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'), ?, ?)
    `
    ).run(IdGenerator.generate(), circuitoId, componenteId, quantidade, usuarioId, usuarioId)
  }

  editarQuantidade(id: number, quantidade: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    db.prepare(
      `
      UPDATE circuito_componentes
      SET quantidade = ?, updated_at = datetime('now','localtime'), updated_by = ?
      WHERE id = ? AND ativo = 1
    `
    ).run(quantidade, usuarioId, id)
  }

  remover(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.prepare(
      `
      UPDATE circuito_componentes
      SET
        ativo = 0,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = datetime('now','localtime'),
        deleted_by = ?
      WHERE id = ? AND ativo = 1
    `
    ).run(usuarioId, usuarioId, id)
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.prepare(
      `
      UPDATE circuito_componentes
      SET
        ativo = 1,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = ? AND ativo = 0
    `
    ).run(usuarioId, id)
  }
}
