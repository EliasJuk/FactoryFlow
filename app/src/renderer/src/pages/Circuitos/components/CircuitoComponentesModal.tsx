import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'

import { useState } from 'react'

import { ui } from '../../../theme/ui'

type Circuito = {
  id: number
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
}

type CircuitoComponente = {
  id: number
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

type Props = {
  circuito: Circuito
  itens: CircuitoComponente[]
  processando: boolean
  onFechar: () => void
  onAbrirAdicionar: () => void
  onEditarQuantidade: (id: number, quantidade: number) => Promise<void>
  onRemover: (id: number) => Promise<void>
}

export function CircuitoComponentesModal({
  circuito,
  itens,
  processando,
  onFechar,
  onAbrirAdicionar,
  onEditarQuantidade,
  onRemover
}: Props) {
  const [itemEditandoId, setItemEditandoId] = useState<number | null>(null)
  const [quantidadeEditando, setQuantidadeEditando] = useState(1)

  const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0)

  function iniciarEdicao(item: CircuitoComponente) {
    if (processando) return

    setItemEditandoId(item.id)
    setQuantidadeEditando(item.quantidade)
  }

  async function salvarQuantidade(id: number) {
    if (processando || !Number.isInteger(quantidadeEditando) || quantidadeEditando <= 0) {
      return
    }

    await onEditarQuantidade(id, quantidadeEditando)
    setItemEditandoId(null)
  }

  function cancelarEdicao() {
    if (processando) return
    setItemEditandoId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Montar Circuito</h2>
            <p className={ui.subtitle}>
              {circuito.codigo} - {circuito.nome}
            </p>
          </div>

          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--soft)] p-3">
            <p className="text-xs font-semibold text-[var(--text-light)]">Componentes diferentes</p>
            <p className="mt-1 text-xl font-bold text-[var(--text)]">{itens.length}</p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--soft)] p-3">
            <p className="text-xs font-semibold text-[var(--text-light)]">Quantidade total</p>
            <p className="mt-1 text-xl font-bold text-[var(--text)]">{quantidadeTotal}</p>
          </div>

          <div className="flex items-end justify-end">
            <button onClick={onAbrirAdicionar} disabled={processando} className={ui.buttonPrimary}>
              <Plus size={16} />
              Adicionar componente
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--border)]">
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
                        value={quantidadeEditando}
                        onChange={(event) => setQuantidadeEditando(Number(event.target.value))}
                        disabled={processando}
                        className="w-24 rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label={`Nova quantidade de ${item.nomeComponente}`}
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
                            onClick={() => salvarQuantidade(item.id)}
                            disabled={
                              processando ||
                              !Number.isInteger(quantidadeEditando) ||
                              quantidadeEditando <= 0
                            }
                            className={ui.buttonPrimary}
                            title="Salvar quantidade"
                          >
                            <Check size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={cancelarEdicao}
                            disabled={processando}
                            className={ui.buttonSecondary}
                            title="Cancelar edição"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(item)}
                            disabled={processando}
                            className={ui.buttonSecondary}
                            title="Editar quantidade"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemover(item.id)}
                            disabled={processando}
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

        <div className="mt-5 flex justify-end">
          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
