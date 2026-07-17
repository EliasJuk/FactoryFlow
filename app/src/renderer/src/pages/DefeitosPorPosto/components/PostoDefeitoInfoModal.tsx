import { CalendarClock, Link2, PencilLine, Trash2, X } from 'lucide-react'

import { Posto } from '../../../models/Posto'
import { PostoDefeito } from '../../../models/PostoDefeito'

type PostoDefeitoInfoModalProps = {
  aberto: boolean
  vinculo: PostoDefeito
  posto: Posto
  onClose: () => void
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return 'Não informado'

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return data.toLocaleString('pt-BR')
}

function PostoDefeitoInfoModal({ aberto, vinculo, posto, onClose }: PostoDefeitoInfoModalProps) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Informações do vínculo</h2>

            <p className="mt-1 text-sm text-slate-500">
              Histórico da associação entre o posto e o defeito.
            </p>
          </div>

          <button
            title="Fechar"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Defeito
                </div>

                <div className="mt-1 text-base font-bold text-slate-900">
                  {vinculo.codigoDefeito} - {vinculo.descricaoDefeito}
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Posto
                </div>

                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {posto.setorNome} / {posto.subsetorNome} / {posto.nome}
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  vinculo.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {vinculo.ativo ? 'ATIVO' : 'REMOVIDO'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Link2 size={17} className="text-slate-500" />
              Identificador global
            </div>

            <div className="mt-2 break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
              {vinculo.uuid}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CalendarClock size={17} className="text-slate-500" />
                Criação
              </div>

              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Criado por</dt>
                  <dd className="font-semibold text-slate-800">
                    {vinculo.createdByNome ?? 'Sistema'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Data e hora</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatarDataHora(vinculo.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <PencilLine size={17} className="text-slate-500" />
                Última alteração
              </div>

              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Alterado por</dt>
                  <dd className="font-semibold text-slate-800">
                    {vinculo.updatedByNome ?? vinculo.createdByNome ?? 'Sistema'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Data e hora</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatarDataHora(vinculo.updatedAt ?? vinculo.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {!vinculo.ativo && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                <Trash2 size={17} />
                Remoção do vínculo
              </div>

              <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs text-red-600">Removido por</dt>
                  <dd className="font-semibold text-red-900">
                    {vinculo.deletedByNome ?? 'Sistema'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-red-600">Data e hora</dt>
                  <dd className="font-semibold text-red-900">
                    {formatarDataHora(vinculo.deletedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-200 px-5 py-4">
          <button
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  )
}

export default PostoDefeitoInfoModal
