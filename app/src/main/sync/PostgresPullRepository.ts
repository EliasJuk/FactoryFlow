import { pool } from '../database/postgres/connection'
import type {
  CircuitoPullRecord,
  ComponentePullRecord,
  DefeitoPullRecord,
  PostoPullRecord,
  PullCursor,
  SetorPullRecord,
  SubsetorPullRecord,
  UsuarioPullRecord
} from './pull.types'

export class PostgresPullRepository {
  async fetchUsuarios(cursor: PullCursor, limit: number): Promise<UsuarioPullRecord[]> {
    const result = await pool.query<UsuarioPullRecord>(
      `
      SELECT
        u.uuid, u.nome, u.matricula, u.perfil,
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
      ${this.cursorWhere('u')}
      ORDER BY u.updated_at, u.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchSetores(cursor: PullCursor, limit: number): Promise<SetorPullRecord[]> {
    const result = await pool.query<SetorPullRecord>(
      `
      SELECT s.uuid, s.nome, s.sigla, s.ativo,
        s.created_at AS "createdAt", s.updated_at AS "updatedAt",
        s.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM setores s
      LEFT JOIN usuarios created_by ON created_by.id = s.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = s.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = s.deleted_by
      ${this.cursorWhere('s')}
      ORDER BY s.updated_at, s.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchSubsetores(cursor: PullCursor, limit: number): Promise<SubsetorPullRecord[]> {
    const result = await pool.query<SubsetorPullRecord>(
      `
      SELECT ss.uuid, ss.nome, setor.uuid AS "setorUuid", ss.ativo,
        ss.created_at AS "createdAt", ss.updated_at AS "updatedAt",
        ss.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM subsetores ss
      INNER JOIN setores setor ON setor.id = ss.setor_id
      LEFT JOIN usuarios created_by ON created_by.id = ss.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = ss.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = ss.deleted_by
      ${this.cursorWhere('ss')}
      ORDER BY ss.updated_at, ss.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchPostos(cursor: PullCursor, limit: number): Promise<PostoPullRecord[]> {
    const result = await pool.query<PostoPullRecord>(
      `
      SELECT p.uuid, p.nome, subsetor.uuid AS "subsetorUuid", p.ativo,
        p.created_at AS "createdAt", p.updated_at AS "updatedAt",
        p.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM postos p
      INNER JOIN subsetores subsetor ON subsetor.id = p.subsetor_id
      LEFT JOIN usuarios created_by ON created_by.id = p.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = p.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = p.deleted_by
      ${this.cursorWhere('p')}
      ORDER BY p.updated_at, p.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchComponentes(cursor: PullCursor, limit: number): Promise<ComponentePullRecord[]> {
    const result = await pool.query<ComponentePullRecord>(
      `
      SELECT c.uuid, c.codigo, c.nome,
        COALESCE((SELECT cp.valor_unitario FROM componentes_precos cp
          WHERE cp.componente_id = c.id ORDER BY cp.id DESC LIMIT 1), 0) AS "precoAtual",
        c.ativo, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        c.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM componentes c
      LEFT JOIN usuarios created_by ON created_by.id = c.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = c.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = c.deleted_by
      ${this.cursorWhere('c')}
      ORDER BY c.updated_at, c.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows).map((row) => ({
      ...row,
      precoAtual: Number(row.precoAtual ?? 0)
    }))
  }

  async fetchCircuitos(cursor: PullCursor, limit: number): Promise<CircuitoPullRecord[]> {
    const result = await pool.query<CircuitoPullRecord>(
      `
      SELECT c.uuid, c.codigo, c.nome, c.ativo,
        c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        c.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM circuitos c
      LEFT JOIN usuarios created_by ON created_by.id = c.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = c.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = c.deleted_by
      ${this.cursorWhere('c')}
      ORDER BY c.updated_at, c.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchDefeitos(cursor: PullCursor, limit: number): Promise<DefeitoPullRecord[]> {
    const result = await pool.query<DefeitoPullRecord>(
      `
      SELECT d.uuid, d.codigo, d.descricao, d.ativo,
        d.created_at AS "createdAt", d.updated_at AS "updatedAt",
        d.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM defeitos d
      LEFT JOIN usuarios created_by ON created_by.id = d.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = d.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = d.deleted_by
      ${this.cursorWhere('d')}
      ORDER BY d.updated_at, d.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  private cursorWhere(alias: string): string {
    return `WHERE $1::timestamp IS NULL OR ${alias}.updated_at > $1::timestamp OR (${alias}.updated_at = $1::timestamp AND ${alias}.uuid::text > COALESCE($2, ''))`
  }

  private normalizeRows<T extends { createdAt: unknown; updatedAt: unknown; deletedAt: unknown }>(
    rows: T[]
  ): Array<
    Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }
  > {
    return rows.map((row) => ({
      ...row,
      createdAt: this.normalizeDate(row.createdAt),
      updatedAt: this.normalizeDate(row.updatedAt),
      deletedAt: this.normalizeNullableDate(row.deletedAt)
    }))
  }

  private normalizeDate(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') return value
    throw new Error('Data inválida recebida do PostgreSQL.')
  }

  private normalizeNullableDate(value: unknown): string | null {
    if (value === null || value === undefined) return null
    return this.normalizeDate(value)
  }
}
