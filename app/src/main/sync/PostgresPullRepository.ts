import { pool } from '../database/postgres/connection'
import type { PullCursor, SetorPullRecord, UsuarioPullRecord } from './pull.types'

export class PostgresPullRepository {
  async fetchUsuarios(cursor: PullCursor, limit: number): Promise<UsuarioPullRecord[]> {
    const result = await pool.query<UsuarioPullRecord>(
      `
      SELECT
        u.uuid,
        u.nome,
        u.matricula,
        u.perfil,
        u.senha_hash AS "senhaHash",
        u.deve_trocar_senha AS "deveTrocarSenha",
        u.ativo,
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt",
        u.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM usuarios u
      LEFT JOIN usuarios created_by ON created_by.id = u.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = u.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = u.deleted_by
      WHERE
        $1::timestamp IS NULL
        OR u.updated_at > $1::timestamp
        OR (
          u.updated_at = $1::timestamp
          AND u.uuid::text > COALESCE($2, '')
        )
      ORDER BY u.updated_at, u.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    return result.rows
  }

  async fetchSetores(cursor: PullCursor, limit: number): Promise<SetorPullRecord[]> {
    const result = await pool.query<SetorPullRecord>(
      `
      SELECT
        s.uuid,
        s.nome,
        s.sigla,
        s.ativo,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        s.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM setores s
      LEFT JOIN usuarios created_by ON created_by.id = s.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = s.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = s.deleted_by
      WHERE
        $1::timestamp IS NULL
        OR s.updated_at > $1::timestamp
        OR (
          s.updated_at = $1::timestamp
          AND s.uuid::text > COALESCE($2, '')
        )
      ORDER BY s.updated_at, s.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    return result.rows
  }
}
