import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface Circuito {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
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

type CircuitoRow = {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
  created_at: string | Date | null
  updated_at: string | Date | null
  deleted_at: string | Date | null
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  created_by_nome: string | null
  updated_by_nome: string | null
  deleted_by_nome: string | null
}

export class CircuitoRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(circuito: CircuitoRow): Circuito {
    return {
      id: circuito.id,
      uuid: circuito.uuid,
      codigo: circuito.codigo,
      nome: circuito.nome,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0),
      createdAt: this.mapearData(circuito.created_at),
      updatedAt: this.mapearData(circuito.updated_at),
      deletedAt: this.mapearData(circuito.deleted_at),
      createdBy: circuito.created_by,
      updatedBy: circuito.updated_by,
      deletedBy: circuito.deleted_by,
      createdByNome: circuito.created_by_nome,
      updatedByNome: circuito.updated_by_nome,
      deletedByNome: circuito.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        c.ativo,
        COUNT(cc.id)::int AS "totalComponentes",
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.created_by,
        c.updated_by,
        c.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM circuitos c
      LEFT JOIN circuito_componentes cc
        ON cc.circuito_id = c.id
       AND cc.ativo = true
      LEFT JOIN usuarios criado ON criado.id = c.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = c.updated_by
      LEFT JOIN usuarios removido ON removido.id = c.deleted_by
    `
  }

  async listar(): Promise<Circuito[]> {
    const result = await pool.query<CircuitoRow>(`
      ${this.consultaBase()}
      WHERE c.ativo = true
      GROUP BY
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        c.ativo,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.created_by,
        c.updated_by,
        c.deleted_by,
        criado.nome,
        atualizado.nome,
        removido.nome
      ORDER BY c.codigo
    `)

    return result.rows.map((circuito) => this.mapear(circuito))
  }

  async listarInativos(): Promise<Circuito[]> {
    const result = await pool.query<CircuitoRow>(`
      ${this.consultaBase()}
      WHERE c.ativo = false
      GROUP BY
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        c.ativo,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.created_by,
        c.updated_by,
        c.deleted_by,
        criado.nome,
        atualizado.nome,
        removido.nome
      ORDER BY c.codigo
    `)

    return result.rows.map((circuito) => this.mapear(circuito))
  }

  async criar(codigo: string, nome: string, usuarioId: number): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM circuitos
        WHERE codigo = $1
        LIMIT 1
      `,
      [codigoFormatado]
    )

    if (existente.rows[0]?.ativo === true) {
      throw new Error('CIRCUITO_DUPLICADO')
    }

    if (existente.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um circuito inativo com este código. Restaure o circuito em vez de criar outro.'
      )
    }

    await pool.query(
      `
        INSERT INTO circuitos (
          uuid,
          codigo,
          nome,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
      `,
      [IdGenerator.generate(), codigoFormatado, nomeFormatado, usuarioId]
    )
  }

  async editar(id: number, codigo: string, nome: string, usuarioId: number): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM circuitos
        WHERE codigo = $1
          AND id <> $2
        LIMIT 1
      `,
      [codigoFormatado, id]
    )

    if (duplicado.rows[0]?.ativo === true) {
      throw new Error('CIRCUITO_DUPLICADO')
    }

    if (duplicado.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um circuito inativo com este código. Altere o código ou restaure o circuito inativo.'
      )
    }

    await pool.query(
      `
        UPDATE circuitos
        SET
          codigo = $1,
          nome = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
      `,
      [codigoFormatado, nomeFormatado, usuarioId, id]
    )
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `
        UPDATE circuitos
        SET
          ativo = false,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = $1
        WHERE id = $2
      `,
      [usuarioId, id]
    )
  }

  async restaurar(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `
        UPDATE circuitos
        SET
          ativo = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1,
          deleted_at = NULL,
          deleted_by = NULL
        WHERE id = $2
      `,
      [usuarioId, id]
    )
  }

  async excluirPermanente(id: number): Promise<void> {
    const verificacoes = await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM circuito_componentes WHERE circuito_id = $1`,
        [id]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM circuito_posto_componentes WHERE circuito_id = $1`,
        [id]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM refugos WHERE circuito_id = $1`,
        [id]
      )
    ])

    if (verificacoes.some((resultado) => Number(resultado.rows[0]?.total ?? 0) > 0)) {
      throw new Error('CIRCUITO_EM_USO')
    }

    await pool.query(
      `
        DELETE FROM circuitos
        WHERE id = $1
          AND ativo = false
      `,
      [id]
    )
  }
}
