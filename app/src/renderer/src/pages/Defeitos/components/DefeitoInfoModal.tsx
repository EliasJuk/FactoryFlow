import { X } from 'lucide-react'

import type { Defeito } from '../../../models/Defeitos'
import { ui } from '../../../theme/ui'

type Props = {
  defeito: Defeito
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

export function DefeitoInfoModal({ defeito, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do defeito</h2>
            <p className={ui.subtitle}>
              {defeito.codigo} - {defeito.descricao}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className={ui.buttonSecondary}
            aria-label="Fechar informações do defeito"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {defeito.ativo ? 'Ativo' : 'Inativo'}
            <br />
            <strong>Código:</strong> {defeito.codigo}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Descrição:</strong>
            <div className="mt-1 text-slate-700">{defeito.descricao}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{defeito.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {defeito.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(defeito.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong> {defeito.updatedByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(defeito.updatedAt)}
          </div>

          {!defeito.ativo && (
            <div className="rounded-md border border-[var(--border)] p-3">
              <strong>Inativado por:</strong>{' '}
              {defeito.deletedByNome ?? defeito.updatedByNome ?? 'Não registrado'}
              <br />
              <strong>Inativado em:</strong> {formatarData(defeito.deletedAt)}
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
