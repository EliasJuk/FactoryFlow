import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"

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
      await window.api.subsetores.editar(subsetorEditando.id, nome, Number(setorId))
      setSubsetorEditando(null)
    } else {
      await window.api.subsetores.criar(nome, Number(setorId))
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

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Subsetores"
        subtitle="Cadastre os subsetores vinculados a um setor."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Setor
              </label>

              <select
                value={setorId}
                onChange={(event) => setSetorId(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              >
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do Subsetor
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: SUB-SETOR A"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarSubsetor}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {subsetorEditando ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Setor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Subsetor
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {subsetores.map((subsetor) => (
                <tr key={subsetor.id} className="border-t">
                  <td className="px-6 py-4 text-slate-700">
                    {subsetor.setorNome}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-700">
                    {subsetor.nome}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarSubsetor(subsetor)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirSubsetor(subsetor.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {subsetores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
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