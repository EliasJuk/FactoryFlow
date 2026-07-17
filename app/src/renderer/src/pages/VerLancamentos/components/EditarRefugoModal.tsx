import { ui } from '../../../theme/ui'
import type { Defeito } from '../../../models/Defeitos'
import type { EditItem, RefugoListagem } from '../types'

type Props = {
  refugo: RefugoListagem
  defeitos: Defeito[]
  matricula: string
  turno: 'A' | 'B' | 'C'
  quantidadeProduzida: number
  observacao: string
  itens: EditItem[]
  onMatriculaChange: (v: string) => void
  onTurnoChange: (v: 'A' | 'B' | 'C') => void
  onQuantidadeProduzidaChange: (v: number) => void
  onObservacaoChange: (v: string) => void
  onItemDefeitoChange: (id: number, defeitoId: number) => void
  onItemQuantidadeChange: (id: number, quantidade: number) => void
  onClose: () => void
  onSave: () => void
}

export function EditarRefugoModal(props: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
        <h2 className={ui.title}>Editar lançamento</h2>
        <p className={ui.subtitle}>{props.refugo.numeroRefugo}</p>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={ui.label}>Matrícula</label>
              <input
                value={props.matricula}
                onChange={(e) => props.onMatriculaChange(e.target.value)}
                className={ui.input}
              />
            </div>
            <div>
              <label className={ui.label}>Turno</label>
              <select
                value={props.turno}
                onChange={(e) => props.onTurnoChange(e.target.value as 'A' | 'B' | 'C')}
                className={ui.select}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className={ui.label}>Qtd. produzida</label>
              <input
                type="number"
                min={0}
                value={props.quantidadeProduzida}
                onChange={(e) => props.onQuantidadeProduzidaChange(Number(e.target.value))}
                className={ui.input}
              />
            </div>
          </div>
          <div>
            <label className={ui.label}>Observação</label>
            <textarea
              value={props.observacao}
              onChange={(e) => props.onObservacaoChange(e.target.value)}
              rows={2}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Componentes refugados</label>
            <div className="space-y-1">
              {props.itens.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_240px_90px] items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-bold">{item.componenteCodigo}</span>{' '}
                    <span className="text-sm">{item.componenteNome}</span>
                  </div>
                  <select
                    value={item.defeitoId}
                    onChange={(e) => props.onItemDefeitoChange(item.id, Number(e.target.value))}
                    className={ui.select}
                  >
                    {props.defeitos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.codigo} - {d.descricao}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={item.quantidade}
                    onChange={(e) => props.onItemQuantidadeChange(item.id, Number(e.target.value))}
                    className={`${ui.input} text-center`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={props.onClose} className={ui.buttonSecondary}>
            Cancelar
          </button>
          <button onClick={props.onSave} className={ui.buttonPrimary}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
