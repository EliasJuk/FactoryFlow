import { pool } from '../../database/postgres/connection'

export interface CircuitoComponente {
  id: number
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

export class CircuitoComponenteRepository {
  async listarPorCircuito(circuitoId: number): Promise<CircuitoComponente[]> {
    const result = await pool.query<any>(
      `
      SELECT
        cc.id,
        cc.circuito_id as "circuitoId",
        cc.componente_id as "componenteId",
        c.codigo as "codigoComponente",
        c.nome as "nomeComponente",
        cc.quantidade,
        cc.ativo
      FROM circuito_componentes cc
      INNER JOIN componentes c ON c.id = cc.componente_id
      WHERE cc.circuito_id = $1
        AND cc.ativo = true
      ORDER BY c.codigo
    `,
      [circuitoId]
    )

    return result.rows.map((item) => ({
      ...item,
      ativo: Boolean(item.ativo)
    }))
  }

  async adicionar(circuitoId: number, componenteId: number, quantidade: number): Promise<void> {
    await pool.query(
      `
      INSERT INTO circuito_componentes
        (circuito_id, componente_id, quantidade, ativo)
      VALUES ($1, $2, $3, true)
    `,
      [circuitoId, componenteId, quantidade]
    )
  }

  async editarQuantidade(id: number, quantidade: number): Promise<void> {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    await pool.query(
      `
      UPDATE circuito_componentes
      SET quantidade = $1
      WHERE id = $2
        AND ativo = true
    `,
      [quantidade, id]
    )
  }

  async remover(id: number): Promise<void> {
    await pool.query(
      `
      UPDATE circuito_componentes
      SET ativo = false
      WHERE id = $1
    `,
      [id]
    )
  }
}
