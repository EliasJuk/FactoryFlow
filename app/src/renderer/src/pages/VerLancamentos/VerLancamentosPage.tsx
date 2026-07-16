import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Printer, Search, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { Defeito } from '../../models/Defeitos'
import { ui } from '../../theme/ui'
import { useApp } from '../../contexts/AppContext'

type RefugoItemListagem = {
  id: number
  uuid: string
  defeitoId: number
  componenteCodigo: string
  componenteNome: string
  defeitoCodigo: string
  defeitoDescricao: string
  quantidadeRefugada: number
}

type RefugoListagem = {
  id: number
  uuid: string
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null
  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string
  itens: RefugoItemListagem[]
}

type EditItem = {
  id: number
  defeitoId: number
  componenteCodigo: string
  componenteNome: string
  defeitoCodigo: string
  defeitoDescricao: string
  quantidade: number
}

function VerLancamentosPage() {
  const { usuario } = useApp()
  const [lancamentos, setLancamentos] = useState<RefugoListagem[]>([])
  const [defeitos, setDefeitos] = useState<Defeito[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [abertos, setAbertos] = useState<number[]>([])
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const [editando, setEditando] = useState<RefugoListagem | null>(null)
  const [confirmarEdicao, setConfirmarEdicao] = useState(false)
  const [editMatricula, setEditMatricula] = useState('')
  const [editTurno, setEditTurno] = useState<'A' | 'B' | 'C'>('A')
  const [editQuantidadeProduzida, setEditQuantidadeProduzida] = useState(0)
  const [editObservacao, setEditObservacao] = useState('')
  const [editItens, setEditItens] = useState<EditItem[]>([])

  const [cancelando, setCancelando] = useState<RefugoListagem | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')

  const limite = 10

  async function carregarLancamentos(pagina = 1) {
    setCarregando(true)

    try {
      const resultado = await window.api.refugos.listar(busca.trim(), pagina, limite)

      setLancamentos(resultado.dados ?? [])
      setTotalPaginas(resultado.totalPaginas || 1)
      setPaginaAtual(pagina)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarDefeitos() {
    const lista = await window.api.defeitos.listar()
    setDefeitos(lista)
  }

  useEffect(() => {
    carregarLancamentos(1)
    carregarDefeitos()
  }, [])

  function alternarAberto(id: number) {
    setAbertos((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]
    )
  }

  async function reimprimir(id: number) {
    await window.api.refugos.imprimir(id)
  }

  function abrirEdicao(refugo: RefugoListagem) {
    const itens = refugo.itens ?? []

    setEditando(refugo)
    setConfirmarEdicao(false)
    setEditMatricula(refugo.matriculaOperador)
    setEditTurno(refugo.turno as 'A' | 'B' | 'C')
    setEditQuantidadeProduzida(refugo.quantidadeProduzida)
    setEditObservacao(refugo.observacao ?? '')

    setEditItens(
      itens.map((item) => ({
        id: item.id,
        defeitoId: item.defeitoId,
        componenteCodigo: item.componenteCodigo,
        componenteNome: item.componenteNome,
        defeitoCodigo: item.defeitoCodigo,
        defeitoDescricao: item.defeitoDescricao,
        quantidade: item.quantidadeRefugada
      }))
    )
  }

  function fecharEdicao() {
    setEditando(null)
    setConfirmarEdicao(false)
    setEditItens([])
  }

  function alterarQuantidadeItem(id: number, quantidade: number) {
    setEditItens((atuais) =>
      atuais.map((item) => (item.id === id ? { ...item, quantidade } : item))
    )
  }

  function alterarDefeitoItem(id: number, defeitoId: number) {
    const defeito = defeitos.find((item) => item.id === defeitoId)

    setEditItens((atuais) =>
      atuais.map((item) =>
        item.id === id
          ? {
              ...item,
              defeitoId,
              defeitoCodigo: defeito?.codigo ?? item.defeitoCodigo,
              defeitoDescricao: defeito?.descricao ?? item.defeitoDescricao
            }
          : item
      )
    )
  }

  async function salvarEdicaoConfirmada() {
    if (!editando) return

    await window.api.refugos.editarCompleto(
      editando.id,
      editMatricula,
      editTurno,
      editQuantidadeProduzida,
      editObservacao.trim() || undefined,
      editItens.map((item) => ({
        id: item.id,
        defeitoId: item.defeitoId,
        quantidade: item.quantidade
      })),
      usuario.id ?? null
    )

    fecharEdicao()
    await carregarLancamentos(paginaAtual)
  }

  function abrirCancelamento(refugo: RefugoListagem) {
    setCancelando(refugo)
    setMotivoCancelamento('')
  }

  async function confirmarCancelamento() {
    if (!cancelando) return
    if (motivoCancelamento.trim() === '') return

    await window.api.refugos.cancelar(cancelando.id, motivoCancelamento.trim(), usuario.id ?? null)

    setCancelando(null)
    setMotivoCancelamento('')
    await carregarLancamentos(paginaAtual)
  }

  function paginasVisiveis() {
    const paginas: number[] = []

    if (totalPaginas <= 7) {
      for (let pagina = 1; pagina <= totalPaginas; pagina++) paginas.push(pagina)
      return paginas
    }

    paginas.push(1)

    if (paginaAtual > 4) paginas.push(-1)

    for (
      let pagina = Math.max(2, paginaAtual - 1);
      pagina <= Math.min(totalPaginas - 1, paginaAtual + 1);
      pagina++
    ) {
      paginas.push(pagina)
    }

    if (paginaAtual < totalPaginas - 3) paginas.push(-2)

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
                  if (event.key === 'Enter' && !carregando) carregarLancamentos(1)
                }}
                placeholder="Número, matrícula, circuito, posto ou defeito..."
                className={ui.input}
                autoFocus
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => carregarLancamentos(1)}
                disabled={carregando}
                className={`${ui.buttonPrimary} ${carregando ? 'opacity-60' : ''}`}
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
              <p className="text-xs font-semibold text-[var(--text-light)]">
                Atualizando lançamentos...
              </p>
            </div>
          )}

          {!carregando &&
            lancamentos.map((refugo) => {
              const aberto = abertos.includes(refugo.id)
              const cancelado = refugo.status === 'CANCELADO'
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
                      ? /*
                      ? "border border-slate-400 bg-slate-200 opacity-75"
                      : ""*/
                        'border border-slate-500 bg-slate-350 opacity-70'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className={ui.title}>{refugo.numeroRefugo}</h2>

                      <p className={ui.subtitle}>
                        {refugo.dataHora} • Turno {refugo.turno} • Matrícula{' '}
                        {refugo.matriculaOperador}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        {refugo.setorNome} / {refugo.subsetorNome} / {refugo.postoNome}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[var(--text)]">
                        Circuito: {refugo.circuitoCodigo} - {refugo.circuitoNome}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        Produzido: {refugo.quantidadeProduzida} • Refugado: {totalRefugado}
                      </p>

                      <p className="mt-1 text-xs font-bold">
                        Status:{' '}
                        <span className={cancelado ? 'text-red-700' : 'text-green-700'}>
                          {cancelado ? 'CANCELADO' : 'ATIVO'}
                        </span>
                      </p>

                      {cancelado && refugo.motivoCancelamento && (
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          Motivo: {refugo.motivoCancelamento}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => reimprimir(refugo.id)}
                        className={ui.buttonSecondary}
                        title="Reimprimir"
                      >
                        <Printer size={16} />
                      </button>

                      {!cancelado && (
                        <>
                          <button
                            onClick={() => abrirEdicao(refugo)}
                            className={ui.buttonSecondary}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => abrirCancelamento(refugo)}
                            className={ui.buttonDanger}
                            title="Cancelar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
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
                          {itens.map((item) => (
                            <tr key={item.id} className="border-t border-[var(--border)]">
                              <td className={ui.tableCellStrong}>
                                <div>{item.componenteCodigo}</div>
                                <div className="text-xs font-normal text-[var(--text-light)]">
                                  {item.componenteNome}
                                </div>
                              </td>

                              <td className={ui.tableCell}>
                                {item.defeitoCodigo} - {item.defeitoDescricao}
                              </td>

                              <td className={`${ui.tableCell} text-right font-bold`}>
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
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {paginasVisiveis().map((pagina, index) =>
              pagina < 0 ? (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-[var(--text-light)]">
                  ...
                </span>
              ) : (
                <button
                  key={pagina}
                  onClick={() => carregarLancamentos(pagina)}
                  className={`rounded-md border px-3 py-1 text-sm font-semibold ${
                    pagina === paginaAtual
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--soft)]'
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
            <h2 className={ui.title}>Editar lançamento</h2>
            <p className={ui.subtitle}>{editando.numeroRefugo}</p>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={ui.label}>Matrícula</label>
                  <input
                    value={editMatricula}
                    autoComplete="off"
                    onChange={(event) => setEditMatricula(event.target.value)}
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Turno</label>
                  <select
                    value={editTurno}
                    onChange={(event) => setEditTurno(event.target.value as 'A' | 'B' | 'C')}
                    className={ui.select}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div>
                  <label className={ui.label}>Qtd. produzida</label>
                  <input
                    type="number"
                    min={0}
                    value={editQuantidadeProduzida}
                    onChange={(event) => setEditQuantidadeProduzida(Number(event.target.value))}
                    className={ui.input}
                  />
                </div>
              </div>

              <div>
                <label className={ui.label}>Observação</label>
                <textarea
                  value={editObservacao}
                  onChange={(event) => setEditObservacao(event.target.value)}
                  rows={2}
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Componentes refugados</label>

                <div className="space-y-1">
                  {editItens.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_240px_90px] items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text)]">
                            {item.componenteCodigo}
                          </span>

                          <span className="text-sm text-[var(--text)]">{item.componenteNome}</span>
                        </div>
                      </div>

                      <select
                        value={item.defeitoId}
                        onChange={(event) =>
                          alterarDefeitoItem(item.id, Number(event.target.value))
                        }
                        className={ui.select}
                      >
                        {defeitos.map((defeito) => (
                          <option key={defeito.id} value={defeito.id}>
                            {defeito.codigo} - {defeito.descricao}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={0}
                        value={item.quantidade}
                        onChange={(event) =>
                          alterarQuantidadeItem(item.id, Number(event.target.value))
                        }
                        className={`${ui.input} text-center`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={fecharEdicao} className={ui.buttonSecondary}>
                Cancelar
              </button>

              <button onClick={() => setConfirmarEdicao(true)} className={ui.buttonPrimary}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarEdicao && editando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className={ui.title}>Confirmar alterações</h2>

            <p className="mt-3 text-sm text-[var(--text)]">
              Deseja realmente salvar as alterações do lançamento{' '}
              <strong>{editando.numeroRefugo}</strong>?
            </p>

            <p className="mt-2 text-xs text-[var(--text-light)]">
              Essa ação alterará os dados do lançamento, incluindo defeito e quantidade dos
              componentes.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmarEdicao(false)} className={ui.buttonSecondary}>
                Voltar
              </button>

              <button onClick={salvarEdicaoConfirmada} className={ui.buttonPrimary}>
                Confirmar e salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className={ui.title}>Cancelar lançamento</h2>

            <p className={ui.subtitle}>{cancelando.numeroRefugo}</p>

            <p className="mt-3 text-sm text-[var(--text)]">
              O lançamento não será apagado. Ele ficará no histórico como <strong>CANCELADO</strong>
              .
            </p>

            <div className="mt-4">
              <label className={ui.label}>Motivo do cancelamento</label>
              <textarea
                value={motivoCancelamento}
                onChange={(event) => setMotivoCancelamento(event.target.value)}
                rows={3}
                className={ui.input}
                placeholder="Ex: lançamento duplicado, erro de componente..."
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancelando(null)
                  setMotivoCancelamento('')
                }}
                className={ui.buttonSecondary}
              >
                Voltar
              </button>

              <button
                onClick={confirmarCancelamento}
                disabled={motivoCancelamento.trim() === ''}
                className={`${ui.buttonDanger} px-4 py-2 text-sm font-semibold ${
                  motivoCancelamento.trim() === '' ? 'opacity-60' : ''
                }`}
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default VerLancamentosPage
