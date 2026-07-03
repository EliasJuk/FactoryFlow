import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X
} from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

type ModalConfirmacaoProps = {
  titulo: string
  descricao: React.ReactNode
  textoConfirmar: string
  perigo?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

const ITENS_POR_PAGINA = 10

function SubsetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [subsetoresInativos, setSubsetoresInativos] = useState<Subsetor[]>([])

  const [busca, setBusca] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [subsetorEditando, setSubsetorEditando] = useState<Subsetor | null>(null)

  const [nome, setNome] = useState("")
  const [setorId, setSetorId] = useState<number | "">("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [mensagemSucesso, setMensagemSucesso] = useState("")
  const [processando, setProcessando] = useState(false)

  const [subsetorParaInativar, setSubsetorParaInativar] =
    useState<Subsetor | null>(null)

  const [subsetorParaRestaurar, setSubsetorParaRestaurar] =
    useState<Subsetor | null>(null)

  const [subsetorParaExcluirPermanente, setSubsetorParaExcluirPermanente] =
    useState<Subsetor | null>(null)

  const [subsetorBloqueado, setSubsetorBloqueado] = useState<{
    subsetor: Subsetor
    totalPostos: number
  } | null>(null)

  async function carregarDados() {
    const [setoresLista, subsetoresLista, inativosLista] = await Promise.all([
      window.api.setores.listar(),
      window.api.subsetores.listar(),
      window.api.subsetores.listarInativos()
    ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setSubsetoresInativos(inativosLista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const subsetoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return subsetores

    return subsetores.filter((subsetor) => {
      return (
        subsetor.nome.toLowerCase().includes(termo) ||
        subsetor.setorNome.toLowerCase().includes(termo)
      )
    })
  }, [busca, subsetores])

  const totalPaginas = Math.max(
    1,
    Math.ceil(subsetoresFiltrados.length / ITENS_POR_PAGINA)
  )

  const subsetoresPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return subsetoresFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, subsetoresFiltrados])

  useEffect(() => {
    setPaginaAtual(1)
  }, [busca])

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas)
    }
  }, [paginaAtual, totalPaginas])

  function limparMensagens() {
    setMensagemErro("")
    setMensagemSucesso("")
  }

  function abrirNovoSubsetor() {
    if (processando) return

    limparMensagens()
    setModalModo("novo")
    setSubsetorEditando(null)
    setNome("")
    setSetorId(setores[0]?.id ?? "")
    setModalAberto(true)
  }

  function abrirEditarSubsetor(subsetor: Subsetor) {
    if (processando) return

    limparMensagens()
    setModalModo("editar")
    setSubsetorEditando(subsetor)
    setNome(subsetor.nome)
    setSetorId(subsetor.setorId)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setSubsetorEditando(null)
    setNome("")
    setSetorId("")
    setMensagemErro("")
  }

  async function salvarSubsetor() {
    if (processando) return

    setMensagemErro("")

    if (!nome.trim() || setorId === "") {
      setMensagemErro("Informe o setor e o nome do subsetor.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && subsetorEditando) {
        const resultado = await window.api.subsetores.editar(
          subsetorEditando.id,
          nome.trim(),
          Number(setorId)
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Subsetor atualizado com sucesso.")
      } else {
        const resultado = await window.api.subsetores.criar(
          nome.trim(),
          Number(setorId)
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Subsetor cadastrado com sucesso.")
      }

      fecharModal()
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(subsetor: Subsetor) {
    if (processando) return

    limparMensagens()

    const totalPostos = await window.api.subsetores.contarPostosAtivos(
      subsetor.id
    )

    if (totalPostos > 0) {
      setSubsetorBloqueado({
        subsetor,
        totalPostos
      })
      return
    }

    setSubsetorParaInativar(subsetor)
  }

  async function confirmarInativacao() {
    if (!subsetorParaInativar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.subsetores.excluir(
        subsetorParaInativar.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSubsetorParaInativar(null)
      setMensagemSucesso("Subsetor inativado com sucesso.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!subsetorParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.subsetores.restaurar(
        subsetorParaRestaurar.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSubsetorParaRestaurar(null)
      setMensagemSucesso("Subsetor restaurado com sucesso.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!subsetorParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.subsetores.excluirPermanente(
        subsetorParaExcluirPermanente.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSubsetorParaExcluirPermanente(null)
      setMensagemSucesso("Subsetor excluído permanentemente.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = nome.trim().length > 0 && setorId !== ""

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Subsetores"
        subtitle="Cadastre e gerencie os subsetores vinculados aos setores."
      />

      <section className={ui.section}>
        {mensagemSucesso && (
          <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensagemSucesso}
          </div>
        )}

        {mensagemErro && !modalAberto && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        <div className={ui.card}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={ui.title}>Subsetores ativos</h2>
              <p className={ui.subtitle}>
                Exibindo {subsetoresFiltrados.length} subsetor(es) ativo(s).
                Limite de {ITENS_POR_PAGINA} por página.
              </p>
            </div>

            <button
              onClick={abrirNovoSubsetor}
              disabled={processando}
              className={ui.buttonPrimary}
            >
              <Plus size={16} />
              Novo Subsetor
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
            <Search size={16} className="text-[var(--text-light)]" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por setor ou subsetor..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {subsetoresPaginados.map((subsetor) => (
                <tr
                  key={subsetor.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCell}>{subsetor.setorNome}</td>
                  <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarSubsetor(subsetor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(subsetor)}
                        disabled={processando}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {subsetoresPaginados.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum subsetor ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--text-light)]">
            Página {paginaAtual} de {totalPaginas}
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
              disabled={paginaAtual === 1}
              className={ui.buttonSecondary}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <button
              onClick={() =>
                setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
              }
              disabled={paginaAtual === totalPaginas}
              className={ui.buttonSecondary}
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setMostrarInativos((valor) => !valor)}
            className="flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--soft)] px-4 py-3 text-left"
          >
            <div>
              <h2 className={ui.title}>Subsetores inativos</h2>
              <p className={ui.subtitle}>
                {subsetoresInativos.length} subsetor(es) inativo(s). Use esta
                área para restaurar ou excluir permanentemente.
              </p>
            </div>

            {mostrarInativos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {mostrarInativos && (
            <table className={ui.table}>
              <thead className="[background-color:var(--soft)]">
                <tr>
                  <th className={ui.tableHeader}>Setor</th>
                  <th className={ui.tableHeader}>Subsetor</th>
                  <th className={ui.tableHeaderRight}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {subsetoresInativos.map((subsetor) => (
                  <tr
                    key={subsetor.id}
                    className="border-t border-[var(--border)] bg-slate-50"
                  >
                    <td className={ui.tableCell}>{subsetor.setorNome}</td>
                    <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                    <td className={ui.tableCell}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSubsetorParaRestaurar(subsetor)}
                          disabled={processando}
                          className={ui.buttonSecondary}
                          title="Restaurar"
                        >
                          <RotateCcw size={15} />
                          Restaurar
                        </button>

                        <button
                          onClick={() =>
                            setSubsetorParaExcluirPermanente(subsetor)
                          }
                          disabled={processando}
                          className={ui.buttonDanger}
                          title="Excluir permanentemente"
                        >
                          <Trash2 size={15} />
                          Excluir permanente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {subsetoresInativos.length === 0 && (
                  <tr>
                    <td colSpan={3} className={ui.empty}>
                      Nenhum subsetor inativo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className={ui.title}>
                    {modalModo === "novo"
                      ? "Novo Subsetor"
                      : "Editar Subsetor"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o setor responsável e o nome do subsetor.
                  </p>
                </div>

                <button
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}
                >
                  <X size={16} />
                </button>
              </div>

              {mensagemErro && (
                <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {mensagemErro}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <div>
                  <label className={ui.label}>Setor</label>
                  <select
                    value={setorId}
                    onChange={(event) =>
                      setSetorId(
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value)
                      )
                    }
                    disabled={processando}
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
                  <label className={ui.label}>Nome do Subsetor</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: Montagem"
                    className={ui.input}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarSubsetor}
                  disabled={!podeSalvar || processando}
                  className={ui.buttonPrimary}
                >
                  {processando
                    ? "Salvando..."
                    : modalModo === "novo"
                      ? "Salvar"
                      : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {subsetorParaInativar && (
          <ModalConfirmacao
            titulo="Inativar subsetor"
            descricao={
              <>
                O subsetor <strong>{subsetorParaInativar.nome}</strong> ficará
                inativo e não aparecerá nas listas principais.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setSubsetorParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {subsetorParaRestaurar && (
          <ModalConfirmacao
            titulo="Restaurar subsetor"
            descricao={
              <>
                O subsetor <strong>{subsetorParaRestaurar.nome}</strong> voltará
                a aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setSubsetorParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {subsetorParaExcluirPermanente && (
          <ModalConfirmacao
            titulo="Excluir permanentemente"
            descricao={
              <>
                O subsetor{" "}
                <strong>{subsetorParaExcluirPermanente.nome}</strong> será
                removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setSubsetorParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}

        {subsetorBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Subsetor possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o subsetor{" "}
                <strong>{subsetorBloqueado.subsetor.nome}</strong>, pois existem{" "}
                <strong>{subsetorBloqueado.totalPostos}</strong> posto(s) de
                trabalho vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Primeiro inative ou remova os postos de trabalho vinculados a
                este subsetor.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSubsetorBloqueado(null)}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function ModalConfirmacao({
  titulo,
  descricao,
  textoConfirmar,
  perigo = false,
  onCancelar,
  onConfirmar
}: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <h2 className={ui.title}>{titulo}</h2>

        <p className="mt-4 text-sm leading-6 text-slate-700">{descricao}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancelar} className={ui.buttonSecondary}>
            Voltar
          </button>

          <button
            onClick={onConfirmar}
            className={perigo ? ui.buttonDanger : ui.buttonPrimary}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubsetoresPage