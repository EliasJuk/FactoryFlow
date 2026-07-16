import { Eye, Pencil, X } from 'lucide-react'

import type { CircuitoPorPosto, RoteiroComponente } from '../../../models/Roteiro'
import { ui } from '../../../theme/ui'

type Props = {
  roteiro: CircuitoPorPosto
  itens: RoteiroComponente[]
  onFechar: () => void
  onEditar: () => void
  onVisualizarItem: (item: RoteiroComponente) => void
}

export function VisualizarRoteiroModal({
  roteiro,
  itens,
  onFechar,
  onEditar,
  onVisualizarItem
}: Props) {
  const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className={ui.title}>
              {roteiro.codigoCircuito} - {roteiro.nomeCircuito}
            </h2>

            <p className={ui.subtitle}>
              {roteiro.subsetorNome} · {roteiro.postoNome}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className={ui.buttonSecondary}
            title="Fechar"
            aria-label="Fechar visualização do roteiro"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[var(--soft)] p-4">
            <p className="text-xs font-semibold text-slate-500">Componentes diferentes</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{itens.length}</p>
          </div>

          <div className="rounded-lg bg-[var(--soft)] p-4">
            <p className="text-xs font-semibold text-slate-500">Quantidade total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{quantidadeTotal}</p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)]">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Quantidade</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item) => (
                <tr key={item.uuid} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{item.codigoComponente}</td>
                  <td className={ui.tableCell}>{item.nomeComponente}</td>
                  <td className={ui.tableCell}>{item.quantidade}</td>
                  <td className={ui.tableCell}>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onVisualizarItem(item)}
                        className={ui.buttonSecondary}
                        title="Informações"
                        aria-label={`Ver informações de ${item.nomeComponente}`}
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {itens.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum componente vinculado a este roteiro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onFechar} className={ui.buttonSecondary}>
            Fechar
          </button>

          <button type="button" onClick={onEditar} className={ui.buttonPrimary}>
            <Pencil size={16} />
            Editar roteiro
          </button>
        </div>
      </div>
    </div>
  )
}