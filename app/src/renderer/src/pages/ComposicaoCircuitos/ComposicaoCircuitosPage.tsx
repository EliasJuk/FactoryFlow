import { useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { SearchBar } from '../../components/Crud/SearchBar/SearchBar'
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

type FiltroComponentes = 'todos' | 'com' | 'sem'

function ComposicaoCircuitosPage() {
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

  const [busca, setBusca] = useState('')
  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')
  const [filtroComponentes, setFiltroComponentes] = useState<FiltroComponentes>('todos')

  const [modalCircuitoAberto, setModalCircuitoAberto] = useState(false)
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
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
    setCodigo('')
    setNome('')
    setMensagemErro('')
    setModalCircuitoAberto(true)
  }

  async function salvarNovoCircuito() {
    if (!codigo.trim() || !nome.trim() || processando) return

    setProcessando(true)
    setMensagemErro('')

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

    setProcessando(true)

    try {
      await window.api.circuitoComponentes.adicionar(
        circuitoSelecionado.id,
        componenteId,
        quantidade
      )

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoSelecionado.id)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoSelecionado.id]: itens
      }))

      setModalAdicionarAberto(false)
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function editarQuantidade(circuitoId: number, id: number, quantidade: number) {
    setProcessando(true)

    try {
      await window.api.circuitoComponentes.editarQuantidade(id, quantidade)

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoId]: itens
      }))

      setMensagemSucesso('Quantidade atualizada com sucesso.')
      await carregarDados()
    } finally {
      setProcessando(false)
    }
  }

  async function removerComponente(circuitoId: number, id: number) {
    setProcessando(true)

    try {
      await window.api.circuitoComponentes.remover(id)

      const itens = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)

      setItensPorCircuito((atual) => ({
        ...atual,
        [circuitoId]: itens
      }))

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
        {mensagemSucesso && (
          <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensagemSucesso}
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

            <button type="button" onClick={abrirNovoCircuito} className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Circuito
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div>
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

            <div>
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

            <div>
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

            <div>
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
          </div>

          <div className="mt-3 flex justify-end">
            <button type="button" onClick={limparFiltros} className={ui.buttonSecondary}>
              <RotateCcw size={15} />
              Limpar filtros
            </button>
          </div>

          {(setorId !== '' || subsetorId !== '' || postoId !== '') && (
            <p className="mt-3 text-xs text-slate-500">
              Os filtros de setor, subsetor e posto consideram os roteiros cadastrados.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {circuitosFiltrados.map((circuito) => (
            <ComposicaoCircuitoCard
              key={circuito.uuid}
              circuito={circuito}
              itens={itensPorCircuito[circuito.id] ?? []}
              aberto={circuitoAbertoId === circuito.id}
              carregando={carregandoCircuitoId === circuito.id}
              processando={processando}
              onToggle={() => abrirCircuito(circuito)}
              onAdicionar={() => {
                setCircuitoSelecionado(circuito)
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
            onFechar={() => setModalAdicionarAberto(false)}
            onAdicionar={adicionarComponente}
          />
        )}
      </section>
    </main>
  )
}

export default ComposicaoCircuitosPage
