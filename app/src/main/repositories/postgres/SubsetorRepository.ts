import { pool } from "../../database/postgres/connection"

export interface Subsetor {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

export class SubsetorRepository {
  async listar(): Promise<Subsetor[]> {
    const resultado = await pool.query<{
      id: number
      nome: string
      setorid: number
      setornome: string
      ativo: boolean
    }>(`
      SELECT 
        subsetores.id,
        subsetores.nome,
        subsetores.setor_id AS "setorid",
        setores.nome AS "setornome",
        subsetores.ativo
      FROM subsetores
      INNER JOIN setores ON setores.id = subsetores.setor_id
      WHERE subsetores.ativo = true
      ORDER BY setores.nome, subsetores.nome
    `)

    return resultado.rows.map((subsetor) => ({
      id: subsetor.id,
      nome: subsetor.nome,
      setorId: subsetor.setorid,
      setorNome: subsetor.setornome,
      ativo: Boolean(subsetor.ativo)
    }))
  }

  async criar(nome: string, setorId: number): Promise<void> {
    const nomeFormatado = nome.trim()

    const existente = await pool.query<{
      id: number
      ativo: boolean
    }>(
      `
        SELECT id, ativo
        FROM subsetores
        WHERE nome = $1
          AND setor_id = $2
      `,
      [nomeFormatado, setorId]
    )

    if (existente.rows.length > 0) {
      await pool.query(
        `
          UPDATE subsetores
          SET nome = $1,
              setor_id = $2,
              ativo = true
          WHERE id = $3
        `,
        [nomeFormatado, setorId, existente.rows[0].id]
      )

      return
    }

    await pool.query(
      `
        INSERT INTO subsetores (nome, setor_id, ativo)
        VALUES ($1, $2, true)
      `,
      [nomeFormatado, setorId]
    )
  }

  async editar(id: number, nome: string, setorId: number): Promise<void> {
    await pool.query(
      `
        UPDATE subsetores
        SET nome = $1,
            setor_id = $2
        WHERE id = $3
      `,
      [nome.trim(), setorId, id]
    )
  }

  async contarPostosAtivos(id: number): Promise<number> {
    const resultado = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM postos
        WHERE subsetor_id = $1
          AND ativo = true
      `,
      [id]
    )

    return Number(resultado.rows[0]?.total ?? 0)
  }

  async excluir(id: number): Promise<void> {
    const total = await this.contarPostosAtivos(id)

    if (total > 0) {
      throw new Error(
        "Há postos de trabalho vinculados a este subsetor. Para inativar este subsetor, primeiro remova ou inative esses postos e depois retorne aqui."
      )
    }

    await pool.query(
      `
        UPDATE subsetores
        SET ativo = false
        WHERE id = $1
      `,
      [id]
    )
  }
}