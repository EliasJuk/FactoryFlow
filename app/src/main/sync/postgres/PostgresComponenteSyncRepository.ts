import type { PoolClient } from 'pg'
import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import type { ComponenteSyncPayload } from '../sync.types'

export class PostgresComponenteSyncRepository {
  async apply(payload: ComponenteSyncPayload): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const r = payload.record
      const createdBy = await this.userId(client, r.createdByUuid)
      const updatedBy = await this.userId(client, r.updatedByUuid)
      const deletedBy = await this.userId(client, r.deletedByUuid)

      const componente = await client.query<{ id: number }>(
        `
        INSERT INTO componentes (
          uuid, codigo, nome, ativo,
          created_at, updated_at, deleted_at,
          created_by, updated_by, deleted_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (uuid) DO UPDATE SET
          codigo = EXCLUDED.codigo,
          nome = EXCLUDED.nome,
          ativo = EXCLUDED.ativo,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at,
          updated_by = EXCLUDED.updated_by,
          deleted_by = EXCLUDED.deleted_by
        RETURNING id
        `,
        [
          r.uuid,
          r.codigo,
          r.nome,
          r.ativo,
          r.createdAt,
          r.updatedAt,
          r.deletedAt,
          createdBy,
          updatedBy,
          deletedBy
        ]
      )

      await this.applyCurrentPrice(client, componente.rows[0].id, Number(r.precoAtual))
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async applyCurrentPrice(
    client: PoolClient,
    componenteId: number,
    value: number
  ): Promise<void> {
    const normalizedValue = Number.isFinite(value) ? value : 0

    const current = await client.query<{ id: number; valor_unitario: string | number }>(
      `
      SELECT id, valor_unitario
      FROM componentes_precos
      WHERE componente_id = $1
        AND ativo = true
        AND vigencia_fim IS NULL
      ORDER BY id DESC
      LIMIT 1
      `,
      [componenteId]
    )

    const currentPrice = current.rows[0]
    if (currentPrice && Number(currentPrice.valor_unitario) === normalizedValue) return

    if (currentPrice) {
      await client.query(
        `
        UPDATE componentes_precos
        SET ativo = false,
            vigencia_fim = CURRENT_DATE
        WHERE id = $1
        `,
        [currentPrice.id]
      )
    }

    if (normalizedValue > 0) {
      await client.query(
        `
        INSERT INTO componentes_precos (
          uuid, componente_id, valor_unitario,
          vigencia_inicio, vigencia_fim, ativo, criado_em
        )
        VALUES ($1,$2,$3,CURRENT_DATE,NULL,true,NOW())
        `,
        [IdGenerator.generate(), componenteId, normalizedValue]
      )
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
