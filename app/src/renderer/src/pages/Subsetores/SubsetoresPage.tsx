import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import type { Setor } from '../../models/Setor'
import type { Subsetor } from '../../models/Subsetor'
import { ui } from '../../theme/ui'

import { Pagination } from '../../components/Pagination/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { CrudHeader } from '../../components/Crud/CrudHeader/CrudHeader'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
import { CrudModal } from '../../components/Crud/CrudModal/CrudModal'
import { InativosCard } from '../../components/Crud/InativosCard/InativosCard'
import { SubsetorInfoModal } from './components/SubsetorInfoModal'

type ModalModo = 'novo' | 'editar'

const ITENS_POR_PAGINA = 10

function SubsetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [subsetoresInativos, setSubsetoresInativos] = useState<Subsetor[]>([])

  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>('novo')
  const [subsetorEditando, setSubsetorEditando] = useState<Subsetor | null>(null)
  const [subsetorVisualizando, setSubsetorVisualizando] = useState<Subsetor | null>(null)

  const [nome, setNome] = useState('')
  const [setorId, setSetorId] = useState<number | ''>('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  const [subsetorParaInativar, setSubsetorParaInativar] = useState<Subsetor | null>(null)

  const [subsetorParaRestaurar, setSubsetorParaRestaurar] = useState<Subsetor | null>(null)

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

  const totalPaginas = Math.max(1, Math.ceil(subsetoresFiltrados.length / ITENS_POR_PAGINA))

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
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function abrirNovoSubsetor() {
    if (processando) return

    limparMensagens()
    setModalModo('novo')
    setSubsetorEditando(null)
    setNome('')
    setSetorId(setores[0]?.id ?? '')
    setModalAberto(true)
  }

  function abrirEditarSubsetor(subsetor: Subsetor) {
    if (processando) return

    limparMensagens()
    setModalModo('editar')
    setSubsetorEditando(subsetor)
    setNome(subsetor.nome)
    setSetorId(subsetor.setorId)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setSubsetorEditando(null)
    setNome('')
    setSetorId('')
    setMensagemErro('')
  }

  async function salvarSubsetor() {
    if (processando) return

    setMensagemErro('')

    if (!nome.trim() || setorId === '') {
      setMensagemErro('Informe o setor e o nome do subsetor.')
      return
    }

    setProcessando(true)

    try {
      if (modalModo === 'editar' && subsetorEditando) {
        const resultado = await window.api.subsetores.editar(
          subsetorEditando.id,
          nome.trim(),
          Number(setorId)
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Subsetor atualizado com sucesso.')
      } else {
        const resultado = await window.api.subsetores.criar(nome.trim(), Number(setorId))

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Subsetor cadastrado com sucesso.')
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

    const totalPostos = await window.api.subsetores.contarPostosAtivos(subsetor.id)

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
      const resultado = await window.api.subsetores.excluir(subsetorParaInativar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSubsetorParaInativar(null)
      setMensagemSucesso('Subsetor inativado com sucesso.')
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
      const resultado = await window.api.subsetores.restaurar(subsetorParaRestaurar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setSubsetorParaRestaurar(null)
      setMensagemSucesso('Subsetor restaurado com sucesso.')
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
      setMensagemSucesso('Subsetor excluído permanentemente.')
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = nome.trim().length > 0 && setorId !== ''

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

        <CrudHeader
          titulo="Subsetores ativos"
          descricao={`Exibindo ${subsetoresFiltrados.length} subsetor(es) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Subsetor"
          disabled={processando}
          onNovo={abrirNovoSubsetor}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por setor ou subsetor..."
          />
        </CrudHeader>

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
                <tr key={subsetor.uuid} className="border-t border-[var(--border)]">
                  <td className={ui.tableCell}>{subsetor.setorNome}</td>
                  <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSubsetorVisualizando(subsetor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do subsetor ${subsetor.nome}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
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

        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onPaginaAnterior={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
          onProximaPagina={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
        />

        <InativosCard
          titulo="Subsetores inativos"
          descricao={`${subsetoresInativos.length} subsetor(es) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
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
                <tr key={subsetor.uuid} className="border-t border-[var(--border)] bg-slate-50">
                  <td className={ui.tableCell}>{subsetor.setorNome}</td>
                  <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSubsetorVisualizando(subsetor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do subsetor ${subsetor.nome}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubsetorParaRestaurar(subsetor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setSubsetorParaExcluirPermanente(subsetor)}
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
        </InativosCard>

        {subsetorVisualizando && (
          <SubsetorInfoModal
            subsetor={subsetorVisualizando}
            onFechar={() => setSubsetorVisualizando(null)}
          />
        )}

        {modalAberto && (
          <CrudModal
            titulo={modalModo === 'novo' ? 'Novo Subsetor' : 'Editar Subsetor'}
            subtitulo="Informe o setor responsável e o nome do subsetor."
            mensagemErro={mensagemErro}
            processando={processando}
            onFechar={fecharModal}
            footer={
              <>
                <button onClick={fecharModal} disabled={processando} className={ui.buttonSecondary}>
                  Cancelar
                </button>

                <button
                  onClick={salvarSubsetor}
                  disabled={!podeSalvar || processando}
                  className={ui.buttonPrimary}
                >
                  {processando
                    ? 'Salvando...'
                    : modalModo === 'novo'
                      ? 'Salvar'
                      : 'Salvar Alterações'}
                </button>
              </>
            }
          >
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <div>
                <label className={ui.label}>Setor</label>
                <select
                  value={setorId}
                  onChange={(event) =>
                    setSetorId(event.target.value === '' ? '' : Number(event.target.value))
                  }
                  disabled={processando}
                  className={ui.select}
                >
                  <option value="">Selecione...</option>

                  {setores.map((setor) => (
                    <option key={setor.uuid} value={setor.id}>
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
          </CrudModal>
        )}

        {subsetorParaInativar && (
          <ConfirmDialog
            titulo="Inativar subsetor"
            descricao={
              <>
                O subsetor <strong>{subsetorParaInativar.nome}</strong> ficará inativo e não
                aparecerá nas listas principais.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setSubsetorParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {subsetorParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar subsetor"
            descricao={
              <>
                O subsetor <strong>{subsetorParaRestaurar.nome}</strong> voltará a aparecer nas
                listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setSubsetorParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {subsetorParaExcluirPermanente && (
          <ConfirmDialog
            titulo="Excluir permanentemente"
            descricao={
              <>
                O subsetor <strong>{subsetorParaExcluirPermanente.nome}</strong> será removido
                definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setSubsetorParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}

        {subsetorBloqueado && (
          <ConfirmDialog
            titulo="Subsetor possui vínculos"
            descricao={
              <>
                Não é possível inativar o subsetor{' '}
                <strong>{subsetorBloqueado.subsetor.nome}</strong>, pois existem{' '}
                <strong>{subsetorBloqueado.totalPostos}</strong> posto(s) de trabalho vinculado(s) a
                ele.
                <br />
                <br />
                Primeiro inative ou remova os postos de trabalho vinculados a este subsetor.
              </>
            }
            textoConfirmar="Voltar"
            onCancelar={() => setSubsetorBloqueado(null)}
            onConfirmar={() => setSubsetorBloqueado(null)}
          />
        )}
      </section>
    </main>
  )
}

export default SubsetoresPage
