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

export interface CircuitoPorPosto {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

type RoteiroComponenteRow = Omit<RoteiroComponente, "ativo"> & {
  ativo: number
}

export class RoteiroRepository {
  listarCircuitosPorPosto(postoId: number, busca = ""): CircuitoPorPosto[] {
    const termo = `%${busca}%`

    return db.prepare(`
      SELECT
        c.id as circuitoId,
        c.codigo as codigoCircuito,
        c.nome as nomeCircuito,
        p.id as postoId,
        p.nome as postoNome,
        sub.nome as subsetorNome,
        COUNT(cpc.id) as totalComponentes
      FROM circuito_posto_componentes cpc
      INNER JOIN circuitos c ON c.id = cpc.circuito_id
      INNER JOIN postos p ON p.id = cpc.posto_id
      INNER JOIN subsetores sub ON sub.id = p.subsetor_id
      WHERE cpc.posto_id = ?
        AND cpc.ativo = 1
        AND (
          ? = ''
          OR c.codigo LIKE ?
          OR c.nome LIKE ?
        )
      GROUP BY c.id, c.codigo, c.nome, p.id, p.nome, sub.nome
      ORDER BY c.codigo
    `).all(postoId, busca, termo, termo) as CircuitoPorPosto[]
  }

  listarPorCircuitoEPosto(
    circuitoId: number,
    postoId: number
  ): RoteiroComponente[] {
    const itens = db.prepare(`
      SELECT
        cpc.id,
        cpc.circuito_id as circuitoId,
        cpc.posto_id as postoId,
        cpc.componente_id as componenteId,
        comp.codigo as codigoComponente,
        comp.nome as nomeComponente,
        cpc.quantidade,
        cpc.ativo
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      WHERE cpc.circuito_id = ?
        AND cpc.posto_id = ?
        AND cpc.ativo = 1
      ORDER BY comp.codigo
    `).all(circuitoId, postoId) as RoteiroComponenteRow[]

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
    const existente = db.prepare(`
      SELECT id
      FROM circuito_posto_componentes
      WHERE circuito_id = ?
        AND posto_id = ?
        AND componente_id = ?
    `).get(circuitoId, postoId, componenteId) as { id: number } | undefined

    if (existente) {
      db.prepare(`
        UPDATE circuito_posto_componentes
        SET quantidade = ?, ativo = 1
        WHERE id = ?
      `).run(quantidade, existente.id)

      return
    }

    db.prepare(`
      INSERT INTO circuito_posto_componentes (
        circuito_id,
        posto_id,
        componente_id,
        quantidade,
        ativo
      ) VALUES (?, ?, ?, ?, 1)
    `).run(circuitoId, postoId, componenteId, quantidade)
  }

  editarQuantidade(id: number, quantidade: number): void {
    db.prepare(`
      UPDATE circuito_posto_componentes
      SET quantidade = ?
      WHERE id = ?
        AND ativo = 1
    `).run(quantidade, id)
  }

  remover(id: number): void {
    db.prepare(`
      UPDATE circuito_posto_componentes
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  listarTodos(): RoteiroComponente[] {
    const itens = db.prepare(`
      SELECT
        cpc.id,
        cpc.circuito_id as circuitoId,
        cpc.posto_id as postoId,
        cpc.componente_id as componenteId,
        comp.codigo as codigoComponente,
        comp.nome as nomeComponente,
        cpc.quantidade,
        cpc.ativo
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      WHERE cpc.ativo = 1
      ORDER BY comp.codigo
    `).all() as RoteiroComponenteRow[]

    return itens.map((item) => ({
      ...item,
      ativo: Boolean(item.ativo)
    }))
  }
}