import { ChevronDown, ChevronUp } from "lucide-react"
import { ui } from "../../../theme/ui"

type InativosCardProps = {
  titulo: string
  descricao: string
  aberto: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function InativosCard({
  titulo,
  descricao,
  aberto,
  onToggle,
  children
}: InativosCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--soft)] px-4 py-3 text-left"
      >
        <div>
          <h2 className={ui.title}>{titulo}</h2>
          <p className={ui.subtitle}>{descricao}</p>
        </div>

        {aberto ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>

      {aberto && children}
    </div>
  )
}