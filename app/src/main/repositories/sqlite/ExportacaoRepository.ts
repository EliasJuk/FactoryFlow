import db from "../../database/database"

export type ExportacaoFiltros = {
  dataInicio: string
  dataFim: string
}

type LinhaExportacao = {
  data: string
  matricula: string
  turno: string
  setor: string
  posto: string
  ctf: string
  quantidadeProduzida: number
  quantidadeRefugo: number
  modoFalha: string
  observacoes: string | null
  horarioRegistro: string
  numeroDefeito: string
  id: string
  custoProduzido: number
  custoRefugo: number
  setorOrigem: string
  modoFalhaReal: string
}

function calcularSemanaISO(data: Date) {
  const dataUtc = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
  const diaSemana = dataUtc.getUTCDay() || 7

  dataUtc.setUTCDate(dataUtc.getUTCDate() + 4 - diaSemana)

  const inicioAno = new Date(Date.UTC(dataUtc.getUTCFullYear(), 0, 1))

  return Math.ceil(((dataUtc.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7)
}

function formatarData(dataHora: string) {
  const data = new Date(dataHora)
  return data.toLocaleDateString("pt-BR")
}

function formatarDataHora(dataHora: string) {
  const data = new Date(dataHora)
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatarNumero(valor: number) {
  return String(valor ?? 0).replace(".", ",")
}

function limparCampo(valor: unknown) {
  return String(valor ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/;/g, ",")
    .trim()
}

function montarCsv(linhas: LinhaExportacao[]) {
  const cabecalho = [
    "Data",
    "Matriula",
    "Turno",
    "Setor",
    "Posto de trabalho",
    "CTF",
    "Qtd. Produzida",
    "Qtd.Refugo",
    "Modo de Falha",
    "Observaoes",
    "Horario e registro",
    "Semana",
    "Numero Defeito ",
    "ID",
    "Custo Produzido",
    "Custo refugo ",
    "Setor do refugo (Origem)",
    "modo de falha real"
  ]

  const linhasCsv = linhas.map((linha) => {
    const dataBase = new Date(linha.horarioRegistro)

    return [
      formatarData(linha.horarioRegistro),
      limparCampo(linha.matricula),
      limparCampo(linha.turno),
      limparCampo(linha.setor),
      limparCampo(linha.posto),
      limparCampo(linha.ctf),
      linha.quantidadeProduzida,
      linha.quantidadeRefugo,
      limparCampo(linha.modoFalha),
      limparCampo(linha.observacoes),
      formatarDataHora(linha.horarioRegistro),
      calcularSemanaISO(dataBase),
      limparCampo(linha.numeroDefeito),
      limparCampo(linha.id),
      formatarNumero(linha.custoProduzido),
      formatarNumero(linha.custoRefugo),
      limparCampo(linha.setorOrigem),
      limparCampo(linha.modoFalhaReal)
    ].join(";")
  })

  return "\uFEFF" + [cabecalho.join(";"), ...linhasCsv].join("\n")
}

export class ExportacaoRepository {
  gerarCsvRefugos(filtros: ExportacaoFiltros) {
    const linhas = db
      .prepare(`
        SELECT
          r.data_hora as horarioRegistro,
          r.matricula_operador as matricula,
          r.turno,
          s.nome as setor,
          p.nome as posto,
          c.codigo as ctf,
          r.quantidade_produzida as quantidadeProduzida,
          ri.quantidade as quantidadeRefugo,

          COALESCE(
            ri.codigo_defeito_snapshot || ' - ' || ri.descricao_defeito_snapshot,
            d.codigo || ' - ' || d.descricao
          ) as modoFalha,

          r.observacao as observacoes,

          COALESCE(ri.codigo_defeito_snapshot, d.codigo) as numeroDefeito,
          r.numero_refugo as id,

          COALESCE(ri.preco_unitario_snapshot, 0) * r.quantidade_produzida as custoProduzido,
          COALESCE(ri.custo_total_snapshot, 0) as custoRefugo,

          s.nome as setorOrigem,
          COALESCE(ri.codigo_defeito_snapshot, d.codigo) as modoFalhaReal

        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id

        WHERE r.status = 'ATIVO'
          AND date(r.data_hora) >= date(?)
          AND date(r.data_hora) <= date(?)

        ORDER BY r.data_hora ASC, r.id ASC
      `)
      .all(filtros.dataInicio, filtros.dataFim) as LinhaExportacao[]

    return montarCsv(linhas)
  }
}