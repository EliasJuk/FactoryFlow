import { ui } from "../../../theme/ui"

type CrudTableProps = {
  children: React.ReactNode
}

export function CrudTable({ children }: CrudTableProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <table className={ui.table}>
        {children}
      </table>
    </div>
  )
}