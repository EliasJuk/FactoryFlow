import { X } from 'lucide-react'

import type { Subsetor } from '../../../models/Subsetor'
import { ui } from '../../../theme/ui'

type Props = {
  subsetor: Subsetor
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

export function SubsetorInfoModal({ subsetor, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do subsetor</h2>
            <p className={ui.subtitle}>
              {subsetor.setorNome} - {subsetor.nome}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className={ui.buttonSecondary}
            aria-label="Fechar informações do subsetor"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {subsetor.ativo ? 'Ativo' : 'Inativo'}
            <br />
            <strong>Setor:</strong> {subsetor.setorNome}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{subsetor.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {subsetor.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(subsetor.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong> {subsetor.updatedByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(subsetor.updatedAt)}
          </div>

          {!subsetor.ativo && (
            <div className="rounded-md border border-[var(--border)] p-3">
              <strong>Inativado por:</strong>{' '}
              {subsetor.deletedByNome ?? subsetor.updatedByNome ?? 'Não registrado'}
              <br />
              <strong>Inativado em:</strong> {formatarData(subsetor.deletedAt)}
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
