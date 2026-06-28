import { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Printer,
  Search,
  Trash2
} from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type RefugoListagem = {
  id: number
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  status: string
  motivoCancelamento?: string | null
  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string
  itens: {
    componenteCodigo: string
    componenteNome: string
    defeitoCodigo: string
    defeitoDescricao: string
    quantidadeRefugada: number
  }[]
}

function VerLancamentosPage() {
  const [lancamentos, setLancamentos] = useState<RefugoListagem[]>([])
  const [busca, setBusca] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [abertos, setAbertos] = useState<number[]>([])
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const [editando, setEditando] = useState<RefugoListagem | null>(null)
  const [editMatricula, setEditMatricula] = useState("")
  const [editTurno, setEditTurno] = useState<"A" | "B" | "C">("A")
  const [editQuantidadeProduzida, setEditQuantidadeProduzida] = useState(0)
  const [editObservacao, setEditObservacao] = useState("")

  const limite = 10

  async function carregarLancamentos(pagina = 1) {
    setCarregando(true)

    try {
      const resultado = await window.api.refugos.listar(
        busca.trim(),
        pagina,
        limite
      )

      setLancamentos(resultado.dados)
      setTotalPaginas(resultado.totalPaginas || 1)
      setPaginaAtual(pagina)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarLancamentos(1)
  }, [])

  function alternarAberto(id: number) {
    setAbertos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    )
  }

  function reimprimir(numeroRefugo: string) {
    alert(`Reimprimir ${numeroRefugo}`)
  }

  function abrirEdicao(refugo: RefugoListagem) {
    setEditando(refugo)
    setEditMatricula(refugo.matriculaOperador)
    setEditTurno(refugo.turno as "A" | "B" | "C")
    setEditQuantidadeProduzida(refugo.quantidadeProduzida)
    setEditObservacao("")
  }

  async function salvarEdicao() {
    if (!editando) return

    await window.api.refugos.editarBasico(
      editando.id,
      editMatricula,
      editTurno,
      editQuantidadeProduzida,
      editObservacao.trim() || undefined
    )

    setEditando(null)
    await carregarLancamentos(paginaAtual)
  }

  async function cancelar(refugo: RefugoListagem) {
    const motivo = prompt(
      `Informe o motivo do cancelamento do lançamento ${refugo.numeroRefugo}:`
    )

    if (!motivo || motivo.trim() === "") return

    const confirmar = confirm(
      `Confirmar cancelamento do lançamento ${refugo.numeroRefugo}?\n\nEle ficará no histórico como CANCELADO.`
    )

    if (!confirmar) return

    await window.api.refugos.cancelar(refugo.id, motivo.trim())
    await carregarLancamentos(paginaAtual)
  }

  function paginasVisiveis() {
    const paginas: number[] = []

    if (totalPaginas <= 7) {
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginas.push(pagina)
      }

      return paginas
    }

    paginas.push(1)

    if (paginaAtual > 4) {
      paginas.push(-1)
    }

    for (
      let pagina = Math.max(2, paginaAtual - 1);
      pagina <= Math.min(totalPaginas - 1, paginaAtual + 1);
      pagina++
    ) {
      paginas.push(pagina)
    }

    if (paginaAtual < totalPaginas - 3) {
      paginas.push(-2)
    }

    paginas.push(totalPaginas)

    return paginas
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Ver Lançamentos"
        subtitle="Consulte, reimprima e acompanhe os refugos lançados."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={ui.label}>Buscar</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") carregarLancamentos(1)
                }}
                placeholder="Número, matrícula, circuito, posto ou defeito..."
                className={ui.input}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => carregarLancamentos(1)}
                className={ui.buttonPrimary}
                title="Buscar"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {carregando && (
            <div className={ui.card}>
              <p className={ui.subtitle}>Carregando lançamentos...</p>
            </div>
          )}

          {!carregando &&
            lancamentos.map((refugo) => {
              const aberto = abertos.includes(refugo.id)
              const cancelado = refugo.status === "CANCELADO"

              const itens = refugo.itens ?? []
              const totalRefugado = itens.reduce(
                (total, item) => total + item.quantidadeRefugada,
                0
              )

              return (
                <div
                  key={refugo.id}
                  className={`${ui.card} ${
                    cancelado
                      ? "border border-slate-400 bg-slate-200 opacity-80"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className={ui.title}>{refugo.numeroRefugo}</h2>

                        {cancelado && (
                          <span className="rounded bg-slate-600 px-2 py-1 text-xs font-bold text-white">
                            CANCELADO
                          </span>
                        )}
                      </div>

                      <p className={ui.subtitle}>
                        {refugo.dataHora} • Turno {refugo.turno} • Matrícula{" "}
                        {refugo.matriculaOperador}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        {refugo.setorNome} / {refugo.subsetorNome} /{" "}
                        {refugo.postoNome}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[var(--text)]">
                        Circuito: {refugo.circuitoCodigo} -{" "}
                        {refugo.circuitoNome}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        Produzido: {refugo.quantidadeProduzida} • Refugado:{" "}
                        {totalRefugado}
                      </p>

                      {cancelado && refugo.motivoCancelamento && (
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          Motivo: {refugo.motivoCancelamento}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => reimprimir(refugo.numeroRefugo)}
                        className={ui.buttonSecondary}
                        title="Reimprimir"
                      >
                        <Printer size={16} />
                      </button>

                      <button
                        onClick={() => abrirEdicao(refugo)}
                        className={ui.buttonSecondary}
                        title="Editar"
                        disabled={cancelado}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => cancelar(refugo)}
                        className={ui.buttonDanger}
                        title="Cancelar"
                        disabled={cancelado}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {aberto && (
                    <div className="mt-3 overflow-hidden rounded-md border border-[var(--border)]">
                      <table className={ui.table}>
                        <thead className="[background-color:var(--soft)]">
                          <tr>
                            <th className={ui.tableHeader}>Componente</th>
                            <th className={ui.tableHeader}>Defeito</th>
                            <th className={ui.tableHeaderRight}>Qtde</th>
                          </tr>
                        </thead>

                        <tbody>
                          {itens.map((item, index) => (
                            <tr
                              key={index}
                              className="border-t border-[var(--border)]"
                            >
                              <td className={ui.tableCellStrong}>
                                <div>{item.componenteCodigo}</div>
                                <div className="text-xs font-normal text-[var(--text-light)]">
                                  {item.componenteNome}
                                </div>
                              </td>

                              <td className={ui.tableCell}>
                                {item.defeitoCodigo} - {item.defeitoDescricao}
                              </td>

                              <td
                                className={`${ui.tableCell} text-right font-bold`}
                              >
                                {item.quantidadeRefugada}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={() => alternarAberto(refugo.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--soft)]"
                  >
                    {aberto ? (
                      <>
                        <ChevronUp size={16} />
                        Recolher componentes
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Ver componentes ({itens.length})
                      </>
                    )}
                  </button>
                </div>
              )
            })}

          {!carregando && lancamentos.length === 0 && (
            <div className={ui.card}>
              <p className={ui.empty}>Nenhum lançamento encontrado.</p>
            </div>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {paginasVisiveis().map((pagina, index) =>
              pagina < 0 ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-[var(--text-light)]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pagina}
                  onClick={() => carregarLancamentos(pagina)}
                  className={`rounded-md border px-3 py-1 text-sm font-semibold ${
                    pagina === paginaAtual
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--soft)]"
                  }`}
                >
                  {pagina}
                </button>
              )
            )}
          </div>
        )}
      </section>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className={ui.title}>Editar lançamento</h2>
            <p className={ui.subtitle}>{editando.numeroRefugo}</p>

            <div className="mt-4 grid gap-3">
              <div>
                <label className={ui.label}>Matrícula</label>
                <input
                  value={editMatricula}
                  onChange={(event) => setEditMatricula(event.target.value)}
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Turno</label>
                <select
                  value={editTurno}
                  onChange={(event) =>
                    setEditTurno(event.target.value as "A" | "B" | "C")
                  }
                  className={ui.select}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div>
                <label className={ui.label}>Quantidade produzida</label>
                <input
                  type="number"
                  min={0}
                  value={editQuantidadeProduzida}
                  onChange={(event) =>
                    setEditQuantidadeProduzida(Number(event.target.value))
                  }
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Observação</label>
                <textarea
                  value={editObservacao}
                  onChange={(event) => setEditObservacao(event.target.value)}
                  rows={3}
                  className={ui.input}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditando(null)}
                className={ui.buttonSecondary}
              >
                Cancelar
              </button>

              <button onClick={salvarEdicao} className={ui.buttonPrimary}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default VerLancamentosPage