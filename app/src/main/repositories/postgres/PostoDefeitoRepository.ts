import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

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
  async listarPorPosto(postoId: number, incluirInativos = false): Promise<PostoDefeito[]> {
    const result = await pool.query<PostoDefeito>(
      `
        SELECT
          pd.id,
          pd.uuid,
          pd.posto_id AS "postoId",
          pd.defeito_id AS "defeitoId",
          d.codigo AS "codigoDefeito",
          d.descricao AS "descricaoDefeito",
          pd.ativo,
          pd.created_at AS "createdAt",
          pd.updated_at AS "updatedAt",
          pd.deleted_at AS "deletedAt",
          pd.created_by AS "createdBy",
          pd.updated_by AS "updatedBy",
          pd.deleted_by AS "deletedBy",
          uc.nome AS "createdByNome",
          uu.nome AS "updatedByNome",
          ud.nome AS "deletedByNome"
        FROM posto_defeitos pd
        INNER JOIN defeitos d ON d.id = pd.defeito_id
        LEFT JOIN usuarios uc ON uc.id = pd.created_by
        LEFT JOIN usuarios uu ON uu.id = pd.updated_by
        LEFT JOIN usuarios ud ON ud.id = pd.deleted_by
        WHERE pd.posto_id = $1
          AND ($2::boolean = true OR pd.ativo = true)
        ORDER BY pd.ativo DESC, d.codigo
      `,
      [postoId, incluirInativos]
    )

    return result.rows.map((item) => ({ ...item, ativo: Boolean(item.ativo) }))
  }

  async listarPermitidosPorPosto(postoId: number): Promise<PostoDefeito[]> {
    return this.listarPorPosto(postoId, false)
  }

  async adicionar(
    postoId: number,
    defeitoId: number,
    usuarioId: number
  ): Promise<AdicionarPostoDefeitoResultado> {
    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `SELECT id, ativo FROM posto_defeitos WHERE posto_id = $1 AND defeito_id = $2 LIMIT 1`,
      [postoId, defeitoId]
    )

    const vinculo = existente.rows[0]
    if (vinculo?.ativo) {
      return {
        sucesso: false,
        codigo: 'DEFEITO_JA_VINCULADO',
        mensagem: 'Este defeito já está vinculado ao posto.'
      }
    }

    if (vinculo) {
      await this.restaurar(vinculo.id, usuarioId)
      return { sucesso: true, mensagem: 'Defeito restaurado para o posto.' }
    }

    await pool.query(
      `
        INSERT INTO posto_defeitos (
          uuid, posto_id, defeito_id, ativo, created_by, updated_by
        ) VALUES ($1, $2, $3, true, $4, $4)
      `,
      [IdGenerator.generate(), postoId, defeitoId, usuarioId]
    )

    return { sucesso: true, mensagem: 'Defeito vinculado ao posto com sucesso.' }
  }

  async remover(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `UPDATE posto_defeitos SET ativo = false, deleted_at = NOW(), deleted_by = $1, updated_at = NOW(), updated_by = $1 WHERE id = $2`,
      [usuarioId, id]
    )
  }

  async restaurar(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `UPDATE posto_defeitos SET ativo = true, deleted_at = NULL, deleted_by = NULL, updated_at = NOW(), updated_by = $1 WHERE id = $2`,
      [usuarioId, id]
    )
  }

  async defeitosPertencemAoPosto(postoId: number, defeitoIds: number[]): Promise<boolean> {
    const ids = [...new Set(defeitoIds)]
    if (ids.length === 0) return false

    const result = await pool.query<{ total: string }>(
      `SELECT COUNT(DISTINCT defeito_id) AS total FROM posto_defeitos WHERE posto_id = $1 AND defeito_id = ANY($2::int[]) AND ativo = true`,
      [postoId, ids]
    )

    return Number(result.rows[0]?.total ?? 0) === ids.length
  }
}
