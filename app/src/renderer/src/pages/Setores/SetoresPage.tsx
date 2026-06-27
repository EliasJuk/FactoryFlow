import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"

function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [nome, setNome] = useState("")
  const [setorEditando, setSetorEditando] = useState<Setor | null>(null)

  async function atualizarLista() {
    const lista = await window.api.setores.listar()
    setSetores(lista)
  }

  useEffect(() => {
    atualizarLista()
  }, [])

  async function salvarSetor() {
    if (!nome.trim()) return

    if (setorEditando) {
      await window.api.setores.editar(setorEditando.id, nome)
      setSetorEditando(null)
    } else {
      await window.api.setores.criar(nome)
    }

    setNome("")
    await atualizarLista()
  }

  function editarSetor(setor: Setor) {
    setSetorEditando(setor)
    setNome(setor.nome)
  }

  async function excluirSetor(id: number) {
    await window.api.setores.excluir(id)
    await atualizarLista()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Setores"
        subtitle="Cadastre e gerencie os setores."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nome do Setor
          </label>

          <div className="flex gap-3">
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex: SETOR-1"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <button
              onClick={salvarSetor}
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              {setorEditando ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Nome
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {setores.map((setor) => (
                <tr key={setor.id} className="border-t">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {setor.nome}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarSetor(setor)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirSetor(setor.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {setores.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
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