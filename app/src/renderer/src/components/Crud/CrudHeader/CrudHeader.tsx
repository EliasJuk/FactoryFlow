import { Plus } from "lucide-react"
import { ui } from "../../../theme/ui"

type CrudHeaderProps = {
  titulo: string
  descricao: string
  textoBotao: string
  disabled?: boolean
  onNovo: () => void
  children?: React.ReactNode
}

export function CrudHeader({
  titulo,
  descricao,
  textoBotao,
  disabled = false,
  onNovo,
  children
}: CrudHeaderProps) {
  return (
    <div className={ui.card}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={ui.title}>{titulo}</h2>
          <p className={ui.subtitle}>{descricao}</p>
        </div>

        <button
          onClick={onNovo}
          disabled={disabled}
          className={ui.buttonPrimary}
        >
          <Plus size={16} />
          {textoBotao}
        </button>
      </div>

      {children}
    </div>
  )
}