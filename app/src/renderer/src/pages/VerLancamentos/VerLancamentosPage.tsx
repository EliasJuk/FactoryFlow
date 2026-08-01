import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import type { Defeito } from '../../models/Defeitos'
import { ui } from '../../theme/ui'
import { RefugoInfoModal } from './components/RefugoInfoModal'
import { CancelarRefugoModal } from './components/CancelarRefugoModal'
import { EditarRefugoModal } from './components/EditarRefugoModal'
import { LancamentoCard } from './components/LancamentoCard'
import type { EditItem, RefugoListagem } from './types'

const PERFIS_QUE_PODEM_ALTERAR = new Set(['ADMIN', 'TECNICO', 'QUALIDADE', 'LIDER'])

function VerLancamentosPage() {
  const { usuario } = useApp()
  const [lancamentos, setLancamentos] = useState<RefugoListagem[]>([])
  const [defeitos, setDefeitos] = useState<Defeito[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [abertos, setAbertos] = useState<number[]>([])
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [auditoria, setAuditoria] = useState<RefugoListagem | null>(null)
  const [editando, setEditando] = useState<RefugoListagem | null>(null)
  const [editMatricula, setEditMatricula] = useState('')
  const [editTurno, setEditTurno] = useState<'A' | 'B' | 'C'>('A')
  const [editQuantidadeProduzida, setEditQuantidadeProduzida] = useState(0)
  const [editObservacao, setEditObservacao] = useState('')
  const [editItens, setEditItens] = useState<EditItem[]>([])
  const [cancelando, setCancelando] = useState<RefugoListagem | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const limite = 10
  const podeAlterar = PERFIS_QUE_PODEM_ALTERAR.has(usuario.perfil)

  async function carregarLancamentos(pagina = 1) {
    setCarregando(true)
    try {
      const resultado = await window.api.refugos.listar(busca.trim(), pagina, limite)
      setLancamentos(resultado.dados ?? [])
      setTotalPaginas(resultado.totalPaginas || 1)
      setPaginaAtual(pagina)
    } catch (error) {
      tratarErro(error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarLancamentos(1)
    void window.api.defeitos.listar().then(setDefeitos)
  }, [])

  function tratarErro(error: unknown) {
    const texto = error instanceof Error ? error.message : String(error)
    setMensagem(
      texto.includes('SESSAO_NAO_AUTENTICADA')
        ? 'Sua sessão não está autenticada. Entre novamente no sistema.'
        : texto.includes('TROCA_SENHA_OBRIGATORIA')
          ? 'Altere sua senha antes de continuar.'
          : texto.includes('SEM_PERMISSAO_REFUGO') || texto.includes('SEM_PERMISSAO')
            ? 'Seu perfil não possui permissão para editar ou cancelar lançamentos.'
            : texto.includes('USUARIO_NAO_IDENTIFICADO')
              ? 'Não foi possível identificar o usuário logado.'
              : 'Não foi possível concluir a operação.'
    )
  }

  function abrirEdicao(refugo: RefugoListagem) {
    setEditando(refugo)
    setEditMatricula(refugo.matriculaOperador)
    setEditTurno(refugo.turno as 'A' | 'B' | 'C')
    setEditQuantidadeProduzida(refugo.quantidadeProduzida)
    setEditObservacao(refugo.observacao ?? '')
    setEditItens(
      refugo.itens.map((item) => ({
        id: item.id,
        defeitoId: item.defeitoId,
        componenteCodigo: item.componenteCodigo,
        componenteNome: item.componenteNome,
        defeitoCodigo: item.defeitoCodigo,
        defeitoDescricao: item.defeitoDescricao,
        quantidade: item.quantidadeRefugada
      }))
    )
  }

  async function salvarEdicao() {
    if (!editando) return

    try {
      await window.api.refugos.editarCompleto(
        editando.id,
        editMatricula,
        editTurno,
        editQuantidadeProduzida,
        editObservacao.trim() || undefined,
        editItens.map(({ id, defeitoId, quantidade }) => ({ id, defeitoId, quantidade }))
      )
      setEditando(null)
      setMensagem('Lançamento atualizado com sucesso.')
      await carregarLancamentos(paginaAtual)
    } catch (error) {
      tratarErro(error)
    }
  }

  async function confirmarCancelamento() {
    if (!cancelando || !motivoCancelamento.trim()) return

    try {
      await window.api.refugos.cancelar(cancelando.id, motivoCancelamento.trim())
      setCancelando(null)
      setMotivoCancelamento('')
      setMensagem('Lançamento cancelado com sucesso.')
      await carregarLancamentos(paginaAtual)
    } catch (error) {
      tratarErro(error)
    }
  }

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <main className={ui.page}>
      <PageHeader
        title="Ver Lançamentos"
        subtitle="Consulte, reimprima e acompanhe os refugos lançados."
      />
      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={ui.label}>Buscar</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !carregando) void carregarLancamentos(1)
                }}
                placeholder="Número, matrícula, circuito, posto ou defeito..."
                className={ui.input}
                autoFocus
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => void carregarLancamentos(1)}
                disabled={carregando}
                className={`${ui.buttonPrimary} ${carregando ? 'opacity-60' : ''}`}
                title="Buscar"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
          {mensagem && (
            <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              {mensagem}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {carregando && (
            <div className={ui.card}>
              <p className="text-xs font-semibold text-[var(--text-light)]">
                Atualizando lançamentos...
              </p>
            </div>
          )}
          {!carregando &&
            lancamentos.map((refugo) => (
              <LancamentoCard
                key={refugo.id}
                refugo={refugo}
                aberto={abertos.includes(refugo.id)}
                podeAlterar={podeAlterar}
                onAlternar={() =>
                  setAbertos((atuais) =>
                    atuais.includes(refugo.id)
                      ? atuais.filter((id) => id !== refugo.id)
                      : [...atuais, refugo.id]
                  )
                }
                onImprimir={() => void window.api.refugos.imprimir(refugo.id)}
                onAuditoria={() => setAuditoria(refugo)}
                onEditar={() => abrirEdicao(refugo)}
                onCancelar={() => {
                  setCancelando(refugo)
                  setMotivoCancelamento('')
                }}
              />
            ))}
        </div>
        {totalPaginas > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {paginas.map((pagina) => (
              <button
                key={pagina}
                onClick={() => void carregarLancamentos(pagina)}
                className={`rounded-md border px-3 py-1 text-sm font-semibold ${pagina === paginaAtual ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--soft)]'}`}
              >
                {pagina}
              </button>
            ))}
          </div>
        )}
      </section>
      {auditoria && <RefugoInfoModal refugo={auditoria} onClose={() => setAuditoria(null)} />}
      {editando && (
        <EditarRefugoModal
          refugo={editando}
          defeitos={defeitos}
          matricula={editMatricula}
          turno={editTurno}
          quantidadeProduzida={editQuantidadeProduzida}
          observacao={editObservacao}
          itens={editItens}
          onMatriculaChange={setEditMatricula}
          onTurnoChange={setEditTurno}
          onQuantidadeProduzidaChange={setEditQuantidadeProduzida}
          onObservacaoChange={setEditObservacao}
          onItemDefeitoChange={(id, defeitoId) =>
            setEditItens((itens) =>
              itens.map((item) => (item.id === id ? { ...item, defeitoId } : item))
            )
          }
          onItemQuantidadeChange={(id, quantidade) =>
            setEditItens((itens) =>
              itens.map((item) => (item.id === id ? { ...item, quantidade } : item))
            )
          }
          onClose={() => setEditando(null)}
          onSave={() => void salvarEdicao()}
        />
      )}
      {cancelando && (
        <CancelarRefugoModal
          refugo={cancelando}
          motivo={motivoCancelamento}
          onMotivoChange={setMotivoCancelamento}
          onClose={() => setCancelando(null)}
          onConfirm={() => void confirmarCancelamento()}
        />
      )}
    </main>
  )
}

export default VerLancamentosPage
