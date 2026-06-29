import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

function SubsetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [subsetorEditando, setSubsetorEditando] = useState<Subsetor | null>(null)

  const [nome, setNome] = useState("")
  const [setorId, setSetorId] = useState<number | "">("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [processando, setProcessando] = useState(false)

  const [subsetorParaInativar, setSubsetorParaInativar] =
    useState<Subsetor | null>(null)

  const [subsetorBloqueado, setSubsetorBloqueado] = useState<{
    subsetor: Subsetor
    totalPostos: number
  } | null>(null)

  async function carregarDados() {
    const [setoresLista, subsetoresLista] = await Promise.all([
      window.api.setores.listar(),
      window.api.subsetores.listar()
    ])

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function abrirNovoSubsetor() {
    setModalModo("novo")
    setSubsetorEditando(null)
    setNome("")
    setSetorId(setores[0]?.id ?? "")
    setMensagemErro("")
    setModalAberto(true)
  }

  function abrirEditarSubsetor(subsetor: Subsetor) {
    setModalModo("editar")
    setSubsetorEditando(subsetor)
    setNome(subsetor.nome)
    setSetorId(subsetor.setorId)
    setMensagemErro("")
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setSubsetorEditando(null)
    setNome("")
    setSetorId("")
    setMensagemErro("")
  }

  async function salvarSubsetor() {
    if (processando) return

    if (!nome.trim() || setorId === "") {
      setMensagemErro("Informe o setor e o nome do subsetor.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && subsetorEditando) {
        await window.api.subsetores.editar(
          subsetorEditando.id,
          nome.trim(),
          Number(setorId)
        )
      } else {
        await window.api.subsetores.criar(nome.trim(), Number(setorId))
      }

      fecharModal()
      await carregarDados()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(subsetor: Subsetor) {
    const totalPostos = await window.api.subsetores.contarPostosAtivos(
      subsetor.id
    )

    if (totalPostos > 0) {
      setSubsetorBloqueado({
        subsetor,
        totalPostos
      })
      return
    }

    setSubsetorParaInativar(subsetor)
  }

  async function confirmarInativacao() {
    if (!subsetorParaInativar) return

    try {
      await window.api.subsetores.excluir(subsetorParaInativar.id)
      setSubsetorParaInativar(null)
      await carregarDados()
    } catch {
      setSubsetorParaInativar(null)
    }
  }

  function extrairMensagemErro(error: unknown) {
    if (error instanceof Error) {
      return error.message
        .replace(/^Error invoking remote method 'subsetores:criar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'subsetores:editar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'subsetores:excluir': Error:\s*/, "")
    }

    return "Erro ao executar operação."
  }

  const podeSalvar = nome.trim().length > 0 && setorId !== ""

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Subsetores"
        subtitle="Cadastre e gerencie os subsetores vinculados aos setores."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.title}>Subsetores cadastrados</h2>
              <p className={ui.subtitle}>
                Subsetores ativos disponíveis para uso no sistema.
              </p>
            </div>

            <button onClick={abrirNovoSubsetor} className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Subsetor
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {subsetores.map((subsetor) => (
                <tr
                  key={subsetor.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCell}>{subsetor.setorNome}</td>
                  <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarSubsetor(subsetor)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(subsetor)}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {subsetores.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum subsetor cadastrado.
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
                    {modalModo === "novo"
                      ? "Novo Subsetor"
                      : "Editar Subsetor"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o setor responsável e o nome do subsetor.
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

              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <div>
                  <label className={ui.label}>Setor</label>
                  <select
                    value={setorId}
                    onChange={(event) =>
                      setSetorId(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    disabled={processando}
                    className={ui.select}
                  >
                    <option value="">Selecione...</option>

                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={ui.label}>Nome do Subsetor</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: Montagem"
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
                  onClick={salvarSubsetor}
                  disabled={!podeSalvar || processando}
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

        {subsetorParaInativar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className={ui.title}>Inativar subsetor</h2>

              <p className="mt-2 text-sm text-slate-600">
                {subsetorParaInativar.nome} ({subsetorParaInativar.setorNome})
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                O subsetor não será apagado permanentemente. Ele ficará apenas
                como <strong>inativo</strong> e não aparecerá mais nas listas
                principais.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSubsetorParaInativar(null)}
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

        {subsetorBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Subsetor possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o subsetor{" "}
                <strong>{subsetorBloqueado.subsetor.nome}</strong>, pois existem{" "}
                <strong>{subsetorBloqueado.totalPostos}</strong> posto(s) de
                trabalho vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Caso deseje realmente remover este subsetor, primeiro inative ou
                remova os postos de trabalho vinculados a ele.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSubsetorBloqueado(null)}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default SubsetoresPage