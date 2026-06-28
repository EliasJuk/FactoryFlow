import { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Printer,
  Search
} from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type RefugoListagem = {
  id: number
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string
  itens: {
    componenteCodigo: string
    componenteNome: string
    defeitoCodigo: string
    defeitoDescricao: string
    quantidadeRefugada: number
  }[]
}

function VerLancamentosPage() {
  const [lancamentos, setLancamentos] = useState<RefugoListagem[]>([])
  const [busca, setBusca] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [abertos, setAbertos] = useState<number[]>([])

  async function carregarLancamentos() {
    setCarregando(true)

    try {
      const lista = await window.api.refugos.listar(busca.trim(), 10)
      setLancamentos(lista)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarLancamentos()
  }, [])

  function alternarAberto(id: number) {
    setAbertos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    )
  }

  function reimprimir(numeroRefugo: string) {
    alert(`Reimprimir ${numeroRefugo}`)
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Ver Lançamentos"
        subtitle="Consulte os últimos refugos lançados no sistema."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={ui.label}>Buscar</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") carregarLancamentos()
                }}
                placeholder="Número, matrícula, circuito, posto ou defeito..."
                className={ui.input}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={carregarLancamentos}
                className={ui.buttonPrimary}
                title="Buscar"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {carregando && (
            <div className={ui.card}>
              <p className={ui.subtitle}>Carregando lançamentos...</p>
            </div>
          )}

          {!carregando &&
            lancamentos.map((refugo) => {
              const aberto = abertos.includes(refugo.id)
              const totalRefugado = refugo.itens.reduce(
                (total, item) => total + item.quantidadeRefugada,
                0
              )

              return (
                <div key={refugo.id} className={ui.card}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <button
                        onClick={() => alternarAberto(refugo.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        {aberto ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}

                        <h2 className={ui.title}>
                          {refugo.numeroRefugo}
                        </h2>
                      </button>

                      <p className={ui.subtitle}>
                        {refugo.dataHora} • Turno {refugo.turno} • Matrícula{" "}
                        {refugo.matriculaOperador}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        {refugo.setorNome} / {refugo.subsetorNome} /{" "}
                        {refugo.postoNome}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[var(--text)]">
                        Circuito: {refugo.circuitoCodigo} -{" "}
                        {refugo.circuitoNome}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        Produzido: {refugo.quantidadeProduzida} • Refugado:{" "}
                        {totalRefugado}
                      </p>
                    </div>

                    <button
                      onClick={() => reimprimir(refugo.numeroRefugo)}
                      className={ui.buttonSecondary}
                      title="Reimprimir"
                    >
                      <Printer size={16} />
                    </button>
                  </div>

                  {aberto && (
                    <div className="mt-3 overflow-hidden rounded-md border border-[var(--border)]">
                      <table className={ui.table}>
                        <thead className="[background-color:var(--soft)]">
                          <tr>
                            <th className={ui.tableHeader}>Componente</th>
                            <th className={ui.tableHeader}>Defeito</th>
                            <th className={ui.tableHeaderRight}>Qtde</th>
                          </tr>
                        </thead>

                        <tbody>
                          {refugo.itens.map((item, index) => (
                            <tr key={index} className="border-t border-[var(--border)]">
                              <td className={ui.tableCellStrong}>
                                <div>{item.componenteCodigo}</div>
                                <div className="text-xs font-normal text-[var(--text-light)]">
                                  {item.componenteNome}
                                </div>
                              </td>

                              <td className={ui.tableCell}>
                                {item.defeitoCodigo} - {item.defeitoDescricao}
                              </td>

                              <td className={`${ui.tableCell} text-right font-bold`}>
                                {item.quantidadeRefugada}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}

          {!carregando && lancamentos.length === 0 && (
            <div className={ui.card}>
              <p className={ui.empty}>Nenhum lançamento encontrado.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default VerLancamentosPage