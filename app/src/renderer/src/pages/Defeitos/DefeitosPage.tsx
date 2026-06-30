import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

type Defeito = {
  id: number
  codigo: string
  descricao: string
  ativo: boolean
}

function DefeitosPage() {
  const [defeitos, setDefeitos] = useState<Defeito[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [defeitoEditando, setDefeitoEditando] = useState<Defeito | null>(null)

  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [processando, setProcessando] = useState(false)

  const [defeitoParaInativar, setDefeitoParaInativar] =
    useState<Defeito | null>(null)

  async function carregarDefeitos() {
    const lista = await window.api.defeitos.listar()
    setDefeitos(lista)
  }

  useEffect(() => {
    carregarDefeitos()
  }, [])

  function abrirNovoDefeito() {
    setModalModo("novo")
    setDefeitoEditando(null)
    setCodigo("")
    setDescricao("")
    setMensagemErro("")
    setModalAberto(true)
  }

  function abrirEditarDefeito(defeito: Defeito) {
    setModalModo("editar")
    setDefeitoEditando(defeito)
    setCodigo(defeito.codigo)
    setDescricao(defeito.descricao)
    setMensagemErro("")
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setDefeitoEditando(null)
    setCodigo("")
    setDescricao("")
    setMensagemErro("")
  }

  function extrairMensagemErro(error: unknown) {
    if (error instanceof Error) {
      const mensagem = error.message
        .replace(/^Error invoking remote method 'defeitos:criar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'defeitos:editar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'defeitos:excluir': Error:\s*/, "")

      if (mensagem.includes("DEFEITO_DUPLICADO")) {
        return "Já existe um defeito ativo com este código. Escolha outro código para continuar."
      }

      return mensagem
    }

    return "Erro ao executar operação."
  }

  async function salvarDefeito() {
    if (processando) return

    if (!codigo.trim() || !descricao.trim()) {
      setMensagemErro("Informe o código e a descrição do defeito.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && defeitoEditando) {
        await window.api.defeitos.editar(
          defeitoEditando.id,
          codigo.trim(),
          descricao.trim()
        )
      } else {
        await window.api.defeitos.criar(codigo.trim(), descricao.trim())
      }

      fecharModal()
      await carregarDefeitos()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!defeitoParaInativar) return

    await window.api.defeitos.excluir(defeitoParaInativar.id)
    setDefeitoParaInativar(null)
    await carregarDefeitos()
  }

  const podeSalvar =
    codigo.trim().length > 0 &&
    descricao.trim().length > 0 &&
    !processando

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Defeitos"
        subtitle="Cadastre os códigos de defeitos utilizados no lançamento de refugo."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.title}>Defeitos cadastrados</h2>
              <p className={ui.subtitle}>
                Defeitos ativos disponíveis para os lançamentos de refugo.
              </p>
            </div>

            <button onClick={abrirNovoDefeito} className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Defeito
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Código</th>
                <th className={ui.tableHeader}>Descrição</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {defeitos.map((defeito) => (
                <tr
                  key={defeito.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCellStrong}>{defeito.codigo}</td>
                  <td className={ui.tableCell}>{defeito.descricao}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarDefeito(defeito)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setDefeitoParaInativar(defeito)}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {defeitos.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum defeito cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className={ui.title}>
                    {modalModo === "novo" ? "Novo Defeito" : "Editar Defeito"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o código e a descrição do defeito.
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

              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <div>
                  <label className={ui.label}>Código do Defeito</label>
                  <input
                    value={codigo}
                    onChange={(event) =>
                      setCodigo(event.target.value.toUpperCase())
                    }
                    disabled={processando}
                    placeholder="Ex: 100"
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Descrição</label>
                  <input
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: Peça amassada"
                    className={ui.input}
                  />
                </div>
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
                  onClick={salvarDefeito}
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

        {defeitoParaInativar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className={ui.title}>Inativar defeito</h2>

              <p className="mt-2 text-sm text-slate-600">
                {defeitoParaInativar.codigo} - {defeitoParaInativar.descricao}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                O defeito não será apagado permanentemente. Ele ficará apenas
                como <strong>inativo</strong> e não aparecerá mais nas listas
                principais.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Os refugos antigos continuarão preservados com o código e a
                descrição utilizados no momento do lançamento.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDefeitoParaInativar(null)}
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

export default DefeitosPage