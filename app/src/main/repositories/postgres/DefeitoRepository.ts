import { pool } from "../../database/postgres/connection"

export interface Defeito {
  id: number
  codigo: string
  descricao: string
  ativo: boolean
}

export class DefeitoRepository {
  async listar(): Promise<Defeito[]> {
    const result = await pool.query<Defeito>(`
      SELECT id, codigo, descricao, ativo
      FROM defeitos
      WHERE ativo = true
      ORDER BY codigo
    `)

    return result.rows.map((defeito) => ({
      ...defeito,
      ativo: Boolean(defeito.ativo)
    }))
  }

  async listarInativos(): Promise<Defeito[]> {
    const result = await pool.query<Defeito>(`
      SELECT id, codigo, descricao, ativo
      FROM defeitos
      WHERE ativo = false
      ORDER BY codigo
    `)

    return result.rows.map((defeito) => ({
      ...defeito,
      ativo: Boolean(defeito.ativo)
    }))
  }

  async criar(codigo: string, descricao: string): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = await pool.query<{ id: number }>(`
      SELECT id
      FROM defeitos
      WHERE codigo = $1
        AND ativo = true
      LIMIT 1
    `, [codigoFormatado])

    if (duplicado.rows[0]) {
      throw new Error("DEFEITO_DUPLICADO")
    }

    await pool.query(`
      INSERT INTO defeitos (codigo, descricao, ativo)
      VALUES ($1, $2, true)
    `, [codigoFormatado, descricaoFormatada])
  }

  async editar(id: number, codigo: string, descricao: string): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = await pool.query<{ id: number }>(`
      SELECT id
      FROM defeitos
      WHERE codigo = $1
        AND ativo = true
        AND id <> $2
      LIMIT 1
    `, [codigoFormatado, id])

    if (duplicado.rows[0]) {
      throw new Error("DEFEITO_DUPLICADO")
    }

    await pool.query(`
      UPDATE defeitos
      SET codigo = $1, descricao = $2
      WHERE id = $3
    `, [codigoFormatado, descricaoFormatada, id])
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE defeitos
      SET ativo = false
      WHERE id = $1
    `, [id])
  }

  async restaurar(id: number): Promise<void> {
    await pool.query(`
      UPDATE defeitos
      SET ativo = true
      WHERE id = $1
    `, [id])
  }

  async excluirPermanente(id: number): Promise<void> {
    await pool.query(`
      DELETE FROM defeitos
      WHERE id = $1
        AND ativo = false
    `, [id])
  }
}
