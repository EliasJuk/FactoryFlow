import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import type { Circuito } from '../../models/Circuito'
import { Pagination } from '../../components/Pagination/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { CrudHeader } from '../../components/Crud/CrudHeader/CrudHeader'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
import { InativosCard } from '../../components/Crud/InativosCard/InativosCard'
import { ui } from '../../theme/ui'
import { useApp } from '../../contexts/AppContext'

import { CircuitoFormModal, type CircuitoFormModo } from './components/CircuitoFormModal'
import { CircuitoInfoModal } from './components/CircuitoInfoModal'

const ITENS_POR_PAGINA = 10

function CircuitosPage() {
  const { usuario } = useApp()

  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [circuitosInativos, setCircuitosInativos] = useState<Circuito[]>([])

  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<CircuitoFormModo>('novo')
  const [circuitoEditando, setCircuitoEditando] = useState<Circuito | null>(null)
  const [circuitoVisualizando, setCircuitoVisualizando] = useState<Circuito | null>(null)

  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  const [circuitoParaInativar, setCircuitoParaInativar] = useState<Circuito | null>(null)
  const [circuitoParaRestaurar, setCircuitoParaRestaurar] = useState<Circuito | null>(null)
  const [circuitoParaExcluirPermanente, setCircuitoParaExcluirPermanente] =
    useState<Circuito | null>(null)

  async function carregarCircuitos() {
    const [ativos, inativos] = await Promise.all([
      window.api.circuitos.listar(),
      window.api.circuitos.listarInativos()
    ])

    setCircuitos(ativos)
    setCircuitosInativos(inativos)
  }

  useEffect(() => {
    carregarCircuitos()
  }, [])

  const circuitosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return circuitos

    return circuitos.filter((circuito) => {
      return (
        circuito.codigo.toLowerCase().includes(termo) || circuito.nome.toLowerCase().includes(termo)
      )
    })
  }, [busca, circuitos])

  const totalPaginas = Math.max(1, Math.ceil(circuitosFiltrados.length / ITENS_POR_PAGINA))

  const circuitosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return circuitosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, circuitosFiltrados])

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

  function abrirNovoCircuito() {
    if (processando) return

    limparMensagens()
    setModalModo('novo')
    setCircuitoEditando(null)
    setCodigo('')
    setNome('')
    setModalAberto(true)
  }

  function abrirEditarCircuito(circuito: Circuito) {
    if (processando) return

    limparMensagens()
    setModalModo('editar')
    setCircuitoEditando(circuito)
    setCodigo(circuito.codigo)
    setNome(circuito.nome)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setCircuitoEditando(null)
    setCodigo('')
    setNome('')
    setMensagemErro('')
  }

  async function salvarCircuito() {
    if (processando) return

    setMensagemErro('')

    if (!codigo.trim() || !nome.trim()) {
      setMensagemErro('Informe o código e o nome do circuito.')
      return
    }

    const usuarioId = usuario.id

    if (!usuarioId) {
      setMensagemErro('Não foi possível identificar o usuário conectado.')
      return
    }

    setProcessando(true)

    try {
      if (modalModo === 'editar' && circuitoEditando) {
        const resultado = await window.api.circuitos.editar(
          circuitoEditando.id,
          codigo.trim().toUpperCase(),
          nome.trim(),
          usuarioId
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Circuito atualizado com sucesso.')
      } else {
        const resultado = await window.api.circuitos.criar(
          codigo.trim().toUpperCase(),
          nome.trim(),
          usuarioId
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Circuito cadastrado com sucesso.')
      }

      fecharModal()
      await carregarCircuitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!circuitoParaInativar || processando) return

    const usuarioId = usuario.id

    if (!usuarioId) {
      setMensagemErro('Não foi possível identificar o usuário conectado.')
      return
    }

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.circuitos.excluir(
        circuitoParaInativar.id,
        usuarioId
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setCircuitoParaInativar(null)
      setMensagemSucesso('Circuito inativado com sucesso.')
      await carregarCircuitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!circuitoParaRestaurar || processando) return

    const usuarioId = usuario.id

    if (!usuarioId) {
      setMensagemErro('Não foi possível identificar o usuário conectado.')
      return
    }

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.circuitos.restaurar(
        circuitoParaRestaurar.id,
        usuarioId
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setCircuitoParaRestaurar(null)
      setMensagemSucesso('Circuito restaurado com sucesso.')
      await carregarCircuitos()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!circuitoParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.circuitos.excluirPermanente(
        circuitoParaExcluirPermanente.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setCircuitoParaExcluirPermanente(null)
      setMensagemSucesso('Circuito excluído permanentemente.')
      await carregarCircuitos()
    } finally {
      setProcessando(false)
    }
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Circuitos"
        subtitle="Cadastre, edite e gerencie os circuitos disponíveis."
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
          titulo="Circuitos ativos"
          descricao={`Exibindo ${circuitosFiltrados.length} circuito(s) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Circuito"
          disabled={processando}
          onNovo={abrirNovoCircuito}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por código ou nome do circuito..."
          />
        </CrudHeader>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código CTF</th>
                <th className={ui.tableHeader}>Circuito</th>
                <th className={ui.tableHeader}>Componentes</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {circuitosPaginados.map((circuito) => (
                <tr key={circuito.uuid} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{circuito.codigo}</td>
                  <td className={ui.tableCell}>{circuito.nome}</td>
                  <td className={ui.tableCell}>{circuito.totalComponentes}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCircuitoVisualizando(circuito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do circuito ${circuito.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => abrirEditarCircuito(circuito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setCircuitoParaInativar(circuito)}
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

              {circuitosPaginados.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum circuito ativo encontrado.
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
          titulo="Circuitos inativos"
          descricao={`${circuitosInativos.length} circuito(s) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código CTF</th>
                <th className={ui.tableHeader}>Circuito</th>
                <th className={ui.tableHeader}>Componentes</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {circuitosInativos.map((circuito) => (
                <tr key={circuito.uuid} className="border-t border-[var(--border)] bg-slate-50">
                  <td className={ui.tableCellStrong}>{circuito.codigo}</td>
                  <td className={ui.tableCell}>{circuito.nome}</td>
                  <td className={ui.tableCell}>{circuito.totalComponentes}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCircuitoVisualizando(circuito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do circuito ${circuito.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCircuitoParaRestaurar(circuito)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setCircuitoParaExcluirPermanente(circuito)}
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

              {circuitosInativos.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum circuito inativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </InativosCard>

        {circuitoVisualizando && (
          <CircuitoInfoModal
            circuito={circuitoVisualizando}
            onFechar={() => setCircuitoVisualizando(null)}
          />
        )}

        {modalAberto && (
          <CircuitoFormModal
            modo={modalModo}
            codigo={codigo}
            nome={nome}
            mensagemErro={mensagemErro}
            processando={processando}
            onCodigoChange={setCodigo}
            onNomeChange={setNome}
            onFechar={fecharModal}
            onSalvar={salvarCircuito}
          />
        )}

        {circuitoParaInativar && (
          <ConfirmDialog
            titulo="Inativar circuito"
            descricao={
              <>
                O circuito{' '}
                <strong>
                  {circuitoParaInativar.codigo} - {circuitoParaInativar.nome}
                </strong>{' '}
                ficará inativo e não aparecerá nas listas principais.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setCircuitoParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {circuitoParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar circuito"
            descricao={
              <>
                O circuito{' '}
                <strong>
                  {circuitoParaRestaurar.codigo} - {circuitoParaRestaurar.nome}
                </strong>{' '}
                voltará a aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setCircuitoParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {circuitoParaExcluirPermanente && (
          <ConfirmDialog
            titulo="Excluir permanentemente"
            descricao={
              <>
                O circuito{' '}
                <strong>
                  {circuitoParaExcluirPermanente.codigo} - {circuitoParaExcluirPermanente.nome}
                </strong>{' '}
                será removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setCircuitoParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}
      </section>
    </main>
  )
}

export default CircuitosPage
