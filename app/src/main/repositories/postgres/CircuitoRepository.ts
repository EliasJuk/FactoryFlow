import { pool } from "../../database/postgres/connection"

export interface Circuito {
  id: number
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
}

export class CircuitoRepository {
  async listar(): Promise<Circuito[]> {
    const result = await pool.query<any>(`
      SELECT
        c.id,
        c.codigo,
        c.nome,
        c.ativo,
        COUNT(cc.id)::int as "totalComponentes"
      FROM circuitos c
      LEFT JOIN circuito_componentes cc
        ON cc.circuito_id = c.id
       AND cc.ativo = true
      WHERE c.ativo = true
      GROUP BY c.id, c.codigo, c.nome, c.ativo
      ORDER BY c.codigo
    `)

    return result.rows.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0)
    }))
  }

  async listarInativos(): Promise<Circuito[]> {
    const result = await pool.query<any>(`
      SELECT
        c.id,
        c.codigo,
        c.nome,
        c.ativo,
        COUNT(cc.id)::int as "totalComponentes"
      FROM circuitos c
      LEFT JOIN circuito_componentes cc
        ON cc.circuito_id = c.id
       AND cc.ativo = true
      WHERE c.ativo = false
      GROUP BY c.id, c.codigo, c.nome, c.ativo
      ORDER BY c.codigo
    `)

    return result.rows.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0)
    }))
  }

  async criar(codigo: string, nome: string): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM circuitos
        WHERE codigo = $1
          AND ativo = true
        LIMIT 1
      `,
      [codigoFormatado]
    )

    if (duplicado.rows[0]) {
      throw new Error("CIRCUITO_DUPLICADO")
    }

    await pool.query(
      `
        INSERT INTO circuitos (codigo, nome, ativo)
        VALUES ($1, $2, true)
      `,
      [codigoFormatado, nomeFormatado]
    )
  }

  async editar(id: number, codigo: string, nome: string): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM circuitos
        WHERE codigo = $1
          AND ativo = true
          AND id <> $2
        LIMIT 1
      `,
      [codigoFormatado, id]
    )

    if (duplicado.rows[0]) {
      throw new Error("CIRCUITO_DUPLICADO")
    }

    await pool.query(
      `
        UPDATE circuitos
        SET codigo = $1, nome = $2
        WHERE id = $3
      `,
      [codigoFormatado, nomeFormatado, id]
    )
  }

  async excluir(id: number): Promise<void> {
    await pool.query(
      `
        UPDATE circuitos
        SET ativo = false
        WHERE id = $1
      `,
      [id]
    )
  }

  async restaurar(id: number): Promise<void> {
    await pool.query(
      `
        UPDATE circuitos
        SET ativo = true
        WHERE id = $1
      `,
      [id]
    )
  }

  async excluirPermanente(id: number): Promise<void> {
    const componentes = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) as total
        FROM circuito_componentes
        WHERE circuito_id = $1
      `,
      [id]
    )

    if (Number(componentes.rows[0]?.total ?? 0) > 0) {
      throw new Error("CIRCUITO_COM_COMPONENTES")
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