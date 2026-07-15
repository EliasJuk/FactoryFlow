import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { Circuito } from '../../models/Circuito'
import { Posto } from '../../models/Posto'
import { Setor } from '../../models/Setor'
import type { CircuitoPorPosto, RoteiroComponente } from '../../models/Roteiro'
import { ui } from '../../theme/ui'

import { RoteiroModal } from './components/RoteiroModal'
import { RoteiroInfoModal } from './components/RoteiroInfoModal'

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
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [circuitos, setCircuitos] = useState<Circuito[]>([])

  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')

  const [buscaCircuito, setBuscaCircuito] = useState('')
  const [circuitosDoPosto, setCircuitosDoPosto] = useState<CircuitoPorPosto[]>([])
  const [circuitoSelecionado, setCircuitoSelecionado] = useState<CircuitoPorPosto | null>(null)

  const [itens, setItens] = useState<RoteiroComponente[]>([])
  const [itemVisualizando, setItemVisualizando] = useState<RoteiroComponente | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>('novo')
  const [modalCircuitoId, setModalCircuitoId] = useState<number | ''>('')
  const [modalItens, setModalItens] = useState<RoteiroComponente[]>([])

  const [componentesDoCircuito, setComponentesDoCircuito] = useState<CircuitoComponente[]>([])
  const [componenteId, setComponenteId] = useState<number | ''>('')
  const [quantidade, setQuantidade] = useState(1)

  async function carregarDados() {
    const [setoresLista, subsetoresLista, postosLista, circuitosLista] = await Promise.all([
      window.api.setores.listar(),
      window.api.subsetores.listar(),
      window.api.postos.listar(),
      window.api.circuitos.listar()
    ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
    setPostos(postosLista)
    setCircuitos(circuitosLista)
  }

  async function carregarCircuitosPorPosto() {
    if (postoId === '') {
      setCircuitosDoPosto([])
      setCircuitoSelecionado(null)
      setItens([])
      return
    }

    const lista = await window.api.roteiro.listarCircuitosPorPosto(
      Number(postoId),
      buscaCircuito.trim()
    )

    setCircuitosDoPosto(lista)
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
    carregarCircuitosPorPosto()
  }, [postoId, buscaCircuito])

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
    setBuscaCircuito('')
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
  }

  function alterarSubsetor(valor: string) {
    const novoSubsetorId = valor === '' ? '' : Number(valor)

    setSubsetorId(novoSubsetorId)
    setPostoId('')
    setBuscaCircuito('')
    setCircuitosDoPosto([])
    setCircuitoSelecionado(null)
    setItens([])
  }

  function alterarPosto(valor: string) {
    const novoPostoId = valor === '' ? '' : Number(valor)

    setPostoId(novoPostoId)
    setBuscaCircuito('')
    setCircuitoSelecionado(null)
    setItens([])
  }

  async function selecionarCircuito(circuito: CircuitoPorPosto) {
    setCircuitoSelecionado(circuito)
    await carregarComponentesDoRoteiro(circuito.circuitoId, circuito.postoId)
  }

  async function abrirNovoRoteiro() {
    if (postoId === '') return

    setModalModo('novo')
    setModalCircuitoId('')
    setModalItens([])
    setComponentesDoCircuito([])
    setComponenteId('')
    setQuantidade(1)
    setModalAberto(true)
  }

  async function abrirEditarRoteiro() {
    if (!circuitoSelecionado || postoId === '') return

    setModalModo('editar')
    setModalCircuitoId(circuitoSelecionado.circuitoId)
    setComponenteId('')
    setQuantidade(1)
    setModalAberto(true)

    await Promise.all([
      carregarModalItens(circuitoSelecionado.circuitoId, Number(postoId)),
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
  }

  async function alterarCircuitoModal(valor: string) {
    const novoCircuitoId = valor === '' ? '' : Number(valor)

    setModalCircuitoId(novoCircuitoId)
    setModalItens([])
    setComponentesDoCircuito([])
    setComponenteId('')
    setQuantidade(1)

    if (novoCircuitoId !== '' && postoId !== '') {
      await Promise.all([
        carregarModalItens(Number(novoCircuitoId), Number(postoId)),
        carregarComponentesDoCircuito(Number(novoCircuitoId))
      ])
    }
  }

  function alterarComponenteModal(valor: string) {
    setComponenteId(valor === '' ? '' : Number(valor))
  }

  async function adicionarComponenteNoModal() {
    if (postoId === '' || modalCircuitoId === '' || componenteId === '') return
    if (quantidade < 1) return

    await window.api.roteiro.adicionar(
      Number(modalCircuitoId),
      Number(postoId),
      Number(componenteId),
      quantidade
    )

    setComponenteId('')
    setQuantidade(1)

    await carregarModalItens(Number(modalCircuitoId), Number(postoId))
  }

  async function alterarQuantidadeModal(id: number, novaQuantidade: number) {
    if (novaQuantidade < 1) return

    await window.api.roteiro.editarQuantidade(id, novaQuantidade)

    if (postoId !== '' && modalCircuitoId !== '') {
      await carregarModalItens(Number(modalCircuitoId), Number(postoId))
    }
  }

  async function removerComponenteModal(id: number) {
    await window.api.roteiro.remover(id)

    if (postoId !== '' && modalCircuitoId !== '') {
      await carregarModalItens(Number(modalCircuitoId), Number(postoId))
    }
  }

  async function salvarAlteracoesModal() {
    const circuitoIdAtual = modalCircuitoId
    const totalItens = modalItens.length

    fecharModal()
    await carregarCircuitosPorPosto()

    if (postoId !== '' && circuitoIdAtual !== '') {
      const circuitoAtualizado = circuitos.find(
        (circuito) => circuito.id === Number(circuitoIdAtual)
      )

      if (circuitoAtualizado) {
        const resumo: CircuitoPorPosto = {
          circuitoId: circuitoAtualizado.id,
          codigoCircuito: circuitoAtualizado.codigo,
          nomeCircuito: circuitoAtualizado.nome,
          postoId: Number(postoId),
          postoNome: postoSelecionado?.nome ?? '',
          subsetorNome: postoSelecionado?.subsetorNome ?? '',
          totalComponentes: totalItens
        }

        setCircuitoSelecionado(resumo)
        await carregarComponentesDoRoteiro(Number(circuitoIdAtual), Number(postoId))
      }
    }
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Roteiros"
        subtitle="Consulte quais circuitos rodam em cada posto e quais componentes pertencem ao roteiro."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => alterarSetor(event.target.value)}
                className={ui.select}
              >
                <option value="">Selecione...</option>

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
                <option value="">Selecione...</option>

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
                <option value="">Selecione...</option>

                {postosFiltrados.map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Pesquisar circuito</label>
              <div className="flex gap-2">
                <input
                  value={buscaCircuito}
                  onChange={(event) => setBuscaCircuito(event.target.value)}
                  disabled={postoId === ''}
                  placeholder="Código ou nome..."
                  className={ui.input}
                />

                <button className={ui.buttonSecondary} disabled={postoId === ''}>
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {postoId === '' && (
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

        {postoId !== '' && (
          <div className={ui.card}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className={ui.title}>Circuitos do posto</h2>
                <p className={ui.subtitle}>{postoSelecionado?.nome ?? 'Posto selecionado'}</p>
              </div>

              <button onClick={abrirNovoRoteiro} className={ui.buttonPrimary}>
                <Plus size={16} />
                Novo Roteiro
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {circuitosDoPosto.map((circuito) => {
                const ativo = circuitoSelecionado?.circuitoId === circuito.circuitoId

                return (
                  <button
                    key={circuito.circuitoId}
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

                    <div className="mt-3 text-xs font-semibold text-slate-500">
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

        {circuitoSelecionado && (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className={ui.title}>
                  {circuitoSelecionado.codigoCircuito} - {circuitoSelecionado.nomeCircuito}
                </h2>

                <p className={ui.subtitle}>Posto: {circuitoSelecionado.postoNome}</p>
              </div>

              <button onClick={abrirEditarRoteiro} className={ui.buttonSecondary}>
                <Pencil size={16} />
                Editar Roteiro
              </button>
            </div>

            <table className={ui.table}>
              <thead className="bg-slate-50">
                <tr>
                  <th className={ui.tableHeader}>Código</th>
                  <th className={ui.tableHeader}>Componente</th>
                  <th className={ui.tableHeader}>Qtde</th>
                  <th className={ui.tableHeaderRight}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {itens.map((item) => (
                  <tr key={item.uuid} className="border-t">
                    <td className={ui.tableCellStrong}>{item.codigoComponente}</td>

                    <td className={ui.tableCell}>{item.nomeComponente}</td>

                    <td className={ui.tableCell}>{item.quantidade}</td>

                    <td className={ui.tableCell}>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setItemVisualizando(item)}
                          className={ui.buttonSecondary}
                          title="Informações"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {itens.length === 0 && (
                  <tr>
                    <td colSpan={4} className={ui.empty}>
                      Nenhum componente vinculado a este roteiro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {itemVisualizando && (
          <RoteiroInfoModal item={itemVisualizando} onFechar={() => setItemVisualizando(null)} />
        )}

        {modalAberto && (
          <RoteiroModal
            modalModo={modalModo}
            postoNome={postoSelecionado?.nome ?? 'Posto selecionado'}
            circuitos={circuitos}
            modalCircuitoId={modalCircuitoId}
            componentesDoCircuito={componentesDoCircuito}
            componenteId={componenteId}
            quantidade={quantidade}
            modalItens={modalItens}
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
