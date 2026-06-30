//import db from "../database/database"
import { getDatabase } from "../database/connection"
const db = getDatabase()

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
  listarPorCircuito(circuitoId: number): CircuitoComponente[] {
    const itens = db
      .prepare(`
        SELECT 
          cc.id,
          cc.circuito_id as circuitoId,
          cc.componente_id as componenteId,
          c.codigo as codigoComponente,
          c.nome as nomeComponente,
          cc.quantidade,
          cc.ativo
        FROM circuito_componentes cc
        INNER JOIN componentes c ON c.id = cc.componente_id
        WHERE cc.circuito_id = ?
          AND cc.ativo = 1
        ORDER BY c.codigo
      `)
      .all(circuitoId) as Array<{
        id: number
        circuitoId: number
        componenteId: number
        codigoComponente: string
        nomeComponente: string
        quantidade: number
        ativo: number
      }>

    return itens.map((item) => ({
      ...item,
      ativo: Boolean(item.ativo)
    }))
  }

  adicionar(circuitoId: number, componenteId: number, quantidade: number): void {
    db.prepare(`
      INSERT INTO circuito_componentes 
        (circuito_id, componente_id, quantidade, ativo)
      VALUES (?, ?, ?, 1)
    `).run(circuitoId, componenteId, quantidade)
  }

  remover(id: number): void {
    db.prepare(`
      UPDATE circuito_componentes
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}