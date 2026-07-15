import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const USUARIO_SISTEMA_ID = 1

export interface Defeito {
  id: number
  uuid: string
  codigo: string
  descricao: string
  ativo: boolean
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

type DefeitoRow = {
  id: number
  uuid: string
  codigo: string
  descricao: string
  ativo: boolean
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

export class DefeitoRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(defeito: DefeitoRow): Defeito {
    return {
      id: defeito.id,
      uuid: defeito.uuid,
      codigo: defeito.codigo,
      descricao: defeito.descricao,
      ativo: Boolean(defeito.ativo),
      createdAt: this.mapearData(defeito.created_at),
      updatedAt: this.mapearData(defeito.updated_at),
      deletedAt: this.mapearData(defeito.deleted_at),
      createdBy: defeito.created_by,
      updatedBy: defeito.updated_by,
      deletedBy: defeito.deleted_by,
      createdByNome: defeito.created_by_nome,
      updatedByNome: defeito.updated_by_nome,
      deletedByNome: defeito.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        d.id,
        d.uuid,
        d.codigo,
        d.descricao,
        d.ativo,
        d.created_at,
        d.updated_at,
        d.deleted_at,
        d.created_by,
        d.updated_by,
        d.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM defeitos d
      LEFT JOIN usuarios criado ON criado.id = d.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = d.updated_by
      LEFT JOIN usuarios removido ON removido.id = d.deleted_by
    `
  }

  async listar(): Promise<Defeito[]> {
    const result = await pool.query<DefeitoRow>(`
      ${this.consultaBase()}
      WHERE d.ativo = true
      ORDER BY d.codigo
    `)

    return result.rows.map((defeito) => this.mapear(defeito))
  }

  async listarInativos(): Promise<Defeito[]> {
    const result = await pool.query<DefeitoRow>(`
      ${this.consultaBase()}
      WHERE d.ativo = false
      ORDER BY d.codigo
    `)

    return result.rows.map((defeito) => this.mapear(defeito))
  }

  async criar(
    codigo: string,
    descricao: string,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM defeitos
        WHERE codigo = $1
        LIMIT 1
      `,
      [codigoFormatado]
    )

    if (existente.rows[0]?.ativo === true) {
      throw new Error('DEFEITO_DUPLICADO')
    }

    if (existente.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um defeito inativo com este código. Restaure o defeito em vez de criar outro.'
      )
    }

    await pool.query(
      `
        INSERT INTO defeitos (
          uuid,
          codigo,
          descricao,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
      `,
      [IdGenerator.generate(), codigoFormatado, descricaoFormatada, usuarioId]
    )
  }

  async editar(
    id: number,
    codigo: string,
    descricao: string,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM defeitos
        WHERE codigo = $1
          AND id <> $2
        LIMIT 1
      `,
      [codigoFormatado, id]
    )

    if (duplicado.rows[0]?.ativo === true) {
      throw new Error('DEFEITO_DUPLICADO')
    }

    if (duplicado.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um defeito inativo com este código. Altere o código ou restaure o defeito inativo.'
      )
    }

    await pool.query(
      `
        UPDATE defeitos
        SET
          codigo = $1,
          descricao = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
      `,
      [codigoFormatado, descricaoFormatada, usuarioId, id]
    )
  }

  async excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    await pool.query(
      `
        UPDATE defeitos
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

  async restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    await pool.query(
      `
        UPDATE defeitos
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
    const emUso = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM refugo_itens
        WHERE defeito_id = $1
      `,
      [id]
    )

    if (Number(emUso.rows[0]?.total ?? 0) > 0) {
      throw new Error('DEFEITO_EM_USO')
    }

    await pool.query(
      `
        DELETE FROM defeitos
        WHERE id = $1
          AND ativo = false
      `,
      [id]
    )
  }
}
