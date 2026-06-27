import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Setor } from "../../models/Setor"

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
      await window.api.setores.editar(setorEditando.id, nome, sigla)
      setSetorEditando(null)
    } else {
      await window.api.setores.criar(nome, sigla)
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

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Setores"
        subtitle="Cadastre e gerencie os setores."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do Setor
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Ar Condicionado"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sigla
              </label>

              <input
                value={sigla}
                onChange={(event) => setSigla(event.target.value.toUpperCase())}
                placeholder="Ex: AC"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarSetor}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {setorEditando ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Sigla
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

                  <td className="px-6 py-4 text-slate-700">
                    {setor.sigla}
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
                    colSpan={3}
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