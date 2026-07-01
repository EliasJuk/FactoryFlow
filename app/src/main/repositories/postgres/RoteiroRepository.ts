import { pool } from "../../database/postgres/connection"

export interface RoteiroComponente {
  id: number
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

export interface CircuitoPorPosto {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

export class RoteiroRepository {
  async listarCircuitosPorPosto(postoId: number, busca = ""): Promise<CircuitoPorPosto[]> {
    const termo = `%${busca}%`

    const result = await pool.query<any>(`
      SELECT
        c.id as "circuitoId",
        c.codigo as "codigoCircuito",
        c.nome as "nomeCircuito",
        p.id as "postoId",
        p.nome as "postoNome",
        sub.nome as "subsetorNome",
        COUNT(cpc.id)::int as "totalComponentes"
      FROM circuito_posto_componentes cpc
      INNER JOIN circuitos c ON c.id = cpc.circuito_id
      INNER JOIN postos p ON p.id = cpc.posto_id
      INNER JOIN subsetores sub ON sub.id = p.subsetor_id
      WHERE cpc.posto_id = $1
        AND cpc.ativo = true
        AND (
          $2 = ''
          OR c.codigo ILIKE $3
          OR c.nome ILIKE $4
        )
      GROUP BY c.id, c.codigo, c.nome, p.id, p.nome, sub.nome
      ORDER BY c.codigo
    `, [postoId, busca, termo, termo])

    return result.rows
  }

  async listarPorCircuitoEPosto(
    circuitoId: number,
    postoId: number
  ): Promise<RoteiroComponente[]> {
    const result = await pool.query<any>(`
      SELECT
        cpc.id,
        cpc.circuito_id as "circuitoId",
        cpc.posto_id as "postoId",
        cpc.componente_id as "componenteId",
        comp.codigo as "codigoComponente",
        comp.nome as "nomeComponente",
        cpc.quantidade,
        cpc.ativo
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      WHERE cpc.circuito_id = $1
        AND cpc.posto_id = $2
        AND cpc.ativo = true
      ORDER BY comp.codigo
    `, [circuitoId, postoId])

    return result.rows.map((item) => ({
      ...item,
      ativo: Boolean(item.ativo)
    }))
  }

  async adicionar(
    circuitoId: number,
    postoId: number,
    componenteId: number,
    quantidade: number
  ): Promise<void> {
    const existente = await pool.query<{ id: number }>(`
      SELECT id
      FROM circuito_posto_componentes
      WHERE circuito_id = $1
        AND posto_id = $2
        AND componente_id = $3
      LIMIT 1
    `, [circuitoId, postoId, componenteId])

    if (existente.rows[0]) {
      await pool.query(`
        UPDATE circuito_posto_componentes
        SET quantidade = $1, ativo = true
        WHERE id = $2
      `, [quantidade, existente.rows[0].id])

      return
    }

    await pool.query(`
      INSERT INTO circuito_posto_componentes (
        circuito_id,
        posto_id,
        componente_id,
        quantidade,
        ativo
      ) VALUES ($1, $2, $3, $4, true)
    `, [circuitoId, postoId, componenteId, quantidade])
  }

  async editarQuantidade(id: number, quantidade: number): Promise<void> {
    await pool.query(`
      UPDATE circuito_posto_componentes
      SET quantidade = $1
      WHERE id = $2
        AND ativo = true
    `, [quantidade, id])
  }

  async remover(id: number): Promise<void> {
    await pool.query(`
      UPDATE circuito_posto_componentes
      SET ativo = false
      WHERE id = $1
    `, [id])
  }

  async listarTodos(): Promise<RoteiroComponente[]> {
    const result = await pool.query<any>(`
      SELECT
        cpc.id,
        cpc.circuito_id as "circuitoId",
        cpc.posto_id as "postoId",
        cpc.componente_id as "componenteId",
        comp.codigo as "codigoComponente",
        comp.nome as "nomeComponente",
        cpc.quantidade,
        cpc.ativo
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      WHERE cpc.ativo = true
      ORDER BY comp.codigo
    `)

    return result.rows.map((item) => ({
      ...item,
      ativo: Boolean(item.ativo)
    }))
  }
}
