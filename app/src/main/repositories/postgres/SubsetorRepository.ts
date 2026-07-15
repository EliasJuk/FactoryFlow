import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const USUARIO_SISTEMA_ID = 1

export interface Subsetor {
  id: number
  uuid: string
  nome: string
  setorId: number
  setorNome: string
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

type SubsetorRow = {
  id: number
  uuid: string
  nome: string
  setor_id: number
  setor_nome: string
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

export class SubsetorRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(subsetor: SubsetorRow): Subsetor {
    return {
      id: subsetor.id,
      uuid: subsetor.uuid,
      nome: subsetor.nome,
      setorId: subsetor.setor_id,
      setorNome: subsetor.setor_nome,
      ativo: Boolean(subsetor.ativo),
      createdAt: this.mapearData(subsetor.created_at),
      updatedAt: this.mapearData(subsetor.updated_at),
      deletedAt: this.mapearData(subsetor.deleted_at),
      createdBy: subsetor.created_by,
      updatedBy: subsetor.updated_by,
      deletedBy: subsetor.deleted_by,
      createdByNome: subsetor.created_by_nome,
      updatedByNome: subsetor.updated_by_nome,
      deletedByNome: subsetor.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        ss.id,
        ss.uuid,
        ss.nome,
        ss.setor_id,
        s.nome AS setor_nome,
        ss.ativo,
        ss.created_at,
        ss.updated_at,
        ss.deleted_at,
        ss.created_by,
        ss.updated_by,
        ss.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM subsetores ss
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios criado ON criado.id = ss.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = ss.updated_by
      LEFT JOIN usuarios removido ON removido.id = ss.deleted_by
    `
  }

  async listar(): Promise<Subsetor[]> {
    const result = await pool.query<SubsetorRow>(`
      ${this.consultaBase()}
      WHERE ss.ativo = true
      ORDER BY s.nome, ss.nome
    `)

    return result.rows.map((subsetor) => this.mapear(subsetor))
  }

  async listarInativos(): Promise<Subsetor[]> {
    const result = await pool.query<SubsetorRow>(`
      ${this.consultaBase()}
      WHERE ss.ativo = false
      ORDER BY s.nome, ss.nome
    `)

    return result.rows.map((subsetor) => this.mapear(subsetor))
  }

  async criar(
    nome: string,
    setorId: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    const nomeFormatado = nome.trim()
    const uuid = IdGenerator.generate()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM subsetores
        WHERE nome = $1
          AND setor_id = $2
        LIMIT 1
      `,
      [nomeFormatado, setorId]
    )

    if (existente.rows[0]?.ativo) {
      throw new Error('Já existe um subsetor ativo com este nome neste setor.')
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        'Já existe um subsetor inativo com este nome neste setor. Restaure o subsetor em vez de criar outro.'
      )
    }

    await pool.query(
      `
        INSERT INTO subsetores (
          uuid,
          nome,
          setor_id,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
      `,
      [uuid, nomeFormatado, setorId, usuarioId]
    )
  }

  async editar(
    id: number,
    nome: string,
    setorId: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    const nomeFormatado = nome.trim()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM subsetores
        WHERE nome = $1
          AND setor_id = $2
          AND id <> $3
        LIMIT 1
      `,
      [nomeFormatado, setorId, id]
    )

    if (existente.rows[0]?.ativo) {
      throw new Error('Já existe outro subsetor ativo com este nome neste setor.')
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        'Já existe um subsetor inativo com este nome neste setor. Altere o nome ou restaure o subsetor inativo.'
      )
    }

    await pool.query(
      `
        UPDATE subsetores
        SET
          nome = $1,
          setor_id = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
      `,
      [nomeFormatado, setorId, usuarioId, id]
    )
  }

  async contarPostosAtivos(id: number): Promise<number> {
    const result = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM postos
        WHERE subsetor_id = $1
          AND ativo = true
      `,
      [id]
    )

    return Number(result.rows[0]?.total ?? 0)
  }

  async excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    const total = await this.contarPostosAtivos(id)

    if (total > 0) {
      throw new Error(
        'Há postos de trabalho vinculados a este subsetor. Para inativar este subsetor, primeiro remova ou inative esses postos e depois retorne aqui.'
      )
    }

    await pool.query(
      `
        UPDATE subsetores
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
        UPDATE subsetores
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
    const result = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM postos
        WHERE subsetor_id = $1
      `,
      [id]
    )

    if (Number(result.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        'Não é possível excluir permanentemente. Existem postos vinculados a este subsetor.'
      )
    }

    await pool.query(
      `
        DELETE FROM subsetores
        WHERE id = $1
          AND ativo = false
      `,
      [id]
    )
  }
}
