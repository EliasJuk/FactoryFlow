import { useEffect, useMemo, useState } from 'react'
import { Eye, Lightbulb, Link2, RotateCcw, Search, Trash2 } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import { Defeito } from '../../models/Defeitos'
import { Posto } from '../../models/Posto'
import { PostoDefeito } from '../../models/PostoDefeito'
import { Setor } from '../../models/Setor'
import { Subsetor } from '../../models/Subsetor'
import { ui } from '../../theme/ui'
import PostoDefeitoInfoModal from './components/PostoDefeitoInfoModal'

const PERFIS_PERMITIDOS = new Set(['ADMIN', 'QUALIDADE', 'TECNICO', 'LIDER', 'SUPERVISOR'])

function DefeitosPorPostoPage() {
  const { usuario } = useApp()

  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [defeitos, setDefeitos] = useState<Defeito[]>([])
  const [vinculos, setVinculos] = useState<PostoDefeito[]>([])

  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')
  const [defeitoId, setDefeitoId] = useState<number | ''>('')

  const [busca, setBusca] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [vinculoSelecionado, setVinculoSelecionado] = useState<PostoDefeito | null>(null)

  const podeGerenciar = PERFIS_PERMITIDOS.has(usuario.perfil)

  useEffect(() => {
    Promise.all([
      window.api.setores.listar(),
      window.api.subsetores.listar(),
      window.api.postos.listar(),
      window.api.defeitos.listar()
    ]).then(([setoresLista, subsetoresLista, postosLista, defeitosLista]) => {
      setSetores(setoresLista)
      setSubsetores(subsetoresLista)
      setPostos(postosLista)
      setDefeitos(defeitosLista)
    })
  }, [])

  const subsetoresFiltrados = useMemo(
    () => subsetores.filter((subsetor) => subsetor.setorId === setorId),
    [setorId, subsetores]
  )

  const postosFiltrados = useMemo(
    () => postos.filter((posto) => posto.subsetorId === subsetorId),
    [postos, subsetorId]
  )

  const postoSelecionado = useMemo(
    () => postos.find((posto) => posto.id === postoId) ?? null,
    [postos, postoId]
  )

  async function carregarVinculos(id: number | '') {
    setPostoId(id)
    setDefeitoId('')
    setMensagem('')
    setVinculoSelecionado(null)

    if (id === '') {
      setVinculos([])
      return
    }

    setCarregando(true)

    try {
      setVinculos(await window.api.postoDefeitos.listarPorPosto(Number(id), true))
    } finally {
      setCarregando(false)
    }
  }

  function alterarSetor(valor: string) {
    setSetorId(valor === '' ? '' : Number(valor))
    setSubsetorId('')
    setPostoId('')
    setDefeitoId('')
    setVinculos([])
    setMensagem('')
    setVinculoSelecionado(null)
  }

  function alterarSubsetor(valor: string) {
    setSubsetorId(valor === '' ? '' : Number(valor))
    setPostoId('')
    setDefeitoId('')
    setVinculos([])
    setMensagem('')
    setVinculoSelecionado(null)
  }

  const idsJaVinculados = useMemo(
    () => new Set(vinculos.filter((item) => item.ativo).map((item) => item.defeitoId)),
    [vinculos]
  )

  const defeitosDisponiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return defeitos.filter(
      (defeito) =>
        !idsJaVinculados.has(defeito.id) &&
        `${defeito.codigo} ${defeito.descricao}`.toLowerCase().includes(termo)
    )
  }, [busca, defeitos, idsJaVinculados])

  async function adicionar() {
    if (postoId === '' || defeitoId === '') return

    const resultado = await window.api.postoDefeitos.adicionar(
      Number(postoId),
      Number(defeitoId),
      usuario.id ?? null
    )

    setMensagem(resultado.mensagem)
    await carregarVinculos(postoId)
  }

  async function remover(id: number) {
    await window.api.postoDefeitos.remover(id, usuario.id ?? null)
    await carregarVinculos(postoId)
  }

  async function restaurar(id: number) {
    await window.api.postoDefeitos.restaurar(id, usuario.id ?? null)
    await carregarVinculos(postoId)
  }

  if (!podeGerenciar) {
    return (
      <main className={ui.page}>
        <PageHeader
          title="Defeitos por Posto"
          subtitle="Defina quais defeitos podem ser usados em cada posto."
        />

        <section className={ui.section}>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Seu perfil não possui permissão para gerenciar esta configuração.
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Defeitos por Posto"
        subtitle="Defina quais defeitos podem ser usados em cada posto de trabalho."
      />

      <section className={ui.section}>
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-amber-950 shadow-sm">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="shrink-0 text-amber-500" />

            <p className="text-sm leading-5">
              <span className="font-bold">Nota:</span> Vincule os defeitos que podem aparecer em um
              determinado posto de trabalho.
            </p>
          </div>
        </div>

        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={ui.label}>Setor</label>
              <select
                className={ui.select}
                value={setorId}
                onChange={(event) => alterarSetor(event.target.value)}
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
                className={ui.select}
                value={subsetorId}
                disabled={setorId === ''}
                onChange={(event) => alterarSubsetor(event.target.value)}
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
                className={ui.select}
                value={postoId}
                disabled={subsetorId === ''}
                onChange={(event) =>
                  carregarVinculos(event.target.value === '' ? '' : Number(event.target.value))
                }
              >
                <option value="">Selecione...</option>

                {postosFiltrados.map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className={ui.label}>Buscar defeito disponível</label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className={`${ui.input} pl-9`}
                value={busca}
                disabled={postoId === ''}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Código ou descrição"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <select
              className={ui.select}
              value={defeitoId}
              disabled={postoId === ''}
              onChange={(event) =>
                setDefeitoId(event.target.value === '' ? '' : Number(event.target.value))
              }
            >
              <option value="">Selecione um defeito...</option>

              {defeitosDisponiveis.map((defeito) => (
                <option key={defeito.id} value={defeito.id}>
                  {defeito.codigo} - {defeito.descricao}
                </option>
              ))}
            </select>

            <button
              className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={postoId === '' || defeitoId === ''}
              onClick={adicionar}
            >
              <Link2 size={16} />
              Vincular
            </button>
          </div>

          {mensagem && (
            <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              {mensagem}
            </div>
          )}
        </div>

        <div className={`${ui.card} mt-4`}>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Defeitos configurados</h2>

          {postoId === '' ? (
            <p className="text-sm text-slate-500">
              Selecione um posto para visualizar os vínculos.
            </p>
          ) : carregando ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : vinculos.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum defeito configurado para este posto.</p>
          ) : (
            <div className="space-y-2">
              {vinculos.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                    item.ativo
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {item.codigoDefeito} - {item.descricaoDefeito}
                    </div>

                    <div className="text-xs text-slate-500">
                      {item.ativo ? 'Ativo para lançamentos' : 'Vínculo removido'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="Ver informações do vínculo"
                      className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setVinculoSelecionado(item)}
                    >
                      <Eye size={17} />
                    </button>

                    {item.ativo ? (
                      <button
                        title="Remover vínculo"
                        className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => remover(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    ) : (
                      <button
                        title="Restaurar vínculo"
                        className="rounded-md p-2 text-slate-400 hover:bg-green-50 hover:text-green-600"
                        onClick={() => restaurar(item.id)}
                      >
                        <RotateCcw size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {vinculoSelecionado && postoSelecionado && (
        <PostoDefeitoInfoModal
          aberto
          vinculo={vinculoSelecionado}
          posto={postoSelecionado}
          onClose={() => setVinculoSelecionado(null)}
        />
      )}
    </main>
  )
}

export default DefeitosPorPostoPage
