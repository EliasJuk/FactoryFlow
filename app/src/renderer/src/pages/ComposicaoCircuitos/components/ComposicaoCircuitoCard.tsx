import { Check, ChevronDown, ChevronUp, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import type { Circuito } from '../../../models/Circuito'
import type { CircuitoComponente } from '../../../models/CircuitoComponente'
import { ui } from '../../../theme/ui'

type Props = {
  circuito: Circuito
  itens: CircuitoComponente[]
  aberto: boolean
  carregando: boolean
  processando: boolean
  podeGerenciar: boolean
  onToggle: () => void
  onAdicionar: () => void
  onVisualizar: (item: CircuitoComponente) => void
  onEditarQuantidade: (id: number, quantidade: number) => Promise<void>
  onRemover: (id: number) => Promise<void>
}

export function ComposicaoCircuitoCard({
  circuito,
  itens,
  aberto,
  carregando,
  processando,
  podeGerenciar,
  onToggle,
  onAdicionar,
  onVisualizar,
  onEditarQuantidade,
  onRemover
}: Props) {
  const [itemEditandoId, setItemEditandoId] = useState<number | null>(null)
  const [quantidade, setQuantidade] = useState(1)

  const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0)

  async function salvar(id: number) {
    if (processando || !Number.isInteger(quantidade) || quantidade < 1) {
      return
    }

    await onEditarQuantidade(id, quantidade)
    setItemEditandoId(null)
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
      >
        <div>
          <div className="font-bold text-slate-900">
            {circuito.codigo} - {circuito.nome}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {circuito.totalComponentes} componente(s) diferente(s)
          </div>
        </div>

        {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {aberto && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-[var(--soft)] p-3">
              <p className="text-xs font-semibold text-slate-500">Componentes diferentes</p>
              <p className="mt-1 text-xl font-bold">{itens.length}</p>
            </div>

            <div className="rounded-md bg-[var(--soft)] p-3">
              <p className="text-xs font-semibold text-slate-500">Quantidade total</p>
              <p className="mt-1 text-xl font-bold">{quantidadeTotal}</p>
            </div>

            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={onAdicionar}
                disabled={processando || !podeGerenciar}
                className={ui.buttonPrimary}
              >
                <Plus size={16} />
                Adicionar componente
              </button>
            </div>
          </div>

          {carregando ? (
            <div className={ui.empty}>Carregando componentes...</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
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
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className={ui.tableCellStrong}>{item.codigoComponente}</td>
                      <td className={ui.tableCell}>{item.nomeComponente}</td>
                      <td className={ui.tableCell}>
                        {itemEditandoId === item.id ? (
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={quantidade}
                            onChange={(event) => setQuantidade(Number(event.target.value))}
                            disabled={processando}
                            className="w-24 rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                          />
                        ) : (
                          item.quantidade
                        )}
                      </td>

                      <td className={ui.tableCell}>
                        <div className="flex justify-end gap-2">
                          {itemEditandoId === item.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => salvar(item.id)}
                                disabled={processando || quantidade < 1}
                                className={ui.buttonPrimary}
                                title="Salvar quantidade"
                              >
                                <Check size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setItemEditandoId(null)}
                                disabled={processando}
                                className={ui.buttonSecondary}
                                title="Cancelar"
                              >
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onVisualizar(item)}
                                disabled={processando}
                                className={ui.buttonSecondary}
                                title="Informações"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setItemEditandoId(item.id)
                                  setQuantidade(item.quantidade)
                                }}
                                disabled={processando || !podeGerenciar}
                                className={ui.buttonSecondary}
                                title="Editar quantidade"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => onRemover(item.id)}
                                disabled={processando || !podeGerenciar}
                                className={ui.buttonDanger}
                                title="Remover componente"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {itens.length === 0 && (
                    <tr>
                      <td colSpan={4} className={ui.empty}>
                        Nenhum componente vinculado a este circuito.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
