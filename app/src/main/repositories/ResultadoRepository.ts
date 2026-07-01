//import db from "../database/database"
import { getDatabase } from "../database/connection"
const db = getDatabase()

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

export type ResultadoDiaTurno = {
  dia: string
  turnoA: number
  turnoB: number
  turnoC: number
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
      params,
      dataInicio,
      dataFim
    }
  }

  private montarDiasDoPeriodo(dataInicio: string, dataFim: string) {
    const dias: ResultadoDiaTurno[] = []
    const inicio = new Date(`${dataInicio}T00:00:00`)
    const fim = new Date(`${dataFim}T00:00:00`)
    const atual = new Date(inicio)

    while (atual <= fim) {
      dias.push({
        dia: String(atual.getDate()).padStart(2, "0"),
        turnoA: 0,
        turnoB: 0,
        turnoC: 0,
        total: 0
      })

      atual.setDate(atual.getDate() + 1)
    }

    return dias
  }

  resumo(filtros: ResultadoFiltros) {
    const filtro = this.montarFiltros(filtros)

    const resumo = db
      .prepare(`
        SELECT
          COUNT(DISTINCT r.id) as totalLancamentos,
          COALESCE(SUM(ri.quantidade), 0) as totalPecasRefugadas,
          COALESCE(SUM(ri.custo_total_snapshot), 0) as custoTotalRefugo
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        WHERE ${filtro.where}
      `)
      .get(...filtro.params) as {
      totalLancamentos: number
      totalPecasRefugadas: number
      custoTotalRefugo: number
    }

    const defeitoMaisComum = db
      .prepare(`
        SELECT
          COALESCE(
            ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot,
            d.codigo || ' - ' || d.descricao
          ) as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id
        WHERE ${filtro.where}
        GROUP BY COALESCE(ri.codigo_defeito_snapshot, d.codigo)
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

    const turnoMaisCritico = db
      .prepare(`
        SELECT
          r.turno as nome,
          COALESCE(SUM(ri.custo_total_snapshot), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        WHERE ${filtro.where}
        GROUP BY r.turno
        ORDER BY total DESC
        LIMIT 1
      `)
      .get(...filtro.params) as ResultadoItem | undefined

    return {
      totalLancamentos: resumo.totalLancamentos ?? 0,
      totalPecasRefugadas: resumo.totalPecasRefugadas ?? 0,
      custoTotalRefugo: resumo.custoTotalRefugo ?? 0,
      defeitoMaisComum: defeitoMaisComum?.nome ?? "-",
      circuitoMaisCritico: circuitoMaisCritico?.nome ?? "-",
      turnoMaisCritico: turnoMaisCritico?.nome ?? "-"
    }
  }

  custoPorDiaTurno(filtros: ResultadoFiltros): ResultadoDiaTurno[] {
    const filtro = this.montarFiltros(filtros)
    const dias = this.montarDiasDoPeriodo(filtro.dataInicio, filtro.dataFim)

    const linhas = db
      .prepare(`
        SELECT
          strftime('%d', r.data_hora) as dia,
          UPPER(TRIM(r.turno)) as turno,
          COALESCE(SUM(ri.custo_total_snapshot), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        WHERE ${filtro.where}
        GROUP BY strftime('%d', r.data_hora), UPPER(TRIM(r.turno))
        ORDER BY dia
      `)
      .all(...filtro.params) as Array<{
      dia: string
      turno: string
      total: number
    }>

    for (const linha of linhas) {
      const dia = dias.find((item) => item.dia === linha.dia)

      if (!dia) continue

      if (linha.turno === "A") {
        dia.turnoA = linha.total
      }

      if (linha.turno === "B") {
        dia.turnoB = linha.total
      }

      if (linha.turno === "C") {
        dia.turnoC = linha.total
      }

      dia.total += linha.total
    }

    return dias
  }

  custoPorTurno(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          'Turno ' || UPPER(TRIM(r.turno)) as nome,
          COALESCE(SUM(ri.custo_total_snapshot), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        WHERE ${filtro.where}
        GROUP BY UPPER(TRIM(r.turno))
        ORDER BY total DESC
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  topDefeitos(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          COALESCE(
            ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot,
            d.codigo || ' - ' || d.descricao
          ) as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id
        WHERE ${filtro.where}
        GROUP BY COALESCE(ri.codigo_defeito_snapshot, d.codigo)
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
          COALESCE(
            ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot,
            comp.codigo || ' - ' || comp.nome
          ) as nome,
          COALESCE(SUM(ri.quantidade), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN componentes comp ON comp.id = ri.componente_id
        WHERE ${filtro.where}
        GROUP BY COALESCE(ri.codigo_componente_snapshot, comp.codigo)
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  topCustoComponentes(filtros: ResultadoFiltros): ResultadoItem[] {
    const filtro = this.montarFiltros(filtros)

    return db
      .prepare(`
        SELECT
          COALESCE(
            ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot,
            comp.codigo || ' - ' || comp.nome
          ) as nome,
          COALESCE(SUM(ri.custo_total_snapshot), 0) as total
        FROM refugos r
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN componentes comp ON comp.id = ri.componente_id
        WHERE ${filtro.where}
        GROUP BY COALESCE(ri.codigo_componente_snapshot, comp.codigo)
        ORDER BY total DESC
        LIMIT 10
      `)
      .all(...filtro.params) as ResultadoItem[]
  }

  resultados(filtros: ResultadoFiltros) {
    return {
      resumo: this.resumo(filtros),
      custoPorDiaTurno: this.custoPorDiaTurno(filtros),
      custoPorTurno: this.custoPorTurno(filtros),
      topDefeitos: this.topDefeitos(filtros),
      topSetores: this.topSetores(filtros),
      topPostos: this.topPostos(filtros),
      topComponentes: this.topComponentes(filtros),
      topCustoComponentes: this.topCustoComponentes(filtros)
    }
  }
}