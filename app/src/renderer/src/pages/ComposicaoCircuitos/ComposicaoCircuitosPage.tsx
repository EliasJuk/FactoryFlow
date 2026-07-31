import { useEffect, useMemo, useState } from 'react'
import { Lightbulb, Plus, RotateCcw } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
import { Pagination } from '../../components/Pagination/Pagination'
import type { Circuito } from '../../models/Circuito'
import type { CircuitoComponente } from '../../models/CircuitoComponente'
import type { Posto } from '../../models/Posto'
import type { Setor } from '../../models/Setor'
import type { Subsetor } from '../../models/Subsetor'
import type { RoteiroComponente } from '../../models/Roteiro'
import { ui } from '../../theme/ui'

import { CircuitoFormModal } from '../Circuitos/components/CircuitoFormModal'
import { AdicionarComponenteModal } from './components/AdicionarComponenteModal'
import { ComposicaoCircuitoCard } from './components/ComposicaoCircuitoCard'
import { CircuitoComponenteInfoModal } from './components/CircuitoComponenteInfoModal'

type FiltroComponentes = 'todos' | 'com' | 'sem'

const ITENS_POR_PAGINA = 10

function ComposicaoCircuitosPage() {
  const { usuario } = useApp()
  const podeGerenciar = usuario.perfil === 'QUALIDADE' || usuario.perfil === 'ADMIN'

  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [componentes, setComponentes] = useState<
    Awaited<ReturnType<typeof window.api.componentes.listar>>
  >([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [roteiros, setRoteiros] = useState<RoteiroComponente[]>([])

  const [itensPorCircuito, setItensPorCircuito] = useState<Record<number, CircuitoComponente[]>>({})
  const [carregandoCircuitoId, setCarregandoCircuitoId] = useState<number | null>(null)
  const [circuitoAbertoId, setCircuitoAbertoId] = useState<number | null>(null)
  const [circuitoSelecionado, setCircuitoSelecionado] = useState<Circuito | null>(null)
  const [itemVisualizando, setItemVisualizando] = useState<CircuitoComponente | null>(null)

  const [busca, setBusca] = useState('')
  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')
  const [filtroComponentes, setFiltroComponentes] = useState<FiltroComponentes>('todos')
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [modalCircuitoAberto, setModalCircuitoAberto] = useState(false)
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [erroAdicionarComponente, setErroAdicionarComponente] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  async function carregarDados() {
    const [
      circuitosLista,
      componentesLista,
      setoresLista,
      subsetoresLista,
      postosLista,
      roteirosLista
    ] = await Promise.all([
      window.api.circuitos.listar(),
      window.api.componentes.listar(),
      window.api.setores.listar(),
      window.api.subsetores.listar(),
      window.api.postos.listar(),
      window.api.roteiro.listarTodos()
    ])

    setCircuitos(circuitosLista)
    setComponentes(componentesLista)
    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setRoteiros(roteirosLista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const subsetoresFiltrados = useMemo(() => {
    if (setorId === '') return subsetores

    return subsetores.filter((subsetor) => subsetor.setorId === Number(setorId))
  }, [setorId, subsetores])

  const postosFiltrados = useMemo(() => {
    if (subsetorId !== '') {
      return postos.filter((posto) => posto.subsetorId === Number(subsetorId))
    }

    if (setorId === '') return postos

    const subsetoresIds = new Set(subsetoresFiltrados.map((subsetor) => subsetor.id))

    return postos.filter((posto) => subsetoresIds.has(posto.subsetorId))
  }, [postos, setorId, subsetorId, subsetoresFiltrados])

  const circuitosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const postosPermitidos = new Set(postosFiltrados.map((posto) => posto.id))

    const circuitosPorEstrutura = new Set(
      roteiros
        .filter((item) => {
          if (postoId !== '') {
            return item.postoId === Number(postoId)
          }

          if (subsetorId !== '' || setorId !== '') {
            return postosPermitidos.has(item.postoId)
          }

          return true
        })
        .map((item) => item.circuitoId)
    )

    return circuitos.filter((circuito) => {
      const correspondeBusca =
        !termo ||
        circuito.codigo.toLowerCase().includes(termo) ||
        circuito.nome.toLowerCase().includes(termo)

      const correspondeComponentes =
        filtroComponentes === 'todos' ||
        (filtroComponentes === 'com' && circuito.totalComponentes > 0) ||
        (filtroComponentes === 'sem' && circuito.totalComponentes === 0)

      const usaFiltroEstrutura = setorId !== '' || subsetorId !== '' || postoId !== ''

      const correspondeEstrutura = !usaFiltroEstrutura || circuitosPorEstrutura.has(circuito.id)

      return correspondeBusca && correspondeComponentes && correspondeEstrutura
    })
  }, [busca, circuitos, filtroComponentes, postoId, postosFiltrados, roteiros, setorId, subsetorId])

  const totalPaginas = Math.max(1, Math.ceil(circuitosFiltrados.length / ITENS_POR_PAGINA))

  const circuitosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA

    return circuitosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [circuitosFiltrados, paginaAtual])

  useEffect(() => {
    setPaginaAtual(1)
    setCircuitoAbertoId(null)
  }, [busca, setorId, subsetorId, postoId, filtroComponentes])

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas)
    }
  }, [paginaAtual, totalPaginas])

  async function abrirCircuito(circuito: Circuito) {
    if (circuitoAbertoId === circuito.id) {
      setCircuitoAbertoId(null)
      return
    }

    setCircuitoAbertoId(circuito.id)

    if (itensPorCircuito[circuito.id]) return

    setCarregandoCircuitoId(circuito.id)

    try {
      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuito.id)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuito.id]: itens
      }))
    } finally {
      setCarregandoCircuitoId(null)
    }
  }

  function abrirNovoCircuito() {
    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para cadastrar circuitos.')
      return
    }

    setCodigo('')
    setNome('')
    setMensagemErro('')
    setModalCircuitoAberto(true)
  }

  async function salvarNovoCircuito() {
    if (!codigo.trim() || !nome.trim() || processando) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para cadastrar circuitos.')
      return
    }

    setProcessando(true)
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.circuitos.criar(codigo.trim().toUpperCase(), nome.trim())

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setModalCircuitoAberto(false)
      setMensagemSucesso('Circuito cadastrado com sucesso.')
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function adicionarComponente(componenteId: number, quantidade: number) {
    if (!circuitoSelecionado || processando) return

    if (!podeGerenciar) {
      setErroAdicionarComponente(
        'Você não possui permissão para adicionar componentes ao circuito.'
      )
      return
    }

    setProcessando(true)
    setErroAdicionarComponente('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.circuitoComponentes.adicionar(
        circuitoSelecionado.id,
        componenteId,
        quantidade
      )

      if (!resultado.sucesso) {
        setErroAdicionarComponente(resultado.mensagem)
        return
      }

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoSelecionado.id)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoSelecionado.id]: itens
      }))

      setModalAdicionarAberto(false)
      setErroAdicionarComponente('')
      setMensagemSucesso(resultado.mensagem)
      await carregarDados()
    } catch {
      setErroAdicionarComponente(
        'Não foi possível adicionar o componente. Verifique os dados e tente novamente.'
      )
    } finally {
      setProcessando(false)
    }
  }

  async function editarQuantidade(circuitoId: number, id: number, quantidade: number) {
    if (processando) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para alterar a composição do circuito.')
      return
    }

    setProcessando(true)
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.circuitoComponentes.editarQuantidade(id, quantidade)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoId]: itens
      }))

      setMensagemSucesso(resultado.mensagem)
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function removerComponente(circuitoId: number, id: number) {
    if (processando) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para alterar a composição do circuito.')
      return
    }

    setProcessando(true)
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.circuitoComponentes.remover(id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoId]: itens
      }))

      setMensagemSucesso(resultado.mensagem)
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  function limparFiltros() {
    setBusca('')
    setSetorId('')
    setSubsetorId('')
    setPostoId('')
    setFiltroComponentes('todos')
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Composição de Circuitos"
        subtitle="Visualize e gerencie os componentes utilizados em cada circuito."
      />
      <section className={ui.section}>
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-amber-950 shadow-sm">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="shrink-0 text-amber-500" />

            <p className="text-sm leading-5">
              <span className="font-bold">Nota:</span> Cadastre todos os componentes que podem ser
              encontrados ou que estejam relacionados ao circuito. Esses componentes poderão ser
              utilizados posteriormente nos roteiros e nos lançamentos de refugo.
            </p>
          </div>
        </div>

        {mensagemSucesso && (
          <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensagemSucesso}
          </div>
        )}

        {mensagemErro && !modalCircuitoAberto && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        <div className={ui.card}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[280px] flex-1">
              <SearchBar
                value={busca}
                onChange={setBusca}
                placeholder="Pesquisar por código ou nome do circuito..."
              />
            </div>

            <button
              type="button"
              onClick={abrirNovoCircuito}
              disabled={processando || !podeGerenciar}
              className={ui.buttonPrimary}
            >
              <Plus size={16} />
              Novo Circuito
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Exibindo {circuitosFiltrados.length} circuito(s). Limite de {ITENS_POR_PAGINA} por
            página.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => {
                  const valor = event.target.value
                  setSetorId(valor === '' ? '' : Number(valor))
                  setSubsetorId('')
                  setPostoId('')
                }}
                className={ui.select}
              >
                <option value="">Todos</option>
                {setores.map((setor) => (
                  <option key={setor.uuid} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={ui.label}>Subsetor</label>
              <select
                value={subsetorId}
                onChange={(event) => {
                  const valor = event.target.value
                  setSubsetorId(valor === '' ? '' : Number(valor))
                  setPostoId('')
                }}
                className={ui.select}
              >
                <option value="">Todos</option>
                {subsetoresFiltrados.map((subsetor) => (
                  <option key={subsetor.uuid} value={subsetor.id}>
                    {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={ui.label}>Posto de trabalho</label>
              <select
                value={postoId}
                onChange={(event) => {
                  const valor = event.target.value
                  setPostoId(valor === '' ? '' : Number(valor))
                }}
                className={ui.select}
              >
                <option value="">Todos</option>
                {postosFiltrados.map((posto) => (
                  <option key={posto.uuid} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={ui.label}>Componentes</label>
              <select
                value={filtroComponentes}
                onChange={(event) => setFiltroComponentes(event.target.value as FiltroComponentes)}
                className={ui.select}
              >
                <option value="todos">Todos</option>
                <option value="com">Com componentes</option>
                <option value="sem">Sem componentes</option>
              </select>
            </div>

            <div className="flex items-end md:col-span-1">
              <button
                type="button"
                onClick={limparFiltros}
                className={`${ui.buttonSecondary} w-full justify-center whitespace-nowrap px-3`}
                title="Limpar filtros"
              >
                <RotateCcw size={15} />
                <span className="md:hidden xl:inline">Limpar</span>
              </button>
            </div>
          </div>

          {(setorId !== '' || subsetorId !== '' || postoId !== '') && (
            <p className="mt-3 text-xs text-slate-500">
              Os filtros de setor, subsetor e posto consideram os roteiros cadastrados.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {circuitosPaginados.map((circuito) => (
            <ComposicaoCircuitoCard
              key={circuito.uuid}
              circuito={circuito}
              itens={itensPorCircuito[circuito.id] ?? []}
              aberto={circuitoAbertoId === circuito.id}
              carregando={carregandoCircuitoId === circuito.id}
              processando={processando}
              podeGerenciar={podeGerenciar}
              onToggle={() => abrirCircuito(circuito)}
              onVisualizar={setItemVisualizando}
              onAdicionar={() => {
                setCircuitoSelecionado(circuito)
                setErroAdicionarComponente('')
                setModalAdicionarAberto(true)
              }}
              onEditarQuantidade={(id, quantidade) => editarQuantidade(circuito.id, id, quantidade)}
              onRemover={(id) => removerComponente(circuito.id, id)}
            />
          ))}

          {circuitosFiltrados.length === 0 && (
            <div className={`${ui.card} ${ui.empty}`}>
              Nenhum circuito encontrado com os filtros selecionados.
            </div>
          )}
        </div>

        {circuitosFiltrados.length > 0 && (
          <Pagination
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onPaginaAnterior={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
            onProximaPagina={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
          />
        )}

        {itemVisualizando && (
          <CircuitoComponenteInfoModal
            item={itemVisualizando}
            onFechar={() => setItemVisualizando(null)}
          />
        )}

        {modalCircuitoAberto && (
          <CircuitoFormModal
            modo="novo"
            codigo={codigo}
            nome={nome}
            mensagemErro={mensagemErro}
            processando={processando}
            onCodigoChange={setCodigo}
            onNomeChange={setNome}
            onFechar={() => setModalCircuitoAberto(false)}
            onSalvar={salvarNovoCircuito}
          />
        )}

        {modalAdicionarAberto && circuitoSelecionado && (
          <AdicionarComponenteModal
            componentes={componentes}
            processando={processando}
            mensagemErro={erroAdicionarComponente}
            onFechar={() => {
              setModalAdicionarAberto(false)
              setErroAdicionarComponente('')
            }}
            onAdicionar={adicionarComponente}
          />
        )}
      </section>
    </main>
  )
}

export default ComposicaoCircuitosPage
