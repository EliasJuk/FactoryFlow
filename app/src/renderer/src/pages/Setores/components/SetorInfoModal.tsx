import { X } from 'lucide-react'

import type { Setor } from '../../../models/Setor'
import { ui } from '../../../theme/ui'

type Props = {
  setor: Setor
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

export function SetorInfoModal({ setor, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do setor</h2>
            <p className={ui.subtitle}>
              {setor.sigla} - {setor.nome}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className={ui.buttonSecondary}
            aria-label="Fechar informações do setor"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {setor.ativo ? 'Ativo' : 'Inativo'}
            <br />
            <strong>Sigla:</strong> {setor.sigla}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Identificador global:</strong>
            <div className="mt-1 break-all font-mono text-xs text-slate-600">{setor.uuid}</div>
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong> {setor.createdByNome ?? 'Sistema'}
            <br />
            <strong>Criado em:</strong> {formatarData(setor.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong> {setor.updatedByNome ?? 'Sistema'}
            <br />
            <strong>Última alteração em:</strong> {formatarData(setor.updatedAt)}
          </div>

          {!setor.ativo && (
            <div className="rounded-md border border-[var(--border)] p-3">
              <strong>Inativado por:</strong>{' '}
              {setor.deletedByNome ?? setor.updatedByNome ?? 'Não registrado'}
              <br />
              <strong>Inativado em:</strong> {formatarData(setor.deletedAt)}
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
