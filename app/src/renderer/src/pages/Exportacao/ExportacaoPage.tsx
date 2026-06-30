import { useState } from "react"
import { Download } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

function getInicioMesAtual() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  return primeiroDia.toISOString().slice(0, 10)
}

function getHoje() {
  return new Date().toISOString().slice(0, 10)
}

function ExportacaoPage() {
  const [dataInicio, setDataInicio] = useState(getInicioMesAtual())
  const [dataFim, setDataFim] = useState(getHoje())
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  async function exportarCsv() {
    if (!dataInicio || !dataFim) {
      setErro("Informe a data inicial e a data final.")
      return
    }

    if (dataInicio > dataFim) {
      setErro("A data inicial não pode ser maior que a data final.")
      return
    }

    setProcessando(true)
    setMensagem("")
    setErro("")

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
      if (error instanceof Error) {
        setErro(error.message)
      } else {
        setErro("Não foi possível exportar o arquivo.")
      }
    } finally {
      setProcessando(false)
    }
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
                Selecione um período para gerar a base de refugos no modelo
                utilizado pela equipe.
              </p>
            </div>

            <div className="rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              <strong>Observação:</strong> o arquivo será gerado em CSV com
              separador ponto e vírgula.
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
                {processando ? "Exportando..." : "Exportar CSV"}
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

          <p className={ui.subtitle}>
            O CSV será gerado com este cabeçalho:
          </p>

          <div className="mt-4 overflow-x-auto rounded-md border border-[var(--border)] bg-slate-300 p-3 text-xs text-slate-700">
            Data;Matriula;Turno;Setor;...
          </div>
        </div>
      </section>
    </main>
  )
}

export default ExportacaoPage