import { pool } from "../../database/postgres/connection"

export interface Setor {
  id: number
  nome: string
  sigla: string
  ativo: boolean
}

type SetorRow = {
  id: number
  nome: string
  sigla: string | null
  ativo: boolean
}

export class SetorRepository {
  private mapear(setor: SetorRow): Setor {
    return {
      id: setor.id,
      nome: setor.nome,
      sigla: setor.sigla ?? "",
      ativo: Boolean(setor.ativo)
    }
  }

  async listar(): Promise<Setor[]> {
    const result = await pool.query<SetorRow>(`
      SELECT id, nome, sigla, ativo
      FROM setores
      WHERE ativo = true
      ORDER BY nome
    `)

    return result.rows.map((setor) => this.mapear(setor))
  }

  async listarInativos(): Promise<Setor[]> {
    const result = await pool.query<SetorRow>(`
      SELECT id, nome, sigla, ativo
      FROM setores
      WHERE ativo = false
      ORDER BY nome
    `)

    return result.rows.map((setor) => this.mapear(setor))
  }

  async criar(nome: string, sigla: string): Promise<void> {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

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
      throw new Error("Já existe um setor ativo cadastrado com esta sigla.")
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        "Já existe um setor inativo com esta sigla. Restaure o setor inativo em vez de criar outro."
      )
    }

    await pool.query(
      `
        INSERT INTO setores (nome, sigla, ativo)
        VALUES ($1, $2, true)
      `,
      [nomeFormatado, siglaFormatada]
    )
  }

  async editar(id: number, nome: string, sigla: string): Promise<void> {
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
      throw new Error("Já existe outro setor ativo cadastrado com esta sigla.")
    }

    if (existente.rows[0] && !existente.rows[0].ativo) {
      throw new Error(
        "Já existe um setor inativo com esta sigla. Altere a sigla ou restaure o setor inativo."
      )
    }

    await pool.query(
      `
        UPDATE setores
        SET nome = $1, sigla = $2
        WHERE id = $3
      `,
      [nomeFormatado, siglaFormatada, id]
    )
  }

  async excluir(id: number): Promise<void> {
    const vinculos = await this.contarSubsetoresAtivos(id)

    if (vinculos > 0) {
      throw new Error(
        "Há subsetores vinculados a este setor. Para inativar este setor, primeiro remova ou inative os subsetores vinculados."
      )
    }

    await pool.query(
      `
        UPDATE setores
        SET ativo = false
        WHERE id = $1
      `,
      [id]
    )
  }

  async restaurar(id: number): Promise<void> {
    await pool.query(
      `
        UPDATE setores
        SET ativo = true
        WHERE id = $1
      `,
      [id]
    )
  }

  async excluirPermanente(id: number): Promise<void> {
    const vinculos = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) as total
        FROM subsetores
        WHERE setor_id = $1
      `,
      [id]
    )

    if (Number(vinculos.rows[0]?.total ?? 0) > 0) {
      throw new Error(
        "Não é possível excluir permanentemente. Existem subsetores vinculados a este setor."
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
        SELECT COUNT(*) as total
        FROM subsetores
        WHERE setor_id = $1
          AND ativo = true
      `,
      [id]
    )

    return Number(result.rows[0]?.total ?? 0)
  }
}