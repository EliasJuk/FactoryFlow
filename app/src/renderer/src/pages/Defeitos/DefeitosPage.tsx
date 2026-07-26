import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import type { Defeito } from '../../models/Defeitos'
import { ui } from '../../theme/ui'

import { Pagination } from '../../components/Pagination/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { CrudHeader } from '../../components/Crud/CrudHeader/CrudHeader'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
import { CrudModal } from '../../components/Crud/CrudModal/CrudModal'
import { InativosCard } from '../../components/Crud/InativosCard/InativosCard'
import { DefeitoInfoModal } from './components/DefeitoInfoModal'

type ModalModo = 'novo' | 'editar'

const ITENS_POR_PAGINA = 10

function DefeitosPage() {
  const { usuario } = useApp()
  const [defeitos, setDefeitos] = useState<Defeito[]>([])
  const [defeitosInativos, setDefeitosInativos] = useState<Defeito[]>([])

  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>('novo')
  const [defeitoEditando, setDefeitoEditando] = useState<Defeito | null>(null)
  const [defeitoVisualizando, setDefeitoVisualizando] = useState<Defeito | null>(null)

  const [codigo, setCodigo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  const [defeitoParaInativar, setDefeitoParaInativar] = useState<Defeito | null>(null)

  const [defeitoParaRestaurar, setDefeitoParaRestaurar] = useState<Defeito | null>(null)

  const [defeitoParaExcluirPermanente, setDefeitoParaExcluirPermanente] = useState<Defeito | null>(
    null
  )

  async function carregarDefeitos() {
    const [ativos, inativos] = await Promise.all([
      window.api.defeitos.listar(),
      window.api.defeitos.listarInativos()
    ])

    setDefeitos(ativos)
    setDefeitosInativos(inativos)
  }

  useEffect(() => {
    carregarDefeitos()
  }, [])

  const defeitosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return defeitos

    return defeitos.filter((defeito) => {
      return (
        defeito.codigo.toLowerCase().includes(termo) ||
        defeito.descricao.toLowerCase().includes(termo)
      )
    })
  }, [busca, defeitos])

  const totalPaginas = Math.max(1, Math.ceil(defeitosFiltrados.length / ITENS_POR_PAGINA))

  const defeitosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return defeitosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, defeitosFiltrados])

  useEffect(() => {
    setPaginaAtual(1)
  }, [busca])

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas)
    }
  }, [paginaAtual, totalPaginas])

  function obterUsuarioId(): number | null {
    if (!usuario.id) {
      setMensagemErro('Usuário logado não identificado.')
      return null
    }

    return usuario.id
  }

  function limparMensagens() {
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function abrirNovoDefeito() {
    if (processando) return

    limparMensagens()
    setModalModo('novo')
    setDefeitoEditando(null)
    setCodigo('')
    setDescricao('')
    setModalAberto(true)
  }

  function abrirEditarDefeito(defeito: Defeito) {
    if (processando) return

    limparMensagens()
    setModalModo('editar')
    setDefeitoEditando(defeito)
    setCodigo(defeito.codigo)
    setDescricao(defeito.descricao)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setDefeitoEditando(null)
    setCodigo('')
    setDescricao('')
    setMensagemErro('')
  }

  async function salvarDefeito() {
    if (processando) return

    setMensagemErro('')

    if (!codigo.trim() || !descricao.trim()) {
      setMensagemErro('Informe o código e a descrição do defeito.')
      return
    }

    const usuarioId = obterUsuarioId()

    if (!usuarioId) return

    setProcessando(true)

    try {
      if (modalModo === 'editar' && defeitoEditando) {
        const resultado = await window.api.defeitos.editar(
          defeitoEditando.id,
          codigo.trim().toUpperCase(),
          descricao.trim(),
          usuarioId
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Defeito atualizado com sucesso.')
      } else {
        const resultado = await window.api.defeitos.criar(
          codigo.trim().toUpperCase(),
          descricao.trim(),
          usuarioId
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Defeito cadastrado com sucesso.')
      }

      fecharModal()
      await carregarDefeitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!defeitoParaInativar || processando) return

    limparMensagens()

    const usuarioId = obterUsuarioId()

    if (!usuarioId) return

    setProcessando(true)

    try {
      const resultado = await window.api.defeitos.excluir(defeitoParaInativar.id, usuarioId)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setDefeitoParaInativar(null)
      setMensagemSucesso('Defeito inativado com sucesso.')
      await carregarDefeitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!defeitoParaRestaurar || processando) return

    limparMensagens()

    const usuarioId = obterUsuarioId()

    if (!usuarioId) return

    setProcessando(true)

    try {
      const resultado = await window.api.defeitos.restaurar(defeitoParaRestaurar.id, usuarioId)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setDefeitoParaRestaurar(null)
      setMensagemSucesso('Defeito restaurado com sucesso.')
      await carregarDefeitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!defeitoParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.defeitos.excluirPermanente(defeitoParaExcluirPermanente.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setDefeitoParaExcluirPermanente(null)
      setMensagemSucesso('Defeito excluído permanentemente.')
      await carregarDefeitos()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = codigo.trim().length > 0 && descricao.trim().length > 0 && !processando

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Defeitos"
        subtitle="Cadastre os códigos de defeitos utilizados no lançamento de refugo."
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
          titulo="Defeitos ativos"
          descricao={`Exibindo ${defeitosFiltrados.length} defeito(s) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Defeito"
          disabled={processando}
          onNovo={abrirNovoDefeito}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por código ou descrição..."
          />
        </CrudHeader>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Descrição</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {defeitosPaginados.map((defeito) => (
                <tr key={defeito.uuid} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{defeito.codigo}</td>
                  <td className={ui.tableCell}>{defeito.descricao}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDefeitoVisualizando(defeito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do defeito ${defeito.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEditarDefeito(defeito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setDefeitoParaInativar(defeito)}
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

              {defeitosPaginados.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum defeito ativo encontrado.
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
          titulo="Defeitos inativos"
          descricao={`${defeitosInativos.length} defeito(s) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Descrição</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {defeitosInativos.map((defeito) => (
                <tr key={defeito.uuid} className="border-t border-[var(--border)] bg-slate-50">
                  <td className={ui.tableCellStrong}>{defeito.codigo}</td>
                  <td className={ui.tableCell}>{defeito.descricao}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDefeitoVisualizando(defeito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do defeito ${defeito.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDefeitoParaRestaurar(defeito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setDefeitoParaExcluirPermanente(defeito)}
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

              {defeitosInativos.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum defeito inativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </InativosCard>

        {defeitoVisualizando && (
          <DefeitoInfoModal
            defeito={defeitoVisualizando}
            onFechar={() => setDefeitoVisualizando(null)}
          />
        )}

        {modalAberto && (
          <CrudModal
            titulo={modalModo === 'novo' ? 'Novo Defeito' : 'Editar Defeito'}
            subtitulo="Informe o código e a descrição do defeito."
            mensagemErro={mensagemErro}
            processando={processando}
            onFechar={fecharModal}
            footer={
              <>
                <button onClick={fecharModal} disabled={processando} className={ui.buttonSecondary}>
                  Cancelar
                </button>

                <button onClick={salvarDefeito} disabled={!podeSalvar} className={ui.buttonPrimary}>
                  {processando
                    ? 'Salvando...'
                    : modalModo === 'novo'
                      ? 'Salvar'
                      : 'Salvar Alterações'}
                </button>
              </>
            }
          >
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div>
                <label className={ui.label}>Código do Defeito</label>
                <input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                  disabled={processando}
                  placeholder="Ex: 100"
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Descrição</label>
                <input
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  disabled={processando}
                  placeholder="Ex: Peça amassada"
                  className={ui.input}
                />
              </div>
            </div>
          </CrudModal>
        )}

        {defeitoParaInativar && (
          <ConfirmDialog
            titulo="Inativar defeito"
            descricao={
              <>
                O defeito{' '}
                <strong>
                  {defeitoParaInativar.codigo} - {defeitoParaInativar.descricao}
                </strong>{' '}
                ficará inativo e não aparecerá nas listas principais.
                <br />
                <br />
                Os refugos antigos continuarão preservados com o código e a descrição utilizados no
                momento do lançamento.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setDefeitoParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {defeitoParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar defeito"
            descricao={
              <>
                O defeito{' '}
                <strong>
                  {defeitoParaRestaurar.codigo} - {defeitoParaRestaurar.descricao}
                </strong>{' '}
                voltará a aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setDefeitoParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {defeitoParaExcluirPermanente && (
          <ConfirmDialog
            titulo="Excluir permanentemente"
            descricao={
              <>
                O defeito{' '}
                <strong>
                  {defeitoParaExcluirPermanente.codigo} - {defeitoParaExcluirPermanente.descricao}
                </strong>{' '}
                será removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setDefeitoParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}
      </section>
    </main>
  )
}

export default DefeitosPage
