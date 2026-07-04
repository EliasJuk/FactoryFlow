import { X } from "lucide-react"
import { ui } from "../../../theme/ui"

type CrudModalProps = {
  titulo: string
  subtitulo: string
  mensagemErro?: string
  processando?: boolean
  onFechar: () => void
  children: React.ReactNode
  footer: React.ReactNode
  maxWidth?: string
}

export function CrudModal({
  titulo,
  subtitulo,
  mensagemErro,
  processando = false,
  onFechar,
  children,
  footer,
  maxWidth = "max-w-xl"
}: CrudModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${maxWidth} rounded-lg bg-white p-5 shadow-xl`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>{titulo}</h2>
            <p className={ui.subtitle}>{subtitulo}</p>
          </div>

          <button
            onClick={onFechar}
            disabled={processando}
            className={ui.buttonSecondary}
          >
            <X size={16} />
          </button>
        </div>

        {mensagemErro && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        {children}

        <div className="mt-5 flex justify-end gap-3">{footer}</div>
      </div>
    </div>
  )
}