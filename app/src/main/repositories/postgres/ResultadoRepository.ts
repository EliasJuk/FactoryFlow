import { pool } from "../../database/postgres/connection"

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

    params.push(dataInicio)
    where.push(`DATE(r.data_hora) >= DATE($${params.length})`)

    params.push(dataFim)
    where.push(`DATE(r.data_hora) <= DATE($${params.length})`)

    if (filtros.setorId) {
      params.push(filtros.setorId)
      where.push(`r.setor_id = $${params.length}`)
    }

    if (filtros.subsetorId) {
      params.push(filtros.subsetorId)
      where.push(`r.subsetor_id = $${params.length}`)
    }

    if (filtros.postoId) {
      params.push(filtros.postoId)
      where.push(`r.posto_id = $${params.length}`)
    }

    if (filtros.circuitoId) {
      params.push(filtros.circuitoId)
      where.push(`r.circuito_id = $${params.length}`)
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

  async resumo(filtros: ResultadoFiltros) {
    const filtro = this.montarFiltros(filtros)

    const resumo = await pool.query<any>(`
      SELECT
        COUNT(DISTINCT r.id)::int as "totalLancamentos",
        COALESCE(SUM(ri.quantidade), 0)::numeric as "totalPecasRefugadas",
        COALESCE(SUM(ri.custo_total_snapshot), 0)::numeric as "custoTotalRefugo"
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      WHERE ${filtro.where}
    `, filtro.params)

    const defeitoMaisComum = await pool.query<ResultadoItem>(`
      SELECT
        COALESCE(
          ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot,
          d.codigo || ' - ' || d.descricao
        ) as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN defeitos d ON d.id = ri.defeito_id
      WHERE ${filtro.where}
      GROUP BY COALESCE(ri.codigo_defeito_snapshot, d.codigo),
               COALESCE(ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot, d.codigo || ' - ' || d.descricao)
      ORDER BY total DESC
      LIMIT 1
    `, filtro.params)

    const circuitoMaisCritico = await pool.query<ResultadoItem>(`
      SELECT
        c.codigo || ' - ' || c.nome as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN circuitos c ON c.id = r.circuito_id
      WHERE ${filtro.where}
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 1
    `, filtro.params)

    const turnoMaisCritico = await pool.query<ResultadoItem>(`
      SELECT
        r.turno as nome,
        COALESCE(SUM(ri.custo_total_snapshot), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      WHERE ${filtro.where}
      GROUP BY r.turno
      ORDER BY total DESC
      LIMIT 1
    `, filtro.params)

    const linha = resumo.rows[0] ?? {}

    return {
      totalLancamentos: Number(linha.totalLancamentos ?? 0),
      totalPecasRefugadas: Number(linha.totalPecasRefugadas ?? 0),
      custoTotalRefugo: Number(linha.custoTotalRefugo ?? 0),
      defeitoMaisComum: defeitoMaisComum.rows[0]?.nome ?? "-",
      circuitoMaisCritico: circuitoMaisCritico.rows[0]?.nome ?? "-",
      turnoMaisCritico: turnoMaisCritico.rows[0]?.nome ?? "-"
    }
  }

  async custoPorDiaTurno(filtros: ResultadoFiltros): Promise<ResultadoDiaTurno[]> {
    const filtro = this.montarFiltros(filtros)
    const dias = this.montarDiasDoPeriodo(filtro.dataInicio, filtro.dataFim)

    const result = await pool.query<any>(`
      SELECT
        TO_CHAR(r.data_hora, 'DD') as dia,
        UPPER(TRIM(r.turno)) as turno,
        COALESCE(SUM(ri.custo_total_snapshot), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      WHERE ${filtro.where}
      GROUP BY TO_CHAR(r.data_hora, 'DD'), UPPER(TRIM(r.turno))
      ORDER BY dia
    `, filtro.params)

    for (const linha of result.rows) {
      const dia = dias.find((item) => item.dia === linha.dia)

      if (!dia) continue

      const total = Number(linha.total ?? 0)

      if (linha.turno === "A") dia.turnoA = total
      if (linha.turno === "B") dia.turnoB = total
      if (linha.turno === "C") dia.turnoC = total

      dia.total += total
    }

    return dias
  }

  async custoPorTurno(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        'Turno ' || UPPER(TRIM(r.turno)) as nome,
        COALESCE(SUM(ri.custo_total_snapshot), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      WHERE ${filtro.where}
      GROUP BY UPPER(TRIM(r.turno))
      ORDER BY total DESC
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async topDefeitos(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        COALESCE(
          ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot,
          d.codigo || ' - ' || d.descricao
        ) as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN defeitos d ON d.id = ri.defeito_id
      WHERE ${filtro.where}
      GROUP BY COALESCE(ri.codigo_defeito_snapshot, d.codigo),
               COALESCE(ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot, d.codigo || ' - ' || d.descricao)
      ORDER BY total DESC
      LIMIT 10
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async topSetores(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        s.nome as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN setores s ON s.id = r.setor_id
      WHERE ${filtro.where}
      GROUP BY s.id
      ORDER BY total DESC
      LIMIT 10
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async topPostos(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        p.nome as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN postos p ON p.id = r.posto_id
      WHERE ${filtro.where}
      GROUP BY p.id
      ORDER BY total DESC
      LIMIT 10
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async topComponentes(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        COALESCE(
          ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot,
          comp.codigo || ' - ' || comp.nome
        ) as nome,
        COALESCE(SUM(ri.quantidade), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN componentes comp ON comp.id = ri.componente_id
      WHERE ${filtro.where}
      GROUP BY COALESCE(ri.codigo_componente_snapshot, comp.codigo),
               COALESCE(ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot, comp.codigo || ' - ' || comp.nome)
      ORDER BY total DESC
      LIMIT 10
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async topCustoComponentes(filtros: ResultadoFiltros): Promise<ResultadoItem[]> {
    const filtro = this.montarFiltros(filtros)

    const result = await pool.query<ResultadoItem>(`
      SELECT
        COALESCE(
          ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot,
          comp.codigo || ' - ' || comp.nome
        ) as nome,
        COALESCE(SUM(ri.custo_total_snapshot), 0)::numeric as total
      FROM refugos r
      INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
      INNER JOIN componentes comp ON comp.id = ri.componente_id
      WHERE ${filtro.where}
      GROUP BY COALESCE(ri.codigo_componente_snapshot, comp.codigo),
               COALESCE(ri.codigo_componente_snapshot || ' - ' || ri.nome_componente_snapshot, comp.codigo || ' - ' || comp.nome)
      ORDER BY total DESC
      LIMIT 10
    `, filtro.params)

    return result.rows.map((item) => ({ ...item, total: Number(item.total) }))
  }

  async resultados(filtros: ResultadoFiltros) {
    return {
      resumo: await this.resumo(filtros),
      custoPorDiaTurno: await this.custoPorDiaTurno(filtros),
      custoPorTurno: await this.custoPorTurno(filtros),
      topDefeitos: await this.topDefeitos(filtros),
      topSetores: await this.topSetores(filtros),
      topPostos: await this.topPostos(filtros),
      topComponentes: await this.topComponentes(filtros),
      topCustoComponentes: await this.topCustoComponentes(filtros)
    }
  }
}
