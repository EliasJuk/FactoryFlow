import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import type { Componente } from '../../models/Componente'
import { ui } from '../../theme/ui'

import { Pagination } from '../../components/Pagination/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { CrudHeader } from '../../components/Crud/CrudHeader/CrudHeader'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
import { CrudModal } from '../../components/Crud/CrudModal/CrudModal'
import { InativosCard } from '../../components/Crud/InativosCard/InativosCard'
import { ComponenteInfoModal } from './components/ComponenteInfoModal'

type ModalModo = 'novo' | 'editar'

const ITENS_POR_PAGINA = 10

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

function converterValorMonetario(valor: string) {
  const normalizado = valor.replace(/\./g, '').replace(',', '.')
  const numero = Number(normalizado)

  return Number.isNaN(numero) ? 0 : numero
}

function ComponentesPage() {
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [componentesInativos, setComponentesInativos] = useState<Componente[]>([])

  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>('novo')
  const [componenteEditando, setComponenteEditando] = useState<Componente | null>(null)
  const [componenteVisualizando, setComponenteVisualizando] = useState<Componente | null>(null)

  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [precoAtual, setPrecoAtual] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  const [componenteParaInativar, setComponenteParaInativar] = useState<Componente | null>(null)

  const [componenteParaRestaurar, setComponenteParaRestaurar] = useState<Componente | null>(null)

  const [componenteParaExcluirPermanente, setComponenteParaExcluirPermanente] =
    useState<Componente | null>(null)

  async function carregarComponentes() {
    const [ativos, inativos] = await Promise.all([
      window.api.componentes.listar(),
      window.api.componentes.listarInativos()
    ])

    setComponentes(ativos)
    setComponentesInativos(inativos)
  }

  useEffect(() => {
    carregarComponentes()
  }, [])

  const componentesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return componentes

    return componentes.filter((componente) => {
      return (
        componente.codigo.toLowerCase().includes(termo) ||
        componente.nome.toLowerCase().includes(termo)
      )
    })
  }, [busca, componentes])

  const totalPaginas = Math.max(1, Math.ceil(componentesFiltrados.length / ITENS_POR_PAGINA))

  const componentesPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return componentesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [paginaAtual, componentesFiltrados])

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

  function abrirNovoComponente() {
    if (processando) return

    limparMensagens()
    setModalModo('novo')
    setComponenteEditando(null)
    setCodigo('')
    setNome('')
    setPrecoAtual('')
    setModalAberto(true)
  }

  function abrirEditarComponente(componente: Componente) {
    if (processando) return

    limparMensagens()
    setModalModo('editar')
    setComponenteEditando(componente)
    setCodigo(componente.codigo)
    setNome(componente.nome)
    setPrecoAtual(componente.precoAtual ? String(componente.precoAtual).replace('.', ',') : '')
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    setComponenteEditando(null)
    setCodigo('')
    setNome('')
    setPrecoAtual('')
    setMensagemErro('')
  }

  async function salvarComponente() {
    if (processando) return

    setMensagemErro('')

    if (!codigo.trim() || !nome.trim()) {
      setMensagemErro('Informe o código CTF e o nome do componente.')
      return
    }

    setProcessando(true)

    try {
      const valor = converterValorMonetario(precoAtual)

      if (modalModo === 'editar' && componenteEditando) {
        const resultado = await window.api.componentes.editar(
          componenteEditando.id,
          codigo.trim().toUpperCase(),
          nome.trim(),
          valor
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Componente atualizado com sucesso.')
      } else {
        const resultado = await window.api.componentes.criar(
          codigo.trim().toUpperCase(),
          nome.trim(),
          valor
        )

        if (!resultado.sucesso) {
          setMensagemErro(resultado.mensagem)
          return
        }

        setMensagemSucesso('Componente cadastrado com sucesso.')
      }

      fecharModal()
      await carregarComponentes()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!componenteParaInativar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.componentes.excluir(componenteParaInativar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setComponenteParaInativar(null)
      setMensagemSucesso('Componente inativado com sucesso.')
      await carregarComponentes()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!componenteParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.componentes.restaurar(componenteParaRestaurar.id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setComponenteParaRestaurar(null)
      setMensagemSucesso('Componente restaurado com sucesso.')
      await carregarComponentes()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExclusaoPermanente() {
    if (!componenteParaExcluirPermanente || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.componentes.excluirPermanente(
        componenteParaExcluirPermanente.id
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setComponenteParaExcluirPermanente(null)
      setMensagemSucesso('Componente excluído permanentemente.')
      await carregarComponentes()
    } finally {
      setProcessando(false)
    }
  }

  const podeSalvar = codigo.trim().length > 0 && nome.trim().length > 0 && !processando

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Componentes"
        subtitle="Cadastre os componentes usados nos circuitos e seus preços vigentes."
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
          titulo="Componentes ativos"
          descricao={`Exibindo ${componentesFiltrados.length} componente(s) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Componente"
          disabled={processando}
          onNovo={abrirNovoComponente}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por código CTF ou nome..."
          />
        </CrudHeader>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código CTF</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Preço atual</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {componentesPaginados.map((componente) => (
                <tr key={componente.uuid} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{componente.codigo}</td>
                  <td className={ui.tableCell}>{componente.nome}</td>
                  <td className={ui.tableCell}>{formatarMoeda(componente.precoAtual)}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setComponenteVisualizando(componente)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do componente ${componente.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEditarComponente(componente)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setComponenteParaInativar(componente)}
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

              {componentesPaginados.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum componente ativo encontrado.
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
          titulo="Componentes inativos"
          descricao={`${componentesInativos.length} componente(s) inativo(s). Use esta área para restaurar ou excluir permanentemente.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código CTF</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Preço atual</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {componentesInativos.map((componente) => (
                <tr key={componente.uuid} className="border-t border-[var(--border)] bg-slate-50">
                  <td className={ui.tableCellStrong}>{componente.codigo}</td>
                  <td className={ui.tableCell}>{componente.nome}</td>
                  <td className={ui.tableCell}>{formatarMoeda(componente.precoAtual)}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setComponenteVisualizando(componente)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações do componente ${componente.codigo}`}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setComponenteParaRestaurar(componente)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setComponenteParaExcluirPermanente(componente)}
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

              {componentesInativos.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum componente inativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </InativosCard>

        {componenteVisualizando && (
          <ComponenteInfoModal
            componente={componenteVisualizando}
            onFechar={() => setComponenteVisualizando(null)}
          />
        )}

        {modalAberto && (
          <CrudModal
            titulo={modalModo === 'novo' ? 'Novo Componente' : 'Editar Componente'}
            subtitulo="Informe o código, o nome e o preço vigente do componente."
            mensagemErro={mensagemErro}
            processando={processando}
            onFechar={fecharModal}
            maxWidth="max-w-2xl"
            footer={
              <>
                <button onClick={fecharModal} disabled={processando} className={ui.buttonSecondary}>
                  Cancelar
                </button>

                <button
                  onClick={salvarComponente}
                  disabled={!podeSalvar}
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
            <div className="grid gap-3 md:grid-cols-[180px_1fr_180px]">
              <div>
                <label className={ui.label}>Código CTF</label>
                <input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                  disabled={processando}
                  placeholder="Ex: 33-0000-0000"
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Nome do Componente</label>
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  disabled={processando}
                  placeholder="Ex: Manga de proteção"
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Preço atual</label>
                <div className="relative">
                  <DollarSign
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={precoAtual}
                    onChange={(event) => setPrecoAtual(event.target.value)}
                    disabled={processando}
                    placeholder="0,00"
                    className={`${ui.input} pl-9`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              <strong>Observação:</strong> ao alterar o preço, o valor antigo fica preservado no
              histórico. Os refugos já lançados continuam com o preço usado no momento do
              lançamento.
            </div>
          </CrudModal>
        )}

        {componenteParaInativar && (
          <ConfirmDialog
            titulo="Inativar componente"
            descricao={
              <>
                O componente{' '}
                <strong>
                  {componenteParaInativar.codigo} - {componenteParaInativar.nome}
                </strong>{' '}
                ficará inativo e não aparecerá nas listas principais.
                <br />
                <br />
                Os refugos antigos continuarão preservados com o código, nome e preço utilizados no
                momento do lançamento.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setComponenteParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {componenteParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar componente"
            descricao={
              <>
                O componente{' '}
                <strong>
                  {componenteParaRestaurar.codigo} - {componenteParaRestaurar.nome}
                </strong>{' '}
                voltará a aparecer nas listas principais.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setComponenteParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {componenteParaExcluirPermanente && (
          <ConfirmDialog
            titulo="Excluir permanentemente"
            descricao={
              <>
                O componente{' '}
                <strong>
                  {componenteParaExcluirPermanente.codigo} - {componenteParaExcluirPermanente.nome}
                </strong>{' '}
                será removido definitivamente. Esta ação não poderá ser desfeita.
              </>
            }
            textoConfirmar="Excluir permanentemente"
            perigo
            onCancelar={() => setComponenteParaExcluirPermanente(null)}
            onConfirmar={confirmarExclusaoPermanente}
          />
        )}
      </section>
    </main>
  )
}

export default ComponentesPage
