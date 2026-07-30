import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface Setor {
  id: number
  uuid: string
  nome: string
  sigla: string
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

type SetorRow = {
  id: number
  uuid: string
  nome: string
  sigla: string | null
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

export class SetorRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(setor: SetorRow): Setor {
    return {
      id: setor.id,
      uuid: setor.uuid,
      nome: setor.nome,
      sigla: setor.sigla ?? '',
      ativo: Boolean(setor.ativo),
      createdAt: this.mapearData(setor.created_at),
      updatedAt: this.mapearData(setor.updated_at),
      deletedAt: this.mapearData(setor.deleted_at),
      createdBy: setor.created_by,
      updatedBy: setor.updated_by,
      deletedBy: setor.deleted_by,
      createdByNome: setor.created_by_nome,
      updatedByNome: setor.updated_by_nome,
      deletedByNome: setor.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        s.id,
        s.uuid,
        s.nome,
        s.sigla,
        s.ativo,
        s.created_at,
        s.updated_at,
        s.deleted_at,
        s.created_by,
        s.updated_by,
        s.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM setores s
      LEFT JOIN usuarios criado ON criado.id = s.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = s.updated_by
      LEFT JOIN usuarios removido ON removido.id = s.deleted_by
    `
  }

  async listar(): Promise<Setor[]> {
    const result = await pool.query<SetorRow>(`
      ${this.consultaBase()}
      WHERE s.ativo = true
      ORDER BY s.nome
    `)

    return result.rows.map((setor) => this.mapear(setor))
  }

  async listarInativos(): Promise<Setor[]> {
    const result = await pool.query<SetorRow>(`
      ${this.consultaBase()}
      WHERE s.ativo = false
      ORDER BY s.nome
    `)

    return result.rows.map((setor) => this.mapear(setor))
  }

  async criar(nome: string, sigla: string, usuarioId: number): Promise<void> {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()
    const uuid = IdGenerator.generate()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM setores
        WHERE sigla = $1
        LIMIT 1
      `,
      [siglaFormatada]
    )

    if (existente.rows[0]?.ativo) {
      throw new Error('Já existe um setor ativo cadastrado com esta sigla.')
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        'Já existe um setor inativo com esta sigla. Restaure o setor inativo em vez de criar outro.'
      )
    }

    await pool.query(
      `
        INSERT INTO setores (
          uuid,
          nome,
          sigla,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
      `,
      [uuid, nomeFormatado, siglaFormatada, usuarioId]
    )
  }

  async editar(id: number, nome: string, sigla: string, usuarioId: number): Promise<void> {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM setores
        WHERE sigla = $1
          AND id <> $2
        LIMIT 1
      `,
      [siglaFormatada, id]
    )

    if (existente.rows[0]?.ativo) {
      throw new Error('Já existe outro setor ativo cadastrado com esta sigla.')
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        'Já existe um setor inativo com esta sigla. Altere a sigla ou restaure o setor inativo.'
      )
    }

    await pool.query(
      `
        UPDATE setores
        SET
          nome = $1,
          sigla = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
      `,
      [nomeFormatado, siglaFormatada, usuarioId, id]
    )
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    const vinculos = await this.contarSubsetoresAtivos(id)

    if (vinculos > 0) {
      throw new Error(
        'Há subsetores vinculados a este setor. Para inativar este setor, primeiro remova ou inative os subsetores vinculados.'
      )
    }

    await pool.query(
      `
        UPDATE setores
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
        UPDATE setores
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
    const vinculos = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM subsetores
        WHERE setor_id = $1
      `,
      [id]
    )

    if (Number(vinculos.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'Não é possível excluir permanentemente. Existem subsetores vinculados a este setor.'
      )
    }

    await pool.query(
      `
        DELETE FROM setores
        WHERE id = $1
          AND ativo = false
      `,
      [id]
    )
  }

  async contarSubsetoresAtivos(id: number): Promise<number> {
    const result = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM subsetores
        WHERE setor_id = $1
          AND ativo = true
      `,
      [id]
    )

    return Number(result.rows[0]?.total ?? 0)
  }
}
