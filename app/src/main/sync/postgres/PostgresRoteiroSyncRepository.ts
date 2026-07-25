import type { PoolClient } from 'pg'
import { pool } from '../../database/postgres/connection'
import type { RoteiroSyncPayload } from '../sync.types'

export class PostgresRoteiroSyncRepository {
  async apply(payload: RoteiroSyncPayload): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const record = payload.record
      const circuitoId = await this.requiredId(client, 'circuitos', record.circuitoUuid)
      const postoId = await this.requiredId(client, 'postos', record.postoUuid)
      const componenteId = await this.requiredId(client, 'componentes', record.componenteUuid)
      const createdBy = await this.userId(client, record.createdByUuid)
      const updatedBy = await this.userId(client, record.updatedByUuid)
      const deletedBy = await this.userId(client, record.deletedByUuid)

      await client.query(
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
          deleted_at,
          created_by,
          updated_by,
          deleted_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (uuid) DO UPDATE SET
          circuito_id = EXCLUDED.circuito_id,
          posto_id = EXCLUDED.posto_id,
          componente_id = EXCLUDED.componente_id,
          quantidade = EXCLUDED.quantidade,
          ativo = EXCLUDED.ativo,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at,
          updated_by = EXCLUDED.updated_by,
          deleted_by = EXCLUDED.deleted_by
        `,
        [
          record.uuid,
          circuitoId,
          postoId,
          componenteId,
          record.quantidade,
          record.ativo,
          record.createdAt,
          record.updatedAt,
          record.deletedAt,
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

  private async requiredId(
    client: PoolClient,
    table: 'circuitos' | 'postos' | 'componentes',
    uuid: string
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `SELECT id FROM ${table} WHERE uuid = $1 LIMIT 1`,
      [uuid]
    )

    const id = result.rows[0]?.id
    if (!id) {
      throw new Error(`Dependência ausente no PostgreSQL: ${table}/${uuid}`)
    }

    return id
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
