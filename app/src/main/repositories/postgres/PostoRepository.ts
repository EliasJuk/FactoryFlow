import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface Posto {
  id: number
  uuid: string
  nome: string
  subsetorId: number
  subsetorNome: string
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

type PostoRow = {
  id: number
  uuid: string
  nome: string
  subsetor_id: number
  subsetor_nome: string
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

export class PostoRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(posto: PostoRow): Posto {
    return {
      id: posto.id,
      uuid: posto.uuid,
      nome: posto.nome,
      subsetorId: posto.subsetor_id,
      subsetorNome: posto.subsetor_nome,
      setorNome: posto.setor_nome,
      ativo: Boolean(posto.ativo),
      createdAt: this.mapearData(posto.created_at),
      updatedAt: this.mapearData(posto.updated_at),
      deletedAt: this.mapearData(posto.deleted_at),
      createdBy: posto.created_by,
      updatedBy: posto.updated_by,
      deletedBy: posto.deleted_by,
      createdByNome: posto.created_by_nome,
      updatedByNome: posto.updated_by_nome,
      deletedByNome: posto.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        p.id,
        p.uuid,
        p.nome,
        p.subsetor_id,
        ss.nome AS subsetor_nome,
        s.nome AS setor_nome,
        p.ativo,
        p.created_at,
        p.updated_at,
        p.deleted_at,
        p.created_by,
        p.updated_by,
        p.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM postos p
      INNER JOIN subsetores ss ON ss.id = p.subsetor_id
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios criado ON criado.id = p.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = p.updated_by
      LEFT JOIN usuarios removido ON removido.id = p.deleted_by
    `
  }

  async listar(): Promise<Posto[]> {
    const result = await pool.query<PostoRow>(`
      ${this.consultaBase()}
      WHERE p.ativo = true
      ORDER BY s.nome, ss.nome, p.nome
    `)

    return result.rows.map((posto) => this.mapear(posto))
  }

  async listarInativos(): Promise<Posto[]> {
    const result = await pool.query<PostoRow>(`
      ${this.consultaBase()}
      WHERE p.ativo = false
      ORDER BY s.nome, ss.nome, p.nome
    `)

    return result.rows.map((posto) => this.mapear(posto))
  }

  async criar(nome: string, subsetorId: number, usuarioId: number): Promise<void> {
    const nomeFormatado = nome.trim()
    const uuid = IdGenerator.generate()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM postos
        WHERE nome = $1
          AND subsetor_id = $2
        LIMIT 1
      `,
      [nomeFormatado, subsetorId]
    )

    if (existente.rows[0]?.ativo === true) {
      throw new Error('POSTO_DUPLICADO')
    }

    if (existente.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um posto inativo com esse nome neste subsetor. Restaure o posto em vez de criar outro.'
      )
    }

    await pool.query(
      `
        INSERT INTO postos (
          uuid,
          nome,
          subsetor_id,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
      `,
      [uuid, nomeFormatado, subsetorId, usuarioId]
    )
  }

  async editar(id: number, nome: string, subsetorId: number, usuarioId: number): Promise<void> {
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM postos
        WHERE nome = $1
          AND subsetor_id = $2
          AND id <> $3
        LIMIT 1
      `,
      [nomeFormatado, subsetorId, id]
    )

    if (duplicado.rows[0]?.ativo === true) {
      throw new Error('POSTO_DUPLICADO')
    }

    if (duplicado.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um posto inativo com esse nome neste subsetor. Altere o nome ou restaure o posto inativo.'
      )
    }

    await pool.query(
      `
        UPDATE postos
        SET
          nome = $1,
          subsetor_id = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
      `,
      [nomeFormatado, subsetorId, usuarioId, id]
    )
  }

  async contarRoteirosAtivos(id: number): Promise<number> {
    const result = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM circuito_posto_componentes
        WHERE posto_id = $1
          AND ativo = true
      `,
      [id]
    )

    return Number(result.rows[0]?.total ?? 0)
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    const total = await this.contarRoteirosAtivos(id)

    if (total > 0) {
      throw new Error('POSTO_COM_VINCULOS')
    }

    await pool.query(
      `
        UPDATE postos
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
        UPDATE postos
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
        FROM circuito_posto_componentes
        WHERE posto_id = $1
      `,
      [id]
    )

    if (Number(result.rows[0]?.total ?? 0) > 0) {
      throw new Error('POSTO_COM_VINCULOS')
    }

    await pool.query(
      `
        DELETE FROM postos
        WHERE id = $1
          AND ativo = false
      `,
      [id]
    )
  }
}
