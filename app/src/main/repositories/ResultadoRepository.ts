import db from "../database/database"

export type ResultadoFiltros = {
  dataInicio?: string
  dataFim?: string
  setorId?: number | null
  subsetorId?: number | null
  postoId?: number | null
  circuitoId?: number | null
}

export type ResultadoItem = {
  nome: string
  total: number
}

export class ResultadoRepository {
  private montarFiltros(filtros: ResultadoFiltros) {
    const where: string[] = ["r.status = 'ATIVO'"]
    const params: unknown[] = []

    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const dataInicio =
      filtros.dataInicio || primeiroDia.toISOString().slice(0, 10)

    const dataFim = filtros.dataFim || hoje.toISOString().slice(0, 10)

    where.push("date(r.data_hora) >= date(?)")
    params.push(dataInicio)

    where.push("date(r.data_hora) <= date(?)")
    params.push(dataFim)

    if (filtros.setorId) {
      where.push("r.setor_id = ?")
      params.push(filtros.setorId)
    }

    if (filtros.subsetorId) {
      where.push("r.subsetor_id = ?")
      params.push(filtros.subsetorId)
    }

    if (filtros.postoId) {
      where.push("r.posto_id = ?")
      params.push(filtros.postoId)
    }

    if (filtros.circuitoId) {
      where.push("r.circuito_id = ?")
      params.push(filtros.circuitoId)
    }

    return {
      where: where.join(" AND "),
      params
    }
  }

  resumo(filtros: ResultadoFiltros) {
    const filtro = this.montarFiltros(filtros)

    const resumo = db
      .prepare(`
        SELECT
          COUNT(DISTINCT r.id) as totalLancamentos,
          COALESCE(SUM(ri.quantidade), 0) as totalPecasRefugadas
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        WHERE ${filtro.where}
      `)
      .get(...filtro.params) as {
      totalLancamentos: number
      totalPecasRefugadas: number
    }

    const defeitoMaisComum = db
      .prepare(`
        SELECT
          d.codigo || ' - ' || d.descricao as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id
        WHERE ${filtro.where}
        GROUP BY d.id
        ORDER BY total DESC
        LIMIT 1
      `)
      .get(...filtro.params) as ResultadoItem | undefined

    const circuitoMaisCritico = db
      .prepare(`
        SELECT
          c.codigo || ' - ' || c.nome as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN circuitos c ON c.id = r.circuito_id
        WHERE ${filtro.where}
        GROUP BY c.id
        ORDER BY total DESC
        LIMIT 1
      `)
      .get(...filtro.params) as ResultadoItem | undefined

    return {
      totalLancamentos: resumo.totalLancamentos ?? 0,
      totalPecasRefugadas: resumo.totalPecasRefugadas ?? 0,
      defeitoMaisComum: defeitoMaisComum?.nome ?? "-",
      circuitoMaisCritico: circuitoMaisCritico?.nome ?? "-"
    }
  }

  topDefeitos(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          d.codigo || ' - ' || d.descricao as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id
        WHERE ${filtro.where}
        GROUP BY d.id
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  topSetores(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          s.nome as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN setores s ON s.id = r.setor_id
        WHERE ${filtro.where}
        GROUP BY s.id
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  topPostos(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          p.nome as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN postos p ON p.id = r.posto_id
        WHERE ${filtro.where}
        GROUP BY p.id
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  topComponentes(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          comp.codigo || ' - ' || comp.nome as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN componentes comp ON comp.id = ri.componente_id
        WHERE ${filtro.where}
        GROUP BY comp.id
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  resultados(filtros: ResultadoFiltros) {
    return {
      resumo: this.resumo(filtros),
      topDefeitos: this.topDefeitos(filtros),
      topSetores: this.topSetores(filtros),
      topPostos: this.topPostos(filtros),
      topComponentes: this.topComponentes(filtros)
    }
  }
}