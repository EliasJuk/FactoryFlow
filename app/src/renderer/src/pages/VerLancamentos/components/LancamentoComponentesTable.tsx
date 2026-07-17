import { ui } from '../../../theme/ui'
import type { RefugoItemListagem } from '../types'

type Props = { itens: RefugoItemListagem[] }

export function LancamentoComponentesTable({ itens }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[var(--border)]">
      <table className={ui.table}>
        <thead className="[background-color:var(--soft)]">
          <tr>
            <th className={ui.tableHeader}>Componente</th>
            <th className={ui.tableHeader}>Defeito</th>
            <th className={ui.tableHeaderRight}>Qtde</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id} className="border-t border-[var(--border)]">
              <td className={ui.tableCellStrong}>
                <div>{item.componenteCodigo}</div>
                <div className="text-xs font-normal text-[var(--text-light)]">
                  {item.componenteNome}
                </div>
              </td>
              <td className={ui.tableCell}>
                {item.defeitoCodigo} - {item.defeitoDescricao}
              </td>
              <td className={`${ui.tableCell} text-right font-bold`}>{item.quantidadeRefugada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
