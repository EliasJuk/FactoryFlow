import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

type ModalModo = "novo" | "editar"

function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [setorEditando, setSetorEditando] = useState<Setor | null>(null)
  const [processando, setProcessando] = useState(false)

  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [mensagemErro, setMensagemErro] = useState("")

  const [setorParaInativar, setSetorParaInativar] = useState<Setor | null>(null)

  const [setorBloqueado, setSetorBloqueado] = useState<{
    setor: Setor
    totalSubsetores: number
  } | null>(null)

  async function atualizarLista() {
    const lista = await window.api.setores.listar()
    setSetores(lista)
  }

  useEffect(() => {
    atualizarLista()
  }, [])

  function abrirNovoSetor() {
    if (processando) return

    setModalModo("novo")
    setSetorEditando(null)
    setNome("")
    setSigla("")
    setMensagemErro("")
    setModalAberto(true)
  }

  function abrirEditarSetor(setor: Setor) {
    setModalModo("editar")
    setSetorEditando(setor)
    setNome(setor.nome)
    setSigla(setor.sigla)
    setMensagemErro("")
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setSetorEditando(null)
    setNome("")
    setSigla("")
    setMensagemErro("")
  }

  async function salvarSetor() {
    if (processando) return

    if (!nome.trim() || !sigla.trim()) {
      setMensagemErro("Informe o nome e a sigla do setor.")
      return
    }

    setProcessando(true)

    try {
      if (modalModo === "editar" && setorEditando) {
        await window.api.setores.editar(
          setorEditando.id,
          nome.trim(),
          sigla.trim().toUpperCase()
        )
      } else {
        await window.api.setores.criar(nome.trim(), sigla.trim().toUpperCase())
      }

      fecharModal()
      await atualizarLista()
    } catch (error) {
      setMensagemErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function solicitarInativacao(setor: Setor) {
    const totalSubsetores = await window.api.setores.contarSubsetoresAtivos(
      setor.id
    )

    if (totalSubsetores > 0) {
      setSetorBloqueado({
        setor,
        totalSubsetores
      })
      return
    }

    setSetorParaInativar(setor)
  }

  async function confirmarInativacao() {
    if (!setorParaInativar) return

    try {
      await window.api.setores.excluir(setorParaInativar.id)
      setSetorParaInativar(null)
      await atualizarLista()
    } catch {
      setSetorParaInativar(null)
    }
  }

  function extrairMensagemErro(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(
      /^Error invoking remote method 'setores:excluir': Error:\s*/,
      ""
    )
  }
    return "Erro ao executar operação."
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Setores"
        subtitle="Cadastre e gerencie os setores da fábrica."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.title}>Setores cadastrados</h2>
              <p className={ui.subtitle}>
                Setores ativos disponíveis para uso no sistema.
              </p>
            </div>

            <button 
              onClick={abrirNovoSetor} 
              disabled={processando}
              className={ui.buttonPrimary}>
              <Plus size={16} />
              Novo Setor
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Nome</th>
                <th className={ui.tableHeader}>Sigla</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {setores.map((setor) => (
                <tr key={setor.id} className="border-t border-[var(--border)]">
                  <td className={ui.tableCellStrong}>{setor.nome}</td>
                  <td className={ui.tableCell}>{setor.sigla}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarSetor(setor)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => solicitarInativacao(setor)}
                        disabled={processando}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {setores.length === 0 && (
                <tr>
                  <td colSpan={3} className={ui.empty}>
                    Nenhum setor cadastrado.
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
                    {modalModo === "novo" ? "Novo Setor" : "Editar Setor"}
                  </h2>

                  <p className={ui.subtitle}>
                    Informe o nome e a sigla que serão utilizados no sistema.
                  </p>
                </div>

                <button 
                  onClick={fecharModal}
                  disabled={processando}
                  className={ui.buttonSecondary}>
                  <X size={16} />
                </button>
              </div>

              {mensagemErro && (
                <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {mensagemErro}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                <div>
                  <label className={ui.label}>Nome do Setor</label>
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    disabled={processando}
                    placeholder="Ex: AR CONDICIONADO"
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Sigla</label>
                  <input
                    value={sigla}
                    onChange={(event) =>
                      setSigla(event.target.value.toUpperCase())
                    }
                    disabled={processando}
                    placeholder="Ex: AC"
                    className={ui.input}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button 
                  onClick={fecharModal} 
                  disabled={processando}
                  className={ui.buttonSecondary}>
                  Cancelar
                </button>

                <button 
                  onClick={salvarSetor} 
                  disabled={processando}
                  className={ui.buttonPrimary}>
                  {modalModo === "novo" ? "Salvar" : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {setorParaInativar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className={ui.title}>Inativar setor</h2>

              <p className="mt-2 text-sm text-slate-600">
                {setorParaInativar.nome}
                {setorParaInativar.sigla && ` (${setorParaInativar.sigla})`}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                O setor não será apagado permanentemente. Ele ficará apenas como{" "}
                <strong>inativo</strong> e não aparecerá mais nas listas principais.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSetorParaInativar(null)}
                  className={ui.buttonSecondary}
                >
                  Voltar
                </button>

                <button onClick={confirmarInativacao} className={ui.buttonDanger}>
                  Confirmar inativação
                </button>
              </div>
            </div>
          </div>
        )}

        {setorBloqueado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-amber-800">
                Setor possui vínculos
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Não é possível inativar o setor{" "}
                <strong>{setorBloqueado.setor.nome}</strong>, pois existem{" "}
                <strong>{setorBloqueado.totalSubsetores}</strong> subsetor(es)
                vinculado(s) a ele.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Caso deseje realmente remover este setor, primeiro inative ou remova os
                subsetores vinculados e os cadastros dependentes deles, como postos de
                trabalho.
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSetorBloqueado(null)}
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

export default SetoresPage