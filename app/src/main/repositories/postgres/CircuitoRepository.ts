import { pool } from "../../database/postgres/connection"

export interface Circuito {
  id: number
  codigo: string
  nome: string
  ativo: boolean
}

export class CircuitoRepository {
  async listar(): Promise<Circuito[]> {
    const result = await pool.query<Circuito>(`
      SELECT id, codigo, nome, ativo
      FROM circuitos
      WHERE ativo = true
      ORDER BY codigo
    `)

    return result.rows.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo)
    }))
  }

  async criar(codigo: string, nome: string): Promise<void> {
    await pool.query(`
      INSERT INTO circuitos (codigo, nome, ativo)
      VALUES ($1, $2, true)
    `, [codigo, nome])
  }

  async editar(id: number, codigo: string, nome: string): Promise<void> {
    await pool.query(`
      UPDATE circuitos
      SET codigo = $1, nome = $2
      WHERE id = $3
    `, [codigo, nome, id])
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE circuitos
      SET ativo = false
      WHERE id = $1
    `, [id])
  }
}
