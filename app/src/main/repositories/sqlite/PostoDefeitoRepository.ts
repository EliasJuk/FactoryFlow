import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export type AdicionarPostoDefeitoResultado =
  | { sucesso: true; mensagem: string }
  | { sucesso: false; codigo: 'DEFEITO_JA_VINCULADO'; mensagem: string }

export interface PostoDefeito {
  id: number
  uuid: string
  postoId: number
  defeitoId: number
  codigoDefeito: string
  descricaoDefeito: string
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

export class PostoDefeitoRepository {
  private readonly syncQueue = new SyncQueueRepository()

  listarPorPosto(postoId: number, incluirInativos = false): PostoDefeito[] {
    const itens = db
      .prepare(
        `
      SELECT
        pd.id,
        pd.uuid,
        pd.posto_id AS postoId,
        pd.defeito_id AS defeitoId,
        d.codigo AS codigoDefeito,
        d.descricao AS descricaoDefeito,
        pd.ativo,
        pd.created_at AS createdAt,
        pd.updated_at AS updatedAt,
        pd.deleted_at AS deletedAt,
        pd.created_by AS createdBy,
        pd.updated_by AS updatedBy,
        pd.deleted_by AS deletedBy,
        uc.nome AS createdByNome,
        uu.nome AS updatedByNome,
        ud.nome AS deletedByNome
      FROM posto_defeitos pd
      INNER JOIN defeitos d ON d.id = pd.defeito_id
      LEFT JOIN usuarios uc ON uc.id = pd.created_by
      LEFT JOIN usuarios uu ON uu.id = pd.updated_by
      LEFT JOIN usuarios ud ON ud.id = pd.deleted_by
      WHERE pd.posto_id = ?
        AND (? = 1 OR pd.ativo = 1)
      ORDER BY pd.ativo DESC, d.codigo
    `
      )
      .all(postoId, incluirInativos ? 1 : 0) as Array<
      Omit<PostoDefeito, 'ativo'> & { ativo: number }
    >

    return itens.map((item) => ({ ...item, ativo: Boolean(item.ativo) }))
  }

  listarPermitidosPorPosto(postoId: number): PostoDefeito[] {
    return this.listarPorPosto(postoId, false)
  }

  adicionar(
    postoId: number,
    defeitoId: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): AdicionarPostoDefeitoResultado {
    const existente = db
      .prepare(`SELECT id, ativo FROM posto_defeitos WHERE posto_id = ? AND defeito_id = ? LIMIT 1`)
      .get(postoId, defeitoId) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      return {
        sucesso: false,
        codigo: 'DEFEITO_JA_VINCULADO',
        mensagem: 'Este defeito já está vinculado ao posto.'
      }
    }

    if (existente) {
      this.restaurar(existente.id, usuarioId)
      return { sucesso: true, mensagem: 'Defeito restaurado para o posto.' }
    }

    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          INSERT INTO posto_defeitos (
            uuid,
            posto_id,
            defeito_id,
            ativo,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
          VALUES (
            ?,
            ?,
            ?,
            1,
            datetime('now','localtime'),
            datetime('now','localtime'),
            ?,
            ?
          )
        `
        )
        .run(IdGenerator.generate(), postoId, defeitoId, usuarioId, usuarioId)

      const postoDefeitoId = Number(resultado.lastInsertRowid)

      this.syncQueue.enqueuePostoDefeito(postoDefeitoId, 'CREATE')
    })()

    return { sucesso: true, mensagem: 'Defeito vinculado ao posto com sucesso.' }
  }

  remover(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE posto_defeitos
          SET
            ativo = 0,
            deleted_at = datetime('now','localtime'),
            deleted_by = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
            AND ativo = 1
        `
        )
        .run(usuarioId, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Vínculo não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueuePostoDefeito(id, 'DELETE')
    })()
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE posto_defeitos
          SET
            ativo = 1,
            deleted_at = NULL,
            deleted_by = NULL,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
            AND ativo = 0
        `
        )
        .run(usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Vínculo não encontrado ou já está ativo.')
      }

      this.syncQueue.enqueuePostoDefeito(id, 'UPDATE')
    })()
  }

  defeitosPertencemAoPosto(postoId: number, defeitoIds: number[]): boolean {
    const ids = [...new Set(defeitoIds)]
    if (ids.length === 0) return false
    const placeholders = ids.map(() => '?').join(', ')
    const result = db
      .prepare(
        `
      SELECT COUNT(DISTINCT defeito_id) AS total
      FROM posto_defeitos
      WHERE posto_id = ? AND defeito_id IN (${placeholders}) AND ativo = 1
    `
      )
      .get(postoId, ...ids) as { total: number }
    return Number(result.total) === ids.length
  }
}
