import { useEffect, useMemo, useState } from "react"
import {
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

import { Pagination } from "../../components/Pagination/Pagination"
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog"
//import { Pagination } from "../../components/Crud/Pagination/Pagination"
//import { ConfirmDialog } from "../../components/Crud/ConfirmDialog/ConfirmDialog"
import { CrudHeader } from "../../components/Crud/CrudHeader/CrudHeader"
import { SearchBar } from "../../components/Crud/SearchBar/SearchBar"
import { CrudModal } from "../../components/Crud/CrudModal/CrudModal"
import { InativosCard } from "../../components/Crud/InativosCard/InativosCard"


type ModalModo = "novo" | "editar"

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

const ITENS_POR_PAGINA = 10

function PostosPage() {
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [postosInativos, setPostosInativos] = useState<Posto[]>([])

  const [busca, setBusca] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [postoEditando, setPostoEditando] = useState<Posto | null>(null)

  const [nome, setNome] = useState("")
  const [subsetorId, setSubsetorId] = useState<number | "">("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [mensagemSucesso, setMensagemSucesso] = useState("")
  const [processando, setProcessando] = useState(false)

  const [postoParaInativar, setPostoParaInativar] = useState<Posto | null>(null)
  const [postoParaRestaurar, setPostoParaRestaurar] = useState<Posto | null>(null)
  const [postoParaExcluirPermanente, setPostoParaExcluirPermanente] =
    useState<Posto | null>(null)

  const [postoBloqueado, setPostoBloqueado] = useState<{
    posto: Posto
    totalRoteiros: number
  } | null>(null)

  async function carregarDados() {
    const [subsetoresLista, postosLista, inativosLista] = await Promise.all([
      window.api.subsetores.listar(),
      window.api.postos.listar(),
      window.api.postos.listarInativos()
    ])

    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setPostosInativos(inativosLista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const postosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return postos

    return postos.filter((posto) => {
      return (
        posto.nome.toLowerCase().includes(termo) ||
        posto.subsetorNome.toLowerCase().includes(termo) ||
        posto.setorNome.toLowerCase().includes(termo)
      )
    })
  }, [busca, postos])

  const totalPaginas = Math.max(
    1,
    Math.ceil(postosFiltrados.length / ITENS_POR_PAGINA)
  )

  const postosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return postosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, postosFiltrados])

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

  function abrirNovoPosto() {
    if (processando) return

    limparMensagens()
    setModalModo("novo")
    setPostoEditando(null)
    setNome("")
    setSubsetorId(subsetores[0]?.id ?? "")
    setModalAberto(true)
  }

  function abrirEditarPosto(posto: Posto) {
    if (processando) return

    limparMensagens()
    setModalModo("editar")
    setPostoEditando(posto)
    setNome(posto.nome)
    setSubsetorId(posto.subsetorId)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setPostoEditando(null)
    setNome("")
    setSubsetorId("")
    setMensagemErro("")
  }

  async function salvarPosto() {
    if (processando) return

    setMensagemErro("")

    if (!nome.trim() || subsetorId === "") {
      setMensagemErro("Informe o subsetor e o nome do posto de trabalho.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && postoEditando) {
        const resultado = await window.api.postos.editar(
          postoEditando.id,
          nome.trim(),
          Number(subsetorId)
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Posto atualizado com sucesso.")
      } else {
        const resultado = await window.api.postos.criar(
          nome.trim(),
          Number(subsetorId)
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Posto cadastrado com sucesso.")
      }

      fecharModal()
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(posto: Posto) {
    if (processando) return

    limparMensagens()

    const totalRoteiros = await window.api.postos.contarRoteirosAtivos(posto.id)

    if (totalRoteiros > 0) {
      setPostoBloqueado({
        posto,
        totalRoteiros
      })
      return
    }

    setPostoParaInativar(posto)
  }

  async function confirmarInativacao() {
    if (!postoParaInativar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.postos.excluir(postoParaInativar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setPostoParaInativar(null)
      setMensagemSucesso("Posto inativado com sucesso.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!postoParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.postos.restaurar(postoParaRestaurar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setPostoParaRestaurar(null)
      setMensagemSucesso("Posto restaurado com sucesso.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!postoParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.postos.excluirPermanente(
        postoParaExcluirPermanente.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setPostoParaExcluirPermanente(null)
      setMensagemSucesso("Posto excluído permanentemente.")
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = nome.trim().length > 0 && subsetorId !== ""

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Postos de Trabalho"
        subtitle="Cadastre e gerencie os postos vinculados aos subsetores."
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

        <CrudHeader
          titulo="Postos ativos"
          descricao={`Exibindo ${postosFiltrados.length} posto(s) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Posto"
          disabled={processando}
          onNovo={abrirNovoPosto}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por setor, subsetor ou posto..."
          />
        </CrudHeader>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeader}>Posto</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {postosPaginados.map((posto) => (
                <tr
                  key={posto.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCell}>{posto.setorNome}</td>
                  <td className={ui.tableCell}>{posto.subsetorNome}</td>
                  <td className={ui.tableCellStrong}>{posto.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarPosto(posto)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(posto)}
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

              {postosPaginados.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum posto ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onPaginaAnterior={() =>
            setPaginaAtual((pagina) => Math.max(1, pagina - 1))
          }
          onProximaPagina={() =>
            setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
          }
        />

        <InativosCard
          titulo="Postos inativos"
          descricao={`${postosInativos.length} posto(s) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeader}>Posto</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {postosInativos.map((posto) => (
                <tr
                  key={posto.id}
                  className="border-t border-[var(--border)] bg-slate-50"
                >
                  <td className={ui.tableCell}>{posto.setorNome}</td>
                  <td className={ui.tableCell}>{posto.subsetorNome}</td>
                  <td className={ui.tableCellStrong}>{posto.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setPostoParaRestaurar(posto)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setPostoParaExcluirPermanente(posto)}
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

              {postosInativos.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum posto inativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </InativosCard>

        {modalAberto && (
          <CrudModal
            titulo={modalModo === "novo" ? "Novo Posto" : "Editar Posto"}
            subtitulo="Informe o subsetor e o nome do posto de trabalho."
            mensagemErro={mensagemErro}
            processando={processando}
            onFechar={fecharModal}
            footer={
              <>
                <button
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarPosto}
                  disabled={!podeSalvar || processando}
                  className={ui.buttonPrimary}
                >
                  {processando
                    ? "Salvando..."
                    : modalModo === "novo"
                      ? "Salvar"
                      : "Salvar Alterações"}
                </button>
              </>
            }
          >
            <div className="grid gap-3 md:grid-cols-[260px_1fr]">
              <div>
                <label className={ui.label}>Subsetor</label>
                <select
                  value={subsetorId}
                  onChange={(event) =>
                    setSubsetorId(
                      event.target.value === "" ? "" : Number(event.target.value)
                    )
                  }
                  disabled={processando}
                  className={ui.select}
                >
                  <option value="">Selecione...</option>

                  {subsetores.map((subsetor) => (
                    <option key={subsetor.id} value={subsetor.id}>
                      {subsetor.setorNome} - {subsetor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={ui.label}>Nome do Posto</label>
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  disabled={processando}
                  placeholder="Ex: Posto 01"
                  className={ui.input}
                />
              </div>
            </div>
          </CrudModal>
        )}

        {postoParaInativar && (
          <ConfirmDialog
            titulo="Inativar posto"
            descricao={
              <>
                O posto <strong>{postoParaInativar.nome}</strong> ficará inativo
                e não aparecerá nas listas principais.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setPostoParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {postoParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar posto"
            descricao={
              <>
                O posto <strong>{postoParaRestaurar.nome}</strong> voltará a
                aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setPostoParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {postoParaExcluirPermanente && (
          <ConfirmDialog
            titulo="Excluir permanentemente"
            descricao={
              <>
                O posto <strong>{postoParaExcluirPermanente.nome}</strong> será
                removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setPostoParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}

        {postoBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Posto possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o posto{" "}
                <strong>{postoBloqueado.posto.nome}</strong>, pois existem{" "}
                <strong>{postoBloqueado.totalRoteiros}</strong> roteiro(s)
                vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Primeiro remova ou inative os roteiros vinculados a este posto.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPostoBloqueado(null)}
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

export default PostosPage