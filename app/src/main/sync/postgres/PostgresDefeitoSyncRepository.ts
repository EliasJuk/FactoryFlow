import type { PoolClient } from 'pg'
import { pool } from '../../database/postgres/connection'
import type { DefeitoSyncPayload } from '../sync.types'

export class PostgresDefeitoSyncRepository {
  async apply(payload: DefeitoSyncPayload): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const r = payload.record
      const createdBy = await this.userId(client, r.createdByUuid)
      const updatedBy = await this.userId(client, r.updatedByUuid)
      const deletedBy = await this.userId(client, r.deletedByUuid)

      await client.query(
        `
        INSERT INTO defeitos (
          uuid, codigo, descricao, ativo,
          created_at, updated_at, deleted_at,
          created_by, updated_by, deleted_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (uuid) DO UPDATE SET
          codigo = EXCLUDED.codigo,
          descricao = EXCLUDED.descricao,
          ativo = EXCLUDED.ativo,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at,
          updated_by = EXCLUDED.updated_by,
          deleted_by = EXCLUDED.deleted_by
        `,
        [
          r.uuid,
          r.codigo,
          r.descricao,
          r.ativo,
          r.createdAt,
          r.updatedAt,
          r.deletedAt,
          createdBy,
          updatedBy,
          deletedBy
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

  private async userId(client: PoolClient, uuid: string | null): Promise<number | null> {
    if (!uuid) return null

    const result = await client.query<{ id: number }>(
      'SELECT id FROM usuarios WHERE uuid = $1 LIMIT 1',
      [uuid]
    )

    return result.rows[0]?.id ?? null
  }
}
