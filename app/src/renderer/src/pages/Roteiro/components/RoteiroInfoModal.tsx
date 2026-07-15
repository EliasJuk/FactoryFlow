import { X } from 'lucide-react'

import type { RoteiroComponente } from '../../../models/Roteiro'
import { ui } from '../../../theme/ui'

type Props = {
  item: RoteiroComponente
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

export function RoteiroInfoModal({ item, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do item do roteiro</h2>
            <p className={ui.subtitle}>
              {item.codigoComponente} - {item.nomeComponente}
            </p>
          </div>

          <button type="button" onClick={onFechar} className={ui.buttonSecondary} title="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {item.ativo ? 'Ativo' : 'Inativo'}
            <br />
            <strong>Quantidade:</strong> {item.quantidade}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{item.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {item.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(item.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong> {item.updatedByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(item.updatedAt)}
          </div>
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
