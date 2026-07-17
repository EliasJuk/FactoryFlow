import { ChevronDown, ChevronUp, Eye, Pencil, Printer, Trash2 } from 'lucide-react'
import { ui } from '../../../theme/ui'
import type { RefugoListagem } from '../types'
import { LancamentoComponentesTable } from './LancamentoComponentesTable'

type Props = {
  refugo: RefugoListagem
  aberto: boolean
  podeAlterar: boolean
  onAlternar: () => void
  onImprimir: () => void
  onAuditoria: () => void
  onEditar: () => void
  onCancelar: () => void
}

export function LancamentoCard(props: Props) {
  const { refugo, aberto, podeAlterar } = props
  const cancelado = refugo.status === 'CANCELADO'
  const itens = refugo.itens ?? []
  const totalRefugado = itens.reduce((total, item) => total + item.quantidadeRefugada, 0)

  return (
    <div
      className={`${ui.card} ${cancelado ? 'border border-slate-500 bg-slate-350 opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className={ui.title}>{refugo.numeroRefugo}</h2>
          <p className={ui.subtitle}>
            {refugo.dataHora} • Turno {refugo.turno} • Matrícula {refugo.matriculaOperador}
          </p>
          <p className="mt-1 text-xs text-[var(--text-light)]">
            {refugo.setorNome} / {refugo.subsetorNome} / {refugo.postoNome}
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--text)]">
            Circuito: {refugo.circuitoCodigo} - {refugo.circuitoNome}
          </p>
          <p className="mt-1 text-xs text-[var(--text-light)]">
            Produzido: {refugo.quantidadeProduzida} • Refugado: {totalRefugado}
          </p>
          <p className="mt-1 text-xs font-bold">
            Status:{' '}
            <span className={cancelado ? 'text-red-700' : 'text-green-700'}>
              {cancelado ? 'CANCELADO' : 'ATIVO'}
            </span>
          </p>
          {cancelado && refugo.motivoCancelamento && (
            <p className="mt-1 text-xs font-semibold text-slate-700">
              Motivo: {refugo.motivoCancelamento}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={props.onImprimir} className={ui.buttonSecondary} title="Reimprimir">
            <Printer size={16} />
          </button>
          <button onClick={props.onAuditoria} className={ui.buttonSecondary} title="Ver auditoria">
            <Eye size={16} />
          </button>
          {!cancelado && podeAlterar && (
            <>
              <button onClick={props.onEditar} className={ui.buttonSecondary} title="Editar">
                <Pencil size={16} />
              </button>
              <button onClick={props.onCancelar} className={ui.buttonDanger} title="Cancelar">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      {aberto && <LancamentoComponentesTable itens={itens} />}
      <button
        onClick={props.onAlternar}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--soft)]"
      >
        {aberto ? (
          <>
            <ChevronUp size={16} />
            Recolher componentes
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            Ver componentes ({itens.length})
          </>
        )}
      </button>
    </div>
  )
}
