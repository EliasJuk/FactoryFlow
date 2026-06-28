import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Circuito } from "../../models/Circuito"
import { Componente } from "../../models/Componente"
import { Posto } from "../../models/Posto"
import { ui } from "../../theme/ui"

type RoteiroComponente = {
  id: number
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

function RoteiroPage() {
  const navigate = useNavigate()

  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [todosPostos, setTodosPostos] = useState<Posto[]>([])
  const [postosVisiveis, setPostosVisiveis] = useState<Posto[]>([])
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [itens, setItens] = useState<RoteiroComponente[]>([])

  const [circuitoId, setCircuitoId] = useState<number | "">("")
  const [postoId, setPostoId] = useState<number | "">("")
  const [componenteId, setComponenteId] = useState<number | "">("")
  const [quantidade, setQuantidade] = useState(1)

  async function carregarDados() {
    const [circuitosLista, postosLista, componentesLista] = await Promise.all([
      window.api.circuitos.listar(),
      window.api.postos.listar(),
      window.api.componentes.listar()
    ])

    setCircuitos(circuitosLista)
    setTodosPostos(postosLista)
    setComponentes(componentesLista)
  }

  async function carregarRoteiro() {
    if (circuitoId === "" || postoId === "") {
      setItens([])
      return
    }

    const lista = await window.api.roteiro.listarPorCircuitoEPosto(
      Number(circuitoId),
      Number(postoId)
    )

    setItens(lista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarRoteiro()
  }, [circuitoId, postoId])

  function alterarCircuito(valor: string) {
    const novoCircuitoId = valor === "" ? "" : Number(valor)

    setCircuitoId(novoCircuitoId)
    setPostoId("")
    setComponenteId("")
    setItens([])

    if (novoCircuitoId === "") {
      setPostosVisiveis([])
      return
    }

    setPostosVisiveis(todosPostos)
  }

  async function adicionarComponente() {
    if (circuitoId === "" || postoId === "" || componenteId === "") return

    await window.api.roteiro.adicionar(
      Number(circuitoId),
      Number(postoId),
      Number(componenteId),
      quantidade
    )

    setComponenteId("")
    setQuantidade(1)
    await carregarRoteiro()
  }

  async function removerComponente(id: number) {
    await window.api.roteiro.remover(id)
    await carregarRoteiro()
  }

  const circuitoSelecionado = circuitos.find(
    (circuito) => circuito.id === circuitoId
  )

  const postoSelecionado = todosPostos.find((posto) => posto.id === postoId)

  return (
    <main className={ui.page}>
      <PageHeader
        title="Roteiro do Circuito"
        subtitle="Defina quais componentes cada posto pode refugar por circuito."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <label className={ui.label}>Circuito</label>

          <select
            value={circuitoId}
            onChange={(event) => alterarCircuito(event.target.value)}
            className={ui.select}
          >
            <option value="">Selecione...</option>

            {circuitos.map((circuito) => (
              <option key={circuito.id} value={circuito.id}>
                {circuito.codigo} - {circuito.nome}
              </option>
            ))}
          </select>
        </div>

        {circuitoSelecionado && (
          <div className={ui.card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={ui.title}>Postos de Trabalho</h2>

              <button
                onClick={() => navigate("/postos")}
                className={ui.buttonSecondary}
              >
                Editar Postos
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-6">
              {postosVisiveis.map((posto) => {
                const ativo = posto.id === postoId

                return (
                  <button
                    key={posto.id}
                    onClick={() => {
                      setPostoId(posto.id)
                      setComponenteId("")
                      setItens([])
                    }}
                    className={`${ui.postoButton} ${
                      ativo
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>{posto.nome}</div>
                    <div className="mt-1 text-xs font-normal text-slate-500">
                      {posto.subsetorNome}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {circuitoSelecionado && postoSelecionado && (
          <div className={ui.card}>
            <h2 className={ui.title}>
              {circuitoSelecionado.codigo} - {circuitoSelecionado.nome}
            </h2>

            <p className={ui.subtitle}>Posto: {postoSelecionado.nome}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_100px_auto]">
              <div>
                <label className={ui.label}>Componente</label>

                <select
                  value={componenteId}
                  onChange={(event) =>
                    setComponenteId(
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value)
                    )
                  }
                  className={ui.select}
                >
                  <option value="">Selecione...</option>

                  {componentes.map((componente) => (
                    <option key={componente.id} value={componente.id}>
                      {componente.codigo} - {componente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={ui.label}>Qtde</label>

                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(event) =>
                    setQuantidade(Number(event.target.value))
                  }
                  className={ui.input}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={adicionarComponente}
                  className={ui.buttonPrimary}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className={ui.cardHeader}>
            <h2 className={ui.title}>Componentes do posto selecionado</h2>
          </div>

          <table className={ui.table}>
            <thead className="bg-slate-50">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Qtde</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className={ui.tableCellStrong}>
                    {item.codigoComponente}
                  </td>

                  <td className={ui.tableCell}>{item.nomeComponente}</td>

                  <td className={ui.tableCell}>{item.quantidade}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removerComponente(item.id)}
                        className={ui.buttonDanger}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {itens.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum componente definido para este circuito e posto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default RoteiroPage