import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, KeyRound, XCircle } from 'lucide-react'
import { ui } from '../../../theme/ui'

export type SolicitacaoSenha = {
  id: number
  uuid: string
  usuarioId: number
  usuarioNome: string
  usuarioMatricula: string
  status: 'PENDENTE' | 'ATENDIDA' | 'CANCELADA'
  solicitadoEm: string
}

type Props = {
  solicitacoes: SolicitacaoSenha[]
  processando: boolean
  podeGerenciar: boolean
  onAtender: (solicitacao: SolicitacaoSenha) => void
  onCancelar: (solicitacao: SolicitacaoSenha) => void
}

function formatarData(valor: string) {
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR')
}

export function SolicitacoesSenhaCard({
  solicitacoes,
  processando,
  podeGerenciar,
  onAtender,
  onCancelar
}: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <h2 className={ui.title}>Solicitações de alteração de senha</h2>
          <p className={ui.subtitle}>
            Solicitações aguardando atendimento da Qualidade ou Administração.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
            {solicitacoes.length} pendente(s)
          </span>
          {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {aberto && (
        <div className="border-t border-[var(--border)]">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Matrícula</th>
                <th className={ui.tableHeader}>Usuário</th>
                <th className={ui.tableHeader}>Solicitado em</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((solicitacao) => (
                <tr key={solicitacao.id} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{solicitacao.usuarioMatricula}</td>
                  <td className={ui.tableCell}>{solicitacao.usuarioNome}</td>
                  <td className={ui.tableCell}>{formatarData(solicitacao.solicitadoEm)}</td>
                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!podeGerenciar || processando}
                        onClick={() => onAtender(solicitacao)}
                        className={ui.buttonPrimary}
                        title="Gerar senha temporária"
                      >
                        <KeyRound size={15} />
                        Gerar senha
                      </button>

                      <button
                        type="button"
                        disabled={!podeGerenciar || processando}
                        onClick={() => onCancelar(solicitacao)}
                        className={ui.buttonDanger}
                        title="Cancelar solicitação"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {solicitacoes.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhuma solicitação pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type SenhaModalProps = {
  nome: string
  matricula: string
  senha: string
  onFechar: () => void
}

export function SenhaTemporariaModal({
  nome,
  matricula,
  senha,
  onFechar
}: SenhaModalProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(senha)
    setCopiado(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className={ui.title}>Senha temporária gerada</h2>
        <p className={ui.subtitle}>
          Esta senha será exibida somente agora. Entregue-a ao usuário com segurança.
        </p>

        <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p><strong>Usuário:</strong> {nome}</p>
          <p><strong>Matrícula:</strong> {matricula}</p>

          <div className="mt-3 flex items-center justify-between rounded bg-white p-3 font-mono text-lg font-bold">
            <span>{senha}</span>
            <button type="button" onClick={copiar} className={ui.buttonSecondary}>
              <Copy size={15} />
              {copiado ? 'Copiada' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onFechar} className={ui.buttonPrimary}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
