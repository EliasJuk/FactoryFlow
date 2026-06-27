import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Componente } from "../../models/Componente"

function ComponentesPage() {
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [codigo, setCodigo] = useState("")
  const [nome, setNome] = useState("")
  const [componenteEditando, setComponenteEditando] =
    useState<Componente | null>(null)

  async function carregarComponentes() {
    const lista = await window.api.componentes.listar()
    setComponentes(lista)
  }

  useEffect(() => {
    carregarComponentes()
  }, [])

  async function salvarComponente() {
    if (!codigo.trim() || !nome.trim()) return

    if (componenteEditando) {
      await window.api.componentes.editar(
        componenteEditando.id,
        codigo,
        nome
      )
      setComponenteEditando(null)
    } else {
      await window.api.componentes.criar(codigo, nome)
    }

    setCodigo("")
    setNome("")
    await carregarComponentes()
  }

  function editarComponente(componente: Componente) {
    setComponenteEditando(componente)
    setCodigo(componente.codigo)
    setNome(componente.nome)
  }

  async function excluirComponente(id: number) {
    await window.api.componentes.excluir(id)
    await carregarComponentes()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Componentes"
        subtitle="Cadastre os componentes usados nos circuitos."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Código CTF
              </label>

              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                placeholder="Ex: 00-0000-0000"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do Componente
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Peça X"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarComponente}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {componenteEditando ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Código CTF
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Componente
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {componentes.map((componente) => (
                <tr key={componente.id} className="border-t">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {componente.codigo}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {componente.nome}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarComponente(componente)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirComponente(componente.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {componentes.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum componente cadastrado.
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

export default ComponentesPage