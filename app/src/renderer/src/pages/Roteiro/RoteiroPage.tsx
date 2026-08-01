import { useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw, Search } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import { Circuito } from '../../models/Circuito'
import { Posto } from '../../models/Posto'
import { Setor } from '../../models/Setor'
import type { CircuitoPorPosto, RoteiroComponente } from '../../models/Roteiro'
import { ui } from '../../theme/ui'

import { RoteiroModal } from './components/RoteiroModal'
import { RoteiroInfoModal } from './components/RoteiroInfoModal'
import { VisualizarRoteiroModal } from './components/VisualizarRoteiroModal'

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

type CircuitoComponente = {
  id: number
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

type ModalModo = 'novo' | 'editar'

function RoteiroPage() {
  const { usuario } = useApp()
  const podeGerenciar = usuario.perfil === 'QUALIDADE' || usuario.perfil === 'ADMIN'

  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [roteiros, setRoteiros] = useState<RoteiroComponente[]>([])

  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')

  const [buscaCircuito, setBuscaCircuito] = useState('')
  const [circuitosDoPosto, setCircuitosDoPosto] = useState<CircuitoPorPosto[]>([])
  const [circuitoSelecionado, setCircuitoSelecionado] = useState<CircuitoPorPosto | null>(null)

  const [itens, setItens] = useState<RoteiroComponente[]>([])
  const [itemVisualizando, setItemVisualizando] = useState<RoteiroComponente | null>(null)
  const [modalVisualizacaoAberto, setModalVisualizacaoAberto] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>('novo')
  const [modalCircuitoId, setModalCircuitoId] = useState<number | ''>('')
  const [modalItens, setModalItens] = useState<RoteiroComponente[]>([])

  const [componentesDoCircuito, setComponentesDoCircuito] = useState<CircuitoComponente[]>([])
  const [componenteId, setComponenteId] = useState<number | ''>('')
  const [quantidade, setQuantidade] = useState(1)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [processando, setProcessando] = useState(false)

  async function carregarDados() {
    const [setoresLista, subsetoresLista, postosLista, circuitosLista, roteirosLista] =
      await Promise.all([
        window.api.setores.listar(),
        window.api.subsetores.listar(),
        window.api.postos.listar(),
        window.api.circuitos.listar(),
        window.api.roteiro.listarTodos()
      ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setCircuitos(circuitosLista)
    setRoteiros(roteirosLista)
  }

  function carregarCircuitosFiltrados() {
    const termo = buscaCircuito.trim().toLowerCase()

    const subsetoresPermitidos = new Set(
      subsetores
        .filter((subsetor) => setorId === '' || subsetor.setorId === Number(setorId))
        .map((subsetor) => subsetor.id)
    )

    const postosPermitidos = new Set(
      postos
        .filter((posto) => {
          if (postoId !== '') return posto.id === Number(postoId)
          if (subsetorId !== '') return posto.subsetorId === Number(subsetorId)
          if (setorId !== '') return subsetoresPermitidos.has(posto.subsetorId)
          return true
        })
        .map((posto) => posto.id)
    )

    const grupos = new Map<string, CircuitoPorPosto>()

    for (const item of roteiros) {
      if (!postosPermitidos.has(item.postoId)) continue

      const circuito = circuitos.find((circuitoAtual) => circuitoAtual.id === item.circuitoId)
      const posto = postos.find((postoAtual) => postoAtual.id === item.postoId)

      if (!circuito || !posto) continue

      const correspondeBusca =
        !termo ||
        circuito.codigo.toLowerCase().includes(termo) ||
        circuito.nome.toLowerCase().includes(termo) ||
        posto.nome.toLowerCase().includes(termo) ||
        posto.subsetorNome.toLowerCase().includes(termo)

      if (!correspondeBusca) continue

      const chave = `${item.circuitoId}:${item.postoId}`
      const existente = grupos.get(chave)

      if (existente) {
        existente.totalComponentes += 1
        continue
      }

      grupos.set(chave, {
        circuitoId: circuito.id,
        codigoCircuito: circuito.codigo,
        nomeCircuito: circuito.nome,
        postoId: posto.id,
        postoNome: posto.nome,
        subsetorNome: posto.subsetorNome,
        totalComponentes: 1
      })
    }

    const lista = Array.from(grupos.values()).sort((a, b) => {
      const porPosto = a.postoNome.localeCompare(b.postoNome, 'pt-BR')
      if (porPosto !== 0) return porPosto
      return a.codigoCircuito.localeCompare(b.codigoCircuito, 'pt-BR')
    })

    setCircuitosDoPosto(lista)

    if (
      circuitoSelecionado &&
      !lista.some(
        (item) =>
          item.circuitoId === circuitoSelecionado.circuitoId &&
          item.postoId === circuitoSelecionado.postoId
      )
    ) {
      setCircuitoSelecionado(null)
      setItens([])
    }
  }

  async function carregarComponentesDoRoteiro(circuitoId: number, postoSelecionadoId: number) {
    const lista = await window.api.roteiro.listarPorCircuitoEPosto(circuitoId, postoSelecionadoId)

    setItens(lista)
  }

  async function carregarModalItens(circuitoId: number, postoSelecionadoId: number) {
    const lista = await window.api.roteiro.listarPorCircuitoEPosto(circuitoId, postoSelecionadoId)

    setModalItens(lista)
  }

  async function carregarComponentesDoCircuito(circuitoId: number) {
    const lista = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)

    setComponentesDoCircuito(lista)
    setComponenteId(lista[0]?.componenteId ?? '')

    return lista
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarCircuitosFiltrados()
  }, [buscaCircuito, circuitos, postoId, postos, roteiros, setorId, subsetorId, subsetores])

  const subsetoresFiltrados = useMemo(() => {
    if (setorId === '') return []
    return subsetores.filter((subsetor) => subsetor.setorId === Number(setorId))
  }, [subsetores, setorId])

  const postosFiltrados = useMemo(() => {
    if (subsetorId === '') return []
    return postos.filter((posto) => posto.subsetorId === Number(subsetorId))
  }, [postos, subsetorId])

  const postoSelecionado = postos.find((posto) => posto.id === postoId)

  function alterarSetor(valor: string) {
    const novoSetorId = valor === '' ? '' : Number(valor)

    setSetorId(novoSetorId)
    setSubsetorId('')
    setPostoId('')
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
    setModalVisualizacaoAberto(false)
  }

  function alterarSubsetor(valor: string) {
    const novoSubsetorId = valor === '' ? '' : Number(valor)

    setSubsetorId(novoSubsetorId)
    setPostoId('')
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
    setModalVisualizacaoAberto(false)
  }

  function alterarPosto(valor: string) {
    const novoPostoId = valor === '' ? '' : Number(valor)

    setPostoId(novoPostoId)
    setCircuitoSelecionado(null)
    setItens([])
    setModalVisualizacaoAberto(false)
  }

  async function selecionarCircuito(circuito: CircuitoPorPosto) {
    setCircuitoSelecionado(circuito)
    await carregarComponentesDoRoteiro(circuito.circuitoId, circuito.postoId)
    setModalVisualizacaoAberto(true)
  }

  async function abrirNovoRoteiro() {
    if (postoId === '') return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para cadastrar roteiros.')
      return
    }

    setMensagemErro('')
    setMensagemSucesso('')
    setModalModo('novo')
    setModalCircuitoId('')
    setModalItens([])
    setComponentesDoCircuito([])
    setComponenteId('')
    setQuantidade(1)
    setModalAberto(true)
  }

  async function abrirEditarRoteiro() {
    if (!circuitoSelecionado) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para editar roteiros.')
      return
    }

    setMensagemErro('')
    setMensagemSucesso('')
    setModalModo('editar')
    setModalCircuitoId(circuitoSelecionado.circuitoId)
    setComponenteId('')
    setQuantidade(1)
    setModalAberto(true)

    await Promise.all([
      carregarModalItens(circuitoSelecionado.circuitoId, circuitoSelecionado.postoId),
      carregarComponentesDoCircuito(circuitoSelecionado.circuitoId)
    ])
  }

  function fecharModal() {
    setModalAberto(false)
    setModalCircuitoId('')
    setModalItens([])
    setComponentesDoCircuito([])
    setComponenteId('')
    setQuantidade(1)
    setMensagemErro('')
    setMensagemSucesso('')
  }

  async function alterarCircuitoModal(valor: string) {
    const novoCircuitoId = valor === '' ? '' : Number(valor)

    setModalCircuitoId(novoCircuitoId)
    setModalItens([])
    setComponentesDoCircuito([])
    setComponenteId('')
    setQuantidade(1)

    const postoAtualId =
      modalModo === 'editar' ? circuitoSelecionado?.postoId : postoId

    if (novoCircuitoId !== '' && postoAtualId !== '' && postoAtualId !== undefined) {
      await Promise.all([
        carregarModalItens(Number(novoCircuitoId), Number(postoAtualId)),
        carregarComponentesDoCircuito(Number(novoCircuitoId))
      ])
    }
  }

  function alterarComponenteModal(valor: string) {
    setComponenteId(valor === '' ? '' : Number(valor))
  }

  async function adicionarComponenteNoModal() {
    const postoAtualId =
      modalModo === 'editar' ? circuitoSelecionado?.postoId : postoId

    if (
      postoAtualId === '' ||
      postoAtualId === undefined ||
      modalCircuitoId === '' ||
      componenteId === '' ||
      processando
    ) {
      return
    }

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para alterar roteiros.')
      return
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      setMensagemErro('Informe uma quantidade inteira maior que zero.')
      return
    }

    setProcessando(true)
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.roteiro.adicionar(
        Number(modalCircuitoId),
        Number(postoAtualId),
        Number(componenteId),
        quantidade
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setComponenteId('')
      setQuantidade(1)
      setMensagemSucesso(resultado.mensagem)

      await carregarModalItens(Number(modalCircuitoId), Number(postoAtualId))
    } catch {
      setMensagemErro('Não foi possível adicionar o componente ao roteiro.')
    } finally {
      setProcessando(false)
    }
  }

  async function alterarQuantidadeModal(id: number, novaQuantidade: number) {
    if (processando) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para alterar roteiros.')
      return
    }

    if (!Number.isInteger(novaQuantidade) || novaQuantidade < 1) {
      setMensagemErro('Informe uma quantidade inteira maior que zero.')
      return
    }

    setProcessando(true)
    setMensagemErro('')

    try {
      const resultado = await window.api.roteiro.editarQuantidade(id, novaQuantidade)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setMensagemSucesso(resultado.mensagem)

      const postoAtualId =
        modalModo === 'editar' ? circuitoSelecionado?.postoId : postoId

      if (postoAtualId !== '' && postoAtualId !== undefined && modalCircuitoId !== '') {
        await carregarModalItens(Number(modalCircuitoId), Number(postoAtualId))
      }
    } catch {
      setMensagemErro('Não foi possível atualizar a quantidade do componente.')
    } finally {
      setProcessando(false)
    }
  }

  async function removerComponenteModal(id: number) {
    if (processando) return

    if (!podeGerenciar) {
      setMensagemErro('Você não possui permissão para alterar roteiros.')
      return
    }

    setProcessando(true)
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado = await window.api.roteiro.remover(id)

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setMensagemSucesso(resultado.mensagem)

      const postoAtualId =
        modalModo === 'editar' ? circuitoSelecionado?.postoId : postoId

      if (postoAtualId !== '' && postoAtualId !== undefined && modalCircuitoId !== '') {
        await carregarModalItens(Number(modalCircuitoId), Number(postoAtualId))
      }
    } catch {
      setMensagemErro('Não foi possível remover o componente do roteiro.')
    } finally {
      setProcessando(false)
    }
  }

  async function salvarAlteracoesModal() {
    const circuitoIdAtual = modalCircuitoId
    const postoAtualId =
      modalModo === 'editar' ? circuitoSelecionado?.postoId : postoId

    fecharModal()
    await carregarDados()

    if (postoAtualId !== '' && postoAtualId !== undefined && circuitoIdAtual !== '') {
      const circuitoAtualizado = circuitos.find(
        (circuito) => circuito.id === Number(circuitoIdAtual)
      )
      const postoAtualizado = postos.find((posto) => posto.id === Number(postoAtualId))

      if (circuitoAtualizado && postoAtualizado) {
        const itensAtualizados = await window.api.roteiro.listarPorCircuitoEPosto(
          Number(circuitoIdAtual),
          Number(postoAtualId)
        )

        const resumo: CircuitoPorPosto = {
          circuitoId: circuitoAtualizado.id,
          codigoCircuito: circuitoAtualizado.codigo,
          nomeCircuito: circuitoAtualizado.nome,
          postoId: Number(postoAtualId),
          postoNome: postoAtualizado.nome,
          subsetorNome: postoAtualizado.subsetorNome,
          totalComponentes: itensAtualizados.length
        }

        setCircuitoSelecionado(resumo)
        setItens(itensAtualizados)
      }
    }
  }

  function limparFiltros() {
    setBuscaCircuito('')
    setSetorId('')
    setSubsetorId('')
    setPostoId('')
    setCircuitoSelecionado(null)
    setItens([])
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Roteiros"
        subtitle="Consulte quais circuitos rodam em cada posto e quais componentes pertencem ao roteiro."
      />

      <section className={ui.section}>
        {mensagemErro && !modalAberto && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensagemErro}
          </div>
        )}

        {mensagemSucesso && !modalAberto && (
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {mensagemSucesso}
          </div>
        )}
        <div className={ui.card}>
          <div>
            <label className={ui.label}>Pesquisar roteiro</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={buscaCircuito}
                  onChange={(event) => setBuscaCircuito(event.target.value)}
                  placeholder="Pesquise por código, circuito, posto ou subsetor..."
                  className={`${ui.input} pl-9`}
                />
              </div>

              <button
                type="button"
                onClick={limparFiltros}
                className={`${ui.buttonSecondary} whitespace-nowrap`}
                title="Limpar pesquisa e filtros"
              >
                <RotateCcw size={16} />
                Limpar
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => alterarSetor(event.target.value)}
                className={ui.select}
              >
                <option value="">Todos</option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Subsetor</label>
              <select
                value={subsetorId}
                onChange={(event) => alterarSubsetor(event.target.value)}
                disabled={setorId === ''}
                className={ui.select}
              >
                <option value="">Todos</option>

                {subsetoresFiltrados.map((subsetor) => (
                  <option key={subsetor.id} value={subsetor.id}>
                    {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Posto de trabalho</label>
              <select
                value={postoId}
                onChange={(event) => alterarPosto(event.target.value)}
                disabled={subsetorId === ''}
                className={ui.select}
              >
                <option value="">Todos</option>

                {postosFiltrados.map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            A pesquisa funciona sem selecionar os filtros. Setor, subsetor e posto apenas refinam os
            resultados.
          </p>
        </div>

        {postoId === '' && buscaCircuito.trim() === '' && setorId === '' && (
          <div className={ui.card}>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-8">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-amber-900">
                    Antes de montar um roteiro
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-amber-800">
                    Certifique-se de que <strong>todos os componentes</strong> do circuito já foram
                    cadastrados no menu <strong>Circuitos</strong>.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-amber-800">
                    Nesta tela você irá definir <strong>em quais postos de trabalho</strong> cada
                    componente poderá ser utilizado ou refugado.
                  </p>

                  <div className="mt-5 rounded-md border border-amber-200 bg-white px-4 py-3">
                    <p className="text-sm text-amber-900">
                      <strong>⚠ Observação:</strong> Caso um componente não apareça durante a
                      criação ou edição do roteiro, volte ao cadastro de <strong> Circuitos</strong>
                      , adicione o componente ao circuito e retorne para esta tela.
                    </p>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-700">Para começar:</p>

                  <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-slate-700">
                    <li>Selecione um setor.</li>
                    <li>Selecione um subsetor.</li>
                    <li>Selecione um posto de trabalho.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {(buscaCircuito.trim() !== '' || setorId !== '' || subsetorId !== '' || postoId !== '') && (
          <div className={ui.card}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className={ui.title}>Roteiros encontrados</h2>
                <p className={ui.subtitle}>
                  {postoSelecionado?.nome ?? 'Pesquisa em todos os postos'}
                </p>
              </div>

              {postoId !== '' && podeGerenciar && (
                <button type="button" onClick={abrirNovoRoteiro} className={ui.buttonPrimary}>
                  <Plus size={16} />
                  Novo Roteiro
                </button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {circuitosDoPosto.map((circuito) => {
                const ativo =
                  circuitoSelecionado?.circuitoId === circuito.circuitoId &&
                  circuitoSelecionado?.postoId === circuito.postoId

                return (
                  <button
                    key={`${circuito.circuitoId}-${circuito.postoId}`}
                    onClick={() => selecionarCircuito(circuito)}
                    className={`rounded-lg border p-4 text-left transition ${
                      ativo
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">
                      {circuito.codigoCircuito}
                    </div>

                    <div className="mt-1 text-sm text-slate-700">{circuito.nomeCircuito}</div>

                    <div className="mt-3 text-xs text-slate-500">
                      {circuito.subsetorNome} · {circuito.postoNome}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {circuito.totalComponentes} componente(s)
                    </div>
                  </button>
                )
              })}

              {circuitosDoPosto.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  Nenhum circuito encontrado para este posto.
                </div>
              )}
            </div>
          </div>
        )}

        {modalVisualizacaoAberto && circuitoSelecionado && (
          <VisualizarRoteiroModal
            roteiro={circuitoSelecionado}
            itens={itens}
            podeGerenciar={podeGerenciar}
            onFechar={() => setModalVisualizacaoAberto(false)}
            onEditar={() => {
              setModalVisualizacaoAberto(false)
              abrirEditarRoteiro()
            }}
            onVisualizarItem={setItemVisualizando}
          />
        )}

        {itemVisualizando && (
          <RoteiroInfoModal item={itemVisualizando} onFechar={() => setItemVisualizando(null)} />
        )}

        {modalAberto && (
          <RoteiroModal
            modalModo={modalModo}
            postoNome={
              modalModo === 'editar'
                ? circuitoSelecionado?.postoNome ?? 'Posto selecionado'
                : postoSelecionado?.nome ?? 'Posto selecionado'
            }
            circuitos={circuitos}
            modalCircuitoId={modalCircuitoId}
            componentesDoCircuito={componentesDoCircuito}
            componenteId={componenteId}
            quantidade={quantidade}
            modalItens={modalItens}
            mensagemErro={mensagemErro}
            mensagemSucesso={mensagemSucesso}
            processando={processando}
            onFechar={fecharModal}
            onAlterarCircuito={alterarCircuitoModal}
            onAlterarComponente={alterarComponenteModal}
            onAlterarQuantidade={setQuantidade}
            onAdicionar={adicionarComponenteNoModal}
            onAlterarQuantidadeItem={alterarQuantidadeModal}
            onRemoverItem={removerComponenteModal}
            onSalvar={salvarAlteracoesModal}
          />
        )}
      </section>
    </main>
  )
}

export default RoteiroPage