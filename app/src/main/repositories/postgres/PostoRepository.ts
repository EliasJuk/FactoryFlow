import { pool } from "../../database/postgres/connection"

export interface Posto {
  id: number
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
  ativo: boolean
}

export class PostoRepository {
  async listar(): Promise<Posto[]> {
    const result = await pool.query<any>(`
      SELECT
        postos.id,
        postos.nome,
        postos.subsetor_id as "subsetorId",
        subsetores.nome as "subsetorNome",
        setores.nome as "setorNome",
        postos.ativo
      FROM postos
      INNER JOIN subsetores ON subsetores.id = postos.subsetor_id
      INNER JOIN setores ON setores.id = subsetores.setor_id
      WHERE postos.ativo = true
      ORDER BY setores.nome, subsetores.nome, postos.nome
    `)

    return result.rows.map((posto) => ({
      ...posto,
      ativo: Boolean(posto.ativo)
    }))
  }

  async criar(nome: string, subsetorId: number): Promise<void> {
    const nomeFormatado = nome.trim()

    const existente = await pool.query<{ id: number; ativo: boolean }>(`
      SELECT id, ativo
      FROM postos
      WHERE nome = $1
        AND subsetor_id = $2
      LIMIT 1
    `, [nomeFormatado, subsetorId])

    if (existente.rows[0]?.ativo === true) {
      throw new Error("POSTO_DUPLICADO")
    }

    if (existente.rows[0]?.ativo === false) {
      await pool.query(`
        UPDATE postos
        SET nome = $1, subsetor_id = $2, ativo = true
        WHERE id = $3
      `, [nomeFormatado, subsetorId, existente.rows[0].id])

      return
    }

    await pool.query(`
      INSERT INTO postos (nome, subsetor_id, ativo)
      VALUES ($1, $2, true)
    `, [nomeFormatado, subsetorId])
  }

  async editar(id: number, nome: string, subsetorId: number): Promise<void> {
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number }>(`
      SELECT id
      FROM postos
      WHERE nome = $1
        AND subsetor_id = $2
        AND ativo = true
        AND id <> $3
      LIMIT 1
    `, [nomeFormatado, subsetorId, id])

    if (duplicado.rows[0]) {
      throw new Error("POSTO_DUPLICADO")
    }

    await pool.query(`
      UPDATE postos
      SET nome = $1, subsetor_id = $2
      WHERE id = $3
    `, [nomeFormatado, subsetorId, id])
  }

  async contarRoteirosAtivos(id: number): Promise<number> {
    const result = await pool.query<{ total: string }>(`
      SELECT COUNT(*) as total
      FROM circuito_posto_componentes
      WHERE posto_id = $1
        AND ativo = true
    `, [id])

    return Number(result.rows[0]?.total ?? 0)
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE postos
      SET ativo = false
      WHERE id = $1
    `, [id])
  }
}
