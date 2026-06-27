import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"

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
  ativo: boolean
}

function PostosPage() {
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [postos, setPostos] = useState<Posto[]>([])

  const [nome, setNome] = useState("")
  const [subsetorId, setSubsetorId] = useState<number | "">("")
  const [postoEditando, setPostoEditando] = useState<Posto | null>(null)

  async function carregarDados() {
    const subsetoresLista = await window.api.subsetores.listar()
    const postosLista = await window.api.postos.listar()

    setSubsetores(subsetoresLista)
    setPostos(postosLista)

    if (subsetoresLista.length > 0 && subsetorId === "") {
      setSubsetorId(subsetoresLista[0].id)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function salvarPosto() {
    if (!nome.trim() || subsetorId === "") return

    if (postoEditando) {
      await window.api.postos.editar(postoEditando.id, nome, Number(subsetorId))
      setPostoEditando(null)
    } else {
      await window.api.postos.criar(nome, Number(subsetorId))
    }

    setNome("")
    await carregarDados()
  }

  function editarPosto(posto: Posto) {
    setPostoEditando(posto)
    setNome(posto.nome)
    setSubsetorId(posto.subsetorId)
  }

  async function excluirPosto(id: number) {
    await window.api.postos.excluir(id)
    await carregarDados()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Postos"
        subtitle="Cadastre os postos de trabalho vinculados aos subsetores."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Subsetor
              </label>

              <select
                value={subsetorId}
                onChange={(event) => setSubsetorId(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              >
                {subsetores.map((subsetor) => (
                  <option key={subsetor.id} value={subsetor.id}>
                    {subsetor.setorNome} - {subsetor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do Posto
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: POSTO 01"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarPosto}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {postoEditando ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Subsetor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Posto
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {postos.map((posto) => (
                <tr key={posto.id} className="border-t">
                  <td className="px-6 py-4 text-slate-700">
                    {posto.subsetorNome}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-700">
                    {posto.nome}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarPosto(posto)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirPosto(posto.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {postos.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum posto cadastrado.
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

export default PostosPage