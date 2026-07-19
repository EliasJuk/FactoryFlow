import { AlertTriangle, FileSpreadsheet, X } from 'lucide-react'
import { useMemo } from 'react'

import { ui } from '../../../theme/ui'

import type { StatusRegistroImportacao } from '../importacao.types'

type RegistroSelecionado = {
  id: number
  status: StatusRegistroImportacao
}

type Props = {
  titulo: string
  registros: RegistroSelecionado[]
  carregando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

export function ConfirmarImportacaoModal({
  titulo,
  registros,
  carregando,
  onCancelar,
  onConfirmar
}: Props) {
  const resumo = useMemo(
    () =>
      registros.reduce(
        (acumulador, registro) => {
          if (registro.status === 'NOVO') acumulador.novos++
          if (registro.status === 'ATUALIZAR') acumulador.atualizacoes++
          if (registro.status === 'RESTAURAR') acumulador.restauracoes++

          return acumulador
        },
        {
          novos: 0,
          atualizacoes: 0,
          restauracoes: 0
        }
      ),
    [registros]
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2 text-[var(--primary)]">
              <FileSpreadsheet size={22} />
            </div>

            <div>
              <h2 className={ui.title}>Confirmar importação</h2>
              <p className={ui.subtitle}>Revise o resumo antes de aplicar as alterações.</p>
            </div>
          </div>

          <button
            type="button"
            title="Fechar"
            onClick={onCancelar}
            disabled={carregando}
            className={ui.buttonSecondary}
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--text)]">
            Serão processados{' '}
            <strong>
              {registros.length} registro(s) de {titulo}
            </strong>
            .
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{resumo.novos}</div>
              <div className="text-xs font-semibold text-blue-700">Novos</div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{resumo.atualizacoes}</div>
              <div className="text-xs font-semibold text-amber-700">Atualizações</div>
            </div>

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center">
              <div className="text-xl font-bold text-violet-700">{resumo.restauracoes}</div>
              <div className="text-xs font-semibold text-violet-700">Restaurações</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600" />

            <div>
              <div className="text-sm font-bold text-amber-900">
                Confirme somente após revisar a prévia
              </div>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Os registros selecionados serão criados, atualizados ou restaurados conforme a
                análise exibida na tela anterior.
              </p>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className={ui.buttonSecondary}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando || registros.length === 0}
            className={ui.buttonPrimary}
          >
            {carregando ? 'Importando...' : `Confirmar importação (${registros.length})`}
          </button>
        </footer>
      </div>
    </div>
  )
}
