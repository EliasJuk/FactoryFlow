import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"
import { ui } from "../../theme/ui"

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

  const [nome, setNome] = useState("")
  const [setorId, setSetorId] = useState<number | "">("")
  const [subsetorEditando, setSubsetorEditando] = useState<Subsetor | null>(null)

  async function carregarDados() {
    const setoresLista = await window.api.setores.listar()
    const subsetoresLista = await window.api.subsetores.listar()

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)

    if (setoresLista.length > 0 && setorId === "") {
      setSetorId(setoresLista[0].id)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function salvarSubsetor() {
    if (!nome.trim() || setorId === "") return

    if (subsetorEditando) {
      await window.api.subsetores.editar(
        subsetorEditando.id,
        nome.trim(),
        Number(setorId)
      )
      setSubsetorEditando(null)
    } else {
      await window.api.subsetores.criar(nome.trim(), Number(setorId))
    }

    setNome("")
    await carregarDados()
  }

  function editarSubsetor(subsetor: Subsetor) {
    setSubsetorEditando(subsetor)
    setNome(subsetor.nome)
    setSetorId(subsetor.setorId)
  }

  async function excluirSubsetor(id: number) {
    await window.api.subsetores.excluir(id)
    await carregarDados()
  }

  function cancelarEdicao() {
    setSubsetorEditando(null)
    setNome("")
    setSetorId(setores[0]?.id ?? "")
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Subsetores"
        subtitle="Cadastre os subsetores vinculados a um setor."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-[260px_1fr_160px]">
            <div>
              <label className={ui.label}>Setor</label>
              <select
                value={setorId}
                onChange={(event) => setSetorId(Number(event.target.value))}
                className={ui.select}
              >
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
                placeholder="Ex: Montagem AC"
                className={ui.input}
              />
            </div>

            <div className="flex items-end gap-2">
              <button onClick={salvarSubsetor} className={ui.buttonPrimary}>
                {subsetorEditando ? "Atualizar" : "Salvar"}
              </button>

              {subsetorEditando && (
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
                <th className={ui.tableHeader}>Setor</th>
                <th className={ui.tableHeader}>Subsetor</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {subsetores.map((subsetor) => (
                <tr key={subsetor.id} className="border-t border-[var(--border)]">
                  <td className={ui.tableCell}>{subsetor.setorNome}</td>
                  <td className={ui.tableCellStrong}>{subsetor.nome}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarSubsetor(subsetor)}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => excluirSubsetor(subsetor.id)}
                        className={ui.buttonDanger}
                        title="Excluir"
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
      </section>
    </main>
  )
}

export default SubsetoresPage