import { useState } from 'react'
import { Download } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import { ui } from '../../theme/ui'

const PERFIS_PERMITIDOS = new Set(['ADMIN', 'QUALIDADE', 'TECNICO', 'LIDER', 'SUPERVISOR'])

function formatarDataLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function getInicioMesAtual() {
  const hoje = new Date()
  return formatarDataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
}

function getHoje() {
  return formatarDataLocal(new Date())
}

function mensagemErroExportacao(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error)

  if (texto.includes('SESSAO_NAO_AUTENTICADA')) {
    return 'Sua sessão não está autenticada. Entre novamente no sistema.'
  }

  if (texto.includes('TROCA_SENHA_OBRIGATORIA')) {
    return 'Altere sua senha antes de continuar.'
  }

  if (texto.includes('SEM_PERMISSAO')) {
    return 'Seu perfil não possui permissão para exportar dados.'
  }

  return 'Não foi possível exportar o arquivo.'
}

function ExportacaoPage() {
  const { usuario } = useApp()
  const [dataInicio, setDataInicio] = useState(getInicioMesAtual())
  const [dataFim, setDataFim] = useState(getHoje())
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const podeExportar = PERFIS_PERMITIDOS.has(usuario.perfil)

  async function exportarCsv() {
    if (!dataInicio || !dataFim) {
      setErro('Informe a data inicial e a data final.')
      return
    }

    if (dataInicio > dataFim) {
      setErro('A data inicial não pode ser maior que a data final.')
      return
    }

    setProcessando(true)
    setMensagem('')
    setErro('')

    try {
      const resultado = await window.api.exportacaoDados.refugosCsv({
        dataInicio,
        dataFim
      })

      if (resultado.sucesso) {
        setMensagem(resultado.mensagem)
      } else {
        setErro(resultado.mensagem)
      }
    } catch (error) {
      setErro(mensagemErroExportacao(error))
    } finally {
      setProcessando(false)
    }
  }

  if (!podeExportar) {
    return (
      <main className={ui.page}>
        <PageHeader
          title="Exportação de Dados"
          subtitle="Gere arquivos CSV para uso no SAP e Power BI."
        />

        <section className={ui.section}>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Seu perfil não possui permissão para exportar dados.
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Exportação de Dados"
        subtitle="Gere arquivos CSV para uso no SAP e Power BI."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={ui.title}>Exportar refugos</h2>
              <p className={ui.subtitle}>
                Selecione um período para gerar a base de refugos no modelo utilizado pela equipe.
              </p>
            </div>

            <div className="rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              <strong>Observação:</strong> o arquivo será gerado em CSV com separador ponto e
              vírgula.
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[220px_220px_1fr]">
            <div>
              <label className={ui.label}>Data inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                disabled={processando}
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Data final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                disabled={processando}
                className={ui.input}
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={exportarCsv}
                disabled={processando}
                className={ui.buttonPrimary}
              >
                <Download size={16} />
                {processando ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>

          {mensagem && (
            <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erro}
            </div>
          )}
        </div>

        <div className={ui.card}>
          <h2 className={ui.title}>Modelo do arquivo</h2>

          <p className={ui.subtitle}>O CSV será gerado com este cabeçalho:</p>

          <div className="mt-4 overflow-x-auto rounded-md border border-[var(--border)] bg-slate-300 p-3 text-xs text-slate-700">
            Data;Matrícula;Turno;Setor;...
          </div>
        </div>
      </section>
    </main>
  )
}

export default ExportacaoPage
