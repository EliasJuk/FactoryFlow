import { useEffect, useState } from 'react'
import { Lock, LockOpen } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { Setor } from '../../models/Setor'
import { Subsetor } from '../../models/Subsetor'
import { Posto } from '../../models/Posto'
import { Circuito } from '../../models/Circuito'
import { Defeito } from '../../models/Defeitos'
import { ui } from '../../theme/ui'
import { useApp } from '../../contexts/AppContext'

type Quantidade = number | ''

const PERFIS_QUE_PODEM_ALTERAR_DATA_HORA = new Set([
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
])

function formatarDataHoraLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`
}

function formatarDataHoraExibicao(valor: string): string {
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR')
}

type RoteiroComponente = {
  id: number
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

type ItemLancamento = {
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  defeitoId: number | ''
  quantidade: Quantidade
}

function LancarRefugoPage() {
  const { usuario } = useApp()
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])
  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [defeitos, setDefeitos] = useState<Defeito[]>([])

  const [setorId, setSetorId] = useState<number | ''>('')
  const [subsetorId, setSubsetorId] = useState<number | ''>('')
  const [postoId, setPostoId] = useState<number | ''>('')
  const [circuitoId, setCircuitoId] = useState<number | ''>('')
  const [turno, setTurno] = useState<'A' | 'B' | 'C'>('A')

  const [matriculaOperador, setMatriculaOperador] = useState('')
  const [quantidadeProduzida, setQuantidadeProduzida] = useState<Quantidade>(0)
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<ItemLancamento[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | 'info'>('info')
  const [salvando, setSalvando] = useState(false)
  const [dataHora, setDataHora] = useState(() => formatarDataHoraLocal(new Date()))
  const [dataHoraDesbloqueada, setDataHoraDesbloqueada] = useState(false)

  const podeAlterarDataHora = PERFIS_QUE_PODEM_ALTERAR_DATA_HORA.has(usuario.perfil)

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

  useEffect(() => {
    carregarDados()
  }, [])

  const subsetoresFiltrados = subsetores.filter((subsetor) => subsetor.setorId === setorId)

  const postosFiltrados = postos.filter((posto) => posto.subsetorId === subsetorId)

  function mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro' | 'info' = 'info') {
    setMensagem(texto)
    setTipoMensagem(tipo)

    setTimeout(() => {
      setMensagem('')
    }, 3500)
  }

  function alterarSetor(valor: string) {
    setSetorId(valor === '' ? '' : Number(valor))
    setSubsetorId('')
    setPostoId('')
    setCircuitoId('')
    setItens([])
    setMensagem('')
  }

  function alterarSubsetor(valor: string) {
    setSubsetorId(valor === '' ? '' : Number(valor))
    setPostoId('')
    setCircuitoId('')
    setItens([])
    setMensagem('')
  }

  function alterarPosto(valor: string) {
    setPostoId(valor === '' ? '' : Number(valor))
    setCircuitoId('')
    setDefeitos([])
    setItens([])
    setMensagem('')
  }

  function alterarCircuito(valor: string) {
    setCircuitoId(valor === '' ? '' : Number(valor))
    setItens([])
    setMensagem('')
  }

  async function carregarComponentesPermitidos() {
    if (postoId === '' || circuitoId === '') {
      setItens([])
      return
    }

    const componentes = await window.api.roteiro.listarPorCircuitoEPosto(
      Number(circuitoId),
      Number(postoId)
    )

    setItens(
      componentes.map((item: RoteiroComponente) => ({
        componenteId: item.componenteId,
        codigoComponente: item.codigoComponente,
        nomeComponente: item.nomeComponente,
        defeitoId: '',
        quantidade: 0
      }))
    )
  }

  useEffect(() => {
    carregarComponentesPermitidos()
  }, [postoId, circuitoId])

  useEffect(() => {
    async function carregarDefeitosPermitidos() {
      if (postoId === '') {
        setDefeitos([])
        return
      }

      const permitidos = await window.api.postoDefeitos.listarPermitidosPorPosto(Number(postoId))
      setDefeitos(
        permitidos.map((item) => ({
          id: item.defeitoId,
          uuid: item.uuid,
          codigo: item.codigoDefeito,
          descricao: item.descricaoDefeito,
          ativo: item.ativo
        }))
      )
    }

    carregarDefeitosPermitidos()
  }, [postoId])

  function alterarDefeito(componenteId: number, defeitoId: number | '') {
    setItens((itensAtuais) =>
      itensAtuais.map((item) =>
        item.componenteId === componenteId ? { ...item, defeitoId } : item
      )
    )
  }

  function alterarQuantidade(componenteId: number, quantidade: Quantidade) {
    setItens((itensAtuais) =>
      itensAtuais.map((item) =>
        item.componenteId === componenteId ? { ...item, quantidade } : item
      )
    )
  }

  function limparAposSalvar() {
    setPostoId('')
    setCircuitoId('')
    setMatriculaOperador('')
    setQuantidadeProduzida(0)
    setObservacao('')
    setItens([])
    setDataHora(formatarDataHoraLocal(new Date()))
    setDataHoraDesbloqueada(false)
  }

  async function salvarRefugo() {
    try {
      setSalvando(true)
      setMensagem('')

      const usuarioId = usuario.id

      if (!usuarioId) {
        mostrarMensagem('Não foi possível identificar o usuário logado.', 'erro')
        return
      }

      const itensValidos = itens
        .filter((item) => item.defeitoId !== '')
        .map((item) => ({
          componenteId: item.componenteId,
          defeitoId: Number(item.defeitoId),
          quantidade: item.quantidade === '' ? 0 : item.quantidade
        }))

      if (
        !matriculaOperador.trim() ||
        setorId === '' ||
        subsetorId === '' ||
        postoId === '' ||
        circuitoId === '' ||
        itensValidos.length === 0
      ) {
        mostrarMensagem(
          'Preencha matrícula, local, posto, circuito e selecione ao menos um defeito.',
          'erro'
        )
        return
      }

      const numeroRefugo = await window.api.refugos.criar({
        matriculaOperador,
        usuarioId,
        dataHora: dataHoraDesbloqueada ? dataHora : undefined,
        setorId: Number(setorId),
        subsetorId: Number(subsetorId),
        postoId: Number(postoId),
        circuitoId: Number(circuitoId),
        turno,
        quantidadeProduzida: quantidadeProduzida === '' ? 0 : quantidadeProduzida,
        observacao: observacao.trim() || undefined,
        itens: itensValidos
      })

      limparAposSalvar()

      mostrarMensagem(
        `✅ Refugo ${numeroRefugo} salvo com sucesso. Imprimindo documento...`,
        'sucesso'
      )
    } catch (erro) {
      console.error(erro)
      mostrarMensagem('❌ Erro ao salvar o refugo.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const mensagemClasse =
    tipoMensagem === 'sucesso'
      ? 'mt-3 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700'
      : tipoMensagem === 'erro'
        ? 'mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700'
        : 'mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700'

  return (
    <main className={ui.page}>
      <PageHeader
        title="Lançar Refugo"
        subtitle="Registre refugos por posto, circuito, componente, defeito e quantidade."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={ui.label}>Data / Hora</label>

              <div className="relative">
                {dataHoraDesbloqueada ? (
                  <input
                    type="datetime-local"
                    value={dataHora}
                    onChange={(event) => setDataHora(event.target.value)}
                    className={`${ui.input} pr-10`}
                  />
                ) : (
                  <input
                    value={formatarDataHoraExibicao(dataHora)}
                    disabled
                    className={`${ui.input} pr-10`}
                  />
                )}

                {podeAlterarDataHora && (
                  <button
                    type="button"
                    onClick={() => {
                      if (dataHoraDesbloqueada) {
                        setDataHora(formatarDataHoraLocal(new Date()))
                      }

                      setDataHoraDesbloqueada((atual) => !atual)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                    aria-label={
                      dataHoraDesbloqueada
                        ? 'Bloquear alteração da data e hora'
                        : 'Permitir alteração da data e hora'
                    }
                    title={
                      dataHoraDesbloqueada ? 'Bloquear data e hora' : 'Desbloquear data e hora'
                    }
                  >
                    {dataHoraDesbloqueada ? <LockOpen size={15} /> : <Lock size={15} />}
                  </button>
                )}
              </div>
            </div>

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
                className={ui.select}
                disabled={setorId === ''}
              >
                <option value="">Selecione...</option>
                {subsetoresFiltrados.map((subsetor) => (
                  <option key={subsetor.id} value={subsetor.id}>
                    {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <div>
              <label className={ui.label}>Posto</label>
              <select
                value={postoId}
                onChange={(event) => alterarPosto(event.target.value)}
                className={ui.select}
                disabled={subsetorId === ''}
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
              <label className={ui.label}>Circuito</label>
              <select
                value={circuitoId}
                onChange={(event) => alterarCircuito(event.target.value)}
                className={ui.select}
                disabled={postoId === ''}
              >
                <option value="">Selecione...</option>
                {circuitos.map((circuito) => (
                  <option key={circuito.id} value={circuito.id}>
                    {circuito.codigo} - {circuito.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>Matrícula</label>
              <input
                value={matriculaOperador}
                onFocus={(event) => event.target.select()}
                onChange={(event) => setMatriculaOperador(event.target.value)}
                placeholder="Ex: 123456"
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Turno</label>
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value as 'A' | 'B' | 'C')}
                className={ui.select}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            <div>
              <label className={ui.label}>Quantidade Produzida</label>
              <input
                type="number"
                min={0}
                value={quantidadeProduzida}
                onFocus={(event) => {
                  if (quantidadeProduzida === 0) setQuantidadeProduzida('')
                  event.target.select()
                }}
                onBlur={() => {
                  if (quantidadeProduzida === '') setQuantidadeProduzida(0)
                }}
                onChange={(event) =>
                  setQuantidadeProduzida(
                    event.target.value === '' ? '' : Number(event.target.value)
                  )
                }
                className={ui.input}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className={ui.cardHeader}>
            <h2 className={ui.title}>Componentes permitidos para o posto</h2>
          </div>

          <table className={ui.table}>
            <thead className="bg-slate-50">
              <tr>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Defeito</th>
                <th className={ui.tableHeader}>Qtde Refugada</th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item) => (
                <tr key={item.componenteId} className="border-t">
                  <td className={ui.tableCellStrong}>
                    <div>{item.codigoComponente}</div>
                    <div className="text-xs font-normal text-slate-500">{item.nomeComponente}</div>
                  </td>

                  <td className={ui.tableCell}>
                    <select
                      value={item.defeitoId}
                      onChange={(event) =>
                        alterarDefeito(
                          item.componenteId,
                          event.target.value === '' ? '' : Number(event.target.value)
                        )
                      }
                      className={ui.select}
                    >
                      <option value="">Sem defeito</option>
                      {defeitos.map((defeito) => (
                        <option key={defeito.id} value={defeito.id}>
                          {defeito.codigo} - {defeito.descricao}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className={ui.tableCell}>
                    <input
                      type="number"
                      min={0}
                      value={item.quantidade}
                      onFocus={(event) => {
                        if (item.quantidade === 0) {
                          alterarQuantidade(item.componenteId, '')
                        }
                        event.target.select()
                      }}
                      onBlur={() => {
                        if (item.quantidade === '') {
                          alterarQuantidade(item.componenteId, 0)
                        }
                      }}
                      onChange={(event) =>
                        alterarQuantidade(
                          item.componenteId,
                          event.target.value === '' ? '' : Number(event.target.value)
                        )
                      }
                      className={`${ui.input} text-center`}
                    />
                  </td>
                </tr>
              ))}

              {itens.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Selecione posto e circuito para carregar os componentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={ui.card}>
          <label className={ui.label}>Observação opcional</label>

          <textarea
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            rows={2}
            placeholder="Informação adicional do lançamento, se necessário."
            className={ui.input}
          />

          {mensagem && <p className={mensagemClasse}>{mensagem}</p>}

          <button
            onClick={salvarRefugo}
            disabled={salvando}
            className={`mt-4 ${ui.buttonPrimary} ${salvando ? 'opacity-60' : ''}`}
          >
            {salvando ? 'Salvando...' : 'Salvar Refugo'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default LancarRefugoPage
