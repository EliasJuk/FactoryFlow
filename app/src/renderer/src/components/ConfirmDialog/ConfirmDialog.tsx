import { ui } from "../../theme/ui"

type ConfirmDialogProps = {
  titulo: string
  descricao: React.ReactNode
  textoConfirmar: string
  perigo?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

export function ConfirmDialog({
  titulo,
  descricao,
  textoConfirmar,
  perigo = false,
  onCancelar,
  onConfirmar
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <h2 className={ui.title}>{titulo}</h2>

        <p className="mt-4 text-sm leading-6 text-slate-700">{descricao}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancelar} className={ui.buttonSecondary}>
            Voltar
          </button>

          <button
            onClick={onConfirmar}
            className={perigo ? ui.buttonDanger : ui.buttonPrimary}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}