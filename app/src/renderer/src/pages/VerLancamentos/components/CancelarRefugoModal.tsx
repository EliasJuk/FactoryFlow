import { ui } from '../../../theme/ui'
import type { RefugoListagem } from '../types'

type Props = {
  refugo: RefugoListagem
  motivo: string
  onMotivoChange: (valor: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function CancelarRefugoModal({ refugo, motivo, onMotivoChange, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className={ui.title}>Cancelar lançamento</h2>
        <p className={ui.subtitle}>{refugo.numeroRefugo}</p>
        <p className="mt-3 text-sm text-[var(--text)]">
          O lançamento ficará no histórico como <strong>CANCELADO</strong>.
        </p>
        <div className="mt-4">
          <label className={ui.label}>Motivo do cancelamento</label>
          <textarea
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            rows={3}
            className={ui.input}
            placeholder="Ex: lançamento duplicado, erro de componente..."
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={ui.buttonSecondary}>
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={!motivo.trim()}
            className={`${ui.buttonDanger} px-4 py-2 text-sm font-semibold ${!motivo.trim() ? 'opacity-60' : ''}`}
          >
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  )
}
