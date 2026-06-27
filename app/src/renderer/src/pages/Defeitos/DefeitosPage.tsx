import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"

type Defeito = {
  id: number
  codigo: string
  descricao: string
  ativo: boolean
}

function DefeitosPage() {
  const [defeitos, setDefeitos] = useState<Defeito[]>([])
  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [defeitoEditando, setDefeitoEditando] = useState<Defeito | null>(null)

  async function carregarDefeitos() {
    const lista = await window.api.defeitos.listar()
    setDefeitos(lista)
  }

  useEffect(() => {
    carregarDefeitos()
  }, [])

  async function salvarDefeito() {
    if (!codigo.trim() || !descricao.trim()) return

    if (defeitoEditando) {
      await window.api.defeitos.editar(defeitoEditando.id, codigo, descricao)
      setDefeitoEditando(null)
    } else {
      await window.api.defeitos.criar(codigo, descricao)
    }

    setCodigo("")
    setDescricao("")
    await carregarDefeitos()
  }

  function editarDefeito(defeito: Defeito) {
    setDefeitoEditando(defeito)
    setCodigo(defeito.codigo)
    setDescricao(defeito.descricao)
  }

  async function excluirDefeito(id: number) {
    await window.api.defeitos.excluir(id)
    await carregarDefeitos()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Defeitos"
        subtitle="Cadastre os códigos de defeitos utilizados no lançamento de refugo."
      />

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Código do Defeito
              </label>

              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                placeholder="Ex: 100"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição
              </label>

              <input
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex: Peça amassada"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarDefeito}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {defeitoEditando ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Descrição
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {defeitos.map((defeito) => (
                <tr key={defeito.id} className="border-t">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {defeito.codigo}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {defeito.descricao}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editarDefeito(defeito)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirDefeito(defeito.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {defeitos.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum defeito cadastrado.
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

export default DefeitosPage