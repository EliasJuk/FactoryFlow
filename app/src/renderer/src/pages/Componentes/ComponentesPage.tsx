import { useEffect, useState } from "react"
import { DollarSign, Pencil, Plus, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

type Componente = {
  id: number
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor || 0)
}

function converterValorMonetario(valor: string) {
  const normalizado = valor.replace(/\./g, "").replace(",", ".")
  const numero = Number(normalizado)

  return Number.isNaN(numero) ? 0 : numero
}

function ComponentesPage() {
  const [componentes, setComponentes] = useState<Componente[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [componenteEditando, setComponenteEditando] =
    useState<Componente | null>(null)

  const [codigo, setCodigo] = useState("")
  const [nome, setNome] = useState("")
  const [precoAtual, setPrecoAtual] = useState("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [processando, setProcessando] = useState(false)

  const [componenteParaInativar, setComponenteParaInativar] =
    useState<Componente | null>(null)

  async function carregarComponentes() {
    const lista = await window.api.componentes.listar()
    setComponentes(lista)
  }

  useEffect(() => {
    carregarComponentes()
  }, [])

  function abrirNovoComponente() {
    setModalModo("novo")
    setComponenteEditando(null)
    setCodigo("")
    setNome("")
    setPrecoAtual("")
    setMensagemErro("")
    setModalAberto(true)
  }

  function abrirEditarComponente(componente: Componente) {
    setModalModo("editar")
    setComponenteEditando(componente)
    setCodigo(componente.codigo)
    setNome(componente.nome)
    setPrecoAtual(
      componente.precoAtual
        ? String(componente.precoAtual).replace(".", ",")
        : ""
    )
    setMensagemErro("")
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setComponenteEditando(null)
    setCodigo("")
    setNome("")
    setPrecoAtual("")
    setMensagemErro("")
  }

  function extrairMensagemErro(error: unknown) {
    if (error instanceof Error) {
      const mensagem = error.message
        .replace(/^Error invoking remote method 'componentes:criar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'componentes:editar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'componentes:excluir': Error:\s*/, "")

      if (mensagem.includes("COMPONENTE_DUPLICADO")) {
        return "Já existe um componente ativo com este código. Escolha outro código para continuar."
      }

      return mensagem
    }

    return "Erro ao executar operação."
  }

  async function salvarComponente() {
    if (processando) return

    if (!codigo.trim() || !nome.trim()) {
      setMensagemErro("Informe o código CTF e o nome do componente.")
      return
    }

    setProcessando(true)

    try {
      const valor = converterValorMonetario(precoAtual)

      if (modalModo === "editar" && componenteEditando) {
        await window.api.componentes.editar(
          componenteEditando.id,
          codigo.trim(),
          nome.trim(),
          valor
        )
      } else {
        await window.api.componentes.criar(codigo.trim(), nome.trim(), valor)
      }

      fecharModal()
      await carregarComponentes()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!componenteParaInativar) return

    await window.api.componentes.excluir(componenteParaInativar.id)
    setComponenteParaInativar(null)
    await carregarComponentes()
  }

  const podeSalvar =
    codigo.trim().length > 0 &&
    nome.trim().length > 0 &&
    !processando

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Componentes"
        subtitle="Cadastre os componentes usados nos circuitos e seus preços vigentes."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.title}>Componentes cadastrados</h2>
              <p className={ui.subtitle}>
                Componentes ativos disponíveis para circuitos, roteiros e lançamentos.
              </p>
            </div>

            <button onClick={abrirNovoComponente} className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Componente
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código CTF</th>
                <th className={ui.tableHeader}>Componente</th>
                <th className={ui.tableHeader}>Preço atual</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {componentes.map((componente) => (
                <tr
                  key={componente.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCellStrong}>{componente.codigo}</td>
                  <td className={ui.tableCell}>{componente.nome}</td>
                  <td className={ui.tableCell}>
                    {formatarMoeda(componente.precoAtual)}
                  </td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarComponente(componente)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setComponenteParaInativar(componente)}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {componentes.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum componente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className={ui.title}>
                    {modalModo === "novo"
                      ? "Novo Componente"
                      : "Editar Componente"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o código, o nome e o preço vigente do componente.
                  </p>
                </div>

                <button
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}
                >
                  <X size={16} />
                </button>
              </div>

              {mensagemErro && (
                <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {mensagemErro}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[180px_1fr_180px]">
                <div>
                  <label className={ui.label}>Código CTF</label>
                  <input
                    value={codigo}
                    onChange={(event) =>
                      setCodigo(event.target.value.toUpperCase())
                    }
                    disabled={processando}
                    placeholder="Ex: 33-0000-0000"
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Nome do Componente</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: Manga de proteção"
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Preço atual</label>
                  <div className="relative">
                    <DollarSign
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={precoAtual}
                      onChange={(event) => setPrecoAtual(event.target.value)}
                      disabled={processando}
                      placeholder="0,00"
                      className={`${ui.input} pl-9`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                <strong>Observação:</strong> ao alterar o preço, o valor antigo
                fica preservado no histórico. Os refugos já lançados continuam
                com o preço usado no momento do lançamento.
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarComponente}
                  disabled={!podeSalvar}
                  className={ui.buttonPrimary}
                >
                  {processando
                    ? "Salvando..."
                    : modalModo === "novo"
                      ? "Salvar"
                      : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {componenteParaInativar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className={ui.title}>Inativar componente</h2>

              <p className="mt-2 text-sm text-slate-600">
                {componenteParaInativar.codigo} - {componenteParaInativar.nome}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                O componente não será apagado permanentemente. Ele ficará apenas
                como <strong>inativo</strong> e não aparecerá mais nas listas
                principais.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Os refugos antigos continuarão preservados com o código, nome e
                preço utilizados no momento do lançamento.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setComponenteParaInativar(null)}
                  className={ui.buttonSecondary}
                >
                  Voltar
                </button>

                <button
                  onClick={confirmarInativacao}
                  className={ui.buttonDanger}
                >
                  Confirmar inativação
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default ComponentesPage