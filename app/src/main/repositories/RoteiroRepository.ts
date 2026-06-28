import db from "../database/database"

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

export class RoteiroRepository {
  listarPorCircuitoEPosto(
    circuitoId: number,
    postoId: number
  ): RoteiroComponente[] {
    const itens = db
      .prepare(`
        SELECT
          cpc.id,
          cpc.circuito_id as circuitoId,
          cpc.posto_id as postoId,
          cpc.componente_id as componenteId,
          componentes.codigo as codigoComponente,
          componentes.nome as nomeComponente,
          cpc.quantidade,
          cpc.ativo
        FROM circuito_posto_componentes cpc
        INNER JOIN componentes
          ON componentes.id = cpc.componente_id
        WHERE cpc.circuito_id = ?
          AND cpc.posto_id = ?
          AND cpc.ativo = 1
        ORDER BY componentes.codigo
      `)
      .all(circuitoId, postoId) as Array<{
        id: number
        circuitoId: number
        postoId: number
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

  adicionar(
    circuitoId: number,
    postoId: number,
    componenteId: number,
    quantidade: number
  ): void {
    db.prepare(`
      INSERT INTO circuito_posto_componentes
        (circuito_id, posto_id, componente_id, quantidade, ativo)
      VALUES (?, ?, ?, ?, 1)
    `).run(circuitoId, postoId, componenteId, quantidade)
  }

  remover(id: number): void {
    db.prepare(`
      UPDATE circuito_posto_componentes
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  listarTodos(): RoteiroComponente[] {
  const itens = db
    .prepare(`
      SELECT
        cpc.id,
        cpc.circuito_id as circuitoId,
        cpc.posto_id as postoId,
        cpc.componente_id as componenteId,
        componentes.codigo as codigoComponente,
        componentes.nome as nomeComponente,
        cpc.quantidade,
        cpc.ativo
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes
        ON componentes.id = cpc.componente_id
      WHERE cpc.ativo = 1
      ORDER BY componentes.codigo
    `)
    .all() as Array<{
      id: number
      circuitoId: number
      postoId: number
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
}