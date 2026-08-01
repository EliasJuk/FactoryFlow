import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const db = getDatabase()

export interface RoteiroComponente {
  id: number
  uuid: string
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
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

export interface CircuitoPorPosto {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

type RoteiroComponenteRow = Omit<RoteiroComponente, 'ativo'> & {
  ativo: number
}

export class RoteiroRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private consultaItensBase(): string {
    return `
      SELECT
        cpc.id,
        cpc.uuid,
        cpc.circuito_id AS circuitoId,
        cpc.posto_id AS postoId,
        cpc.componente_id AS componenteId,
        comp.codigo AS codigoComponente,
        comp.nome AS nomeComponente,
        cpc.quantidade,
        cpc.ativo,
        cpc.created_at AS createdAt,
        cpc.updated_at AS updatedAt,
        cpc.deleted_at AS deletedAt,
        cpc.created_by AS createdBy,
        cpc.updated_by AS updatedBy,
        cpc.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      LEFT JOIN usuarios criado ON criado.id = cpc.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = cpc.updated_by
      LEFT JOIN usuarios removido ON removido.id = cpc.deleted_by
    `
  }

  private mapear(item: RoteiroComponenteRow): RoteiroComponente {
    return { ...item, ativo: Boolean(item.ativo) }
  }

  listarCircuitosPorPosto(postoId: number, busca = ''): CircuitoPorPosto[] {
    const termo = `%${busca}%`

    return db
      .prepare(
        `
      SELECT
        c.id AS circuitoId,
        c.codigo AS codigoCircuito,
        c.nome AS nomeCircuito,
        p.id AS postoId,
        p.nome AS postoNome,
        sub.nome AS subsetorNome,
        COUNT(cpc.id) AS totalComponentes
      FROM circuito_posto_componentes cpc
      INNER JOIN circuitos c ON c.id = cpc.circuito_id
      INNER JOIN postos p ON p.id = cpc.posto_id
      INNER JOIN subsetores sub ON sub.id = p.subsetor_id
      WHERE cpc.posto_id = ?
        AND cpc.ativo = 1
        AND (
          ? = ''
          OR c.codigo LIKE ?
          OR c.nome LIKE ?
        )
      GROUP BY c.id, c.codigo, c.nome, p.id, p.nome, sub.nome
      ORDER BY c.codigo
    `
      )
      .all(postoId, busca, termo, termo) as CircuitoPorPosto[]
  }

  listarPorCircuitoEPosto(
    circuitoId: number,
    postoId: number,
    incluirInativos = false
  ): RoteiroComponente[] {
    const itens = db
      .prepare(
        `
      ${this.consultaItensBase()}
      WHERE cpc.circuito_id = ?
        AND cpc.posto_id = ?
        AND (? = 1 OR cpc.ativo = 1)
      ORDER BY comp.codigo
    `
      )
      .all(circuitoId, postoId, incluirInativos ? 1 : 0) as RoteiroComponenteRow[]

    return itens.map((item) => this.mapear(item))
  }

  adicionar(
    circuitoId: number,
    postoId: number,
    componenteId: number,
    quantidade: number,
    usuarioId: number
  ): void {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    const existente = db
      .prepare(
        `
        SELECT id, ativo
        FROM circuito_posto_componentes
        WHERE circuito_id = ?
          AND posto_id = ?
          AND componente_id = ?
        LIMIT 1
        `
      )
      .get(circuitoId, postoId, componenteId) as { id: number; ativo: number } | undefined

    db.transaction(() => {
      if (existente) {
        const resultado = db
          .prepare(
            `
            UPDATE circuito_posto_componentes
            SET
              quantidade = ?,
              ativo = 1,
              updated_at = datetime('now','localtime'),
              updated_by = ?,
              deleted_at = NULL,
              deleted_by = NULL
            WHERE id = ?
            `
          )
          .run(quantidade, usuarioId, existente.id)

        if (resultado.changes === 0) {
          throw new Error('Roteiro não encontrado.')
        }

        this.syncQueue.enqueueRoteiro(existente.id, 'UPDATE')
        return
      }

      const resultado = db
        .prepare(
          `
          INSERT INTO circuito_posto_componentes (
            uuid,
            circuito_id,
            posto_id,
            componente_id,
            quantidade,
            ativo,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
          VALUES (
            ?, ?, ?, ?, ?, 1,
            datetime('now','localtime'),
            datetime('now','localtime'),
            ?, ?
          )
          `
        )
        .run(
          IdGenerator.generate(),
          circuitoId,
          postoId,
          componenteId,
          quantidade,
          usuarioId,
          usuarioId
        )

      this.syncQueue.enqueueRoteiro(Number(resultado.lastInsertRowid), 'CREATE')
    })()
  }

  editarQuantidade(id: number, quantidade: number, usuarioId: number): void {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE circuito_posto_componentes
          SET
            quantidade = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
            AND ativo = 1
          `
        )
        .run(quantidade, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Roteiro não encontrado ou está inativo.')
      }

      this.syncQueue.enqueueRoteiro(id, 'UPDATE')
    })()
  }

  remover(id: number, usuarioId: number): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE circuito_posto_componentes
          SET
            ativo = 0,
            updated_at = datetime('now','localtime'),
            updated_by = ?,
            deleted_at = datetime('now','localtime'),
            deleted_by = ?
          WHERE id = ?
            AND ativo = 1
          `
        )
        .run(usuarioId, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Roteiro não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueueRoteiro(id, 'DELETE')
    })()
  }

  listarTodos(): RoteiroComponente[] {
    const itens = db
      .prepare(
        `
      ${this.consultaItensBase()}
      WHERE cpc.ativo = 1
      ORDER BY comp.codigo
    `
      )
      .all() as RoteiroComponenteRow[]

    return itens.map((item) => this.mapear(item))
  }
}
