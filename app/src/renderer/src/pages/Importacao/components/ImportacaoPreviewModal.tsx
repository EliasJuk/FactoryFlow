import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'

import { ui } from '../../../theme/ui'

type StatusRegistroImportacao = 'NOVO' | 'ATUALIZAR' | 'RESTAURAR' | 'SEM_ALTERACAO' | 'ERRO'

type AvisoImportacao = {
  tipo: 'DEPENDENCIA_INATIVA'
  titulo: string
  mensagem: string
  itens: string[]
}

type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: Record<string, string>
  status: StatusRegistroImportacao
  resumo: string
  mensagens: string[]
  alteracoes: {
    campo: string
    valorAtual: string | null
    novoValor: string | null
  }[]
  registroExistenteId?: number
}

type Props = {
  titulo: string
  colunas: string[]
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
  carregando: boolean
  onFechar: () => void
  onToggleTodos: (selecionado: boolean) => void
  onToggleLinha: (id: number) => void
  onConfirmar: () => void
}

const STATUS_CONFIG: Record<StatusRegistroImportacao, { titulo: string; classe: string }> = {
  NOVO: {
    titulo: 'Novo',
    classe: 'border-blue-200 bg-blue-50 text-blue-700'
  },
  ATUALIZAR: {
    titulo: 'Atualizar',
    classe: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  RESTAURAR: {
    titulo: 'Restaurar',
    classe: 'border-violet-200 bg-violet-50 text-violet-700'
  },
  SEM_ALTERACAO: {
    titulo: 'Sem alteração',
    classe: 'border-slate-200 bg-slate-100 text-slate-600'
  },
  ERRO: {
    titulo: 'Erro',
    classe: 'border-red-200 bg-red-50 text-red-700'
  }
}

export function ImportacaoPreviewModal({
  titulo,
  colunas,
  registros,
  avisos,
  carregando,
  onFechar,
  onToggleTodos,
  onToggleLinha,
  onConfirmar
}: Props) {
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set())

  const selecionados = registros.filter((registro) => registro.selecionado)
  const selecionaveis = registros.filter(
    (registro) => registro.status !== 'ERRO' && registro.status !== 'SEM_ALTERACAO'
  )

  const todosSelecionados =
    selecionaveis.length > 0 && selecionaveis.every((registro) => registro.selecionado)

  const resumo = useMemo(() => {
    return registros.reduce<Record<StatusRegistroImportacao, number>>(
      (acumulador, registro) => {
        acumulador[registro.status]++
        return acumulador
      },
      {
        NOVO: 0,
        ATUALIZAR: 0,
        RESTAURAR: 0,
        SEM_ALTERACAO: 0,
        ERRO: 0
      }
    )
  }, [registros])

  function alternarDetalhes(id: number) {
    setExpandidos((atuais) => {
      const proximo = new Set(atuais)

      if (proximo.has(id)) {
        proximo.delete(id)
      } else {
        proximo.add(id)
      }

      return proximo
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
          <div>
            <h2 className={ui.title}>Prévia e análise da importação</h2>
            <p className={ui.subtitle}>
              {titulo} • {registros.length} registro(s) analisado(s) • {selecionados.length}{' '}
              selecionado(s)
            </p>
          </div>

          <button onClick={onFechar} disabled={carregando} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] bg-[var(--soft)] px-5 py-3 sm:grid-cols-5">
          {(
            [
              ['NOVO', 'Novos'],
              ['ATUALIZAR', 'Atualizações'],
              ['RESTAURAR', 'Restaurações'],
              ['SEM_ALTERACAO', 'Sem alteração'],
              ['ERRO', 'Erros']
            ] as const
          ).map(([status, rotulo]) => (
            <div key={status} className="rounded-md bg-white px-3 py-2 text-center">
              <div className="text-lg font-bold text-[var(--text)]">{resumo[status]}</div>
              <div className="text-xs text-[var(--text-light)]">{rotulo}</div>
            </div>
          ))}
        </div>

        {avisos.map((aviso) => (
          <div
            key={`${aviso.tipo}-${aviso.titulo}`}
            className="border-b border-amber-200 bg-amber-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />

              <div>
                <h3 className="text-sm font-bold text-amber-900">{aviso.titulo}</h3>

                <p className="mt-1 text-sm text-amber-800">{aviso.mensagem}</p>

                <ul className="mt-2 space-y-1 text-sm font-semibold text-amber-900">
                  {aviso.itens.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={todosSelecionados}
              onChange={(event) => onToggleTodos(event.target.checked)}
              disabled={carregando || selecionaveis.length === 0}
            />
            Selecionar todas as ações válidas
          </label>

          <span className="text-xs text-[var(--text-light)]">
            Erros e registros sem alteração não podem ser selecionados.
          </span>
        </div>

        <div className="max-h-[55vh] overflow-auto">
          <table className={ui.table}>
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className={ui.tableHeader}>Selecionar</th>
                <th className={ui.tableHeader}>Linha</th>
                <th className={ui.tableHeader}>Status</th>

                {colunas.map((coluna) => (
                  <th key={coluna} className={ui.tableHeader}>
                    {coluna}
                  </th>
                ))}

                <th className={ui.tableHeader}>Análise</th>
                <th className={ui.tableHeader}>Detalhes</th>
              </tr>
            </thead>

            <tbody>
              {registros.map((registro) => {
                const bloqueado = registro.status === 'ERRO' || registro.status === 'SEM_ALTERACAO'
                const possuiDetalhes =
                  registro.alteracoes.length > 0 || registro.mensagens.length > 0
                const expandido = expandidos.has(registro.id)
                const statusConfig = STATUS_CONFIG[registro.status]

                return (
                  <Fragment key={registro.id}>
                    <tr className="border-t border-[var(--border)] align-top">
                      <td className={ui.tableCell}>
                        <input
                          type="checkbox"
                          checked={registro.selecionado}
                          onChange={() => onToggleLinha(registro.id)}
                          disabled={carregando || bloqueado}
                        />
                      </td>

                      <td className={ui.tableCellStrong}>{registro.linha}</td>

                      <td className={ui.tableCell}>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusConfig.classe}`}
                        >
                          {statusConfig.titulo}
                        </span>
                      </td>

                      {colunas.map((coluna) => (
                        <td key={coluna} className={ui.tableCell}>
                          {registro.dados[coluna] || '-'}
                        </td>
                      ))}

                      <td className={ui.tableCell}>
                        <div
                          className={`max-w-sm text-sm ${
                            registro.status === 'SEM_ALTERACAO'
                              ? 'font-medium text-amber-600'
                              : 'text-[var(--text)]'
                          }`}
                        >
                          {registro.resumo}
                        </div>
                      </td>

                      <td className={ui.tableCell}>
                        {possuiDetalhes ? (
                          <button
                            type="button"
                            onClick={() => alternarDetalhes(registro.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]"
                          >
                            {expandido ? (
                              <>
                                <ChevronUp size={15} />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown size={15} />
                                Ver
                              </>
                            )}
                          </button>
                        ) : (
                          <CheckCircle2 size={17} className="text-green-500" />
                        )}
                      </td>
                    </tr>

                    {expandido && possuiDetalhes && (
                      <tr
                        key={`${registro.id}-detalhes`}
                        className="border-t border-[var(--border)] bg-slate-50"
                      >
                        <td colSpan={colunas.length + 6} className="px-5 py-4">
                          {registro.alteracoes.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Alterações previstas
                              </h4>

                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {registro.alteracoes.map((alteracao) => (
                                  <div
                                    key={alteracao.campo}
                                    className="rounded-md border border-amber-200 bg-white p-3"
                                  >
                                    <div className="text-xs font-bold text-slate-700">
                                      {alteracao.campo}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">Atual</div>
                                    <div className="font-semibold text-slate-800">
                                      {alteracao.valorAtual || '-'}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">Novo</div>
                                    <div className="font-semibold text-slate-800">
                                      {alteracao.novoValor || '-'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {registro.mensagens.length > 0 && (
                            <div className={registro.alteracoes.length > 0 ? 'mt-4' : ''}>
                              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700">
                                <AlertCircle size={15} />
                                Problemas encontrados
                              </h4>

                              <ul className="mt-2 space-y-1 text-sm text-red-700">
                                {registro.mensagens.map((mensagem) => (
                                  <li key={mensagem}>• {mensagem}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}

              {registros.length === 0 && (
                <tr>
                  <td colSpan={colunas.length + 6} className={ui.empty}>
                    Nenhum registro encontrado no arquivo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] p-5">
          <button onClick={onFechar} disabled={carregando} className={ui.buttonSecondary}>
            Cancelar
          </button>

          <button
            onClick={onConfirmar}
            disabled={carregando || selecionados.length === 0}
            className={ui.buttonPrimary}
          >
            {carregando ? 'Importando...' : `Importar selecionados (${selecionados.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
