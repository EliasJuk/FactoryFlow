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
  async listar(): Promise<Setor[]> {
    const result = await pool.query<SetorRow>(`
      SELECT id, nome, sigla, ativo
      FROM setores
      WHERE ativo = true
      ORDER BY nome
    `)

    return result.rows.map((setor) => ({
      ...setor,
      sigla: setor.sigla ?? "",
      ativo: Boolean(setor.ativo)
    }))
  }

  async criar(nome: string, sigla: string): Promise<void> {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = await pool.query<{ id: number; ativo: boolean }>(`
      SELECT id, ativo
      FROM setores
      WHERE sigla = $1
      LIMIT 1
    `, [siglaFormatada])

    if (existente.rows[0]) {
      await pool.query(`
        UPDATE setores
        SET nome = $1, sigla = $2, ativo = true
        WHERE id = $3
      `, [nomeFormatado, siglaFormatada, existente.rows[0].id])

      return
    }

    await pool.query(`
      INSERT INTO setores (nome, sigla, ativo)
      VALUES ($1, $2, true)
    `, [nomeFormatado, siglaFormatada])
  }

  async editar(id: number, nome: string, sigla: string): Promise<void> {
    await pool.query(`
      UPDATE setores
      SET nome = $1, sigla = $2
      WHERE id = $3
    `, [nome.trim(), sigla.trim().toUpperCase(), id])
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE setores
      SET ativo = false
      WHERE id = $1
    `, [id])
  }

  async contarSubsetoresAtivos(id: number): Promise<number> {
    const result = await pool.query<{ total: string }>(`
      SELECT COUNT(*) as total
      FROM subsetores
      WHERE setor_id = $1
        AND ativo = true
    `, [id])

    return Number(result.rows[0]?.total ?? 0)
  }
}
