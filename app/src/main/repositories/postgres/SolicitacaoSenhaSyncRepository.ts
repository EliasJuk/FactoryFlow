import type { Pool, PoolClient } from "pg"

export interface SolicitacaoSenhaSync {
  id: number
  uuid: string
  usuario_id: number
  status: string
  solicitado_em: string
  atendido_em: string | null
  cancelado_em: string | null
  atendido_por: number | null
  cancelado_por: number | null
  created_at: string
  updated_at: string
}

export class PostgresSolicitacaoSenhaSyncRepository {
  constructor(
    private readonly pool: Pool
  ) {}

  async buscarAlteracoesDesde(
    data: string | null
  ): Promise<SolicitacaoSenhaSync[]> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        uuid,
        usuario_id,
        status,
        solicitado_em,
        atendido_em,
        cancelado_em,
        atendido_por,
        cancelado_por,
        created_at,
        updated_at
      FROM solicitacoes_alteracao_senha
      WHERE ($1::timestamp IS NULL OR updated_at > $1)
      ORDER BY updated_at ASC
      `,
      [data]
    )

    return result.rows
  }


  async buscarPorUuid(
    uuid: string
  ): Promise<SolicitacaoSenhaSync | null> {

    const result = await this.pool.query(
      `
      SELECT
        id,
        uuid,
        usuario_id,
        status,
        solicitado_em,
        atendido_em,
        cancelado_em,
        atendido_por,
        cancelado_por,
        created_at,
        updated_at
      FROM solicitacoes_alteracao_senha
      WHERE uuid = $1
      LIMIT 1
      `,
      [uuid]
    )

    return result.rows[0] ?? null
  }


  async inserirOuAtualizar(
    solicitacao: SolicitacaoSenhaSync,
    client?: PoolClient
  ): Promise<void> {

    const executor = client ?? this.pool

    await executor.query(
      `
      INSERT INTO solicitacoes_alteracao_senha (
        uuid,
        usuario_id,
        status,
        solicitado_em,
        atendido_em,
        cancelado_em,
        atendido_por,
        cancelado_por,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      ON CONFLICT (uuid)
      DO UPDATE SET

        usuario_id = EXCLUDED.usuario_id,
        status = EXCLUDED.status,
        solicitado_em = EXCLUDED.solicitado_em,
        atendido_em = EXCLUDED.atendido_em,
        cancelado_em = EXCLUDED.cancelado_em,
        atendido_por = EXCLUDED.atendido_por,
        cancelado_por = EXCLUDED.cancelado_por,
        updated_at = EXCLUDED.updated_at
      `,
      [
        solicitacao.uuid,
        solicitacao.usuario_id,
        solicitacao.status,
        solicitacao.solicitado_em,
        solicitacao.atendido_em,
        solicitacao.cancelado_em,
        solicitacao.atendido_por,
        solicitacao.cancelado_por,
        solicitacao.created_at,
        solicitacao.updated_at
      ]
    )
  }


  async existe(
    uuid: string
  ): Promise<boolean> {

    const result = await this.pool.query(
      `
      SELECT 1
      FROM solicitacoes_alteracao_senha
      WHERE uuid = $1
      LIMIT 1
      `,
      [uuid]
    )

    return result.rowCount !== 0
  }
}