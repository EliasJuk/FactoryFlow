import { X } from "lucide-react"
import { ui } from "../../../theme/ui"

type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: Record<string, string>
}

type Props = {
  titulo: string
  colunas: string[]
  registros: RegistroPreview[]
  carregando: boolean
  onFechar: () => void
  onToggleTodos: (selecionado: boolean) => void
  onToggleLinha: (id: number) => void
  onConfirmar: () => void
}

export function ImportacaoPreviewModal({
  titulo,
  colunas,
  registros,
  carregando,
  onFechar,
  onToggleTodos,
  onToggleLinha,
  onConfirmar
}: Props) {
  const selecionados = registros.filter((registro) => registro.selecionado)
  const todosSelecionados =
    registros.length > 0 && selecionados.length === registros.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
          <div>
            <h2 className={ui.title}>Prévia da importação</h2>
            <p className={ui.subtitle}>
              {titulo} • {registros.length} registro(s) carregado(s) •{" "}
              {selecionados.length} selecionado(s)
            </p>
          </div>

          <button
            onClick={onFechar}
            disabled={carregando}
            className={ui.buttonSecondary}
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-[var(--border)] bg-[var(--soft)] px-5 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={todosSelecionados}
              onChange={(event) => onToggleTodos(event.target.checked)}
              disabled={carregando || registros.length === 0}
            />
            Selecionar todos
          </label>
        </div>

        <div className="max-h-[58vh] overflow-auto">
          <table className={ui.table}>
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr>
                <th className={ui.tableHeader}>Selecionar</th>
                <th className={ui.tableHeader}>Linha</th>

                {colunas.map((coluna) => (
                  <th key={coluna} className={ui.tableHeader}>
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className="border-t border-[var(--border)]">
                  <td className={ui.tableCell}>
                    <input
                      type="checkbox"
                      checked={registro.selecionado}
                      onChange={() => onToggleLinha(registro.id)}
                      disabled={carregando}
                    />
                  </td>

                  <td className={ui.tableCellStrong}>{registro.linha}</td>

                  {colunas.map((coluna) => (
                    <td key={coluna} className={ui.tableCell}>
                      {registro.dados[coluna] || "-"}
                    </td>
                  ))}
                </tr>
              ))}

              {registros.length === 0 && (
                <tr>
                  <td colSpan={colunas.length + 2} className={ui.empty}>
                    Nenhum registro encontrado no arquivo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] p-5">
          <button
            onClick={onFechar}
            disabled={carregando}
            className={ui.buttonSecondary}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirmar}
            disabled={carregando || selecionados.length === 0}
            className={ui.buttonPrimary}
          >
            {carregando
              ? "Importando..."
              : `Importar selecionados (${selecionados.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}