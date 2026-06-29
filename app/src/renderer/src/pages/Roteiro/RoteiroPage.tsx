import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Circuito } from "../../models/Circuito"
import { Componente } from "../../models/Componente"
import { Posto } from "../../models/Posto"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

type CircuitoPorPosto = {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

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

type ModalModo = "novo" | "editar"

function RoteiroPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [componentes, setComponentes] = useState<Componente[]>([])

  const [setorId, setSetorId] = useState<number | "">("")
  const [subsetorId, setSubsetorId] = useState<number | "">("")
  const [postoId, setPostoId] = useState<number | "">("")

  const [buscaCircuito, setBuscaCircuito] = useState("")
  const [circuitosDoPosto, setCircuitosDoPosto] = useState<CircuitoPorPosto[]>([])
  const [circuitoSelecionado, setCircuitoSelecionado] =
    useState<CircuitoPorPosto | null>(null)

  const [itens, setItens] = useState<RoteiroComponente[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [modalCircuitoId, setModalCircuitoId] = useState<number | "">("")
  const [modalItens, setModalItens] = useState<RoteiroComponente[]>([])

  const [buscaComponente, setBuscaComponente] = useState("")
  const [componenteSelecionado, setComponenteSelecionado] =
    useState<Componente | null>(null)
  const [quantidade, setQuantidade] = useState(1)

  async function carregarDados() {
    const [
      setoresLista,
      subsetoresLista,
      postosLista,
      circuitosLista,
      componentesLista
    ] = await Promise.all([
      window.api.setores.listar(),
      window.api.subsetores.listar(),
      window.api.postos.listar(),
      window.api.circuitos.listar(),
      window.api.componentes.listar()
    ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setCircuitos(circuitosLista)
    setComponentes(componentesLista)
  }

  async function carregarCircuitosPorPosto() {
    if (postoId === "") {
      setCircuitosDoPosto([])
      setCircuitoSelecionado(null)
      setItens([])
      return
    }

    const lista = await window.api.roteiro.listarCircuitosPorPosto(
      Number(postoId),
      buscaCircuito.trim()
    )

    setCircuitosDoPosto(lista)
  }

  async function carregarComponentesDoRoteiro(
    circuitoId: number,
    postoSelecionadoId: number
  ) {
    const lista = await window.api.roteiro.listarPorCircuitoEPosto(
      circuitoId,
      postoSelecionadoId
    )

    setItens(lista)
  }

  async function carregarModalItens(circuitoId: number, postoSelecionadoId: number) {
    const lista = await window.api.roteiro.listarPorCircuitoEPosto(
      circuitoId,
      postoSelecionadoId
    )

    setModalItens(lista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarCircuitosPorPosto()
  }, [postoId, buscaCircuito])

  const subsetoresFiltrados = useMemo(() => {
    if (setorId === "") return []
    return subsetores.filter((subsetor) => subsetor.setorId === Number(setorId))
  }, [subsetores, setorId])

  const postosFiltrados = useMemo(() => {
    if (subsetorId === "") return []
    return postos.filter((posto) => posto.subsetorId === Number(subsetorId))
  }, [postos, subsetorId])

  const componentesFiltrados = useMemo(() => {
    const termo = buscaComponente.trim().toLowerCase()

    if (termo.length < 2) return []

    return componentes
      .filter((componente) => {
        const codigo = componente.codigo.toLowerCase()
        const nome = componente.nome.toLowerCase()

        return codigo.includes(termo) || nome.includes(termo)
      })
      .slice(0, 12)
  }, [componentes, buscaComponente])

  const postoSelecionado = postos.find((posto) => posto.id === postoId)

  function alterarSetor(valor: string) {
    const novoSetorId = valor === "" ? "" : Number(valor)

    setSetorId(novoSetorId)
    setSubsetorId("")
    setPostoId("")
    setBuscaCircuito("")
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
  }

  function alterarSubsetor(valor: string) {
    const novoSubsetorId = valor === "" ? "" : Number(valor)

    setSubsetorId(novoSubsetorId)
    setPostoId("")
    setBuscaCircuito("")
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
  }

  function alterarPosto(valor: string) {
    const novoPostoId = valor === "" ? "" : Number(valor)

    setPostoId(novoPostoId)
    setBuscaCircuito("")
    setCircuitoSelecionado(null)
    setItens([])
  }

  async function selecionarCircuito(circuito: CircuitoPorPosto) {
    setCircuitoSelecionado(circuito)
    await carregarComponentesDoRoteiro(circuito.circuitoId, circuito.postoId)
  }

  async function abrirNovoRoteiro() {
    if (postoId === "") return

    setModalModo("novo")
    setModalCircuitoId("")
    setModalItens([])
    setBuscaComponente("")
    setComponenteSelecionado(null)
    setQuantidade(1)
    setModalAberto(true)
  }

  async function abrirEditarRoteiro() {
    if (!circuitoSelecionado || postoId === "") return

    setModalModo("editar")
    setModalCircuitoId(circuitoSelecionado.circuitoId)
    setBuscaComponente("")
    setComponenteSelecionado(null)
    setQuantidade(1)
    setModalAberto(true)

    await carregarModalItens(circuitoSelecionado.circuitoId, Number(postoId))
  }

  function fecharModal() {
    setModalAberto(false)
    setModalCircuitoId("")
    setModalItens([])
    setBuscaComponente("")
    setComponenteSelecionado(null)
    setQuantidade(1)
  }

  async function adicionarComponenteNoModal() {
    if (postoId === "" || modalCircuitoId === "" || !componenteSelecionado) return

    await window.api.roteiro.adicionar(
      Number(modalCircuitoId),
      Number(postoId),
      componenteSelecionado.id,
      quantidade
    )

    setBuscaComponente("")
    setComponenteSelecionado(null)
    setQuantidade(1)

    await carregarModalItens(Number(modalCircuitoId), Number(postoId))
  }

  async function alterarQuantidadeModal(id: number, novaQuantidade: number) {
    if (novaQuantidade < 1) return

    await window.api.roteiro.editarQuantidade(id, novaQuantidade)

    if (postoId !== "" && modalCircuitoId !== "") {
      await carregarModalItens(Number(modalCircuitoId), Number(postoId))
    }
  }

  async function removerComponenteModal(id: number) {
    await window.api.roteiro.remover(id)

    if (postoId !== "" && modalCircuitoId !== "") {
      await carregarModalItens(Number(modalCircuitoId), Number(postoId))
    }
  }

  async function salvarAlteracoesModal() {
    fecharModal()

    await carregarCircuitosPorPosto()

    if (postoId !== "" && modalCircuitoId !== "") {
      const circuitoAtualizado = circuitos.find(
        (circuito) => circuito.id === Number(modalCircuitoId)
      )

      if (circuitoAtualizado) {
        const resumo: CircuitoPorPosto = {
          circuitoId: circuitoAtualizado.id,
          codigoCircuito: circuitoAtualizado.codigo,
          nomeCircuito: circuitoAtualizado.nome,
          postoId: Number(postoId),
          postoNome: postoSelecionado?.nome ?? "",
          subsetorNome: postoSelecionado?.subsetorNome ?? "",
          totalComponentes: modalItens.length
        }

        setCircuitoSelecionado(resumo)
        await carregarComponentesDoRoteiro(Number(modalCircuitoId), Number(postoId))
      }
    }
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Roteiros"
        subtitle="Consulte quais circuitos rodam em cada posto e quais componentes pertencem ao roteiro."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => alterarSetor(event.target.value)}
                className={ui.select}
              >
                <option value="">Selecione...</option>

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
                onChange={(event) => alterarSubsetor(event.target.value)}
                disabled={setorId === ""}
                className={ui.select}
              >
                <option value="">Selecione...</option>

                {subsetoresFiltrados.map((subsetor) => (
                  <option key={subsetor.id} value={subsetor.id}>
                    {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Posto de trabalho</label>
              <select
                value={postoId}
                onChange={(event) => alterarPosto(event.target.value)}
                disabled={subsetorId === ""}
                className={ui.select}
              >
                <option value="">Selecione...</option>

                {postosFiltrados.map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Pesquisar circuito</label>
              <div className="flex gap-2">
                <input
                  value={buscaCircuito}
                  onChange={(event) => setBuscaCircuito(event.target.value)}
                  disabled={postoId === ""}
                  placeholder="Código ou nome..."
                  className={ui.input}
                />

                <button className={ui.buttonSecondary} disabled={postoId === ""}>
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/*
        {postoId === "" && (
          <div className={ui.card}>
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className={ui.title}>Selecione um posto de trabalho</h2>
              <p className={ui.subtitle}>
                Escolha setor, subsetor e posto para visualizar os circuitos e componentes do roteiro.
              </p>
            </div>
          </div>
        )}*/}

        {postoId === "" && (
          <div className={ui.card}>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-8">

              <div className="flex items-start gap-4">

                <div className="text-3xl">
                  💡
                </div>

                <div className="flex-1">

                  <h2 className="text-lg font-semibold text-amber-900">
                    Antes de montar um roteiro
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-amber-800">
                    Certifique-se de que <strong>todos os componentes</strong> do circuito
                    já foram cadastrados no menu <strong>Circuitos</strong>.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-amber-800">
                    Nesta tela você irá definir <strong>em quais postos de trabalho</strong>
                    cada componente poderá ser utilizado ou refugado.
                  </p>

                  <div className="mt-5 rounded-md border border-amber-200 bg-white px-4 py-3">
                    <p className="text-sm text-amber-900">
                      <strong>⚠ Observação:</strong> Caso um componente não apareça durante
                      a criação ou edição do roteiro, volte ao cadastro de
                      <strong> Circuitos</strong>, adicione o componente ao circuito e
                      retorne para esta tela.
                    </p>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-700">
                    Para começar:
                  </p>

                  <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-slate-700">
                    <li>Selecione um setor.</li>
                    <li>Selecione um subsetor.</li>
                    <li>Selecione um posto de trabalho.</li>
                  </ul>

                </div>

              </div>

            </div>
          </div>
        )}

        {postoId !== "" && (
          <div className={ui.card}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className={ui.title}>Circuitos do posto</h2>
                <p className={ui.subtitle}>
                  {postoSelecionado?.nome ?? "Posto selecionado"}
                </p>
              </div>

              <button onClick={abrirNovoRoteiro} className={ui.buttonPrimary}>
                <Plus size={16} />
                Novo Roteiro
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {circuitosDoPosto.map((circuito) => {
                const ativo =
                  circuitoSelecionado?.circuitoId === circuito.circuitoId

                return (
                  <button
                    key={circuito.circuitoId}
                    onClick={() => selecionarCircuito(circuito)}
                    className={`rounded-lg border p-4 text-left transition ${
                      ativo
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">
                      {circuito.codigoCircuito}
                    </div>

                    <div className="mt-1 text-sm text-slate-700">
                      {circuito.nomeCircuito}
                    </div>

                    <div className="mt-3 text-xs font-semibold text-slate-500">
                      {circuito.totalComponentes} componente(s)
                    </div>
                  </button>
                )
              })}

              {circuitosDoPosto.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  Nenhum circuito encontrado para este posto.
                </div>
              )}
            </div>
          </div>
        )}

        {circuitoSelecionado && (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className={ui.title}>
                  {circuitoSelecionado.codigoCircuito} -{" "}
                  {circuitoSelecionado.nomeCircuito}
                </h2>

                <p className={ui.subtitle}>
                  Posto: {circuitoSelecionado.postoNome}
                </p>
              </div>

              <button onClick={abrirEditarRoteiro} className={ui.buttonSecondary}>
                <Pencil size={16} />
                Editar Roteiro
              </button>
            </div>

            <table className={ui.table}>
              <thead className="bg-slate-50">
                <tr>
                  <th className={ui.tableHeader}>Código</th>
                  <th className={ui.tableHeader}>Componente</th>
                  <th className={ui.tableHeader}>Qtde</th>
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
                  </tr>
                ))}

                {itens.length === 0 && (
                  <tr>
                    <td colSpan={3} className={ui.empty}>
                      Nenhum componente vinculado a este roteiro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className={ui.title}>
                    {modalModo === "novo" ? "Novo Roteiro" : "Editar Roteiro"}
                  </h2>

                  <p className={ui.subtitle}>
                    Posto: {postoSelecionado?.nome ?? "Posto selecionado"}
                  </p>
                </div>

                <button onClick={fecharModal} className={ui.buttonSecondary}>
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                <div>
                  <label className={ui.label}>Circuito</label>
                  <select
                    value={modalCircuitoId}
                    onChange={(event) => {
                      const valor =
                        event.target.value === "" ? "" : Number(event.target.value)

                      setModalCircuitoId(valor)
                      setModalItens([])

                      if (valor !== "" && postoId !== "") {
                        carregarModalItens(Number(valor), Number(postoId))
                      }
                    }}
                    disabled={modalModo === "editar"}
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

                <div className="relative">
                  <label className={ui.label}>Buscar componente</label>
                  <input
                    value={
                      componenteSelecionado
                        ? `${componenteSelecionado.codigo} - ${componenteSelecionado.nome}`
                        : buscaComponente
                    }
                    onChange={(event) => {
                      setComponenteSelecionado(null)
                      setBuscaComponente(event.target.value)
                    }}
                    placeholder="Digite código ou nome..."
                    className={ui.input}
                  />

                  {!componenteSelecionado && componentesFiltrados.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-300 bg-white shadow-lg">
                      {componentesFiltrados.map((componente) => (
                        <button
                          key={componente.id}
                          type="button"
                          onClick={() => {
                            setComponenteSelecionado(componente)
                            setBuscaComponente("")
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-orange-50"
                        >
                          <span className="font-bold">{componente.codigo}</span>
                          {" - "}
                          {componente.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={ui.label}>Qtde</label>
                  <input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(event) => setQuantidade(Number(event.target.value))}
                    className={ui.input}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={adicionarComponenteNoModal}
                    disabled={
                      postoId === "" ||
                      modalCircuitoId === "" ||
                      !componenteSelecionado
                    }
                    className={ui.buttonPrimary}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
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
                    {modalItens.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className={ui.tableCellStrong}>
                          {item.codigoComponente}
                        </td>

                        <td className={ui.tableCell}>{item.nomeComponente}</td>

                        <td className={ui.tableCell}>
                          <input
                            type="number"
                            min={1}
                            value={item.quantidade}
                            onChange={(event) =>
                              alterarQuantidadeModal(
                                item.id,
                                Number(event.target.value)
                              )
                            }
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>

                        <td className={ui.tableCell}>
                          <div className="flex justify-end">
                            <button
                              onClick={() => removerComponenteModal(item.id)}
                              className={ui.buttonDanger}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {modalItens.length === 0 && (
                      <tr>
                        <td colSpan={4} className={ui.empty}>
                          Nenhum componente vinculado a este roteiro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={fecharModal} className={ui.buttonSecondary}>
                  Cancelar
                </button>

                <button
                  onClick={salvarAlteracoesModal}
                  disabled={modalCircuitoId === ""}
                  className={ui.buttonPrimary}
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default RoteiroPage