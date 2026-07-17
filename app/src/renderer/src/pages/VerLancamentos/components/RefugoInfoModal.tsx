import { X } from 'lucide-react'

import { ui } from '../../../theme/ui'
import type { RefugoListagem } from '../types'

type Props = {
  refugo: RefugoListagem
  onClose: () => void
}

function formatarData(valor?: string | null): string {
  if (!valor) return 'Não registrado'

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return data.toLocaleString('pt-BR')
}

export function RefugoInfoModal({ refugo, onClose }: Props) {
  const cancelado = refugo.status === 'CANCELADO'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do lançamento</h2>
            <p className={ui.subtitle}>{refugo.numeroRefugo}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={ui.buttonSecondary}
            aria-label="Fechar informações do lançamento"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {cancelado ? 'Cancelado' : 'Ativo'}
            <br />
            <strong>Componentes vinculados:</strong> {refugo.itens.length}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{refugo.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {refugo.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(refugo.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong>{' '}
            {refugo.updatedByNome ?? refugo.createdByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(refugo.updatedAt)}
          </div>

          {cancelado && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              <strong>Cancelado por:</strong>{' '}
              {refugo.deletedByNome ?? refugo.updatedByNome ?? 'Não registrado'}
              <br />
              <strong>Cancelado em:</strong> {formatarData(refugo.deletedAt)}
              {refugo.motivoCancelamento && (
                <>
                  <br />
                  <strong>Motivo:</strong> {refugo.motivoCancelamento}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={ui.buttonSecondary}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
