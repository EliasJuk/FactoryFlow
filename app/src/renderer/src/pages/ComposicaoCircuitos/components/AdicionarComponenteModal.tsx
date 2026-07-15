import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { ui } from '../../../theme/ui'

type Componente = {
  id: number
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

type Props = {
  componentes: Componente[]
  processando: boolean
  onFechar: () => void
  onAdicionar: (componenteId: number, quantidade: number) => Promise<void>
}

export function AdicionarComponenteModal({
  componentes,
  processando,
  onFechar,
  onAdicionar
}: Props) {
  const [busca, setBusca] = useState('')
  const [componenteId, setComponenteId] = useState<number | null>(null)
  const [quantidade, setQuantidade] = useState(1)

  const componentesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return componentes

    return componentes.filter((componente) => {
      return (
        componente.codigo.toLowerCase().includes(termo) ||
        componente.nome.toLowerCase().includes(termo)
      )
    })
  }, [busca, componentes])

  async function confirmar() {
    if (!componenteId || quantidade <= 0 || processando) return
    await onAdicionar(componenteId, quantidade)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Adicionar componente</h2>
            <p className={ui.subtitle}>Pesquise, selecione o componente e informe a quantidade.</p>
          </div>

          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
          <Search size={16} className="text-[var(--text-light)]" />

          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por código ou nome..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Componente</th>
              </tr>
            </thead>

            <tbody>
              {componentesFiltrados.map((componente) => {
                const selecionado = componente.id === componenteId

                return (
                  <tr
                    key={componente.id}
                    onClick={() => setComponenteId(componente.id)}
                    className={`cursor-pointer border-t border-[var(--border)] ${
                      selecionado ? 'bg-green-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={ui.tableCellStrong}>{componente.codigo}</td>
                    <td className={ui.tableCell}>{componente.nome}</td>
                  </tr>
                )
              })}

              {componentesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={2} className={ui.empty}>
                    Nenhum componente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 max-w-[180px]">
          <label className={ui.label}>Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(event) => setQuantidade(Number(event.target.value))}
            disabled={processando}
            className={ui.input}
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            Cancelar
          </button>

          <button
            onClick={confirmar}
            disabled={!componenteId || quantidade <= 0 || processando}
            className={ui.buttonPrimary}
          >
            {processando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
