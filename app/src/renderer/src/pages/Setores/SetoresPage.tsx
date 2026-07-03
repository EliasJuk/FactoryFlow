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

const ITENS_POR_PAGINA = 10

function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [setoresInativos, setSetoresInativos] = useState<Setor[]>([])

  const [busca, setBusca] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [setorEditando, setSetorEditando] = useState<Setor | null>(null)

  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [mensagemSucesso, setMensagemSucesso] = useState("")
  const [processando, setProcessando] = useState(false)

  const [setorParaInativar, setSetorParaInativar] = useState<Setor | null>(null)
  const [setorParaRestaurar, setSetorParaRestaurar] = useState<Setor | null>(null)
  const [setorParaExcluirPermanente, setSetorParaExcluirPermanente] =
    useState<Setor | null>(null)

  const [setorBloqueado, setSetorBloqueado] = useState<{
    setor: Setor
    totalSubsetores: number
  } | null>(null)

  async function atualizarListas() {
    const [ativos, inativos] = await Promise.all([
      window.api.setores.listar(),
      window.api.setores.listarInativos()
    ])

    setSetores(ativos)
    setSetoresInativos(inativos)
  }

  useEffect(() => {
    atualizarListas()
  }, [])

  const setoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return setores

    return setores.filter((setor) => {
      return (
        setor.nome.toLowerCase().includes(termo) ||
        setor.sigla.toLowerCase().includes(termo)
      )
    })
  }, [busca, setores])

  const totalPaginas = Math.max(
    1,
    Math.ceil(setoresFiltrados.length / ITENS_POR_PAGINA)
  )

  const setoresPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return setoresFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, setoresFiltrados])

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

  function abrirNovoSetor() {
    if (processando) return

    limparMensagens()
    setModalModo("novo")
    setSetorEditando(null)
    setNome("")
    setSigla("")
    setModalAberto(true)
  }

  function abrirEditarSetor(setor: Setor) {
    if (processando) return

    limparMensagens()
    setModalModo("editar")
    setSetorEditando(setor)
    setNome(setor.nome)
    setSigla(setor.sigla)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setSetorEditando(null)
    setNome("")
    setSigla("")
    setMensagemErro("")
  }

  async function salvarSetor() {
    if (processando) return

    limparMensagens()

    if (!nome.trim() || !sigla.trim()) {
      setMensagemErro("Informe o nome e a sigla do setor.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && setorEditando) {
        await window.api.setores.editar(
          setorEditando.id,
          nome.trim(),
          sigla.trim().toUpperCase()
        )

        setMensagemSucesso("Setor atualizado com sucesso.")
      } else {
        await window.api.setores.criar(nome.trim(), sigla.trim().toUpperCase())
        setMensagemSucesso("Setor cadastrado com sucesso.")
      }

      fecharModal()
      await atualizarListas()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(setor: Setor) {
    if (processando) return

    limparMensagens()

    const totalSubsetores = await window.api.setores.contarSubsetoresAtivos(
      setor.id
    )

    if (totalSubsetores > 0) {
      setSetorBloqueado({
        setor,
        totalSubsetores
      })
      return
    }

    setSetorParaInativar(setor)
  }

  async function confirmarInativacao() {
    if (!setorParaInativar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      await window.api.setores.excluir(setorParaInativar.id)
      setSetorParaInativar(null)
      setMensagemSucesso("Setor inativado com sucesso.")
      await atualizarListas()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
      setSetorParaInativar(null)
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!setorParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      await window.api.setores.restaurar(setorParaRestaurar.id)
      setSetorParaRestaurar(null)
      setMensagemSucesso("Setor restaurado com sucesso.")
      await atualizarListas()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
      setSetorParaRestaurar(null)
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!setorParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      await window.api.setores.excluirPermanente(setorParaExcluirPermanente.id)
      setSetorParaExcluirPermanente(null)
      setMensagemSucesso("Setor excluído permanentemente.")
      await atualizarListas()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
      setSetorParaExcluirPermanente(null)
    } finally {
      setProcessando(false)
    }
  }

  function extrairMensagemErro(error: unknown) {
    if (error instanceof Error) {
      return error.message
        .replace(/^Error invoking remote method 'setores:[^']+': Error:\s*/, "")
        .replace(/^Error:\s*/, "")
    }

    return "Erro ao executar operação."
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Setores"
        subtitle="Cadastre, gerencie e restaure setores da fábrica."
      />

      <section className={ui.section}>
        {mensagemSucesso && (
          <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensagemSucesso}
          </div>
        )}

        <div className={ui.card}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={ui.title}>Setores ativos</h2>
              <p className={ui.subtitle}>
                Exibindo {setoresFiltrados.length} setor(es) ativo(s). Limite de{" "}
                {ITENS_POR_PAGINA} por página.
              </p>
            </div>

            <button
              onClick={abrirNovoSetor}
              disabled={processando}
              className={ui.buttonPrimary}
            >
              <Plus size={16} />
              Novo Setor
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
            <Search size={16} className="text-[var(--text-light)]" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por nome ou sigla..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Nome</th>
                <th className={ui.tableHeader}>Sigla</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {setoresPaginados.map((setor) => (
                <tr key={setor.id} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{setor.nome}</td>
                  <td className={ui.tableCell}>{setor.sigla}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarSetor(setor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(setor)}
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

              {setoresPaginados.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum setor ativo encontrado.
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
              <h2 className={ui.title}>Setores inativos</h2>
              <p className={ui.subtitle}>
                {setoresInativos.length} setor(es) inativo(s). Use esta área
                para restaurar ou excluir permanentemente.
              </p>
            </div>

            {mostrarInativos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {mostrarInativos && (
            <table className={ui.table}>
              <thead className="[background-color:var(--soft)]">
                <tr>
                  <th className={ui.tableHeader}>Nome</th>
                  <th className={ui.tableHeader}>Sigla</th>
                  <th className={ui.tableHeaderRight}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {setoresInativos.map((setor) => (
                  <tr
                    key={setor.id}
                    className="border-t border-[var(--border)] bg-slate-50"
                  >
                    <td className={ui.tableCellStrong}>{setor.nome}</td>
                    <td className={ui.tableCell}>{setor.sigla}</td>

                    <td className={ui.tableCell}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSetorParaRestaurar(setor)}
                          disabled={processando}
                          className={ui.buttonSecondary}
                          title="Restaurar"
                        >
                          <RotateCcw size={15} />
                          Restaurar
                        </button>

                        <button
                          onClick={() => setSetorParaExcluirPermanente(setor)}
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

                {setoresInativos.length === 0 && (
                  <tr>
                    <td colSpan={3} className={ui.empty}>
                      Nenhum setor inativo.
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
                    {modalModo === "novo" ? "Novo Setor" : "Editar Setor"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o nome e a sigla que serão utilizados no sistema.
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

              <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                <div>
                  <label className={ui.label}>Nome do Setor</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: AR CONDICIONADO"
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Sigla</label>
                  <input
                    value={sigla}
                    onChange={(event) =>
                      setSigla(event.target.value.toUpperCase())
                    }
                    disabled={processando}
                    placeholder="Ex: AC"
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
                  onClick={salvarSetor}
                  disabled={processando}
                  className={ui.buttonPrimary}
                >
                  {modalModo === "novo" ? "Salvar" : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {setorParaInativar && (
          <ModalConfirmacao
            titulo="Inativar setor"
            descricao={
              <>
                O setor <strong>{setorParaInativar.nome}</strong> ficará inativo
                e não aparecerá nas listas principais.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setSetorParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {setorParaRestaurar && (
          <ModalConfirmacao
            titulo="Restaurar setor"
            descricao={
              <>
                O setor <strong>{setorParaRestaurar.nome}</strong> voltará a
                aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setSetorParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {setorParaExcluirPermanente && (
          <ModalConfirmacao
            titulo="Excluir permanentemente"
            descricao={
              <>
                O setor <strong>{setorParaExcluirPermanente.nome}</strong> será
                removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setSetorParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}

        {setorBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Setor possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o setor{" "}
                <strong>{setorBloqueado.setor.nome}</strong>, pois existem{" "}
                <strong>{setorBloqueado.totalSubsetores}</strong> subsetor(es)
                vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Primeiro inative ou remova os subsetores vinculados e os
                cadastros dependentes deles, como postos de trabalho.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSetorBloqueado(null)}
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

type ModalConfirmacaoProps = {
  titulo: string
  descricao: React.ReactNode
  textoConfirmar: string
  perigo?: boolean
  onCancelar: () => void
  onConfirmar: () => void
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

export default SetoresPage