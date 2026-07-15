import { CrudModal } from '../../../components/Crud/CrudModal/CrudModal'
import { ui } from '../../../theme/ui'

export type CircuitoFormModo = 'novo' | 'editar'

type Props = {
  modo: CircuitoFormModo
  codigo: string
  nome: string
  mensagemErro: string
  processando: boolean
  onCodigoChange: (valor: string) => void
  onNomeChange: (valor: string) => void
  onFechar: () => void
  onSalvar: () => void
}

export function CircuitoFormModal({
  modo,
  codigo,
  nome,
  mensagemErro,
  processando,
  onCodigoChange,
  onNomeChange,
  onFechar,
  onSalvar
}: Props) {
  const podeSalvar = codigo.trim().length > 0 && nome.trim().length > 0 && !processando

  return (
    <CrudModal
      titulo={modo === 'novo' ? 'Novo Circuito' : 'Editar Circuito'}
      subtitulo="Informe o código CTF e o nome do circuito."
      mensagemErro={mensagemErro}
      processando={processando}
      onFechar={onFechar}
      footer={
        <>
          <button
            type="button"
            onClick={onFechar}
            disabled={processando}
            className={ui.buttonSecondary}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSalvar}
            disabled={!podeSalvar}
            className={ui.buttonPrimary}
          >
            {processando ? 'Salvando...' : modo === 'novo' ? 'Salvar' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <div>
          <label className={ui.label}>Código CTF</label>
          <input
            value={codigo}
            onChange={(event) => onCodigoChange(event.target.value.toUpperCase())}
            disabled={processando}
            placeholder="Ex: 41-0000-0000"
            className={ui.input}
          />
        </div>

        <div>
          <label className={ui.label}>Nome do Circuito</label>
          <input
            value={nome}
            onChange={(event) => onNomeChange(event.target.value)}
            disabled={processando}
            placeholder="Informe o nome do circuito"
            className={ui.input}
          />
        </div>
      </div>
    </CrudModal>
  )
}
