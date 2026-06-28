import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [setorEditando, setSetorEditando] = useState<Setor | null>(null)

  async function atualizarLista() {
    const lista = await window.api.setores.listar()
    setSetores(lista)
  }

  useEffect(() => {
    atualizarLista()
  }, [])

  async function salvarSetor() {
    if (!nome.trim() || !sigla.trim()) return

    if (setorEditando) {
      await window.api.setores.editar(setorEditando.id, nome.trim(), sigla.trim())
      setSetorEditando(null)
    } else {
      await window.api.setores.criar(nome.trim(), sigla.trim())
    }

    setNome("")
    setSigla("")
    await atualizarLista()
  }

  function editarSetor(setor: Setor) {
    setSetorEditando(setor)
    setNome(setor.nome)
    setSigla(setor.sigla)
  }

  async function excluirSetor(id: number) {
    await window.api.setores.excluir(id)
    await atualizarLista()
  }

  function cancelarEdicao() {
    setSetorEditando(null)
    setNome("")
    setSigla("")
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Setores"
        subtitle="Cadastre e gerencie os setores."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
            <div>
              <label className={ui.label}>Nome do Setor</label>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Ar Condicionado"
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Sigla</label>
              <input
                value={sigla}
                onChange={(event) => setSigla(event.target.value.toUpperCase())}
                placeholder="Ex: AC"
                className={ui.input}
              />
            </div>

            <div className="flex items-end gap-2">
              <button onClick={salvarSetor} className={ui.buttonPrimary}>
                {setorEditando ? "Atualizar" : "Salvar"}
              </button>

              {setorEditando && (
                <button onClick={cancelarEdicao} className={ui.buttonSecondary}>
                  Cancelar
                </button>
              )}
            </div>
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
                        onClick={() => editarSetor(setor)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => excluirSetor(setor.id)}
                        className={ui.buttonDanger}
                        title="Excluir"
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
      </section>
    </main>
  )
}

export default SetoresPage