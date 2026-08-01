import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'

import { ui } from '../../../theme/ui'
import { Circuito } from '../../../models/Circuito'
import type { RoteiroComponente } from '../../../models/Roteiro'

type ModalModo = 'novo' | 'editar'

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
  modalModo: ModalModo
  postoNome: string
  circuitos: Circuito[]
  modalCircuitoId: number | ''
  componentesDoCircuito: CircuitoComponente[]
  componenteId: number | ''
  quantidade: number
  modalItens: RoteiroComponente[]
  mensagemErro: string
  mensagemSucesso: string
  processando: boolean
  onFechar: () => void
  onAlterarCircuito: (valor: string) => void
  onAlterarComponente: (valor: string) => void
  onAlterarQuantidade: (quantidade: number) => void
  onAdicionar: () => void
  onRemoverItem: (id: number) => void
  onSalvar: (quantidades: Record<number, number>) => void
}

export function RoteiroModal({
  modalModo,
  postoNome,
  circuitos,
  modalCircuitoId,
  componentesDoCircuito,
  componenteId,
  quantidade,
  modalItens,
  mensagemErro,
  mensagemSucesso,
  processando,
  onFechar,
  onAlterarCircuito,
  onAlterarComponente,
  onAlterarQuantidade,
  onAdicionar,
  onRemoverItem,
  onSalvar
}: Props) {
  const semComponentesNoCircuito = modalCircuitoId !== '' && componentesDoCircuito.length === 0
  const [quantidadesLocais, setQuantidadesLocais] = useState<Record<number, number>>({})

  useEffect(() => {
    setQuantidadesLocais((atuais) => {
      const proximas: Record<number, number> = {}

      for (const item of modalItens) {
        proximas[item.id] = atuais[item.id] ?? item.quantidade
      }

      return proximas
    })
  }, [modalItens])

  function alterarQuantidadeLocal(id: number, novaQuantidade: number) {
    setQuantidadesLocais((atuais) => ({
      ...atuais,
      [id]: novaQuantidade
    }))
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className={ui.title}>{modalModo === 'novo' ? 'Novo Roteiro' : 'Editar Roteiro'}</h2>

            <p className={ui.subtitle}>Posto: {postoNome}</p>
          </div>

          <button type="button" onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 min-h-[44px]">
          {mensagemErro ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensagemErro}
            </div>
          ) : mensagemSucesso ? (
            <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {mensagemSucesso}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
          <div>
            <label className={ui.label}>Circuito</label>
            <select
              value={modalCircuitoId}
              onChange={(event) => onAlterarCircuito(event.target.value)}
              disabled={modalModo === 'editar' || processando}
              className={ui.select}
            >
              <option value="">Selecione...</option>

              {circuitos.map((circuito) => (
                <option key={circuito.id} value={circuito.id}>
                  {circuito.codigo} - {circuito.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={ui.label}>Componente do circuito</label>
            <select
              value={componenteId}
              onChange={(event) => onAlterarComponente(event.target.value)}
              disabled={modalCircuitoId === '' || semComponentesNoCircuito || processando}
              className={ui.select}
            >
              <option value="">
                {semComponentesNoCircuito ? 'Nenhum componente neste circuito' : 'Selecione...'}
              </option>

              {componentesDoCircuito.map((item) => (
                <option key={item.componenteId} value={item.componenteId}>
                  {item.codigoComponente} - {item.nomeComponente}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={ui.label}>Qtde</label>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(event) => onAlterarQuantidade(Number(event.target.value))}
              disabled={processando}
              className={ui.input}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={onAdicionar}
              disabled={
                modalCircuitoId === '' ||
                componenteId === '' ||
                quantidade < 1 ||
                semComponentesNoCircuito ||
                processando
              }
              className={ui.buttonPrimary}
            >
              Adicionar
            </button>
          </div>
        </div>

        {semComponentesNoCircuito && (
          <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Este circuito ainda não possui componentes cadastrados. Vá até a tela de{' '}
            <strong>Circuitos</strong>, clique em <strong>Montar Circuito</strong> e adicione os
            componentes.
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <table className={ui.table}>
            <thead className="bg-slate-50">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Qtde</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {modalItens.map((item) => (
                <tr key={item.uuid} className="border-t">
                  <td className={ui.tableCellStrong}>{item.codigoComponente}</td>

                  <td className={ui.tableCell}>{item.nomeComponente}</td>

                  <td className={ui.tableCell}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quantidadesLocais[item.id] ?? item.quantidade}
                      onChange={(event) =>
                        alterarQuantidadeLocal(item.id, Number(event.target.value))
                      }
                      disabled={processando}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => onRemoverItem(item.id)} disabled={processando} className={ui.buttonDanger}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {modalItens.length === 0 && (
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
          <button type="button" onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onSalvar(quantidadesLocais)}
            disabled={modalCircuitoId === '' || processando}
            className={ui.buttonPrimary}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
