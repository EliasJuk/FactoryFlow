import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

type Posto = {
  id: number
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
  ativo: boolean
}

type Circuito = {
  id: number
  codigo: string
  nome: string
  ativo: boolean
}

type ResultadoItem = {
  nome: string
  total: number
}

type Resultados = {
  resumo: {
    totalLancamentos: number
    totalPecasRefugadas: number
    defeitoMaisComum: string
    circuitoMaisCritico: string
  }
  topDefeitos: ResultadoItem[]
  topSetores: ResultadoItem[]
  topPostos: ResultadoItem[]
  topComponentes: ResultadoItem[]
}

function getInicioMesAtual() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  return primeiroDia.toISOString().slice(0, 10)
}

function getHoje() {
  return new Date().toISOString().slice(0, 10)
}

function CardIndicador({
  titulo,
  valor,
  descricao
}: {
  titulo: string
  valor: string | number
  descricao: string
}) {
  return (
    <div className={ui.card}>
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">{valor}</h2>
      <p className="mt-1 text-xs text-slate-500">{descricao}</p>
    </div>
  )
}

function GraficoBarras({
  titulo,
  dados
}: {
  titulo: string
  dados: ResultadoItem[]
}) {
  return (
    <div className={ui.card}>
      <h2 className={ui.title}>{titulo}</h2>

      {dados.length === 0 ? (
        <div className={ui.empty}>Nenhum dado encontrado para este período.</div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="nome" type="category" width={140} />
              <Tooltip />
              <Bar 
                dataKey="total"
                fill="#3B82F6"
                radius={[0, 6, 6, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ResultadosPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [circuitos, setCircuitos] = useState<Circuito[]>([])

  const [dataInicio, setDataInicio] = useState(getInicioMesAtual())
  const [dataFim, setDataFim] = useState(getHoje())

  const [setorId, setSetorId] = useState<number | "">("")
  const [subsetorId, setSubsetorId] = useState<number | "">("")
  const [postoId, setPostoId] = useState<number | "">("")
  const [circuitoId, setCircuitoId] = useState<number | "">("")

  const [resultados, setResultados] = useState<Resultados | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  async function carregarFiltros() {
    const [setoresLista, subsetoresLista, postosLista, circuitosLista] =
      await Promise.all([
        window.api.setores.listar(),
        window.api.subsetores.listar(),
        window.api.postos.listar(),
        window.api.circuitos.listar()
      ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setCircuitos(circuitosLista)
  }

  async function carregarResultados() {
    setCarregando(true)
    setErro("")

    try {
      const dados = await window.api.refugos.resultados({
        dataInicio,
        dataFim,
        setorId: setorId === "" ? null : Number(setorId),
        subsetorId: subsetorId === "" ? null : Number(subsetorId),
        postoId: postoId === "" ? null : Number(postoId),
        circuitoId: circuitoId === "" ? null : Number(circuitoId)
      })

      console.log("[RESULTADOS]", dados)

      setResultados(dados)
    } catch (error) {
      console.error("[RESULTADOS]", error)

      if (error instanceof Error) {
        setErro(error.message)
      } else {
        setErro("Não foi possível carregar os resultados.")
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarFiltros()
    carregarResultados()
  }, [])

  const subsetoresFiltrados = useMemo(() => {
    if (setorId === "") return subsetores
    return subsetores.filter((subsetor) => subsetor.setorId === Number(setorId))
  }, [subsetores, setorId])

  const postosFiltrados = useMemo(() => {
    if (subsetorId === "") return postos
    return postos.filter((posto) => posto.subsetorId === Number(subsetorId))
  }, [postos, subsetorId])

  function limparFiltros() {
    setDataInicio(getInicioMesAtual())
    setDataFim(getHoje())
    setSetorId("")
    setSubsetorId("")
    setPostoId("")
    setCircuitoId("")
  }

  const totalGeral =
    resultados?.resumo.totalLancamentos ?? 0

  return (
    <main className={ui.page}>
      <PageHeader
        title="Resultados"
        subtitle="Acompanhe os principais indicadores de refugo da fábrica."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <h2 className={ui.title}>Filtros</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-6">
            <div>
              <label className={ui.label}>Data inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Data final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => {
                  const valor =
                    event.target.value === "" ? "" : Number(event.target.value)

                  setSetorId(valor)
                  setSubsetorId("")
                  setPostoId("")
                }}
                className={ui.select}
              >
                <option value="">Todos</option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Subsetor</label>
              <select
                value={subsetorId}
                onChange={(event) => {
                  const valor =
                    event.target.value === "" ? "" : Number(event.target.value)

                  setSubsetorId(valor)
                  setPostoId("")
                }}
                className={ui.select}
              >
                <option value="">Todos</option>

                {subsetoresFiltrados.map((subsetor) => (
                  <option key={subsetor.id} value={subsetor.id}>
                    {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Posto</label>
              <select
                value={postoId}
                onChange={(event) =>
                  setPostoId(
                    event.target.value === "" ? "" : Number(event.target.value)
                  )
                }
                className={ui.select}
              >
                <option value="">Todos</option>

                {postosFiltrados.map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Circuito</label>
              <select
                value={circuitoId}
                onChange={(event) =>
                  setCircuitoId(
                    event.target.value === "" ? "" : Number(event.target.value)
                  )
                }
                className={ui.select}
              >
                <option value="">Todos</option>

                {circuitos.map((circuito) => (
                  <option key={circuito.id} value={circuito.id}>
                    {circuito.codigo} - {circuito.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={limparFiltros} className={ui.buttonSecondary}>
              Limpar
            </button>

            <button
              onClick={carregarResultados}
              disabled={carregando}
              className={ui.buttonPrimary}
            >
              {carregando ? "Carregando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>

        {erro && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        {resultados && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <CardIndicador
                titulo="Lançamentos"
                valor={resultados.resumo.totalLancamentos}
                descricao="Total de refugos ativos"
              />

              <CardIndicador
                titulo="Peças refugadas"
                valor={resultados.resumo.totalPecasRefugadas}
                descricao="Soma das quantidades refugadas"
              />

              <CardIndicador
                titulo="Defeito mais comum"
                valor={resultados.resumo.defeitoMaisComum}
                descricao="Maior volume no período"
              />

              <CardIndicador
                titulo="Circuito mais crítico"
                valor={resultados.resumo.circuitoMaisCritico}
                descricao="Circuito com maior quantidade"
              />
            </div>

            {totalGeral === 0 && (
              <div className={ui.card}>
                <div className={ui.empty}>
                  Nenhum resultado encontrado para o período selecionado.
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <GraficoBarras
                titulo="Top refugos por defeito"
                dados={resultados.topDefeitos}
              />

              <GraficoBarras
                titulo="Top refugos por setor"
                dados={resultados.topSetores}
              />

              <GraficoBarras
                titulo="Top refugos por posto"
                dados={resultados.topPostos}
              />

              <GraficoBarras
                titulo="Top componentes refugados"
                dados={resultados.topComponentes}
              />
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default ResultadosPage