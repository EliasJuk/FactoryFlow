import type { PoolClient } from 'pg'

import { pool } from '../../database/postgres/connection'
import type { SolicitacaoAlteracaoSenhaSyncPayload } from '../sync.types'

export class PostgresSolicitacaoSenhaSyncRepository {
  async apply(payload: SolicitacaoAlteracaoSenhaSyncPayload): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const record = payload.record
      const usuarioId = await this.requiredUserId(
        client,
        record.usuarioUuid,
        'usuário da solicitação'
      )
      const atendidoPor = await this.optionalUserId(
        client,
        record.atendidoPorUuid,
        'usuário que atendeu a solicitação'
      )
      const canceladoPor = await this.optionalUserId(
        client,
        record.canceladoPorUuid,
        'usuário que cancelou a solicitação'
      )

      await client.query(
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
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        )
        ON CONFLICT (uuid) DO UPDATE SET
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
          record.uuid,
          usuarioId,
          record.status,
          record.solicitadoEm,
          record.atendidoEm,
          record.canceladoEm,
          atendidoPor,
          canceladoPor,
          record.createdAt,
          record.updatedAt
        ]
      )

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async requiredUserId(
    client: PoolClient,
    uuid: string,
    description: string
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `
      SELECT id
      FROM usuarios
      WHERE uuid = $1
      LIMIT 1
      `,
      [uuid]
    )

    const id = result.rows[0]?.id

    if (!id) {
      throw new Error(`Dependência ausente no PostgreSQL: ${description}/${uuid}`)
    }

    return id
  }

  private async optionalUserId(
    client: PoolClient,
    uuid: string | null,
    description: string
  ): Promise<number | null> {
    if (!uuid) return null
    return this.requiredUserId(client, uuid, description)
  }
}
