import { X } from 'lucide-react'

import type { Circuito } from '../../../models/Circuito'
import { ui } from '../../../theme/ui'

type Props = {
  circuito: Circuito
  onFechar: () => void
}

function formatarData(valor?: string | null): string {
  if (!valor) return 'Não registrado'

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return data.toLocaleString('pt-BR')
}

export function CircuitoInfoModal({ circuito, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do circuito</h2>
            <p className={ui.subtitle}>
              {circuito.codigo} - {circuito.nome}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className={ui.buttonSecondary}
            aria-label="Fechar informações do circuito"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {circuito.ativo ? 'Ativo' : 'Inativo'}
            <br />
            <strong>Componentes vinculados:</strong> {circuito.totalComponentes}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{circuito.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {circuito.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(circuito.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong> {circuito.updatedByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(circuito.updatedAt)}
          </div>

          {!circuito.ativo && (
            <div className="rounded-md border border-[var(--border)] p-3">
              <strong>Inativado por:</strong>{' '}
              {circuito.deletedByNome ?? circuito.updatedByNome ?? 'Não registrado'}
              <br />
              <strong>Inativado em:</strong> {formatarData(circuito.deletedAt)}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onFechar} className={ui.buttonSecondary}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
