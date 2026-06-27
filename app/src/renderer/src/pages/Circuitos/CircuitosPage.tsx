import { useEffect, useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Circuito } from "../../models/Circuito"
import { Componente } from "../../models/Componente"
import { CircuitoComponente } from "../../models/CircuitoComponente"

function CircuitosPage() {
  const [circuitos, setCircuitos] = useState<Circuito[]>([])
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [componentesDoCircuito, setComponentesDoCircuito] = useState<CircuitoComponente[]>([])

  const [codigo, setCodigo] = useState("")
  const [nome, setNome] = useState("")
  const [circuitoEditando, setCircuitoEditando] = useState<Circuito | null>(null)
  const [circuitoSelecionado, setCircuitoSelecionado] = useState<Circuito | null>(null)

  const [componenteId, setComponenteId] = useState<number | "">("")
  const [quantidade, setQuantidade] = useState(1)

  async function carregarCircuitos() {
    const lista = await window.api.circuitos.listar()
    setCircuitos(lista)
  }

  async function carregarComponentes() {
    const lista = await window.api.componentes.listar()
    setComponentes(lista)

    if (lista.length > 0) {
      setComponenteId(lista[0].id)
    }
  }

  async function carregarComponentesDoCircuito(circuitoId: number) {
    const lista = await window.api.circuitoComponentes.listarPorCircuito(circuitoId)
    setComponentesDoCircuito(lista)
  }

  useEffect(() => {
    carregarCircuitos()
    carregarComponentes()
  }, [])

  async function salvarCircuito() {
    if (!codigo.trim() || !nome.trim()) return

    if (circuitoEditando) {
      await window.api.circuitos.editar(circuitoEditando.id, codigo, nome)
      setCircuitoEditando(null)
    } else {
      await window.api.circuitos.criar(codigo, nome)
    }

    setCodigo("")
    setNome("")
    await carregarCircuitos()
  }

  function editarCircuito(circuito: Circuito) {
    setCircuitoEditando(circuito)
    setCodigo(circuito.codigo)
    setNome(circuito.nome)
  }

  async function excluirCircuito(id: number) {
    await window.api.circuitos.excluir(id)
    await carregarCircuitos()
  }

  async function selecionarCircuito(circuito: Circuito) {
    setCircuitoSelecionado(circuito)
    await carregarComponentesDoCircuito(circuito.id)
  }

  async function adicionarComponente() {
    if (!circuitoSelecionado || componenteId === "") return

    await window.api.circuitoComponentes.adicionar(
      circuitoSelecionado.id,
      Number(componenteId),
      quantidade
    )

    setQuantidade(1)
    await carregarComponentesDoCircuito(circuitoSelecionado.id)
  }

  async function removerComponente(id: number) {
    if (!circuitoSelecionado) return

    await window.api.circuitoComponentes.remover(id)
    await carregarComponentesDoCircuito(circuitoSelecionado.id)
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro de Circuitos"
        subtitle="Cadastre circuitos e vincule componentes."
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
                placeholder="Ex: 44-0000-0001"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do Circuito
              </label>

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Produto 0001"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            onClick={salvarCircuito}
            className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            {circuitoEditando ? "Atualizar" : "Salvar"}
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
                  Circuito
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {circuitos.map((circuito) => (
                <tr key={circuito.id} className="border-t">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {circuito.codigo}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {circuito.nome}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => selecionarCircuito(circuito)}
                        className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                        title="Montar circuito"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        onClick={() => editarCircuito(circuito)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => excluirCircuito(circuito.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {circuitos.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum circuito cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {circuitoSelecionado && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-slate-800">
              Componentes do circuito
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {circuitoSelecionado.codigo} - {circuitoSelecionado.nome}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_120px_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Componente
                </label>

                <select
                  value={componenteId}
                  onChange={(event) => setComponenteId(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                >
                  {componentes.map((componente) => (
                    <option key={componente.id} value={componente.id}>
                      {componente.codigo} - {componente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Qtde
                </label>

                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(event) => setQuantidade(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={adicionarComponente}
                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Componente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Qtde
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {componentesDoCircuito.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {item.codigoComponente}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.nomeComponente}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.quantidade}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => removerComponente(item.id)}
                            className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {componentesDoCircuito.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        Nenhum componente vinculado a este circuito.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default CircuitosPage