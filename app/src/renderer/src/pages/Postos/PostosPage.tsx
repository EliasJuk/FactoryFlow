import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

type Posto = {
  id: number
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
  ativo: boolean
}

function PostosPage() {
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [postoEditando, setPostoEditando] = useState<Posto | null>(null)

  const [nome, setNome] = useState("")
  const [subsetorId, setSubsetorId] = useState<number | "">("")
  const [mensagemErro, setMensagemErro] = useState("")
  const [processando, setProcessando] = useState(false)

  const [postoParaInativar, setPostoParaInativar] = useState<Posto | null>(null)

  const [postoBloqueado, setPostoBloqueado] = useState<{
    posto: Posto
    totalRoteiros: number
  } | null>(null)

  async function carregarDados() {
    const [subsetoresLista, postosLista] = await Promise.all([
      window.api.subsetores.listar(),
      window.api.postos.listar()
    ])

    setSubsetores(subsetoresLista)
    setPostos(postosLista)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function abrirNovoPosto() {
    setModalModo("novo")
    setPostoEditando(null)
    setNome("")
    setSubsetorId(subsetores[0]?.id ?? "")
    setMensagemErro("")
    setModalAberto(true)
  }

  function abrirEditarPosto(posto: Posto) {
    setModalModo("editar")
    setPostoEditando(posto)
    setNome(posto.nome)
    setSubsetorId(posto.subsetorId)
    setMensagemErro("")
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setPostoEditando(null)
    setNome("")
    setSubsetorId("")
    setMensagemErro("")
  }

  async function salvarPosto() {
    if (processando) return

    if (!nome.trim() || subsetorId === "") {
      setMensagemErro("Informe o subsetor e o nome do posto de trabalho.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && postoEditando) {
        await window.api.postos.editar(
          postoEditando.id,
          nome.trim(),
          Number(subsetorId)
        )
      } else {
        await window.api.postos.criar(nome.trim(), Number(subsetorId))
      }

      fecharModal()
      await carregarDados()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(posto: Posto) {
    const totalRoteiros = await window.api.postos.contarRoteirosAtivos(posto.id)

    if (totalRoteiros > 0) {
      setPostoBloqueado({
        posto,
        totalRoteiros
      })
      return
    }

    setPostoParaInativar(posto)
  }

  async function confirmarInativacao() {
    if (!postoParaInativar) return

    try {
      await window.api.postos.excluir(postoParaInativar.id)
      setPostoParaInativar(null)
      await carregarDados()
    } catch {
      setPostoParaInativar(null)
    }
  }

  function extrairMensagemErro(error: unknown) {
    if (error instanceof Error) {
      const mensagem = error.message
        .replace(/^Error invoking remote method 'postos:criar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'postos:editar': Error:\s*/, "")
        .replace(/^Error invoking remote method 'postos:excluir': Error:\s*/, "")

      if (mensagem.includes("POSTO_DUPLICADO")) {
        return "Já existe um posto de trabalho com esse nome dentro do subsetor selecionado. Escolha outro nome."
      }

      if (mensagem.includes("POSTO_COM_VINCULOS")) {
        return "Este posto possui roteiros vinculados e não pode ser inativado."
      }

      return mensagem
    }

    return "Erro ao executar operação."
  }

  const podeSalvar = nome.trim().length > 0 && subsetorId !== ""

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Postos de Trabalho"
        subtitle="Cadastre e gerencie os postos vinculados aos subsetores."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.title}>Postos cadastrados</h2>
              <p className={ui.subtitle}>
                Postos ativos disponíveis para uso nos roteiros e lançamentos.
              </p>
            </div>

            <button onClick={abrirNovoPosto} className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Posto
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeader}>Posto</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {postos.map((posto) => (
                <tr
                  key={posto.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCell}>{posto.setorNome}</td>
                  <td className={ui.tableCell}>{posto.subsetorNome}</td>
                  <td className={ui.tableCellStrong}>{posto.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarPosto(posto)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(posto)}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {postos.length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.empty}>
                    Nenhum posto cadastrado.
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
                    {modalModo === "novo" ? "Novo Posto" : "Editar Posto"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o subsetor e o nome do posto de trabalho.
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

              <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                <div>
                  <label className={ui.label}>Subsetor</label>
                  <select
                    value={subsetorId}
                    onChange={(event) =>
                      setSubsetorId(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    disabled={processando}
                    className={ui.select}
                  >
                    <option value="">Selecione...</option>

                    {subsetores.map((subsetor) => (
                      <option key={subsetor.id} value={subsetor.id}>
                        {subsetor.setorNome} - {subsetor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={ui.label}>Nome do Posto</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: Posto 01"
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
                  onClick={salvarPosto}
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

        {postoParaInativar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className={ui.title}>Inativar posto</h2>

              <p className="mt-2 text-sm text-slate-600">
                {postoParaInativar.nome} ({postoParaInativar.subsetorNome})
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                O posto não será apagado permanentemente. Ele ficará apenas como{" "}
                <strong>inativo</strong> e não aparecerá mais nas listas
                principais.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setPostoParaInativar(null)}
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

        {postoBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Posto possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o posto{" "}
                <strong>{postoBloqueado.posto.nome}</strong>, pois existem{" "}
                <strong>{postoBloqueado.totalRoteiros}</strong> roteiro(s)
                vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Caso deseje realmente remover este posto, primeiro remova ou
                inative os roteiros vinculados a ele.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPostoBloqueado(null)}
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

export default PostosPage