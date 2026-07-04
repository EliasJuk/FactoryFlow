import { useEffect, useMemo, useState } from "react"
import { Pencil, RotateCcw, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

import { Pagination } from "../../components/Pagination/Pagination"
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog"
import { CrudHeader } from "../../components/Crud/CrudHeader/CrudHeader"
import { SearchBar } from "../../components/Crud/SearchBar/SearchBar"
import { CrudModal } from "../../components/Crud/CrudModal/CrudModal"
import { InativosCard } from "../../components/Crud/InativosCard/InativosCard"

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
        const resultado = await window.api.setores.editar(
          setorEditando.id,
          nome.trim(),
          sigla.trim().toUpperCase()
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Setor atualizado com sucesso.")
      } else {
        const resultado = await window.api.setores.criar(
          nome.trim(),
          sigla.trim().toUpperCase()
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso("Setor cadastrado com sucesso.")
      }

      fecharModal()
      await atualizarListas()
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
      const resultado = await window.api.setores.excluir(setorParaInativar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSetorParaInativar(null)
      setMensagemSucesso("Setor inativado com sucesso.")
      await atualizarListas()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!setorParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.setores.restaurar(setorParaRestaurar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSetorParaRestaurar(null)
      setMensagemSucesso("Setor restaurado com sucesso.")
      await atualizarListas()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!setorParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.setores.excluirPermanente(
        setorParaExcluirPermanente.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSetorParaExcluirPermanente(null)
      setMensagemSucesso("Setor excluído permanentemente.")
      await atualizarListas()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = nome.trim().length > 0 && sigla.trim().length > 0

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

        {mensagemErro && !modalAberto && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        <CrudHeader
          titulo="Setores ativos"
          descricao={`Exibindo ${setoresFiltrados.length} setor(es) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Setor"
          disabled={processando}
          onNovo={abrirNovoSetor}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por nome ou sigla..."
          />
        </CrudHeader>

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
          titulo="Setores inativos"
          descricao={`${setoresInativos.length} setor(es) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
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
        </InativosCard>

        {modalAberto && (
          <CrudModal
            titulo={modalModo === "novo" ? "Novo Setor" : "Editar Setor"}
            subtitulo="Informe o nome e a sigla que serão utilizados no sistema."
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
                  onClick={salvarSetor}
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
          </CrudModal>
        )}

        {setorParaInativar && (
          <ConfirmDialog
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
          <ConfirmDialog
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
          <ConfirmDialog
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
          <ConfirmDialog
            titulo="Setor possui vínculos"
            descricao={
              <>
                Não é possível inativar o setor{" "}
                <strong>{setorBloqueado.setor.nome}</strong>, pois existem{" "}
                <strong>{setorBloqueado.totalSubsetores}</strong> subsetor(es)
                vinculado(s) a ele.
                <br />
                <br />
                Primeiro inative ou remova os subsetores vinculados e os
                cadastros dependentes deles, como postos de trabalho.
              </>
            }
            textoConfirmar="Voltar"
            onCancelar={() => setSetorBloqueado(null)}
            onConfirmar={() => setSetorBloqueado(null)}
          />
        )}
      </section>
    </main>
  )
}

export default SetoresPage